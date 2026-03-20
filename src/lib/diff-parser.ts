export interface DiffFile {
  path: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  newStart: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: "add" | "delete" | "context";
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number;
}

export function parseDiff(rawDiff: string): DiffFile[] {
  const files: DiffFile[] = [];
  const fileSections = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const section of fileSections) {
    const lines = section.split("\n");

    const pathLine = lines.find((l) => l.startsWith("+++ b/"));
    if (!pathLine) continue;
    const path = pathLine.slice(6);

    const hunks: DiffHunk[] = [];
    let additions = 0;
    let deletions = 0;
    let currentHunk: DiffHunk | null = null;
    let oldLine = 0;
    let newLine = 0;

    for (const line of lines) {
      const hunkMatch = line.match(/^@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (hunkMatch) {
        currentHunk = {
          header: line,
          oldStart: parseInt(hunkMatch[1]),
          newStart: parseInt(hunkMatch[2]),
          lines: [],
        };
        hunks.push(currentHunk);
        oldLine = currentHunk.oldStart;
        newLine = currentHunk.newStart;
        continue;
      }

      if (!currentHunk) continue;

      if (line.startsWith("+")) {
        currentHunk.lines.push({
          type: "add",
          content: line.slice(1),
          oldLineNumber: null,
          newLineNumber: newLine,
        });
        newLine++;
        additions++;
      } else if (line.startsWith("-")) {
        currentHunk.lines.push({
          type: "delete",
          content: line.slice(1),
          oldLineNumber: oldLine,
          newLineNumber: newLine,
        });
        oldLine++;
        deletions++;
      } else if (line.startsWith(" ")) {
        currentHunk.lines.push({
          type: "context",
          content: line.slice(1),
          oldLineNumber: oldLine,
          newLineNumber: newLine,
        });
        oldLine++;
        newLine++;
      }
    }

    files.push({ path, hunks, additions, deletions });
  }

  return files;
}

export interface DiffChunk {
  files: DiffFile[];
  tokenEstimate: number;
}

const CHARS_PER_TOKEN = 4;
const MAX_CHUNK_TOKENS = 80_000;

export function chunkDiffFiles(files: DiffFile[]): DiffChunk[] {
  const chunks: DiffChunk[] = [];
  let currentFiles: DiffFile[] = [];
  let currentTokens = 0;

  const sorted = [...files]
    .filter((f) => !shouldSkipFile(f.path))
    .sort((a, b) => a.additions + a.deletions - (b.additions + b.deletions));

  for (const file of sorted) {
    const fileText = reconstructFileText(file);
    const tokens = Math.ceil(fileText.length / CHARS_PER_TOKEN);

    if (tokens > MAX_CHUNK_TOKENS) {
      if (currentFiles.length > 0) {
        chunks.push({ files: currentFiles, tokenEstimate: currentTokens });
        currentFiles = [];
        currentTokens = 0;
      }
      chunks.push({ files: [file], tokenEstimate: tokens });
      continue;
    }

    if (currentTokens + tokens > MAX_CHUNK_TOKENS) {
      chunks.push({ files: currentFiles, tokenEstimate: currentTokens });
      currentFiles = [];
      currentTokens = 0;
    }

    currentFiles.push(file);
    currentTokens += tokens;
  }

  if (currentFiles.length > 0) {
    chunks.push({ files: currentFiles, tokenEstimate: currentTokens });
  }

  return chunks;
}

function shouldSkipFile(path: string): boolean {
  const skipPatterns = [
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
    /\.min\.(js|css)$/,
    /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
    /\.generated\./,
    /dist\//,
    /build\//,
  ];
  return skipPatterns.some((p) => p.test(path));
}

function reconstructFileText(file: DiffFile): string {
  return file.hunks
    .map((h) =>
      h.lines
        .map((l) => {
          const prefix =
            l.type === "add" ? "+" : l.type === "delete" ? "-" : " ";
          return `${prefix}${l.content}`;
        })
        .join("\n")
    )
    .join("\n");
}
