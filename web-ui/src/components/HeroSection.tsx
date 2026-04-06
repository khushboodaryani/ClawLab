"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Github, ChevronRight } from "lucide-react";

const CHAT_APPS = ["WhatsApp", "Telegram", "Discord", "Slack", "iMessage"];

export default function HeroSection({ onStart }: { onStart: () => void }) {
  const [index, setIndex] = useState(0);
  const currentApp = useMemo(() => CHAT_APPS[index], [index]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % CHAT_APPS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative pt-24 pb-20 px-6 overflow-hidden min-h-screen flex flex-col items-center">

      {/* ── Background Elements ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="atmosphere-glow" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] opacity-[0.03]"
          style={{ background: "radial-gradient(circle at 50% 0%, var(--accent) 0%, transparent 60%)", filter: "blur(120px)" }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center">

        {/* Announcement banner */}
        <motion.a
          href="https://github.com/khushboodaryani/ClawLab"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="announce-pill mb-12"
        >
          <div className="flex items-center gap-3">
            <span className="bg-accent px-2 py-0.5 rounded-md text-[8px] font-black text-white tracking-[0.2em]">
              BETA 1.0
            </span>
            <span className="text-xs font-semibold text-text-secondary tracking-tight">
              ClawLab is now in Open Beta. Join on GitHub.
            </span>
          </div>
          <div className="w-[1px] h-4 bg-white/10 mx-2" />
          <div className="pr-1 text-accent flex items-center gap-1.5 text-xs font-bold transition-all hover:gap-2">
            Read Docs <ChevronRight size={14} />
          </div>
        </motion.a>

        {/* Mascot + Mascot "Sticker" Container */}
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ delay: 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
           className="relative mb-12 group cursor-pointer"
        >
            {/* The Sticker Card — High robustness with FIXED size */}
            <div 
              className="relative bg-white rounded-[44px] shadow-[0_32px_96px_-12px_rgba(0,0,0,0.7)] rotate-[-4deg] flex items-center justify-center transition-all duration-700 group-hover:rotate-0 group-hover:scale-[1.04] overflow-hidden"
              style={{ width: 320, height: 320, border: "4px solid #fff" }}
            >
                <img
                  src="/dog.png"
                  alt="ClawLab Mascot"
                  className="w-full h-full object-contain pointer-events-none select-none p-8"
                  style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.1))" }}
                />
                <div className="absolute top-8 right-8 flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#28c840] shadow-[0_0_15px_#28c840] border-2 border-white animate-pulse" />
                </div>
            </div>
            {/* Ambient Shadow/Glow under sticker */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-12 bg-accent/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-[1px] bg-gradient-to-r from-transparent to-accent/40" />
            <span className="text-[10px] font-black uppercase tracking-[0.45em] text-accent text-glow">
              Elite Local Intelligence
            </span>
            <div className="w-10 h-[1px] bg-gradient-to-l from-transparent to-accent/40" />
          </div>

          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.85] mb-8 text-balance">
            Stop Sketching. <br />
            <span
              className="text-glow"
              style={{
                background: "linear-gradient(135deg, #fff 30%, var(--accent) 120%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Start Commanding.
            </span>
          </h1>

          <div className="flex flex-col items-center gap-6">
            <h2 className="text-lg md:text-2xl font-medium tracking-tight text-text-secondary leading-normal">
              The first autonomous AI agent that lives in your{" "}
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentApp}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  className="font-black text-white border-b-2 border-accent inline-block min-w-[140px]"
                >
                  {currentApp}
                </motion.span>
              </AnimatePresence>
              <br className="hidden md:block" />
              and works inside your local system.
            </h2>
            <p className="text-sm font-medium text-text-muted opacity-60">Connected to your machine, your repositories, and your life.</p>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-5 mt-16"
        >
          <button
            onClick={onStart}
            className="group flex items-center justify-center gap-3 bg-accent text-white font-black py-5 px-10 rounded-2xl transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_0_64px_var(--accent-glow)] active:scale-95 shadow-[0_20px_50px_rgba(255,77,77,0.3)]"
          >
            Initialize Agent
            <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="https://github.com/khushboodaryani/ClawLab"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 py-5 px-10 rounded-2xl border border-white/10 glass font-black text-white hover:bg-white/[0.08] transition-all"
            style={{ textDecoration: "none" }}
          >
            <Github size={20} />
            GitHub
          </a>
        </motion.div>


      </div>
    </section>
  );
}
