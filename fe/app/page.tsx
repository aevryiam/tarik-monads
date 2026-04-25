"use client";

import { useReadContract } from "wagmi";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import TugOfWarArena from "@/app/components/TugOfWarArena";
import ActionPanel from "@/app/components/ActionPanel";
import WarInfo from "@/app/components/WarInfo";
import VictoryCrate from "@/app/components/VictoryCrate";
import AdminPanel from "@/app/components/AdminPanel";
import CampaignCard from "@/app/components/CampaignCard";
import Leaderboard from "@/app/components/Leaderboard";
import { ADDRESSES } from "@/app/config/addresses";
import { TARIK_VAULT_ABI } from "@/app/contracts/abi/TarikVault.abi";
import { useWar } from "@/app/hooks/useWar";
import { useWarList } from "@/app/hooks/useWarList";
import { useUserDeposit } from "@/app/hooks/useUserDeposit";
import { useVictoryCrate } from "@/app/hooks/useVictoryCrate";

type ViewMode = "grid" | "arena" | "lootboxes" | "leaderboard" | "admin";

export default function Home() {
  const [view, setView] = useState<ViewMode>("grid");
  const [activeWarId, setActiveWarId] = useState<number | null>(null);
  const [featuredWarId, setFeaturedWarId] = useState<number | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  const { warCount, activeWars } = useWarList();
  const selectedWarId = activeWarId ?? (warCount > 0 ? warCount - 1 : 0);
  const { war, tugPosition, isOpen } = useWar(selectedWarId);
  const { isWinner } = useUserDeposit(selectedWarId);
  const {
    hasCrate,
    isOpened: crateOpened,
    yieldAmount: crateYield,
  } = useVictoryCrate(selectedWarId);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  const hasWar = Boolean(war && warCount > 0);
  const userIsWinner = isWinner(war);
  const currentWar = hasWar ? war : undefined;
  const latestOnChainWarId =
    activeWars.length > 0 ? activeWars[activeWars.length - 1].warId : null;
  const featuredOnChainWarId = featuredWarId ?? latestOnChainWarId;

  const openOnChainWar = (id: number) => {
    setActiveWarId(id);
    setView("arena");
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-primary)",
            }}
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 160, delay: 0.1 }}
            >
              <img
                src="/logo.png"
                alt="Tarik Logo"
                style={{ height: 80, objectFit: "contain" }}
              />
            </motion.div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 160 }}
              transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
              style={{
                height: 2,
                marginTop: 16,
                borderRadius: 2,
                background:
                  "linear-gradient(90deg, var(--red-main), var(--gold), var(--blue-main))",
              }}
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1.5 }}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                color: "var(--text-dim)",
                marginTop: 12,
                letterSpacing: "0.15em",
              }}
            >
              LOSSLESS YIELD WARS
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar activeView={view} onViewChange={(v) => setView(v as ViewMode)} />

      <main
        style={{
          paddingTop: 80,
          maxWidth: 1400,
          margin: "0 auto",
          padding: "80px 32px 48px",
        }}
      >
        {view === "grid" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: showSplash ? 2.8 : 0, duration: 0.5 }}
          >
            <div style={{ marginBottom: 24, paddingTop: 16 }}>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2.2rem",
                  letterSpacing: "0.06em",
                  lineHeight: 1.1,
                  marginBottom: 6,
                }}
              >
                Yield Wars
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  maxWidth: 460,
                }}
              >
                Stake on your champion. Principal is safe — winner takes all
                yield.
              </p>
            </div>

            {activeWars.length > 0 ? (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--text-dim)",
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#4caf50",
                        display: "inline-block",
                      }}
                    />
                    ON-CHAIN CAMPAIGNS
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(340px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {activeWars.map((w) => (
                      <OnChainWarCard
                        key={w.warId}
                        warId={w.warId}
                        onClick={() => openOnChainWar(w.warId)}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--text-dim)",
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Flame size={14} color="var(--red-glow)" /> TRENDING
                  </div>
                  {featuredOnChainWarId !== null && (
                    <OnChainWarCard
                      warId={featuredOnChainWarId}
                      onClick={() => openOnChainWar(featuredOnChainWarId)}
                      featured
                    />
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(340px, 1fr))",
                    gap: 16,
                  }}
                >
                  {activeWars.map((w) => (
                    <OnChainWarCard
                      key={w.warId}
                      warId={w.warId}
                      onClick={() => openOnChainWar(w.warId)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div
                style={{
                  padding: 28,
                  borderRadius: 16,
                  border: "1px dashed var(--border-medium)",
                  background: "var(--bg-card)",
                  textAlign: "center",
                  maxWidth: 720,
                  margin: "0 auto",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.2rem",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  NO ACTIVE ON-CHAIN CAMPAIGN
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "var(--text-secondary)",
                    margin: 0,
                  }}
                >
                  Mock campaigns are hidden. Create a real campaign from the
                  Admin Dashboard to enable staking.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {view === "arena" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <button
              onClick={() => {
                setView("grid");
                setActiveWarId(null);
              }}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                color: "var(--text-dim)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 0",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-dim)")
              }
            >
              ← Back to Markets
            </button>

            {currentWar && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <TugOfWarArena
                  nameA={currentWar.nameA}
                  nameB={currentWar.nameB}
                  tvlA={currentWar.tvlA}
                  tvlB={currentWar.tvlB}
                  pctA={tugPosition ? Number(tugPosition.pctA) : 5000}
                  pctB={tugPosition ? Number(tugPosition.pctB) : 5000}
                  status={Number(currentWar.status)}
                  winningSide={Number(currentWar.winningSide)}
                  yieldBps={Number(currentWar.mockYieldBps)}
                  totalDeposits={currentWar.totalDeposits}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <WarInfo
                    warId={selectedWarId}
                    nameA={currentWar.nameA}
                    nameB={currentWar.nameB}
                    startTime={Number(currentWar.startTime)}
                    endTime={Number(currentWar.endTime)}
                    status={Number(currentWar.status)}
                    participantCount={Number(currentWar.participantCount)}
                    totalDeposits={currentWar.totalDeposits}
                    yieldBps={Number(currentWar.mockYieldBps)}
                    totalYield={currentWar.totalYield}
                  />
                  <ActionPanel
                    warId={selectedWarId}
                    nameA={currentWar.nameA}
                    nameB={currentWar.nameB}
                    isOpen={!!isOpen}
                    status={Number(currentWar.status)}
                    winningSide={Number(currentWar.winningSide)}
                    war={currentWar}
                  />
                </div>

                {hasCrate && userIsWinner && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <VictoryCrate
                      yieldAmount={crateYield ?? BigInt(0)}
                      isOpened={crateOpened}
                      onOpen={() => {}}
                      isOpening={false}
                    />
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {view === "lootboxes" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: "40px 0" }}
          >
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2.5rem",
                  color: "var(--gold)",
                  letterSpacing: "0.1em",
                }}
              >
                YOUR LOOTBOXES
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--text-secondary)",
                }}
              >
                Unseal the crates you have won to claim your yield.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 32,
              }}
            >
              {warCount > 0 &&
                Array.from({ length: warCount }).map((_, i) => {
                  if (i === selectedWarId && hasCrate && !crateOpened) {
                    return (
                      <div key={i} style={{ width: 300 }}>
                        <VictoryCrate
                          yieldAmount={crateYield || BigInt(0)}
                          isOpened={false}
                          onOpen={() => {}}
                          isOpening={false}
                        />
                      </div>
                    );
                  }
                  return null;
                })}

              {!hasCrate && (
                <div
                  style={{
                    padding: 24,
                    borderRadius: 12,
                    border: "1px dashed var(--border-medium)",
                    color: "var(--text-dim)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  No Victory Crates yet. Join a real on-chain campaign to earn
                  one.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {view === "leaderboard" && <Leaderboard />}

        {view === "admin" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: "40px 0" }}
          >
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2.5rem",
                  color: "var(--gold)",
                  letterSpacing: "0.1em",
                }}
              >
                ADMIN DASHBOARD
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--text-secondary)",
                }}
              >
                Manage campaigns, resolve wars, and control the yield flow.
              </p>
            </div>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <AdminPanel onSetFeatured={setFeaturedWarId} />
            </div>
          </motion.div>
        )}

        <footer
          style={{
            marginTop: 48,
            paddingTop: 20,
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--text-dim)",
            }}
          >
            TARIK · Lossless Yield Wars
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--text-dim)",
            }}
          >
            Built on{" "}
            <span style={{ color: "var(--text-secondary)" }}>Monad</span> ·{" "}
            {new Date().getFullYear()}
          </div>
        </footer>
      </main>
    </div>
  );
}

function OnChainWarCard({
  warId,
  onClick,
  featured,
}: {
  warId: number;
  onClick: () => void;
  featured?: boolean;
}) {
  const [nowSec, setNowSec] = useState(0);

  const { data: war } = useReadContract({
    address: ADDRESSES.tarikVault,
    abi: TARIK_VAULT_ABI,
    functionName: "getWar",
    args: [BigInt(warId)],
    query: { refetchInterval: 6000 },
  });

  const { data: tug } = useReadContract({
    address: ADDRESSES.tarikVault,
    abi: TARIK_VAULT_ABI,
    functionName: "getTugOfWarPosition",
    args: [BigInt(warId)],
    query: { enabled: !!war, refetchInterval: 6000 },
  });

  useEffect(() => {
    const update = () => setNowSec(Math.floor(Date.now() / 1000));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!war) return null;

  const pctA = tug ? Number(tug[0]) / 100 : 50;
  const status = Number(war.status);
  const hasEnded = status === 0 && nowSec > 0 && Number(war.endTime) <= nowSec;
  const statusLabels = ["LIVE", "RESOLVED", "CANCELLED"];

  return (
    <CampaignCard
      id={warId}
      nameA={war.nameA}
      nameB={war.nameB}
      imageUrl={`https://placehold.co/600x340/0b0c10/4caf50?text=⚡+LIVE+WAR+%23${warId}&font=montserrat`}
      category={hasEnded ? "SETTLE" : statusLabels[status]}
      pctA={pctA}
      tvlA={Number(war.tvlA) / 1e18}
      tvlB={Number(war.tvlB) / 1e18}
      participants={Number(war.participantCount)}
      endTime={Number(war.endTime)}
      yieldBps={Number(war.mockYieldBps)}
      featured={featured}
      hot={status === 0 && !hasEnded}
      onClick={onClick}
    />
  );
}
