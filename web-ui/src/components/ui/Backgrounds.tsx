"use client";

import React, { useEffect, useRef } from "react";

// ── Animated particle canvas background ──────────────────────────────────────
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string }[] = [];
    const colors = ["#c084fc", "#818cf8", "#67e8f9", "#6ee7b7", "#f9a8d4"];
    
    const resize = () => { 
      canvas.width = window.innerWidth; 
      canvas.height = window.innerHeight; 
    };
    
    const spawn = () => {
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * window.innerWidth, 
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.3, 
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.8 + 0.4, 
          alpha: Math.random() * 0.5 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); 
            ctx.moveTo(particles[i].x, particles[i].y); 
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(167,139,250,${0.10 * (1 - dist / 120)})`; 
            ctx.lineWidth = 0.5; 
            ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        ctx.beginPath(); 
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, "0"); 
        ctx.fill();
        p.x += p.vx; 
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      animId = requestAnimationFrame(draw);
    };
    
    resize(); 
    spawn(); 
    draw();
    window.addEventListener("resize", resize);
    return () => { 
      cancelAnimationFrame(animId); 
      window.removeEventListener("resize", resize); 
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: "fixed", 
        inset: 0, 
        width: "100%", 
        height: "100%", 
        pointerEvents: "none", 
        zIndex: 0 
      }} 
    />
  );
}

// ── Glow orbs ─────────────────────────────────────────────────────────────────
export function GlowOrbs() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      <div 
        style={{ 
          position: "absolute", 
          width: 700, 
          height: 700, 
          top: -250, 
          left: -200, 
          borderRadius: "50%", 
          background: "radial-gradient(circle, rgba(124,58,237,0.20) 0%, transparent 70%)" 
        }} 
      />
      <div 
        style={{ 
          position: "absolute", 
          width: 500, 
          height: 500, 
          bottom: -100, 
          right: -80, 
          borderRadius: "50%", 
          background: "radial-gradient(circle, rgba(56,189,248,0.13) 0%, transparent 70%)" 
        }} 
      />
      <div 
        style={{ 
          position: "absolute", 
          width: 350, 
          height: 350, 
          top: "45%", 
          left: "60%", 
          borderRadius: "50%", 
          background: "radial-gradient(circle, rgba(244,114,182,0.10) 0%, transparent 70%)" 
        }} 
      />
    </div>
  );
}
