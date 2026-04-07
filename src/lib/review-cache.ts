import fs from "fs";
import path from "path";

const CACHE_DIR =
  process.env.NODE_ENV === "production"
    ? path.join("/tmp", ".review-cache")
    : path.join(process.cwd(), ".cache");

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function cacheFilePath(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}

export function getCachedReview<T>(key: string): T | null {
  try {
    const filePath = cacheFilePath(key);
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export function setCachedReview<T>(key: string, data: T): void {
  try {
    ensureCacheDir();
    const filePath = cacheFilePath(key);
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
