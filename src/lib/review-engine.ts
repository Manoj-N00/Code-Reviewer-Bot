import {
  fetchPRDiff,
  postReview,
  PullRequestContext,
  ReviewComment,
} from "./github";
import { parseDiff, chunkDiffFiles, DiffFile } from "./diff-parser";
import { reviewDiffChunk, AIReviewComment, AIReviewResult } from "./openrouter";

interface WebhookPayload {
  action: string;
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    head: { sha: string };
  };
  repository: {
    name: string;
    owner: { login: string };
  };
  installation: { id: number };
}

export async function handlePullRequestEvent(
  payload: WebhookPayload
): Promise<void> {
  const ctx: PullRequestContext = {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    pullNumber: payload.pull_request.number,
    installationId: payload.installation.id,
    headSha: payload.pull_request.head.sha,
  };

  console.log(`Reviewing PR #${ctx.pullNumber} on ${ctx.owner}/${ctx.repo}`);

  // 1. Fetch the raw diff
  const rawDiff = await fetchPRDiff(ctx);

  // 2. Parse into structured files
  const files = parseDiff(rawDiff);

  if (files.length === 0) {
    console.log("No reviewable files in diff, skipping");
    return;
  }

  // 3. Chunk the files for the AI
  const chunks = chunkDiffFiles(files);

  // 4. Review each chunk
  const allResults: AIReviewResult[] = [];
  for (const chunk of chunks) {
    try {
      const result = await reviewDiffChunk(
        chunk.files,
        payload.pull_request.title,
        payload.pull_request.body ?? ""
      );
      allResults.push(result);
    } catch (error) {
      console.error("Error reviewing chunk:", error);
    }
  }

  if (allResults.length === 0) {
    console.error("All review chunks failed, skipping");
    return;
  }

  // 5. Merge results from all chunks
  const allComments: AIReviewComment[] = allResults.flatMap((r) => r.comments);
  const validComments = validateAndFilterComments(allComments, files);

  // 6. Build the summary
  const summaryParts = allResults.map((r) => r.summary).filter(Boolean);
  const summary = formatSummary(summaryParts, validComments, files);

  // 7. Map AI comments to GitHub review comment format
  const reviewComments: ReviewComment[] = validComments.map((c) => ({
    path: c.file,
    line: c.line,
    side: "RIGHT" as const,
    body: formatComment(c),
  }));

  // 8. Post the review
  await postReview(ctx, summary, reviewComments, "COMMENT");

  console.log(
    `Posted review with ${reviewComments.length} comments on PR #${ctx.pullNumber}`
  );
}

function validateAndFilterComments(
  comments: AIReviewComment[],
  files: DiffFile[]
): AIReviewComment[] {
  const validLines = new Set<string>();
  for (const file of files) {
    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.type === "add" || line.type === "context") {
          validLines.add(`${file.path}:${line.newLineNumber}`);
        }
      }
    }
  }

  return comments.filter((c) => {
    const key = `${c.file}:${c.line}`;
    if (!validLines.has(key)) {
      console.warn(`Dropping invalid comment: ${key} not in diff`);
      return false;
    }
    return true;
  });
}

function formatComment(c: AIReviewComment): string {
  const severityEmoji: Record<string, string> = {
    critical: "\u{1F534}",
    warning: "\u{1F7E1}",
    suggestion: "\u{1F535}",
    nitpick: "\u26AA",
  };
  const emoji = severityEmoji[c.severity] || "\u{1F4AC}";
  return `${emoji} **${c.severity.toUpperCase()}**: ${c.comment}`;
}

function formatSummary(
  summaries: string[],
  comments: AIReviewComment[],
  files: DiffFile[]
): string {
  const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);
  const criticalCount = comments.filter(
    (c) => c.severity === "critical"
  ).length;
  const warningCount = comments.filter((c) => c.severity === "warning").length;
  const suggestionCount = comments.filter(
    (c) => c.severity === "suggestion"
  ).length;
  const nitpickCount = comments.filter((c) => c.severity === "nitpick").length;

  let md = `## Code Review Summary\n\n`;
  md += `**Files reviewed:** ${files.length} | `;
  md += `**Changes:** +${totalAdditions} -${totalDeletions}\n\n`;

  if (criticalCount > 0) {
    md += `> \u26A0\uFE0F **${criticalCount} critical issue(s) found**\n\n`;
  }

  md += summaries.join("\n\n");

  md += `\n\n---\n`;
  md += `| Severity | Count |\n|----------|-------|\n`;
  md += `| \u{1F534} Critical | ${criticalCount} |\n`;
  md += `| \u{1F7E1} Warning | ${warningCount} |\n`;
  md += `| \u{1F535} Suggestion | ${suggestionCount} |\n`;
  md += `| \u26AA Nitpick | ${nitpickCount} |\n`;

  md += `\n\n*Reviewed by [Code Reviewer Bot](https://github.com/apps/code-reviewer-bot)*`;

  return md;
}
