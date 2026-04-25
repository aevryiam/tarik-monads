"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// A single lightning bolt path
function LightningBolt({ delay, side }: { delay: number; side: "left" | "right" }) {
  const [path, setPath] = useState("");
  const repeatDelay = 2 + ((delay * 10) % 4);

  useEffect(() => {
    const generatePath = () => {
      const startX = side === "left" ? 10 + Math.random() * 30 : 60 + Math.random() * 30;
      let x = startX;
      let y = 0;
      let d = `M${x},${y}`;
      const segments = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < segments; i++) {
        x += (Math.random() - 0.5) * 30;
        y += 15 + Math.random() * 20;
        d += ` L${x},${y}`;
      }
      setPath(d);
    };
    generatePath();
    const interval = setInterval(generatePath, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [side]);

  return (
    <motion.path
      d={path}
      stroke={side === "left" ? "rgba(230,57,70,0.7)" : "rgba(29,111,255,0.7)"}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      initial={{ opacity: 0, pathLength: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        pathLength: [0, 1, 1, 1],
      }}
      transition={{
        duration: 0.4,
        delay,
        repeat: Infinity,
        repeatDelay,
        times: [0, 0.3, 0.7, 1],
      }}
      style={{
        filter: `drop-shadow(0 0 6px ${side === "left" ? "rgba(230,57,70,0.5)" : "rgba(29,111,255,0.5)"})`,
      }}
    />
  );
}

export default function LightningEffect({ intensity = 0.5 }: { intensity?: number }) {
  // More lightning bolts when intensity is higher (closer to 50/50)
  const boltCount = Math.floor(2 + intensity * 6);

  return (
    <svg
      viewBox="0 0 100 120"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0.6,
      }}
      preserveAspectRatio="none"
    >
      {Array.from({ length: boltCount }).map((_, i) => (
        <LightningBolt
          key={`l-${i}`}
          delay={i * 0.3}
          side={i % 2 === 0 ? "left" : "right"}
        />
      ))}
    </svg>
  );
}
