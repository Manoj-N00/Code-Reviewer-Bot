"use client";

import { useState, useRef, useLayoutEffect } from "react";
import ReviewForm from "./components/review-form";

export default function Home() {
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);

  if (submittedUrl) {
    return <ReviewForm prUrl={submittedUrl} onBack={() => setSubmittedUrl(null)} />;
  }

  return <LandingPage onSubmit={setSubmittedUrl} />;
}

/* ─────────────────────────────────────────────────────────
   Landing Page
───────────────────────────────────────────────────────── */
function LandingPage({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = url.trim();
    if (!v) return;
    onSubmit(v);
  }

  function handlePill(pr: string) {
    onSubmit(`https://github.com/${pr.replace("#", "/pull/")}`);
  }

  const pills = ["sgl-project/sglang#12668", "openai/codex#8961", "microsoft/vscode#240128"];

  return (
    <div style={{ background: "#141414", minHeight: "100vh" }}>

      {/* ── GitHub link — top right ── */}
      <a
        href="https://github.com/Manoj-N00/Code-Reviewer-Bot"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          top: 16,
          right: 20,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 14px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          textDecoration: "none",
          color: "rgba(255,255,255,0.75)",
          fontSize: 13,
          fontWeight: 500,
          transition: "all 0.15s ease",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.background = "rgba(255,255,255,0.1)";
          el.style.borderColor = "rgba(255,255,255,0.22)";
          el.style.color = "rgba(255,255,255,0.95)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.background = "rgba(255,255,255,0.05)";
          el.style.borderColor = "rgba(255,255,255,0.1)";
          el.style.color = "rgba(255,255,255,0.75)";
        }}
      >
        {/* GitHub icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8a8.013 8.013 0 0 0 5.45 7.59c.4.08.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        Manoj-N00/Code-Reviewer-Bot
      </a>

      {/* ── Hero ── */}
      <div style={{ padding: "72px 80px 0", maxWidth: 900 }}>
        <h1 style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.12, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.9)", marginBottom: 20 }}>
          <span style={{ display: "inline-flex" }}>
            <HatchWord color="#4ade80">Code</HatchWord>
            {" "}
            <HatchWord color="#f87171">Review</HatchWord>
          </span>
          {" "}is the way to<br />understand code.
        </h1>

        <p style={{ fontSize: 16, color: "#9ca3af", lineHeight: 1.6, marginBottom: 36, maxWidth: 520 }}>
          Code review that organizes diffs, detects moved code, and flags potential bugs.
        </p>

        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 10 }}>
          Try on any <strong style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>public</strong> GitHub PR URL
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Or connect this bot to your repository for automatic PR reviews.
          </span>
          <a
            href="https://github.com/apps/code-reviewer-bot/installations/new"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.85)",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 7,
              padding: "5px 10px",
              background: "rgba(255,255,255,0.03)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "rgba(255,255,255,0.28)";
              el.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "rgba(255,255,255,0.14)";
              el.style.background = "rgba(255,255,255,0.03)";
            }}
          >
            Connect repository
          </a>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{
            display: "flex", alignItems: "center", width: 520,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, overflow: "hidden",
          }}>
            <input
              type="text" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="github.com/owner/repo/pull/123"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "12px 16px", fontSize: 14, color: "rgba(255,255,255,0.85)" }}
              onFocus={e => { (e.currentTarget.parentElement as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
              onBlur={e  => { (e.currentTarget.parentElement as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
            />
            <button type="submit" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "12px 16px", color: url.trim() ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </form>

        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {pills.map(pr => (
            <button key={pr} onClick={() => handlePill(pr)} style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20, color: "#9ca3af", padding: "5px 14px", fontSize: 12,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.22)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "#9ca3af"; }}
            >{pr}</button>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "56px 0 0" }} />

      {/* ── Preview: full diff mockup (scrollable content) ── */}
      <div style={{ display: "flex" }}>
        {/* Main diff column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* PR title row */}
          <PrRow num={1} title="Add setTimeout.clock marker for fake timer detection" comments="0/1" />

          {/* File 1 */}
          <FileRow name="FakeTimers.zig" path="src/bun.js/test/timers/FakeTimers.zig" additions={22} />
          <DiffBlock lines={[
            { type: "info",    text: "@@ -188,7 +188,7 @@" },
            { type: "context", text: "  pub fn setFakeTimerMarker(this: *FakeTimers) void {" },
            { type: "context", text: "      const clock = this.clock;" },
            { type: "removed", text: "-     clock.is_fake = false;" },
            { type: "added",   text: "+     clock.is_fake = true;" },
            { type: "context", text: "      if (clock.setTimeout) |f| {" },
            { type: "context", text: "          f.mark();" },
            { type: "context", text: "      }" },
          ]} />

          {/* File 2 */}
          <PrRow num={2} title="Fix setTimeout behavior in Node.js compatibility layer" comments="1/3" />
          <FileRow name="Timer.zig" path="src/bun.js/Timer.zig" additions={45} deletions={12} />
          <DiffBlock lines={[
            { type: "info",    text: "@@ -42,6 +42,19 @@" },
            { type: "context", text: "  const Timer = struct {" },
            { type: "context", text: "      handle: uv.uv_timer_t," },
            { type: "added",   text: "+     is_clock_marker: bool = false," },
            { type: "added",   text: "+     clock_id: u32 = 0," },
            { type: "context", text: "      callback: JSValue," },
            { type: "context", text: "  };" },
            { type: "info",    text: "@@ -98,4 +111,8 @@" },
            { type: "context", text: "  fn setTimeout(this: *Timer, ms: u64) void {" },
            { type: "removed", text: "-     this.handle.start(ms, 0);" },
            { type: "added",   text: "+     if (this.is_clock_marker) {" },
            { type: "added",   text: "+         this.markClock();" },
            { type: "added",   text: "+     }" },
            { type: "added",   text: "+     this.handle.start(ms, 0);" },
            { type: "context", text: "  }" },
          ]} />

          {/* File 3 */}
          <FileRow name="clock.zig" path="src/bun.js/test/timers/clock.zig" additions={8} />
          <DiffBlock lines={[
            { type: "info",    text: "@@ -5,5 +5,13 @@" },
            { type: "context", text: "  pub const Clock = struct {" },
            { type: "context", text: "      is_fake: bool = false," },
            { type: "added",   text: "+     /// Clock marker injected by setTimeout" },
            { type: "added",   text: "+     setTimeout: ?*const fn () void = null," },
            { type: "added",   text: "+     setInterval: ?*const fn () void = null," },
            { type: "added",   text: "+     clearTimeout: ?*const fn () void = null," },
            { type: "context", text: "      tick: u64 = 0," },
            { type: "context", text: "  };" },
          ]} />

          {/* File 4 */}
          <PrRow num={3} title="Add regression test for FakeTimers clock detection" comments="0/0" />
          <FileRow name="FakeTimers.test.zig" path="src/bun.js/test/timers/FakeTimers.test.zig" additions={67} />
          <DiffBlock lines={[
            { type: "info",    text: "@@ -0,0 +1,67 @@" },
            { type: "added",   text: "+const std = @import(\"std\");" },
            { type: "added",   text: "+const FakeTimers = @import(\"FakeTimers.zig\");" },
            { type: "added",   text: "+" },
            { type: "added",   text: "+test \"setTimeout.clock marker is set\" {" },
            { type: "added",   text: "+    var timers = FakeTimers.init();" },
            { type: "added",   text: "+    defer timers.deinit();" },
            { type: "added",   text: "+" },
            { type: "added",   text: "+    timers.install();" },
            { type: "added",   text: "+    try std.testing.expect(timers.clock.is_fake == true);" },
            { type: "added",   text: "+    try std.testing.expect(timers.clock.setTimeout != null);" },
            { type: "added",   text: "+}" },
            { type: "added",   text: "+" },
            { type: "added",   text: "+test \"clearTimeout removes marker\" {" },
            { type: "added",   text: "+    var timers = FakeTimers.init();" },
            { type: "added",   text: "+    defer timers.deinit();" },
            { type: "added",   text: "+    timers.install();" },
            { type: "added",   text: "+    timers.uninstall();" },
            { type: "added",   text: "+    try std.testing.expect(timers.clock.is_fake == false);" },
            { type: "added",   text: "+}" },
          ]} />
        </div>

        {/* ── Right: Bug Catcher panel ── */}
        <RightPanel />
      </div>
    </div>
  );
}

/* ── Small reusable pieces ── */

function HatchWord({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ color, padding: "0 0.05em", display: "inline-block", position: "relative", overflow: "hidden" }}>
      {children}
      <span style={{
        pointerEvents: "none", position: "absolute", inset: "-50%",
        width: "200%", height: "200%",
        background: `repeating-linear-gradient(-55deg, color-mix(in srgb, ${color} 20%, transparent) 0px, color-mix(in srgb, ${color} 20%, transparent) 1.5px, transparent 1.5px, transparent 5px)`,
      }} />
    </span>
  );
}


function PrRow({ num, title, comments }: { num: number; title: string; comments: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)",
      background: num % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, color: "#6b7280", minWidth: 16, textAlign: "right" }}>{num}</span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#6b7280", fontSize: 12, flexShrink: 0 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        {comments}
      </div>
    </div>
  );
}

function FileRow({ name, path, additions = 0, deletions = 0 }: { name: string; path: string; additions?: number; deletions?: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)",
      background: "rgba(255,255,255,0.015)",
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600, fontFamily: "monospace" }}>{name}</span>
      <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace", flex: 1 }}>{path}</span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" style={{ cursor: "pointer" }}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      {additions > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "2px 7px", borderRadius: 4 }}>+{additions}</span>}
      {deletions > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "#f87171", background: "rgba(248,113,113,0.1)", padding: "2px 7px", borderRadius: 4 }}>-{deletions}</span>}
      <button style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 5, color: "#9ca3af", padding: "3px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
        Mark as viewed
      </button>
    </div>
  );
}

type DiffLineType = "added" | "removed" | "context" | "info";

function DiffBlock({ lines }: { lines: { type: DiffLineType; text: string }[] }) {
  const bg: Record<DiffLineType, string> = {
    added:   "rgba(74,222,128,0.07)",
    removed: "rgba(248,113,113,0.07)",
    context: "transparent",
    info:    "rgba(99,102,241,0.06)",
  };
  const fg: Record<DiffLineType, string> = {
    added:   "#4ade80",
    removed: "#f87171",
    context: "#9ca3af",
    info:    "#818cf8",
  };
  const prefix: Record<DiffLineType, string> = { added: "+", removed: "-", context: " ", info: " " };

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "#0f0f0f" }}>
      {lines.map((l, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "baseline", padding: "2px 24px",
          background: bg[l.type], borderLeft: l.type === "added" ? "2px solid rgba(74,222,128,0.4)" : l.type === "removed" ? "2px solid rgba(248,113,113,0.4)" : "2px solid transparent",
        }}>
          <span style={{ fontSize: 11, color: fg[l.type], fontFamily: "monospace", opacity: 0.7, userSelect: "none", minWidth: 12, marginRight: 16 }}>
            {prefix[l.type]}
          </span>
          <span style={{ fontSize: 12, color: fg[l.type], fontFamily: "monospace", whiteSpace: "pre" }}>{l.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Accordion component — exact Devin accordion-down/up animation ── */
function Accordion({
  label, color, dot, children, defaultOpen = true,
}: {
  label: string; color: string; dot: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [animating, setAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState<number>(0);

  // Measure natural height once mounted
  useLayoutEffect(() => {
    if (contentRef.current) setContentH(contentRef.current.scrollHeight);
  }, [children]);

  function toggle() {
    if (contentRef.current) setContentH(contentRef.current.scrollHeight);
    setAnimating(true);
    setOpen(o => !o);
  }

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Header row — clicking toggles */}
      <button
        onClick={toggle}
        style={{
          display: "flex", alignItems: "center", gap: 6, width: "100%",
          background: "transparent", border: "none", cursor: "pointer",
          padding: "6px 0", marginBottom: 4,
        }}
      >
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color, flex: 1, textAlign: "left" }}>{label}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={color} strokeWidth="2.5" strokeLinecap="round"
          style={{
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Animated content — accordion-down / accordion-up */}
      <div
        style={{
          overflow: "hidden",
          // Use max-height transition which works reliably without JS height vars
          maxHeight: open ? `${contentH + 40}px` : "0px",
          opacity: open ? 1 : 0,
          transition: "max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease",
        }}
        onTransitionEnd={() => setAnimating(false)}
      >
        <div ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Right sticky panel ── */
function RightPanel() {
  const files = [
    { name: "FakeTimers.zig",      c: "#4ade80" },
    { name: "Timer.zig",           c: "#f59e0b" },
    { name: "clock.zig",           c: "#4ade80" },
    { name: "FakeTimers.test.zig", c: "#4ade80" },
  ];

  return (
    <div style={{
      width: 300, minWidth: 300, borderLeft: "1px solid rgba(255,255,255,0.06)",
      background: "#141414", padding: "20px 16px",
      position: "sticky", top: 52, height: "calc(100vh - 52px)", overflowY: "auto",
      animation: "popover-in 0.35s cubic-bezier(0.4, 0, 0.2, 1) both",
    }}>

      {/* Changes in PR */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 10 }}>
          Changes in PR
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {files.map((f, i) => (
            <div
              key={f.name}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 8px", borderRadius: 6, cursor: "pointer",
                transition: "background 0.12s",
                animation: `fadeIn 0.3s ease both`,
                animationDelay: `${i * 55}ms`,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill={f.c} fillOpacity="0.75">
                <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"/>
              </svg>
              <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace", flex: 1 }}>{f.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 16 }} />

      {/* Bug Catcher label */}
      <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
        Bug Catcher
      </p>

      {/* Bugs accordion */}
      <Accordion label="1 Potential bug" color="#ef4444" dot="#ef4444" defaultOpen>
        <BugCard
          title="setFakeTimerMarker sets clock to false instead of true"
          file="FakeTimers.zig" line={188} type="Bug" color="#ef4444"
        />
      </Accordion>

      {/* Flags accordion */}
      <div style={{ marginTop: 12 }}>
        <Accordion label="2 Flags" color="#6366f1" dot="#6366f1" defaultOpen>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <BugCard
              title="Timer.is_clock_marker field may cause alignment issues in packed structs"
              file="Timer.zig" line={43} type="Investigate" color="#6366f1"
            />
            <BugCard
              title="Missing null check before dereferencing setTimeout function pointer"
              file="Timer.zig" line={114} type="Investigate" color="#6366f1"
            />
          </div>
        </Accordion>
      </div>
    </div>
  );
}

function BugCard({ title, file, line, type, color }: { title: string; file: string; line: number; type: string; color: string }) {
  return (
    <div style={{
      padding: "9px 10px",
      background: `${color}08`,
      border: `1px solid ${color}20`,
      borderRadius: 7,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, marginTop: 5, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{title}</p>
          <p style={{ fontSize: 10, color: "#6b7280", marginTop: 3 }}>
            <span style={{ color }}>{type}</span> · {file}:{line}
          </p>
        </div>
      </div>
    </div>
  );
}
