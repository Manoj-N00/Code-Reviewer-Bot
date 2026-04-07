import { NextRequest, NextResponse } from "next/server";
import { parseDiff, chunkDiffFiles } from "@/lib/diff-parser";
import { reviewDiffChunk, AIReviewResult } from "@/lib/openrouter";
import { getCachedReview, setCachedReview, buildCacheKey } from "@/lib/review-cache";

export const maxDuration = 120;

interface PRMeta {
  owner: string;
  repo: string;
  pullNumber: number;
  title: string;
  body: string;
  headSha: string;
}

async function fetchPRMeta(prUrl: string): Promise<PRMeta> {
  const match = prUrl.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
  );
  if (!match) {
    throw new Error("Invalid GitHub PR URL. Expected: https://github.com/owner/repo/pull/123");
  }

  const [, owner, repo, pullNumber] = match;

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

  return {
    owner,
    repo,
    pullNumber: parseInt(pullNumber),
    title: prData.title,
    body: prData.body || "",
    headSha: prData.head?.sha || "",
  };
}

async function fetchPRDiff(owner: string, repo: string, pullNumber: number): Promise<string> {
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

  return diffResponse.text();
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

    // Fetch PR metadata (lightweight — just the JSON, no diff)
    const meta = await fetchPRMeta(prUrl.trim());

    // Check cache
    const cacheKey = buildCacheKey(meta.owner, meta.repo, meta.pullNumber, meta.headSha);
    const cached = getCachedReview<ReturnType<typeof buildResponse>>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Cache miss — fetch diff and run AI review
    const diff = await fetchPRDiff(meta.owner, meta.repo, meta.pullNumber);

    if (!diff) {
      return NextResponse.json(
        { error: "No diff found for this PR" },
        { status: 400 }
      );
    }

    const files = parseDiff(diff);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No reviewable files in this PR" },
        { status: 400 }
      );
    }

    const chunks = chunkDiffFiles(files);

    const allResults: AIReviewResult[] = [];
    for (const chunk of chunks) {
      const result = await reviewDiffChunk(
        chunk.files,
        meta.title,
        meta.body
      );
      allResults.push(result);
    }

    const comments = allResults.flatMap((r) => r.comments);
    const summaries = allResults.map((r) => r.summary).filter(Boolean);

    const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
    const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);

    const response = buildResponse(meta, files.length, totalAdditions, totalDeletions, summaries, comments);

    // Write to cache
    setCachedReview(cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildResponse(
  meta: PRMeta,
  filesReviewed: number,
  additions: number,
  deletions: number,
  summaries: string[],
  comments: AIReviewResult["comments"]
) {
  return {
    pr: {
      title: meta.title,
      owner: meta.owner,
      repo: meta.repo,
      number: meta.pullNumber,
    },
    stats: {
      filesReviewed,
      additions,
      deletions,
    },
    summary: summaries.join("\n\n"),
    comments,
  };
}
