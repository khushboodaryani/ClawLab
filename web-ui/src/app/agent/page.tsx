"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ChatPanel from "@/components/ChatPanel";
import TerminalPanel from "@/components/TerminalPanel";
import { ChatMessage, PendingCommand, TerminalLine, SSEEvent } from "@/types";
import { createSession, sendMessage, approveCommand, subscribeToEvents, browseFolder, ImagePayload } from "@/lib/api";

let msgCounter = 0;
const uid = () => `${Date.now()}-${++msgCounter}`;

export default function AgentPage() {
  const [sessionId, setSessionId]   = useState<string | null>(null);
  const [workingDir, setWorkingDir] = useState<string>("");
  const [inputDir, setInputDir]     = useState<string>("C:\\Users\\DELL\\claw-code");
  const [input, setInput]           = useState("");
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [termLines, setTermLines]   = useState<TerminalLine[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash"); // Flash is multitasking king
  const [pendingImages, setPendingImages] = useState<ImagePayload[]>([]);
  
  const esRef = useRef<EventSource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTermLine = (content: string, stream: TerminalLine["stream"] = "system") => {
    setTermLines(prev => [...prev, { id: uid(), content, stream, timestamp: Date.now() }]);
  };

  const updatePendingCommand = (messageId: string, update: Partial<PendingCommand>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId && msg.pendingCommand
        ? { ...msg, pendingCommand: { ...msg.pendingCommand, ...update } }
        : msg
    ));
  };

  const pendingChatId = useRef<string | null>(null);

  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      const { session_id, working_dir } = await createSession(inputDir || undefined);
      setSessionId(session_id);
      setWorkingDir(working_dir);

      const es = subscribeToEvents(session_id);
      esRef.current = es;

      es.addEventListener("snapshot", () => {
        setIsConnected(true);
        setIsLoading(false);
        addTermLine(`📁 Working directory: ${working_dir}`, "system");
        addTermLine("🚀 Agent connected and ready.", "system");
      });

      es.addEventListener("message", (ev) => {
        const data = JSON.parse(ev.data) as SSEEvent & { type: "message" };
        const msg = data.message;
        const blocks = (msg as any).content || (msg as any).blocks || [];
        const text = blocks
          .filter((b: any) => b.type === "text")
          .map((b: any) => b.text)
          .join("\n");
        if (text) {
          setMessages(prev => [...prev, {
            id: uid(),
            role: msg.role === "user" ? "user" : "assistant",
            content: text,
            timestamp: Date.now(),
          }]);
        }
      });

      // REAL-TIME STREAMING HANDLER
      es.addEventListener("partial_message", (ev) => {
        const data = JSON.parse(ev.data) as { delta: string };
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === "assistant" && !lastMsg.pendingCommand) {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, content: lastMsg.content + data.delta }
            ];
          } else {
            return [...prev, {
              id: uid(),
              role: "assistant",
              content: data.delta,
              timestamp: Date.now(),
            }];
          }
        });
      });

      es.addEventListener("requires_approval", (ev) => {
        const data = JSON.parse(ev.data) as SSEEvent & { type: "requires_approval" };
        const chatId = uid();
        pendingChatId.current = chatId;

        const pendingCmd: PendingCommand = {
          command: data.command,
          risk: data.risk,
          blocked: data.blocked,
          status: "pending",
        };

        setMessages(prev => [...prev, {
          id: chatId,
          role: "assistant",
          content: data.blocked
            ? `⛔ I attempted to run a blocked command.`
            : `I need to run the following command:`,
          timestamp: Date.now(),
          pendingCommand: pendingCmd,
        }]);

        addTermLine(
          data.blocked
            ? `🚫 BLOCKED: ${data.command}`
            : `⏸ Waiting for approval: ${data.command}`,
          "system"
        );
      });

      es.addEventListener("log", (ev) => {
        const data = JSON.parse(ev.data) as SSEEvent & { type: "log" };
        addTermLine(data.content, data.stream);
      });

      es.addEventListener("done", (ev) => {
        const data = JSON.parse(ev.data) as SSEEvent & { type: "done" };
        const isSuccess = data.exit_code === 0;
        addTermLine(isSuccess ? `✅ Completed successfully (Exit code: 0)` : `❌ Failed with exit code: ${data.exit_code}`, isSuccess ? "system" : "stderr");
        if (pendingChatId.current) {
          updatePendingCommand(pendingChatId.current, {
            status: "done",
            exitCode: data.exit_code,
          });
        }
      });

      es.addEventListener("error", (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data) as SSEEvent & { type: "error" };
          addTermLine(`❌ Error: ${data.content}`, "stderr");
        } catch {
          setIsConnected(false);
          setIsLoading(false);
        }
      });

      es.onerror = () => {
        setIsConnected(false);
        setIsLoading(false);
      };
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  }, [inputDir]);

  const disconnect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setSessionId(null);
    setIsConnected(false);
    setMessages([]);
    setTermLines([]);
    setPendingImages([]);
    addTermLine("🛑 Disconnected from session.", "system");
  }, []);

  const handleSend = useCallback(async () => {
    if (!sessionId || (!input.trim() && pendingImages.length === 0)) return;
    const text = input.trim();
    const imagesToSend = [...pendingImages];
    
    setInput("");
    setPendingImages([]);

    try {
      await sendMessage(sessionId, text, imagesToSend.length > 0 ? imagesToSend : undefined, selectedModel);
    } catch (err) {
      addTermLine(`❌ Failed to send message: ${err}`, "stderr");
    }
  }, [sessionId, input, selectedModel, pendingImages]);

  const handleApprove = useCallback(async (messageId: string) => {
    if (!sessionId) return;
    updatePendingCommand(messageId, { status: "approved" });
    addTermLine("▶ Executing command...", "system");
    await approveCommand(sessionId, true);
  }, [sessionId]);

  const handleDeny = useCallback(async (messageId: string) => {
    if (!sessionId) return;
    updatePendingCommand(messageId, { status: "denied" });
    addTermLine("✕ Command denied by user.", "system");
    await approveCommand(sessionId, false);
  }, [sessionId]);

  const handleRetry = useCallback((command: string) => {
    if (!sessionId) return;
    setInput(`run: ${command}`);
  }, [sessionId]);

  const handleBrowse = async () => {
    try {
      const path = await browseFolder();
      if (path) setInputDir(path);
    } catch (err) {
      console.error("Browse failed", err);
    }
  };

  // MULTIMODAL HANDLERS
  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        setPendingImages(prev => [...prev, { media_type: file.type, data: base64 }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
            const blob = items[i].getAsFile();
            if (blob) files.push(blob);
        }
    }
    if (files.length > 0) processFiles(files);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  return (
    <div 
        onDrop={onDrop} 
        onDragOver={e => e.preventDefault()}
        style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}
    >
      {/* Top bar */}
      <header style={{
        padding: "0 20px",
        height: "52px",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid var(--border)",
        gap: "12px",
        flexShrink: 0,
        background: "var(--bg-secondary)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>⚡</span>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>ClawAgent</span>
          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "var(--accent-glow)", color: "var(--accent)", fontWeight: 600, letterSpacing: "0.5px" }}>
            PRO
          </span>
        </div>

        {!isConnected && (
          <>
            <input
              type="text"
              placeholder="Project directory path..."
              value={inputDir}
              onChange={e => setInputDir(e.target.value)}
              style={{
                flex: 1,
                maxWidth: "400px",
                marginLeft: "auto",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                fontSize: "12px",
                outline: "none",
              }}
            />
            <button
              onClick={handleBrowse}
              disabled={isLoading}
              style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-tertiary)", color: "var(--text-primary)", fontSize: "12px", cursor: "pointer" }}
            >
              📂 Browse
            </button>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-tertiary)", color: "var(--text-primary)", fontSize: "12px", outline: "none", cursor: "pointer" }}
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Super Fast ⚡)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Powerful 🧠)</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="gpt-4o">GPT-4o (Paid API)</option>
              <option value="llama3">Llama 3 (Ollama Local)</option>
              <option value="mistral">Mistral (Ollama Local)</option>
            </select>
            <button
              onClick={connect}
              disabled={isLoading}
              style={{ padding: "7px 18px", borderRadius: "8px", border: "none", background: isLoading ? "var(--border)" : "var(--accent)", color: "white", fontWeight: 600, fontSize: "13px", cursor: isLoading ? "not-allowed" : "pointer" }}
            >
              {isLoading ? "Connecting..." : "Connect"}
            </button>
          </>
        )}

        {isConnected && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>📁 {workingDir}</div>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
            <button onClick={disconnect} style={{ marginLeft: "8px", padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-tertiary)", color: "var(--red)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              ✕ Disconnect
            </button>
          </div>
        )}
      </header>

      {/* Main split view */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ width: "50%", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-secondary)" }}>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <ChatPanel
              messages={messages}
              isConnected={isConnected}
              onApprove={handleApprove}
              onDeny={handleDeny}
              onRetry={handleRetry}
            />
          </div>

          {/* Pending Images Preview */}
          {pendingImages.length > 0 && (
            <div style={{ display: "flex", gap: "10px", padding: "10px 16px", borderTop: "1px solid var(--border)", background: "var(--bg-primary)", overflowX: "auto" }}>
                {pendingImages.map((img, i) => (
                    <div key={i} style={{ position: "relative", flexShrink: 0 }}>
                        <img 
                            src={`data:${img.media_type};base64,${img.data}`} 
                            style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border-accent)" }} 
                        />
                        <button 
                            onClick={() => setPendingImages(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ position: "absolute", top: "-5px", right: "-5px", width: "18px", height: "18px", borderRadius: "50%", background: "var(--red)", color: "white", border: "none", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >✕</button>
                    </div>
                ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: "10px", flexShrink: 0, background: "var(--bg-secondary)", alignItems: "center" }}>
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                onChange={e => e.target.files && processFiles(e.target.files)} 
                accept="image/*"
                multiple
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={!isConnected}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", padding: "0 5px", color: "var(--text-muted)" }}
                title="Attach Image"
            >📎</button>
            
            <input
              id="chat-input"
              type="text"
              placeholder={isConnected ? 'Message ClawAgent...' : "Connect to start chatting"}
              value={input}
              disabled={!isConnected}
              onPaste={onPaste}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
              style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--bg-tertiary)", color: "var(--text-primary)", fontSize: "14px", outline: "none", transition: "border-color 0.15s" }}
            />
            
            <button
              id="send-btn"
              onClick={handleSend}
              disabled={!isConnected || (!input.trim() && pendingImages.length === 0)}
              style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: isConnected && (input.trim() || pendingImages.length > 0) ? "var(--accent)" : "var(--bg-tertiary)", color: "white", fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all 0.15s" }}
            >
              Send ⚡
            </button>
          </div>
        </div>

        <div style={{ width: "50%", overflow: "hidden", background: "#08080a" }}>
          <TerminalPanel lines={termLines} onClear={() => setTermLines([])} />
        </div>
      </div>
    </div>
  );
}
