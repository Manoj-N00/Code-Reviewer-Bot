import { NextRequest, NextResponse } from "next/server";
import { parseDiff, chunkDiffFiles } from "@/lib/diff-parser";
import { reviewDiffChunk, AIReviewResult } from "@/lib/openrouter";

export const maxDuration = 120;

interface PRInfo {
  owner: string;
  repo: string;
  pullNumber: number;
  title: string;
  body: string;
  diff: string;
}

async function fetchPRInfo(prUrl: string): Promise<PRInfo> {
  // Parse PR URL: https://github.com/owner/repo/pull/123
  const match = prUrl.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
  );
  if (!match) {
    throw new Error("Invalid GitHub PR URL. Expected: https://github.com/owner/repo/pull/123");
  }

  const [, owner, repo, pullNumber] = match;

  // Fetch PR metadata
  const prResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!prResponse.ok) {
    if (prResponse.status === 404) {
      throw new Error("PR not found. Make sure the repository is public and the URL is correct.");
    }
    throw new Error(`GitHub API error: ${prResponse.status}`);
  }

  const prData = await prResponse.json();

  // Fetch diff
  const diffResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
    {
      headers: {
        Accept: "application/vnd.github.v3.diff",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!diffResponse.ok) {
    throw new Error(`Failed to fetch diff: ${diffResponse.status}`);
  }

  const diff = await diffResponse.text();

  return {
    owner,
    repo,
    pullNumber: parseInt(pullNumber),
    title: prData.title,
    body: prData.body || "",
    diff,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { prUrl } = await request.json();

    if (!prUrl || typeof prUrl !== "string") {
      return NextResponse.json(
        { error: "PR URL is required" },
        { status: 400 }
      );
    }

    // Fetch PR info and diff
    const prInfo = await fetchPRInfo(prUrl.trim());

    if (!prInfo.diff) {
      return NextResponse.json(
        { error: "No diff found for this PR" },
        { status: 400 }
      );
    }

    // Parse and chunk the diff
    const files = parseDiff(prInfo.diff);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No reviewable files in this PR" },
        { status: 400 }
      );
    }

    const chunks = chunkDiffFiles(files);

    // Review each chunk
    const allResults: AIReviewResult[] = [];
    for (const chunk of chunks) {
      const result = await reviewDiffChunk(
        chunk.files,
        prInfo.title,
        prInfo.body
      );
      allResults.push(result);
    }

    // Merge results
    const comments = allResults.flatMap((r) => r.comments);
    const summaries = allResults.map((r) => r.summary).filter(Boolean);

    // Build stats
    const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
    const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);

    return NextResponse.json({
      pr: {
        title: prInfo.title,
        owner: prInfo.owner,
        repo: prInfo.repo,
        number: prInfo.pullNumber,
      },
      stats: {
        filesReviewed: files.length,
        additions: totalAdditions,
        deletions: totalDeletions,
      },
      summary: summaries.join("\n\n"),
      comments,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
