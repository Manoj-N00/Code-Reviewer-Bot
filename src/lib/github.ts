import { createAppAuth } from "@octokit/auth-app";
import { env } from "@/config/env";

export interface PullRequestContext {
  owner: string;
  repo: string;
  pullNumber: number;
  installationId: number;
  headSha: string;
}

export interface ReviewComment {
  path: string;
  line: number;
  side: "RIGHT";
  body: string;
}

async function getInstallationToken(installationId: number): Promise<string> {
  const auth = createAppAuth({
    appId: env.github.appId,
    privateKey: env.github.privateKey,
  });

  const { token } = await auth({
    type: "installation",
    installationId,
  });

  return token;
}

export async function fetchPRDiff(ctx: PullRequestContext): Promise<string> {
  const token = await getInstallationToken(ctx.installationId);

  const response = await fetch(
    `https://api.github.com/repos/${ctx.owner}/${ctx.repo}/pulls/${ctx.pullNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3.diff",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch diff: ${response.status}`);
  }

  return response.text();
}

export async function fetchPRFiles(
  ctx: PullRequestContext
): Promise<{ filename: string; status: string; patch?: string }[]> {
  const token = await getInstallationToken(ctx.installationId);

  const response = await fetch(
    `https://api.github.com/repos/${ctx.owner}/${ctx.repo}/pulls/${ctx.pullNumber}/files?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch PR files: ${response.status}`);
  }

  return response.json();
}

export async function postReview(
  ctx: PullRequestContext,
  summary: string,
  comments: ReviewComment[],
  event: "COMMENT" | "REQUEST_CHANGES" = "COMMENT"
): Promise<void> {
  const token = await getInstallationToken(ctx.installationId);

  const response = await fetch(
    `https://api.github.com/repos/${ctx.owner}/${ctx.repo}/pulls/${ctx.pullNumber}/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commit_id: ctx.headSha,
        body: summary,
        event,
        comments: comments.map((c) => ({
          path: c.path,
          line: c.line,
          side: c.side,
          body: c.body,
        })),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to post review: ${response.status} ${error}`);
  }
}
