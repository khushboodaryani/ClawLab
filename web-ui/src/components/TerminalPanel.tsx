"use client";

import { useRef, useEffect } from "react";
import { TerminalLine } from "@/types";

interface TerminalPanelProps {
  lines: TerminalLine[];
  onClear: () => void;
}

const LINE_COLOR: Record<string, string> = {
  stdout: "var(--text-primary)",
  stderr: "var(--red)",
  system: "var(--text-muted)",
};

export default function TerminalPanel({ lines, onClear }: TerminalPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [lines]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}>
        {/* macOS-style traffic lights */}
        <div style={{ display: "flex", gap: "6px", marginRight: "12px" }}>
          {["#f05151", "#f5a623", "#3ecf72"].map((color, i) => (
            <div key={i} style={{ width: "11px", height: "11px", borderRadius: "50%", background: color, opacity: 0.8 }} />
          ))}
        </div>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>Terminal</span>
        <button
          onClick={onClear}
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: "4px",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-secondary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          Clear
        </button>
      </div>

      {/* Terminal output */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "12px 16px",
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        fontSize: "12.5px",
        lineHeight: "1.7",
        background: "#08080a",
        userSelect: "text",
      }}>
        {lines.length === 0 && (
          <div className="terminal-cursor" style={{ color: "var(--text-muted)" }}>
            Awaiting command execution
          </div>
        )}

        {lines.map((line) => (
          <div key={line.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            {line.stream === "system" ? (
              <span style={{ color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{line.content}</span>
            ) : (
              <>
                <span style={{ color: line.stream === "stderr" ? "var(--red)" : "#5a7fa8", flexShrink: 0, userSelect: "none" }}>
                  {line.stream === "stderr" ? "✗" : "›"}
                </span>
                <span style={{ color: LINE_COLOR[line.stream], whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {line.content}
                </span>
              </>
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
