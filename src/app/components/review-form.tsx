"use client";

import { useState, useEffect } from "react";

interface ReviewComment {
  file: string;
  line: number;
  comment: string;
  severity: "critical" | "warning" | "suggestion" | "nitpick";
}

interface ReviewResult {
  pr: { title: string; owner: string; repo: string; number: number };
  stats: { filesReviewed: number; additions: number; deletions: number };
  summary: string;
  comments: ReviewComment[];
}

const severity = {
  critical: { label: "Bug", color: "#ff5e5e", bg: "rgba(255,94,94,0.08)", border: "rgba(255,94,94,0.2)" },
  warning: { label: "Warning", color: "#ffaa47", bg: "rgba(255,170,71,0.08)", border: "rgba(255,170,71,0.2)" },
  suggestion: { label: "Suggestion", color: "#6096ff", bg: "rgba(96,150,255,0.08)", border: "rgba(96,150,255,0.2)" },
  nitpick: { label: "FYI", color: "#8f8f8f", bg: "rgba(143,143,143,0.08)", border: "rgba(143,143,143,0.2)" },
};

function groupByFile(comments: ReviewComment[]) {
  const g: Record<string, ReviewComment[]> = {};
  for (const c of comments) {
    if (!g[c.file]) g[c.file] = [];
    g[c.file].push(c);
  }
  return g;
}

export default function ReviewForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [tab, setTab] = useState<"issues" | "summary">("issues");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) return;
    setProgress(0);
    const t1 = setTimeout(() => setProgress(30), 500);
    const t2 = setTimeout(() => setProgress(60), 2000);
    const t3 = setTimeout(() => setProgress(80), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prUrl: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      setProgress(100);
      setTimeout(() => setResult(data), 300);
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  }

  const fileGroups = result ? groupByFile(result.comments) : {};
  const count = (s: string) => result?.comments.filter((c) => c.severity === s).length ?? 0;

  // Landing state
  if (!result && !loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "0 24px" }}>
        <div style={{ maxWidth: 560, width: "100%", animation: "fadeIn 0.5s ease-out" }}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: "#f2f2f2", letterSpacing: "-0.02em", marginBottom: 12 }}>
              Review a Pull Request
            </h1>
            <p style={{ fontSize: 14, color: "#8f8f8f", lineHeight: 1.6 }}>
              Paste a public GitHub PR URL to get an AI-powered code review
            </p>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit}>
            <div style={{
              display: "flex", alignItems: "center", gap: 0,
              background: "#181818", border: "1px solid #353535", borderRadius: 12,
              overflow: "hidden", transition: "border-color 0.2s",
            }}>
              <div style={{ padding: "0 0 0 16px", color: "#8f8f8f", display: "flex" }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
                </svg>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="github.com/owner/repo/pull/123"
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  padding: "14px 12px", color: "#f2f2f2", fontSize: 14,
                  fontFamily: "SF Mono, Roboto Mono, ui-monospace, monospace",
                }}
              />
              <button
                type="submit"
                disabled={!url.trim()}
                style={{
                  margin: 6, padding: "8px 20px", borderRadius: 8,
                  background: url.trim() ? "#6096ff" : "#252525",
                  color: url.trim() ? "#fff" : "#8f8f8f",
                  border: "none", fontSize: 13, fontWeight: 500, cursor: url.trim() ? "pointer" : "default",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                Review
              </button>
            </div>
          </form>

          {error && (
            <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 8, background: "rgba(255,94,94,0.08)", border: "1px solid rgba(255,94,94,0.2)", color: "#ff5e5e", fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 48 }}>
            <FeatureCard color="#ff5e5e" title="Bugs" desc="Catches logic errors, security vulnerabilities, and data loss risks" />
            <FeatureCard color="#ffaa47" title="Warnings" desc="Identifies performance issues and missing error handling" />
            <FeatureCard color="#6096ff" title="Suggestions" desc="Recommends better patterns and readability improvements" />
          </div>

          {/* Bottom text */}
          <p style={{ textAlign: "center", fontSize: 11, color: "#454545", marginTop: 40 }}>
            Powered by GPT-OSS 120B via OpenRouter
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 32 }}>
        <div style={{ animation: "fadeIn 0.3s ease-out" }}>
          {/* Spinner */}
          <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              border: "2px solid #252525",
            }} />
            <div style={{
              position: "absolute", top: 0, left: 0,
              width: 64, height: 64, borderRadius: "50%",
              border: "2px solid transparent", borderTopColor: "#6096ff",
              animation: "spin 1s linear infinite",
            }} />
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6096ff" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#f2f2f2" }}>Analyzing Pull Request</p>
            <p style={{ fontSize: 13, color: "#8f8f8f", marginTop: 6 }}>
              {progress < 30 ? "Fetching diff from GitHub..." : progress < 60 ? "Parsing code changes..." : progress < 80 ? "Reviewing with AI..." : "Finalizing review..."}
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ width: 240, height: 3, background: "#252525", borderRadius: 2, marginTop: 20, overflow: "hidden" }}>
            <div style={{
              height: "100%", background: "linear-gradient(90deg, #6096ff, #02c598)",
              borderRadius: 2, transition: "width 0.5s ease",
              width: `${progress}%`,
            }} />
          </div>
        </div>
      </div>
    );
  }

  // Results
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header bar */}
      <div style={{
        borderBottom: "1px solid #252525", padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#141414", animation: "fadeIn 0.3s ease-out",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Back button */}
          <button
            onClick={() => { setResult(null); setError(""); }}
            style={{
              background: "transparent", border: "1px solid #353535", borderRadius: 6,
              color: "#8f8f8f", cursor: "pointer", padding: "4px 8px",
              display: "flex", alignItems: "center", gap: 4, fontSize: 12,
              transition: "all 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </button>

          {/* PR info */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%", background: "#35e6bc",
            }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#f2f2f2" }}>
              {result!.pr.title}
            </span>
            <span style={{
              fontSize: 11, color: "#8f8f8f",
              fontFamily: "SF Mono, Roboto Mono, ui-monospace, monospace",
            }}>
              {result!.pr.owner}/{result!.pr.repo} #{result!.pr.number}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12 }}>
          <span style={{ color: "#35e6bc", fontFamily: "SF Mono, monospace" }}>+{result!.stats.additions}</span>
          <span style={{ color: "#ff5e5e", fontFamily: "SF Mono, monospace" }}>-{result!.stats.deletions}</span>
          <span style={{ color: "#8f8f8f" }}>{result!.stats.filesReviewed} files</span>
        </div>
      </div>

      {/* Issue counts bar */}
      <div style={{
        borderBottom: "1px solid #252525", padding: "8px 24px",
        display: "flex", alignItems: "center", gap: 16, background: "#121212",
        animation: "fadeIn 0.3s ease-out 0.1s both",
      }}>
        {(["critical", "warning", "suggestion", "nitpick"] as const).map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: severity[s].color }} />
            <span style={{ fontSize: 12, color: "#8f8f8f" }}>
              {count(s)} {severity[s].label}{count(s) !== 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        borderBottom: "1px solid #252525", padding: "0 24px",
        display: "flex", gap: 0, background: "#121212",
        animation: "fadeIn 0.3s ease-out 0.15s both",
      }}>
        <TabBtn active={tab === "issues"} onClick={() => setTab("issues")}>
          Issues ({result!.comments.length})
        </TabBtn>
        <TabBtn active={tab === "summary"} onClick={() => setTab("summary")}>
          Summary
        </TabBtn>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {tab === "summary" && (
          <div style={{
            fontSize: 14, color: "#cbcbcb", lineHeight: 1.7,
            maxWidth: 640, whiteSpace: "pre-wrap",
            animation: "fadeIn 0.3s ease-out",
          }}>
            {result!.summary}
          </div>
        )}

        {tab === "issues" && (
          <div className="stagger-children" style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
            {result!.comments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", animation: "fadeIn 0.4s ease-out" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", background: "rgba(53,230,188,0.1)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#35e6bc" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 500, color: "#35e6bc" }}>No issues found</p>
                <p style={{ fontSize: 13, color: "#8f8f8f", marginTop: 4 }}>This PR looks good to merge</p>
              </div>
            ) : (
              Object.entries(fileGroups).map(([file, comments]) => (
                <div key={file}>
                  {/* File header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="#8f8f8f">
                      <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
                    </svg>
                    <span style={{
                      fontSize: 13, color: "#cbcbcb",
                      fontFamily: "SF Mono, Roboto Mono, ui-monospace, monospace",
                    }}>
                      {file}
                    </span>
                    <span style={{ fontSize: 11, color: "#454545" }}>
                      {comments.length} issue{comments.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Comments */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {comments.map((c, i) => {
                      const s = severity[c.severity];
                      return (
                        <div
                          key={i}
                          style={{
                            background: s.bg, border: `1px solid ${s.border}`,
                            borderRadius: 10, padding: "14px 16px",
                            borderLeft: `3px solid ${s.color}`,
                            transition: "transform 0.15s ease, box-shadow 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                            <span style={{
                              fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                              letterSpacing: "0.05em", color: s.color,
                              background: `${s.color}15`, padding: "2px 6px", borderRadius: 4,
                            }}>
                              {s.label}
                            </span>
                            <span style={{
                              fontSize: 11, color: "#454545",
                              fontFamily: "SF Mono, monospace",
                            }}>
                              L{c.line}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: "#cbcbcb", lineHeight: 1.6 }}>
                            {c.comment}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureCard({ color, title, desc }: { color: string; title: string; desc: string }) {
  return (
    <div style={{
      background: "#181818", border: "1px solid #252525", borderRadius: 12,
      padding: 20, transition: "border-color 0.2s",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 12,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 500, color: "#f2f2f2", marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 12, color: "#8f8f8f", lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent", border: "none", cursor: "pointer",
        padding: "10px 16px", fontSize: 12, fontWeight: 500,
        color: active ? "#f2f2f2" : "#8f8f8f",
        borderBottom: active ? "2px solid #6096ff" : "2px solid transparent",
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}
