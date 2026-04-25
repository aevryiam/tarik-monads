"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import LightningEffect from "./LightningEffect";
import Sparkline from "./Sparkline";
import { icons } from "lucide-react";

interface CampaignCardProps {
  id: number;
  nameA: string;
  nameB: string;
  imageUrl?: string;
  category: string;
  pctA: number;
  tvlA: number;
  tvlB: number;
  participants: number;
  endTime: number;
  yieldBps: number;
  hot?: boolean;
  onClick?: () => void;
  featured?: boolean;
  iconName?: string;
  trendA?: number[];
}

export default function CampaignCard({
  nameA, nameB, imageUrl, category, pctA,
  tvlA, tvlB, participants, endTime, yieldBps, hot, onClick, featured,
  iconName, trendA
}: CampaignCardProps) {
  const pctB = 100 - pctA;
  const [timeLeft, setTimeLeft] = useState("");
  const [animatedPctA, setAnimatedPctA] = useState(50);

  // Countdown
  useEffect(() => {
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = Math.max(0, endTime - now);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, [endTime]);

  // Animate the bar on mount
  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedPctA(pctA), 300);
    return () => clearTimeout(timeout);
  }, [pctA]);

  // Intensity: closer to 50/50 = more intense
  const intensity = 1 - Math.abs(pctA - 50) / 50;
  const isClose = Math.abs(pctA - 50) < 10;
  const totalTVL = tvlA + tvlB;

  // Render Icon if exists
  const IconComponent = iconName ? (icons as any)[iconName] : null;

  // $10 Bet Simulation logic
  // Calculate total return based on proportion
  const calcReturn = (sideTvl: number) => {
    if (sideTvl === 0) return 0;
    // You get your $10 back + proportion of the other side's TVL
    const myShare = 10 / (sideTvl + 10);
    const otherSideTvl = sideTvl === tvlA ? tvlB : tvlA;
    const profit = myShare * otherSideTvl;
    return (10 + profit).toFixed(2);
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{
        cursor: onClick ? "pointer" : "default",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--bg-card)",
        border: hot ? "1px solid rgba(230,57,70,0.25)" : "1px solid var(--border-subtle)",
        transition: "border-color 0.3s",
        position: "relative",
        width: featured ? "100%" : undefined,
      }}
    >
      {/* Header section (Icon / Image) */}
      <div
        style={{
          position: "relative",
          height: featured ? 160 : 120,
          background: imageUrl ? `url(${imageUrl})` : "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-card) 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {IconComponent && !imageUrl && (
          <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 0.15 }}
             transition={{ duration: 0.5 }}
          >
            <IconComponent size={featured ? 100 : 70} color="var(--text-primary)" strokeWidth={1} />
          </motion.div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 10%, var(--bg-card) 100%)",
        }} />

        {/* Top badges */}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6, zIndex: 2 }}>
          <span style={{
            padding: "3px 8px",
            borderRadius: 4,
            fontSize: "0.6rem",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            color: "var(--text-secondary)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {category}
          </span>
          {hot && (
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 4, fontSize: "0.6rem",
              fontFamily: "var(--font-mono)", fontWeight: 700,
              background: "var(--red-light)",
              color: "var(--red-main)",
            }}>
              <icons.Flame size={10} /> HOT
            </span>
          )}
        </div>

        {/* Yield badge */}
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 2,
          padding: "3px 8px",
          borderRadius: 4,
          fontSize: "0.6rem",
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          background: "rgba(255,215,0,0.15)",
          backdropFilter: "blur(4px)",
          color: "var(--gold)",
          border: "1px solid rgba(255,215,0,0.2)",
        }}>
          {yieldBps / 100}% yield
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 16px 16px" }}>
        {/* Versus header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: featured ? "1.5rem" : "1.2rem",
            letterSpacing: "0.06em",
            color: "var(--red-main)",
          }}>
            {nameA}
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--text-dim)",
            letterSpacing: "0.1em",
          }}>
            VS
          </span>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: featured ? "1.5rem" : "1.2rem",
            letterSpacing: "0.06em",
            color: "var(--blue-main)",
          }}>
            {nameB}
          </span>
        </div>

        {/* Tug bar */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          {/* Percentage labels & Sparkline */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: featured ? "1.1rem" : "0.85rem",
                fontWeight: 700,
                color: "var(--red-light)",
              }}>
                {pctA.toFixed(1)}%
              </span>
              {trendA && trendA.length > 0 && <Sparkline data={trendA} color="var(--red-main)" />}
            </div>
            
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: featured ? "1.1rem" : "0.85rem",
              fontWeight: 700,
              color: "var(--blue-light)",
            }}>
              {pctB.toFixed(1)}%
            </span>
          </div>

          {/* Bar */}
          <div style={{
            height: featured ? 8 : 6,
            borderRadius: 4,
            background: "var(--bg-secondary)",
            overflow: "hidden",
            position: "relative",
          }}>
            <motion.div
              initial={{ width: "50%" }}
              animate={{ width: [`${animatedPctA}%`, `${animatedPctA + 1}%`, `${animatedPctA - 0.5}%`, `${animatedPctA}%`] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              style={{
                height: "100%",
                background: isClose
                  ? "linear-gradient(90deg, var(--red-main), var(--red-glow))"
                  : "linear-gradient(90deg, var(--red-dark), var(--red-main))",
                borderRadius: "4px 0 0 4px",
                position: "absolute",
                left: 0,
                top: 0,
              }}
            >
              {/* Pulse glow when close */}
              {isClose && (
                <motion.div
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{
                    position: "absolute",
                    right: -2,
                    top: -2,
                    bottom: -2,
                    width: 8,
                    background: "var(--gold)",
                    borderRadius: 4,
                    boxShadow: "0 0 8px var(--gold)",
                  }}
                />
              )}
            </motion.div>
            
            {/* Lightning Effect positioned at the junction */}
            {isClose && (
              <motion.div
                initial={{ left: "50%" }}
                animate={{ left: [`${animatedPctA}%`, `${animatedPctA + 1}%`, `${animatedPctA - 0.5}%`, `${animatedPctA}%`] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                style={{
                   position: 'absolute',
                   top: '50%',
                   transform: 'translate(-50%, -50%)',
                   width: 30,
                   height: 40,
                   pointerEvents: 'none',
                   zIndex: 10
                }}
              >
                <LightningEffect intensity={intensity} />
              </motion.div>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: featured ? 12 : 0,
        }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--text-dim)",
            }}>
              ${totalTVL.toLocaleString()} TVL
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--text-dim)",
            }}>
              {participants.toLocaleString()} players
            </span>
          </div>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: isClose ? "var(--gold)" : "var(--text-dim)",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            <icons.Timer size={10} /> {timeLeft}
          </span>
        </div>

        {/* Featured Bet Simulation */}
        {featured && (
          <div style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "var(--bg-primary)",
            borderRadius: 12,
            border: "1px dashed var(--border-medium)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
             <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
               <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)", textTransform: "uppercase" }}>{nameA} return</span>
               <motion.span 
                 animate={{ scale: [1, 1.05, 0.98, 1], color: ["var(--red-main)", "var(--red-glow)", "var(--red-main)", "var(--red-main)"] }}
                 transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                 style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", color: "var(--red-main)", fontWeight: 700, display: "inline-block" }}
               >
                 ${calcReturn(tvlA)}
               </motion.span>
             </div>
             
             <div style={{ 
               fontFamily: "var(--font-display)", 
               fontSize: "1rem", 
               color: "var(--text-secondary)", 
               letterSpacing: "0.05em", 
               background: "var(--bg-secondary)",
               padding: "4px 12px",
               borderRadius: 20,
               border: "1px solid var(--border-subtle)"
             }}>
               $10 BET PAYS
             </div>
             
             <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
               <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)", textTransform: "uppercase" }}>{nameB} return</span>
               <motion.span 
                 animate={{ scale: [1, 0.98, 1.05, 1], color: ["var(--blue-main)", "var(--blue-main)", "var(--blue-glow)", "var(--blue-main)"] }}
                 transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
                 style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", color: "var(--blue-main)", fontWeight: 700, display: "inline-block" }}
               >
                 ${calcReturn(tvlB)}
               </motion.span>
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
