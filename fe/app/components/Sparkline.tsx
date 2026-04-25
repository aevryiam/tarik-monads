"use client";

import { motion } from "framer-motion";

export default function Sparkline({ data, color }: { data: number[], color: string }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data) - 2;
  const max = Math.max(...data) + 2;
  const range = max - min;

  // Map data points to SVG coordinates
  // ViewBox is 100x30
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 30 - ((val - min) / range) * 30; // Invert Y since SVG 0 is top
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width="120" height="30" viewBox="0 0 100 30" style={{ overflow: "visible", marginLeft: 8 }}>
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
    </svg>
  );
}
