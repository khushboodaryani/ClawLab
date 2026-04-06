"use client";

import React, { useState } from "react";
import { TeddySmall } from "../mascot/TeddyMascot";

// ── Feature card ─────────────────────────────────────────────────────────────
export function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div 
      onMouseEnter={() => setHov(true)} 
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 20, 
        padding: "24px", 
        display: "flex", 
        flexDirection: "column", 
        gap: 12,
        background: hov ? "rgba(167,139,250,0.07)" : "rgba(255,255,255,0.04)",
        border: hov ? "1px solid rgba(167,139,250,0.30)" : "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)", 
        transition: "all 0.25s ease",
        transform: hov ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hov ? "0 12px 40px rgba(124,58,237,0.18)" : "none",
        cursor: "default",
      }}
    >
      <span style={{ fontSize: 26 }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Syne', sans-serif" }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "rgba(255,255,255,0.52)", fontFamily: "'DM Sans', sans-serif" }}>{desc}</p>
    </div>
  );
}

// ── Testimonial card ──────────────────────────────────────────────────────────
export function TestimonialCard({ handle, text }: { handle: string; text: string }) {
  return (
    <div 
      style={{
        borderRadius: 18, 
        padding: "18px 20px", 
        display: "flex", 
        flexDirection: "column", 
        gap: 10,
        background: "rgba(255,255,255,0.035)", 
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(6px)", 
        marginBottom: 16,
      }}
    >
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.72)", fontFamily: "'DM Sans', sans-serif" }}>
        &ldquo;{text}&rdquo;
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <TeddySmall size={18} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", fontFamily: "'Syne', sans-serif" }}>@{handle}</span>
      </div>
    </div>
  );
}

import { useAuth } from "@/context/AuthContext";

export function Navbar({ onLogin }: { onLogin?: () => void }) {
  const { user, logout } = useAuth();

  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <TeddySmall size={38} />
        <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px" }}>ClawLab</span>
      </div>
      <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
        {["Features", "Integrations", "Docs", "Community"].map(l => (
          <a key={l} href={`#${l.toLowerCase()}`} className="nav-link" style={{ color: "rgba(255,255,255,0.48)", fontSize: 14, fontWeight: 500 }}>{l}</a>
        ))}
      </div>
      
      {user ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user.picture ? (
              <img src={user.picture} alt={user.name} style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #7c3aed" }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                {user.name.charAt(0)}
              </div>
            )}
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: "'Syne', sans-serif" }}>{user.name}</span>
          </div>
          <a 
            href="/agent"
            style={{
              fontSize: 12, 
              fontWeight: 600, 
              padding: "6px 14px", 
              borderRadius: 8,
              background: "linear-gradient(135deg,#7c3aed,#2563eb)", 
              color: "#fff", 
              fontFamily: "'Syne', sans-serif",
              border: "none",
              cursor: "pointer",
              textDecoration: "none"
            }}
          >
            Dashboard
          </a>
          <button 
            onClick={logout}
            style={{
              fontSize: 12, 
              fontWeight: 600, 
              padding: "6px 14px", 
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)", 
              color: "rgba(255,255,255,0.6)", 
              fontFamily: "'Syne', sans-serif",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <button 
          onClick={onLogin}
          className="cta-main" 
          style={{
            fontSize: 13, 
            fontWeight: 700, 
            padding: "10px 22px", 
            borderRadius: 999,
            background: "linear-gradient(135deg,#7c3aed,#2563eb)", 
            color: "#fff", 
            fontFamily: "'Syne', sans-serif",
            border: "none",
            cursor: "pointer",
          }}
        >
          Get Started
        </button>
      )}
    </nav>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 40px 44px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <TeddySmall size={34} />
        <span style={{ fontWeight: 800, fontSize: 18, fontFamily: "'Syne', sans-serif" }}>ClawLab</span>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {["Blog","Showcase","Discord","GitHub","Docs","Trust"].map(l => (
          <a key={l} href="#" className="nav-link" style={{ color: "rgba(255,255,255,0.36)", fontSize: 13, textDecoration: "none" }}>{l}</a>
        ))}
      </div>
      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 12, margin: 0 }}>Built with 🧸 by the ClawLab community</p>
    </footer>
  );
}
