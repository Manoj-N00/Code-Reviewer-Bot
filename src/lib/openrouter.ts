import { env } from "@/config/env";
import { DiffFile } from "./diff-parser";

export interface AIReviewComment {
  file: string;
  line: number;
  comment: string;
  severity: "critical" | "warning" | "suggestion" | "nitpick";
}

export interface AIReviewResult {
  summary: string;
  comments: AIReviewComment[];
}

export async function reviewDiffChunk(
  files: DiffFile[],
  prTitle: string,
  prBody: string
): Promise<AIReviewResult> {
  const diffText = files
    .map((f) => {
      const hunkText = f.hunks
        .map((h) => {
          const lines = h.lines
            .map((l) => {
              const prefix =
                l.type === "add" ? "+" : l.type === "delete" ? "-" : " ";
              return `${l.newLineNumber}\t${prefix}${l.content}`;
            })
            .join("\n");
          return `${h.header}\n${lines}`;
        })
        .join("\n");
      return `### File: ${f.path}\n${hunkText}`;
    })
    .join("\n\n");

  const systemPrompt = `You are an expert code reviewer. Review the following PR diff and provide actionable feedback.

RULES:
- Prioritize high-impact issues: correctness, security, reliability, and performance
- Focus on real defects and risky behavior changes, not personal style preferences
- Every comment MUST reference a specific file and line number from the diff
- Only comment on lines marked with + (additions) -- these are new/changed lines
- Use the exact line numbers shown at the start of each line
- Never invent files/lines/functions that are not present in the diff
- Be concise. One comment per root cause. No fluff.
- Avoid duplicate comments for the same underlying issue
- Do NOT repeat what the code does -- explain what is wrong, why it matters, and a concrete fix
- If confidence is low or context is insufficient, skip the comment

CHECKLIST (borrowed from common automated review bots):
- Security: injection risks, auth/authz mistakes, secrets exposure, unsafe deserialization, missing validation/sanitization
- Reliability: null/undefined handling, race conditions, resource leaks, error handling gaps, incorrect edge-case logic
- Performance: unnecessary heavy work in hot paths, N+1 patterns, expensive loops, memory/caching issues
- Maintainability: fragile logic, dead code, misleading naming that can cause future bugs, missing tests for risky changes
- API/behavior changes: breaking contract changes, compatibility regressions, missing migrations/guards

SEVERITY LEVELS:
- critical: Bugs, security vulnerabilities, data loss risks
- warning: Performance issues, error handling gaps, potential edge cases
- suggestion: Better patterns, readability improvements
- nitpick: Minor style or naming issues (use sparingly)

Respond with ONLY valid JSON in this exact format:
{
  "summary": "Brief overall assessment of the PR (2-3 sentences)",
  "comments": [
    {
      "file": "path/to/file.ts",
      "line": 42,
      "comment": "Description of the issue and suggested fix",
      "severity": "warning"
    }
  ]
}

If the code looks good and you have no issues to report, return:
{
  "summary": "Brief positive assessment",
  "comments": []
}`;

  const userPrompt = `PR Title: ${prTitle}
PR Description: ${prBody || "No description provided."}

## Diff

${diffText}`;

  const response = await fetch(`${env.openrouter.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openrouter.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://code-reviewer.vercel.app",
      "X-Title": "Code Reviewer Bot",
    },
    body: JSON.stringify({
      model: env.openrouter.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from OpenRouter");
  }

  // Strip markdown code fences if present
  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  return JSON.parse(cleaned) as AIReviewResult;
}
