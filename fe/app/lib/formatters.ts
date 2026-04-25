// ============================================================================
// lib/formatters.ts - Utility functions untuk formatting data on-chain
// ============================================================================

import { ASSET_SYMBOL, MON_DECIMALS } from "@/app/config/constants";

/**
 * Format bigint MON menjadi string dengan 4 desimal.
 * @example formatMON(25000000000000000000n) -> "25.0000"
 */
export function formatMON(amount: bigint, options?: { symbol?: boolean }): string {
  const value = Number(amount) / 10 ** MON_DECIMALS;
  const parts = value.toFixed(4).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = parts.join(".");
  return options?.symbol ? `${formatted} ${ASSET_SYMBOL}` : formatted;
}

/**
 * Format basis points menjadi persentase.
 * @example formatBps(500n) -> "5.00%"
 * @example formatBps(10000n) -> "100%"
 */
export function formatBps(bps: bigint | number): string {
  const value = Number(bps) / 100;
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

/**
 * Format tug-of-war basis points (0-10000) menjadi persentase UI (0-100).
 * @example tugBpsToPercent(7500n) -> 75
 */
export function tugBpsToPercent(bps: bigint | number): number {
  return Number(bps) / 100;
}

/**
 * Format detik menjadi string "Xh Ym Zs" atau "X menit" untuk countdown.
 * @example formatTimeRemaining(3661n) -> "1h 1m 1s"
 * @example formatTimeRemaining(59n) -> "59s"
 */
export function formatTimeRemaining(seconds: bigint | number): string {
  const s = Number(seconds);
  if (s <= 0) return "Ended";

  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/**
 * Format Unix timestamp menjadi string tanggal lokal.
 * @example formatTimestamp(1714000000n) -> "25 Apr 2026, 15.00"
 */
export function formatTimestamp(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Shortens an EVM address.
 * @example shortenAddress("0x8B35e6241D00Fa03C7b36e923b41590bb6B94478") -> "0x8B35...4478"
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`;
}

/**
 * Format jumlah besar menjadi "1.2K MON", "3.4M MON", dll.
 * @example formatCompactMON(1250000000000000000000n) -> "1.25K MON"
 */
export function formatCompactMON(amount: bigint): string {
  const value = Number(amount) / 10 ** MON_DECIMALS;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M ${ASSET_SYMBOL}`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K ${ASSET_SYMBOL}`;
  return `${value.toFixed(4)} ${ASSET_SYMBOL}`;
}
