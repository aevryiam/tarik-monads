"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract } from "wagmi";
import { ADDRESSES, MOCK_USDC_ABI, OWNER_ADDRESS } from "@/app/config/contracts";
import { formatUnits } from "viem";

export default function Navbar() {
  const { address } = useAccount();
  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  const { data: balance } = useReadContract({
    address: ADDRESSES.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        background: "rgba(11, 12, 16, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            letterSpacing: "0.15em",
            lineHeight: 1,
          }}
        >
          <span style={{ color: "var(--red-main)" }}>TA</span>
          <span style={{ color: "var(--text-primary)" }}>R</span>
          <span style={{ color: "var(--blue-main)" }}>IK</span>
        </div>
        {isOwner && (
          <span className="badge" style={{ background: "rgba(255,215,0,0.15)", color: "var(--gold)", border: "1px solid rgba(255,215,0,0.3)" }}>
            ADMIN
          </span>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {address && balance !== undefined && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              padding: "6px 12px",
              background: "var(--bg-card)",
              borderRadius: 6,
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ color: "var(--gold)" }}>
              {Number(formatUnits(balance, 6)).toLocaleString()}
            </span>{" "}
            mUSDC
          </div>
        )}
        <ConnectButton
          showBalance={false}
          chainStatus="icon"
          accountStatus="address"
        />
      </div>
    </nav>
  );
}
