"use client";

import React, { useState } from "react";
import { TeddySmall } from "../mascot/TeddyMascot";

export function Terminal() {
  const [copied, setCopied] = useState(false);
  const cmd = "npm i -g clawlab && clawlab onboard";

  const handleCopy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="install" style={{ maxWidth: 680, margin: "60px auto 80px", padding: "0 24px" }}>
      <div style={{ borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.025)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {["#ff5f57","#ffbd2e","#28c840"].map(c => <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c, display: "inline-block" }} />)}
          <div style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 7 }}>
            <TeddySmall size={22} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", fontFamily: "monospace" }}>clawlab — bash</span>
          </div>
        </div>
        <div style={{ padding: "24px 24px 20px", fontFamily: "monospace", fontSize: 13 }}>
          <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.26)" }}># The tiny bear that runs your life</p>
          <div 
            onClick={handleCopy}
            style={{
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              padding: "12px 16px", 
              borderRadius: 12, 
              cursor: "pointer",
              background: "rgba(255,255,255,0.045)", 
              border: "1px solid rgba(255,255,255,0.09)",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
          >
            <span>
              <span style={{ color: "#a78bfa" }}>$ </span>
              <span style={{ color: "rgba(255,255,255,0.85)" }}>{cmd}</span>
            </span>
            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: "rgba(167,139,250,0.2)", color: "#c4b5fd", marginLeft: 16, flexShrink: 0 }}>
              {copied ? "✓ Copied!" : "Copy"}
            </span>
          </div>
          <p style={{ margin: "14px 0 0", color: "rgba(255,255,255,0.24)" }}># macOS · Windows · Linux · installs Node.js for you</p>
        </div>
      </div>
    </section>
  );
}
