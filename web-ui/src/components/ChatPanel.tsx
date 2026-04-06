"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "@/types";
import CommandCard from "./CommandCard";

interface ChatPanelProps {
  messages: ChatMessage[];
  isConnected: boolean;
  onApprove: (messageId: string) => void;
  onDeny: (messageId: string) => void;
  onRetry: (command: string) => void;
}

export default function ChatPanel({ messages, isConnected, onApprove, onDeny, onRetry }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexShrink: 0,
      }}>
        <div style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: isConnected ? "var(--green)" : "var(--red)",
          boxShadow: isConnected ? "0 0 8px var(--green)" : "none",
          transition: "all 0.3s",
        }} />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Chat</span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {messages.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🤖</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
              Agent Ready
            </div>
            <div style={{ fontSize: "12px" }}>
              Type a message or start with <code style={{ color: "var(--accent)" }}>run: npm install</code> to test
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="animate-fade-in" style={{ display: "flex", flexDirection: "column" }}>
            {/* Role label */}
            <div style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: msg.role === "user" ? "var(--accent)" : "var(--text-muted)",
              marginBottom: "4px",
              paddingLeft: "2px",
            }}>
              {msg.role === "user" ? "You" : "Agent"}
            </div>

            {/* Bubble */}
            <div style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "88%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: msg.role === "user" ? "var(--accent-dim)" : "var(--bg-tertiary)",
              border: msg.role === "user" ? "none" : "1px solid var(--border)",
              color: "var(--text-primary)",
              fontSize: "14px",
              lineHeight: "1.6",
              wordBreak: "break-word",
              userSelect: "text",
            }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "inherit" }}>
                {msg.content}
              </pre>

              {msg.pendingCommand && (
                <CommandCard
                  command={msg.pendingCommand}
                  onApprove={() => onApprove(msg.id)}
                  onDeny={() => onDeny(msg.id)}
                />
              )}

              {/* Error recovery buttons */}
              {msg.pendingCommand?.status === "done" && msg.pendingCommand.exitCode !== 0 && (
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button
                    onClick={() => onRetry(msg.pendingCommand!.command)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-accent)",
                      background: "var(--bg-hover)",
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    🔄 Retry
                  </button>
                  <button
                    onClick={() => onRetry(`The command "${msg.pendingCommand!.command}" failed. Please fix the error.`)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--accent-dim)",
                      background: "var(--accent-glow)",
                      color: "var(--accent)",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    🤖 Ask AI to Fix
                  </button>
                </div>
              )}
            </div>

            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px", paddingLeft: "2px" }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
