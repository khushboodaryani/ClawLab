"use client";

import React from "react";
import { TeddyDoodle } from "../mascot/TeddyMascot";
import { AuthButtons } from "./AuthButtons";

export function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(7, 6, 15, 0.85)",
        backdropFilter: "blur(12px)",
        animation: "fadeIn 0.3s ease",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      
      <div 
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 32,
          padding: "40px 32px",
          textAlign: "center",
          position: "relative",
          animation: "scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 100px rgba(124,58,237,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.3)",
            fontSize: 24,
            cursor: "pointer",
            padding: 4,
          }}
        >
          ×
        </button>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <TeddyDoodle size={100} animate />
        </div>
        
        <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif", marginBottom: 12 }}>
          Welcome to ClawLab
        </h2>
        
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 32, lineHeight: 1.6 }}>
          Join our community of builders and start commanding your AI future today.
        </p>

        <AuthButtons />

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 32 }}>
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
