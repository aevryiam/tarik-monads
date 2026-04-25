"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface VictoryCrateProps {
  yieldAmount: bigint;
  isOpened: boolean;
  onOpen: () => void;
  isOpening: boolean;
}

const SPARKLE_COUNT = 12;

function Sparkle({ index }: { index: number }) {
  const angle = (index / SPARKLE_COUNT) * 360;
  const distance = 60 + Math.random() * 80;
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
  const formatUSDC = (val: bigint) => (Number(val) / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2 });

  // Determine rarity based on yield
  const yieldNum = Number(yieldAmount) / 1e6;
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
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          minHeight: 200,
        }}
      >
        {/* Sparkles */}
        {Array.from({ length: SPARKLE_COUNT }).map((_, i) => (
          <Sparkle key={i} index={i} />
        ))}

        {/* Rarity badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.3 }}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            letterSpacing: "0.2em",
            color: rarityColors[rarity],
            textShadow: `0 0 20px ${rarityColors[rarity]}`,
            marginBottom: 8,
          }}
        >
          ★ {rarity} ★
        </motion.div>

        {/* Yield amount */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--gold)",
            textShadow: "0 0 15px rgba(255,215,0,0.5)",
          }}
        >
          +${formatUSDC(yieldAmount)} mUSDC
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--text-dim)",
            marginTop: 8,
          }}
        >
          Yield claimed successfully ✓
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={handleClick}
      whileHover={!shaking ? { scale: 1.05 } : {}}
      animate={shaking ? {
        rotate: [0, -8, 8, -10, 10, -12, 12, -10, 8, -6, 0],
        scale: [1, 1.02, 1.04, 1.06, 1.08, 1.1, 1.08, 1.06, 1.04, 1.02, 1],
      } : {}}
      transition={shaking ? { duration: 1.5, ease: "easeInOut" } : { type: "spring" }}
      style={{
        cursor: shaking ? "wait" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        minHeight: 200,
        background: "linear-gradient(135deg, rgba(255,215,0,0.05), rgba(255,107,0,0.05))",
        border: "2px solid rgba(255,215,0,0.2)",
        borderRadius: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow backdrop */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at center, rgba(255,215,0,0.08), transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Crate icon */}
      <motion.div
        animate={!shaking ? { y: [0, -6, 0] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{ fontSize: "4rem", marginBottom: 12, position: "relative", zIndex: 1 }}
      >
        🎁
      </motion.div>

      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.2rem",
        letterSpacing: "0.12em",
        color: "var(--gold)",
        position: "relative",
        zIndex: 1,
      }}>
        {shaking ? "OPENING..." : "VICTORY CRATE"}
      </div>

      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.7rem",
        color: "var(--text-dim)",
        marginTop: 6,
        position: "relative",
        zIndex: 1,
      }}>
        {shaking ? "⚡ Stand by..." : "Click to open"}
      </div>
    </motion.div>
  );
}
