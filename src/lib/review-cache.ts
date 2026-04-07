import fs from "fs";
import path from "path";

// Pre-seeded cache lives in the repo (survives Vercel cold starts)
const SEED_CACHE_DIR = path.join(process.cwd(), "src", "data", "cached-reviews");

// Runtime cache for non-seeded PRs
const RUNTIME_CACHE_DIR =
  process.env.NODE_ENV === "production"
    ? path.join("/tmp", ".review-cache")
    : path.join(process.cwd(), ".cache");

function ensureRuntimeCacheDir() {
  if (!fs.existsSync(RUNTIME_CACHE_DIR)) {
    fs.mkdirSync(RUNTIME_CACHE_DIR, { recursive: true });
  }
}

export function getCachedReview<T>(key: string): T | null {
  // 1. Check pre-seeded cache first (always available, even on cold starts)
  try {
    const seedPath = path.join(SEED_CACHE_DIR, `${key}.json`);
    if (fs.existsSync(seedPath)) {
      const data = fs.readFileSync(seedPath, "utf-8");
      return JSON.parse(data) as T;
    }
  } catch {
    // fall through
  }

  // 2. Check runtime cache
  try {
    const runtimePath = path.join(RUNTIME_CACHE_DIR, `${key}.json`);
    if (fs.existsSync(runtimePath)) {
      const data = fs.readFileSync(runtimePath, "utf-8");
      return JSON.parse(data) as T;
    }
  } catch {
    // fall through
  }

  return null;
}

export function setCachedReview<T>(key: string, data: T): void {
  try {
    ensureRuntimeCacheDir();
    const filePath = path.join(RUNTIME_CACHE_DIR, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");
  } catch {
    // Cache write failure is non-fatal
  }
}

export function buildCacheKey(
  owner: string,
  repo: string,
  pullNumber: number,
  headSha: string
): string {
  return `${owner}-${repo}-${pullNumber}-${headSha}`;
}
