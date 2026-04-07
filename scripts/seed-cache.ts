/**
 * Seed script: runs AI review for the 3 demo PRs and saves results
 * to src/data/cached-reviews/ so they load instantly on Vercel.
 *
 * Usage: npx tsx scripts/seed-cache.ts
 *
 * Requires OPENROUTER_API_KEY in .env or environment.
 */

import fs from "fs";
import path from "path";

const DEMO_PRS = [
  "https://github.com/sgl-project/sglang/pull/12668",
  "https://github.com/openai/codex/pull/8961",
  "https://github.com/microsoft/vscode/pull/240128",
];

const CACHE_DIR = path.join(process.cwd(), "src", "data", "cached-reviews");

async function main() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Start the dev server or assume it's running
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  for (const prUrl of DEMO_PRS) {
    console.log(`\nReviewing: ${prUrl}`);
    const start = Date.now();

    try {
      const res = await fetch(`${baseUrl}/api/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prUrl }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`  FAILED (${res.status}): ${err}`);
        continue;
      }

      const data = await res.json();
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`  Done in ${elapsed}s — ${data.comments?.length ?? 0} comments`);

      // Extract key parts from the URL to build cache key
      const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
      if (!match) continue;
      const [, owner, repo, pullNumber] = match;

      // Fetch head SHA
      const metaRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
        { headers: { Accept: "application/vnd.github.v3+json", "X-GitHub-Api-Version": "2022-11-28" } }
      );
      const meta = await metaRes.json();
      const headSha = meta.head?.sha || "unknown";

      const cacheKey = `${owner}-${repo}-${pullNumber}-${headSha}`;
      const filePath = path.join(CACHE_DIR, `${cacheKey}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`  Cached to: ${cacheKey}.json`);
    } catch (err) {
      console.error(`  ERROR: ${err}`);
    }
  }

  console.log("\nDone! Commit the files in src/data/cached-reviews/ to the repo.");
}

main();
