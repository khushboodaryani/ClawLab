"use client";

import React, { useState } from "react";
import { ParticleBackground, GlowOrbs } from "@/components/ui/Backgrounds";
import { TeddyDoodle, TeddySmall } from "@/components/mascot/TeddyMascot";
import { Navbar, FeatureCard, TestimonialCard, Footer } from "@/components/landing/LandingComponents";
import { Terminal } from "@/components/landing/Terminal";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { LoginModal } from "@/components/auth/LoginModal";

import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoginVisible, setIsLoginVisible] = useState(false);

  const toggleLogin = () => {
    if (user) {
      // Redirect to dashboard or similar if already logged in
      window.location.href = "/agent"; 
    } else {
      setIsLoginVisible(!isLoginVisible);
    }
  };

  // Auto-close login modal if user logs in
  React.useEffect(() => {
    if (user && isLoginVisible) {
      setIsLoginVisible(false);
    }
  }, [user, isLoginVisible]);

  const features = [
    { icon: "🖥️", title: "Runs on your machine", desc: "Mac, Windows, or Linux. Anthropic, OpenAI, or local models. Private by default — your data stays yours." },
    { icon: "💬", title: "Any chat app", desc: "Talk to it on WhatsApp, Telegram, Discord, Slack, Signal, or iMessage. Works in DMs and group chats." },
    { icon: "🧠", title: "Persistent memory", desc: "Remembers you and becomes uniquely yours. Your preferences, your context, your AI." },
    { icon: "🌐", title: "Browser control", desc: "It can browse the web, fill forms, and extract data from any site — fully autonomous." },
    { icon: "⚙️", title: "Full system access", desc: "Read and write files, run shell commands, execute scripts. Full access or sandboxed — your choice." },
    { icon: "🔌", title: "Skills & plugins", desc: "Extend with community skills or build your own. It can even write and install its own skills." },
  ];

  const testimonials = [
    { handle: "nateliason", text: "1,000% worth it. Managing sessions I can kick off anywhere, running tests autonomously and opening PRs. The future is here." },
    { handle: "davemorin", text: "I don't even know what to call it. The first time I felt like I'm living in the future since the launch of ChatGPT." },
    { handle: "danpeguine", text: "Your context and skills live on YOUR computer, not a walled garden. Proactive AF: cron jobs, reminders, background tasks. Memory persists 24/7." },
    { handle: "therno", text: "It's running my company." },
    { handle: "lycfyi", text: "After years of AI hype I thought nothing could faze me. Then I installed it. AI as teammate, not tool. The endgame of digital employees is here." },
    { handle: "nathanclark_", text: "A smart model with eyes and hands at a desk. You message it like a coworker and it does everything a person could do with a computer." },
    { handle: "karpathy", text: "Excellent reading. Love oracle and Claw." },
    { handle: "BraydonCoyer", text: "Named him Jarvis. Daily briefings, calendar checks, reminds me when to leave for pickleball based on traffic." },
    { handle: "cnakazawa", text: "The first software in ages for which I constantly check for new releases. It's hard to put into words. It's a special project." },
  ];

  const integrations = ["WhatsApp", "Telegram", "Discord", "Slack", "Signal", "iMessage", "Claude", "GPT-4", "Spotify", "Obsidian", "Twitter / X", "Browser", "Gmail", "GitHub", "Notion", "Hetzner"];

  return (
    <div style={{ background: "#07060f", minHeight: "100vh", color: "#fff", overflowX: "hidden", fontFamily: "'DM Sans', system-ui, sans-serif", position: "relative" }}>
      <ParticleBackground />
      <GlowOrbs />

      <div style={{ position: "relative", zIndex: 10 }}>
        <Navbar onLogin={toggleLogin} />

        {/* HERO SECTION */}
        <section style={{ textAlign: "center", padding: "52px 24px 16px", maxWidth: 860, margin: "0 auto" }}>
          {/* announcement badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600,
            padding: "8px 18px", borderRadius: 999, marginBottom: 32, cursor: "pointer",
            background: "rgba(124,58,237,0.15)", border: "1px solid rgba(167,139,250,0.35)",
            color: "#c4b5fd", fontFamily: "'Syne',sans-serif",
            boxShadow: "0 0 24px rgba(124,58,237,0.25)",
          }}>
            <TeddySmall size={20} />
            New — ClawLab + VirusTotal Skill Security →
          </div>

          {/* floating mascot */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <TeddyDoodle size={200} animate />
          </div>

          <h1 className="hero-text" style={{ fontSize: "clamp(2.5rem,7vw,5rem)", fontWeight: 800, lineHeight: 1.06, margin: "0 0 18px", fontFamily: "'Syne',sans-serif", letterSpacing: "-1.5px" }}>
            <span className="grad-text">The AI that</span><br />
            <span style={{ color: "#fff" }}>actually does things.</span>
          </h1>

          <p className="hero-sub" style={{ fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,0.48)", marginBottom: 34, maxWidth: 500, margin: "0 auto 34px", fontFamily: "'DM Sans',sans-serif" }}>
            Clears your inbox, sends emails, manages your calendar, checks you in for flights.
            All from WhatsApp, Telegram, or any chat app you already use.
          </p>

          <div className="hero-btns" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
              <button 
                onClick={toggleLogin} 
                className="cta-main" 
                style={{
                  padding: "14px 32px", 
                  borderRadius: 999, 
                  fontSize: 14, 
                  fontWeight: 700,
                  background: "linear-gradient(135deg,#7c3aed 0%,#2563eb 100%)",
                  boxShadow: "0 4px 24px rgba(124,58,237,0.4)", 
                  color: "#fff", 
                  fontFamily: "'Syne',sans-serif",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {user ? "Open Dashboard 🧸" : "Install ClawLab 🧸"}
              </button>
              <a href="#docs" className="cta-ghost" style={{
                padding: "14px 32px", borderRadius: 999, fontSize: 14, fontWeight: 600,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.75)", fontFamily: "'Syne',sans-serif",
              }}>View Docs →</a>
            </div>
            
            {/* OAUTH LOGIN - Hide if logged in */}
            {!user && <AuthButtons />}
          </div>
        </section>

        {/* TERMINAL SECTION */}
        <Terminal />

        {/* FEATURES SECTION */}
        <section id="features" style={{ maxWidth: 1080, margin: "0 auto 90px", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <TeddySmall size={26} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(192,132,252,0.85)" }}>What It Does</span>
            </div>
            <h2 style={{ margin: 0, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 800, fontFamily: "'Syne',sans-serif", letterSpacing: "-0.5px" }}>Everything. All at once.</h2>
          </div>
          <div className="feat-grid">
            {features.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </section>

        {/* INTEGRATIONS SECTION */}
        <section id="integrations" style={{ maxWidth: 760, margin: "0 auto 90px", padding: "0 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <TeddySmall size={24} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(103,232,249,0.85)" }}>Works With Everything</span>
          </div>
          <h2 style={{ margin: "0 0 36px", fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>50+ integrations out of the box</h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
            {integrations.map(i => (
              <span key={i} className="pill" style={{
                padding: "9px 18px", borderRadius: 999, fontSize: 13, fontWeight: 500,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
                color: "rgba(255,255,255,0.65)",
              }}>{i}</span>
            ))}
            <span style={{ padding: "9px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600, background: "rgba(103,232,249,0.10)", border: "1px solid rgba(103,232,249,0.28)", color: "#67e8f9" }}>+ many more →</span>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section style={{ maxWidth: 1080, margin: "0 auto 90px", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <TeddySmall size={24} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(110,231,183,0.85)" }}>What People Say</span>
            </div>
            <h2 style={{ margin: 0, fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>The bear speaks for itself. 🧸</h2>
          </div>
          <div className="testi-cols">
            {testimonials.map((t, idx) => <TestimonialCard key={idx} {...t} />)}
          </div>
        </section>

        {/* NEWSLETTER SECTION */}
        <section style={{ maxWidth: 520, margin: "0 auto 80px", padding: "0 24px", textAlign: "center" }}>
          <div className="teddy-spin" style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <TeddyDoodle size={110} animate={false} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(249,168,212,0.85)" }}>Stay in the Loop</span>
          <h2 style={{ margin: "10px 0 8px", fontSize: "1.9rem", fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>Bear wisdom, delivered.</h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.42)", marginBottom: 24 }}>New features, integrations, and highlights. No spam, unsubscribe anytime.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              style={{ flex: 1, padding: "12px 18px", borderRadius: 999, fontSize: 14, outline: "none", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontFamily: "'DM Sans',sans-serif" }} 
            />
            <button style={{ padding: "12px 22px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "#fff", border: "none", fontFamily: "'Syne',sans-serif" }}>
              Subscribe
            </button>
          </div>
        </section>

        <Footer />
      </div>

      <LoginModal 
        isOpen={isLoginVisible} 
        onClose={() => setIsLoginVisible(false)} 
      />
    </div>
  );
}
