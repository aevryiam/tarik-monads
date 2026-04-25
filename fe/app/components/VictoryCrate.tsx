"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ASSET_SYMBOL, MON_DECIMALS } from "@/app/config/constants";
import { formatMON } from "@/app/lib/formatters";

interface VictoryCrateProps {
  yieldAmount: bigint;
  isOpened: boolean;
  onOpen: () => void;
  isOpening: boolean;
}

const SPARKLE_COUNT = 12;

function Sparkle({ index }: { index: number }) {
  const angle = (index / SPARKLE_COUNT) * 360;
  const distance = 60 + ((index * 37) % 80);
  const dx = Math.cos((angle * Math.PI) / 180) * distance;
  const dy = Math.sin((angle * Math.PI) / 180) * distance;
  const colors = ["#FFD700", "#FF6B00", "#FF1744", "#448AFF", "#FFF"];
  const color = colors[index % colors.length];

  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
      animate={{ x: dx, y: dy, scale: [0, 1.5, 0], opacity: [1, 1, 0] }}
      transition={{ duration: 0.8, delay: 0.1 + index * 0.03 }}
      style={{
        position: "absolute",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${color}`,
        top: "50%",
        left: "50%",
        pointerEvents: "none",
      }}
    />
  );
}

export default function VictoryCrate({ yieldAmount, isOpened, onOpen, isOpening }: VictoryCrateProps) {
  const [showReveal, setShowReveal] = useState(false);
  const [shaking, setShaking] = useState(false);
  // Determine rarity based on yield
  const yieldNum = Number(yieldAmount) / 10 ** MON_DECIMALS;
  const rarity = yieldNum > 500 ? "SSR" : yieldNum > 100 ? "RARE" : "COMMON";
  const rarityColors: Record<string, string> = {
    COMMON: "var(--text-secondary)",
    RARE: "var(--blue-glow)",
    SSR: "var(--gold)",
  };

  const handleClick = () => {
    if (isOpened || shaking || isOpening) return;
    setShaking(true);
    setTimeout(() => {
      setShaking(false);
      setShowReveal(true);
      onOpen();
    }, 1500);
  };

  if (isOpened || showReveal) {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          minHeight: 280,
          background: "radial-gradient(circle at center, rgba(255,215,0,0.1) 0%, transparent 70%)",
          borderRadius: 24,
          border: "1px solid rgba(255,215,0,0.1)",
        }}
      >
        {/* Magic Particles */}
        {Array.from({ length: 24 }).map((_, i) => (
          <Sparkle key={i} index={i} />
        ))}

        {/* Glow behind the yield */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          style={{
             position: "absolute",
             width: 150, height: 150,
             background: "conic-gradient(from 0deg, transparent, rgba(255,215,0,0.3), transparent)",
             borderRadius: "50%",
             filter: "blur(20px)",
             zIndex: 0
          }}
        />

        {/* Rarity badge */}
        <motion.div
          initial={{ scale: 0, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", delay: 0.3 }}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.8rem",
            letterSpacing: "0.2em",
            color: rarityColors[rarity],
            textShadow: `0 0 20px ${rarityColors[rarity]}`,
            marginBottom: 12,
            zIndex: 1,
          }}
        >
          ★ {rarity} ★
        </motion.div>

        {/* Yield amount */}
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "3rem",
            fontWeight: 800,
            color: "var(--gold)",
            textShadow: "0 0 30px rgba(255,215,0,0.8)",
            zIndex: 1,
          }}
        >
          +{formatMON(yieldAmount)} {ASSET_SYMBOL}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            color: "var(--gold)",
            marginTop: 12,
            background: "rgba(255,215,0,0.1)",
            padding: "6px 16px",
            borderRadius: 20,
            border: "1px solid rgba(255,215,0,0.2)",
            zIndex: 1,
          }}
        >
          YIELD CLAIMED ✓
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={handleClick}
      whileHover={!shaking ? { scale: 1.05, boxShadow: "0 0 30px rgba(255,215,0,0.2)" } : {}}
      animate={shaking ? {
        rotate: [0, -10, 10, -15, 15, -20, 20, -15, 10, -5, 0],
        scale: [1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.2, 1.15, 1.1, 1.05, 1],
        filter: ["brightness(1)", "brightness(1.5)", "brightness(2)", "brightness(1)"],
      } : {
        y: [0, -10, 0]
      }}
      transition={
        shaking 
        ? { duration: 1.5, ease: "easeInOut" } 
        : { repeat: Infinity, duration: 3, ease: "easeInOut" }
      }
      style={{
        cursor: shaking ? "wait" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        minHeight: 250,
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))",
        border: "2px solid rgba(255,215,0,0.3)",
        borderRadius: 24,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0,0,0,0.3), inset 0 0 40px rgba(255,215,0,0.05)",
      }}
    >
      {/* Magic glow backdrop */}
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at center, rgba(255,215,0,0.15), transparent 70%)",
          pointerEvents: "none",
        }} 
      />

      {/* Crate Visual */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: 16 }}>
        <motion.div
          animate={shaking ? { rotate: [0, -5, 5, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.1 }}
          style={{ 
             width: 100, height: 100, 
             background: "linear-gradient(135deg, #FFD700, #F59E0B)", 
             borderRadius: 16, 
             boxShadow: "0 10px 30px rgba(255,215,0,0.4), inset 0 4px 10px rgba(255,255,255,0.5)",
             display: "flex", alignItems: "center", justifyContent: "center",
             border: "4px solid #B45309"
          }}
        >
          <div style={{ width: 80, height: 20, background: "rgba(0,0,0,0.2)", borderRadius: 10 }} />
        </motion.div>
      </div>

      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.4rem",
        letterSpacing: "0.15em",
        color: "var(--gold)",
        textShadow: "0 0 15px rgba(255,215,0,0.5)",
        position: "relative",
        zIndex: 1,
      }}>
        {shaking ? "UNSEALING..." : "VICTORY CRATE"}
      </div>

      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.75rem",
        color: "var(--text-secondary)",
        marginTop: 8,
        position: "relative",
        zIndex: 1,
        background: "rgba(0,0,0,0.3)",
        padding: "4px 12px",
        borderRadius: 12,
      }}>
        {shaking ? "⚡ Magic expanding..." : "Tap to reveal yield"}
      </div>
    </motion.div>
  );
}
