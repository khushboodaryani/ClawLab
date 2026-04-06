"use client";

import { CommandRisk, PendingCommand } from "@/types";

interface CommandCardProps {
  command: PendingCommand;
  onApprove: () => void;
  onDeny: () => void;
}

const RISK_CONFIG: Record<CommandRisk, { label: string; color: string; bg: string; icon: string }> = {
  low:     { label: "Low Risk",    color: "#3ecf72", bg: "rgba(62,207,114,0.08)",  icon: "✅" },
  medium:  { label: "Medium Risk", color: "#f5a623", bg: "rgba(245,166,35,0.08)",  icon: "⚠️" },
  high:    { label: "High Risk",   color: "#f05151", bg: "rgba(240,81,81,0.08)",   icon: "🚨" },
  blocked: { label: "BLOCKED",     color: "#f05151", bg: "rgba(240,81,81,0.12)",   icon: "🚫" },
};

export default function CommandCard({ command, onApprove, onDeny }: CommandCardProps) {
  const cfg = RISK_CONFIG[command.risk];
  const isDone = command.status !== "pending";

  return (
    <div
      className="animate-fade-in"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.color}40`,
        borderLeft: `3px solid ${cfg.color}`,
        borderRadius: "10px",
        padding: "12px 14px",
        marginTop: "10px",
        opacity: isDone ? 0.6 : 1,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span style={{ fontSize: "12px" }}>{cfg.icon}</span>
        <span style={{ fontSize: "11px", fontWeight: 600, color: cfg.color, letterSpacing: "0.5px", textTransform: "uppercase" }}>
          {cfg.label}
        </span>
      </div>

      {/* Command */}
      <div
        style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: "6px",
          padding: "8px 12px",
          marginBottom: "10px",
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontSize: "13px",
          color: "#e8e8ed",
          wordBreak: "break-all",
        }}
      >
        <span style={{ color: "#3ecf72", marginRight: "8px" }}>$</span>
        {command.command}
      </div>

      {/* Status or Buttons */}
      {command.status === "pending" && !command.blocked && (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onApprove}
            style={{
              flex: 1,
              padding: "7px 12px",
              borderRadius: "6px",
              border: "1px solid #3ecf7240",
              background: "rgba(62,207,114,0.12)",
              color: "#3ecf72",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(62,207,114,0.22)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(62,207,114,0.12)")}
          >
            ✓ Execute
          </button>
          <button
            onClick={onDeny}
            style={{
              flex: 1,
              padding: "7px 12px",
              borderRadius: "6px",
              border: "1px solid #f0515140",
              background: "rgba(240,81,81,0.08)",
              color: "#f05151",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(240,81,81,0.18)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(240,81,81,0.08)")}
          >
            ✕ Deny
          </button>
        </div>
      )}

      {command.status === "pending" && command.blocked && (
        <div style={{ fontSize: "12px", color: "#f05151" }}>
          🚫 This command is permanently blocked for safety. It cannot be executed.
        </div>
      )}

      {command.status === "approved" && (
        <div style={{ fontSize: "12px", color: cfg.color }}>
          ▶ Executing...
        </div>
      )}

      {command.status === "done" && (
        <div style={{ fontSize: "12px", color: command.exitCode === 0 ? "#3ecf72" : "#f05151" }}>
          {command.exitCode === 0 ? "✓ Completed successfully" : `✕ Failed with exit code ${command.exitCode}`}
        </div>
      )}

      {command.status === "denied" && (
        <div style={{ fontSize: "12px", color: "#8e8ea0" }}>
          Command denied by user.
        </div>
      )}
    </div>
  );
}
