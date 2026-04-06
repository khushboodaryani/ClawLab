"use client";

import React from "react";

// ── TEDDY DOODLE with specs ───────────────────────────────────────────────────
export function TeddyDoodle({ size = 220, animate = true }: { size?: number; animate?: boolean }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 220 220"
      style={{ 
        filter: "drop-shadow(0 8px 32px rgba(167,139,250,0.35))", 
        ...(animate ? { animation: "teddyFloat 4s ease-in-out infinite" } : {}) 
      }}
    >
      {/* ears behind head */}
      <ellipse cx="62" cy="72" rx="22" ry="20" fill="#d4a76a" stroke="#1a1025" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="62" cy="72" rx="13" ry="12" fill="#f0c98a" />
      <ellipse cx="158" cy="72" rx="22" ry="20" fill="#d4a76a" stroke="#1a1025" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="158" cy="72" rx="13" ry="12" fill="#f0c98a" />
      {/* head */}
      <ellipse cx="110" cy="100" rx="54" ry="50" fill="#e8b96a" stroke="#1a1025" strokeWidth="2.5" />
      {/* face patch */}
      <ellipse cx="110" cy="112" rx="30" ry="24" fill="#f5d89a" stroke="#1a1025" strokeWidth="1.5" />
      {/* nose */}
      <ellipse cx="110" cy="107" rx="8" ry="5.5" fill="#1a1025" />
      <ellipse cx="108" cy="105.5" rx="2.5" ry="1.5" fill="#fff" opacity="0.5" />
      {/* mouth */}
      <path d="M103 113 Q110 120 117 113" fill="none" stroke="#1a1025" strokeWidth="2" strokeLinecap="round" />
      {/* glasses */}
      <rect x="76" y="84" width="30" height="20" rx="8" fill="none" stroke="#1a1025" strokeWidth="2.2" />
      <rect x="114" y="84" width="30" height="20" rx="8" fill="none" stroke="#1a1025" strokeWidth="2.2" />
      <line x1="106" y1="94" x2="114" y2="94" stroke="#1a1025" strokeWidth="2" strokeLinecap="round" />
      <line x1="76" y1="94" x2="62" y2="90" stroke="#1a1025" strokeWidth="2" strokeLinecap="round" />
      <line x1="144" y1="94" x2="158" y2="90" stroke="#1a1025" strokeWidth="2" strokeLinecap="round" />
      <rect x="77" y="85" width="28" height="18" rx="7" fill="#c084fc" opacity="0.20" />
      <rect x="115" y="85" width="28" height="18" rx="7" fill="#c084fc" opacity="0.20" />
      <line x1="82" y1="89" x2="88" y2="89" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="120" y1="89" x2="126" y2="89" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      {/* eyes */}
      <circle cx="91" cy="95" r="5" fill="#1a1025" />
      <circle cx="129" cy="95" r="5" fill="#1a1025" />
      <circle cx="93" cy="93" r="1.8" fill="#fff" opacity="0.9" />
      <circle cx="131" cy="93" r="1.8" fill="#fff" opacity="0.9" />
      {/* blush */}
      <ellipse cx="80" cy="112" rx="9" ry="6" fill="#f472b6" opacity="0.35" />
      <ellipse cx="140" cy="112" rx="9" ry="6" fill="#f472b6" opacity="0.35" />
      {/* body */}
      <ellipse cx="110" cy="175" rx="42" ry="36" fill="#d4a76a" stroke="#1a1025" strokeWidth="2.5" />
      <ellipse cx="110" cy="178" rx="24" ry="20" fill="#f5d89a" stroke="#1a1025" strokeWidth="1.5" />
      <ellipse cx="110" cy="182" rx="5" ry="4" fill="#d4a76a" stroke="#1a1025" strokeWidth="1.2" />
      {/* arms */}
      <ellipse cx="68" cy="168" rx="14" ry="28" fill="#d4a76a" stroke="#1a1025" strokeWidth="2" transform="rotate(-20 68 168)" />
      <ellipse cx="152" cy="168" rx="14" ry="28" fill="#d4a76a" stroke="#1a1025" strokeWidth="2" transform="rotate(20 152 168)" />
      {/* legs */}
      <ellipse cx="88" cy="208" rx="16" ry="12" fill="#d4a76a" stroke="#1a1025" strokeWidth="2" />
      <ellipse cx="132" cy="208" rx="16" ry="12" fill="#d4a76a" stroke="#1a1025" strokeWidth="2" />
      {/* scarf */}
      <path d="M72 145 Q110 135 148 145 Q148 155 110 158 Q72 155 72 145 Z" fill="#7c3aed" stroke="#1a1025" strokeWidth="1.5" />
      <path d="M82 150 Q110 142 138 150" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.5" />
      <path d="M78 154 Q70 165 73 175" fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" />
      <path d="M73 175 Q68 182 72 188" fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" />
      {/* sparkles */}
      <text x="22" y="55" fontSize="14" fill="#f9a8d4" opacity="0.85">✦</text>
      <text x="185" y="48" fontSize="10" fill="#67e8f9" opacity="0.8">✦</text>
      <text x="10" y="155" fontSize="9" fill="#c084fc" opacity="0.7">✦</text>
      <text x="198" y="165" fontSize="12" fill="#f9a8d4" opacity="0.75">✦</text>
    </svg>
  );
}

// ── Tiny teddy for inline accents ─────────────────────────────────────────────
export function TeddySmall({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      <ellipse cx="62" cy="72" rx="22" ry="20" fill="#d4a76a" stroke="#1a1025" strokeWidth="2.5" />
      <ellipse cx="62" cy="72" rx="13" ry="12" fill="#f0c98a" />
      <ellipse cx="158" cy="72" rx="22" ry="20" fill="#d4a76a" stroke="#1a1025" strokeWidth="2.5" />
      <ellipse cx="158" cy="72" rx="13" ry="12" fill="#f0c98a" />
      <ellipse cx="110" cy="100" rx="54" ry="50" fill="#e8b96a" stroke="#1a1025" strokeWidth="2.5" />
      <ellipse cx="110" cy="112" rx="30" ry="24" fill="#f5d89a" stroke="#1a1025" strokeWidth="1.5" />
      <ellipse cx="110" cy="107" rx="8" ry="5.5" fill="#1a1025" />
      <path d="M103 113 Q110 120 117 113" fill="none" stroke="#1a1025" strokeWidth="2" strokeLinecap="round" />
      <rect x="76" y="84" width="30" height="20" rx="8" fill="none" stroke="#1a1025" strokeWidth="2.2" />
      <rect x="114" y="84" width="30" height="20" rx="8" fill="none" stroke="#1a1025" strokeWidth="2.2" />
      <line x1="106" y1="94" x2="114" y2="94" stroke="#1a1025" strokeWidth="2" strokeLinecap="round" />
      <rect x="77" y="85" width="28" height="18" rx="7" fill="#c084fc" opacity="0.22" />
      <rect x="115" y="85" width="28" height="18" rx="7" fill="#c084fc" opacity="0.22" />
      <circle cx="91" cy="95" r="5" fill="#1a1025" />
      <circle cx="129" cy="95" r="5" fill="#1a1025" />
      <circle cx="93" cy="93" r="1.8" fill="#fff" opacity="0.9" />
      <circle cx="131" cy="93" r="1.8" fill="#fff" opacity="0.9" />
      <ellipse cx="80" cy="112" rx="9" ry="6" fill="#f472b6" opacity="0.35" />
      <ellipse cx="140" cy="112" rx="9" ry="6" fill="#f472b6" opacity="0.35" />
    </svg>
  );
}
