"use client";

import { useAccount, useReadContract } from "wagmi";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import TugOfWarArena from "@/app/components/TugOfWarArena";
import ActionPanel from "@/app/components/ActionPanel";
import WarInfo from "@/app/components/WarInfo";
import VictoryCrate from "@/app/components/VictoryCrate";
import FaucetButton from "@/app/components/FaucetButton";
import AdminPanel from "@/app/components/AdminPanel";
import CampaignCard from "@/app/components/CampaignCard";
import Leaderboard from "@/app/components/Leaderboard";
import { ADDRESSES, TARIK_VAULT_ABI, VICTORY_CRATE_ABI } from "@/app/config/contracts";
import { MOCK_CAMPAIGNS, type MockCampaign } from "@/app/config/mockData";
import { useWar } from "@/app/hooks/useWar";
import { useWarList } from "@/app/hooks/useWarList";
import { useUserDeposit } from "@/app/hooks/useUserDeposit";
import { useVictoryCrate } from "@/app/hooks/useVictoryCrate";

type ViewMode = "grid" | "arena" | "lootboxes" | "leaderboard" | "admin";

export default function Home() {
  const { address } = useAccount();
  const [view, setView] = useState<ViewMode>("grid");
  const [activeWarId, setActiveWarId] = useState<number>(0);
  const [selectedMock, setSelectedMock] = useState<MockCampaign | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  // Custom hooks — replace 8 inline useReadContract calls
  const { warCount } = useWarList();
  const { war, tugPosition, isOpen } = useWar(activeWarId);
  const { deposit: userDeposit, isWinner } = useUserDeposit(activeWarId);
  const { hasCrate, isOpened: crateOpened, yieldAmount: crateYield } = useVictoryCrate(activeWarId);

  const currentWarId = warCount > 0 ? BigInt(warCount) : undefined;

  useEffect(() => {
    if (warCount > 0) {
      setActiveWarId(warCount - 1);
    }
  }, [warCount]);

  // Dismiss splash
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  const hasWar = war && warCount > 0;
  const userIsWinner = isWinner(war);

  const [featuredWarId, setFeaturedWarId] = useState<number | null>(null);

  const categories = ["All", "Politik", "Crypto", "Sports", "Tech"];
  const filteredMocks = activeCategory === "All"
    ? MOCK_CAMPAIGNS
    : MOCK_CAMPAIGNS.filter((c) => c.category === activeCategory);

  // Featured = first hot campaign
  const featured = MOCK_CAMPAIGNS.find((c) => c.hot);
  const rest = filteredMocks.filter((c) => c !== featured || activeCategory !== "All");

  const openCampaign = (campaign: MockCampaign) => {
    setSelectedMock(campaign);
    setView("arena");
  };

  const openOnChainWar = (id: number) => {
    setActiveWarId(id);
    setSelectedMock(null);
    setView("arena");
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Splash */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "var(--bg-primary)",
            }}
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 160, delay: 0.1 }}
            >
              <img src="/logo.png" alt="Tarik Logo" style={{ height: 80, objectFit: "contain" }} />
            </motion.div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 160 }}
              transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
              style={{
                height: 2, marginTop: 16, borderRadius: 2,
                background: "linear-gradient(90deg, var(--red-main), var(--gold), var(--blue-main))",
              }}
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1.5 }}
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-dim)", marginTop: 12, letterSpacing: "0.15em" }}
            >
              LOSSLESS YIELD WARS
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar activeView={view} onViewChange={(v) => setView(v as ViewMode)} />

      <main style={{ paddingTop: 80, maxWidth: 1400, margin: "0 auto", padding: "80px 32px 48px" }}>
        {/* Grid view — Polymarket-style */}
        {view === "grid" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: showSplash ? 2.8 : 0, duration: 0.5 }}
          >
            {/* Header */}
            <div style={{ marginBottom: 24, paddingTop: 16 }}>
              <h1 style={{
                fontFamily: "var(--font-display)", fontSize: "2.2rem",
                letterSpacing: "0.06em", lineHeight: 1.1, marginBottom: 6,
              }}>
                Yield Wars
              </h1>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.9rem",
                color: "var(--text-secondary)", maxWidth: 460,
              }}>
                Stake on your champion. Principal is safe — winner takes all yield.
              </p>
            </div>

            {/* Category tabs + Faucet */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 20, flexWrap: "wrap", gap: 8,
            }}>
              <div style={{ display: "flex", gap: 4 }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      fontFamily: "var(--font-body)", fontSize: "0.8rem",
                      padding: "5px 14px", borderRadius: 6, border: "none",
                      cursor: "pointer", transition: "all 0.15s",
                      background: activeCategory === cat ? "rgba(255,255,255,0.1)" : "transparent",
                      color: activeCategory === cat ? "var(--text-primary)" : "var(--text-dim)",
                      fontWeight: activeCategory === cat ? 600 : 400,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <FaucetButton />
            </div>

            {/* On-chain wars (if any) */}
            {warCount > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                  letterSpacing: "0.15em", textTransform: "uppercase",
                  color: "var(--text-dim)", marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4caf50", display: "inline-block" }} />
                  LIVE ON-CHAIN
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                  {Array.from({ length: warCount }).map((_, i) => (
                    <OnChainWarCard key={i} warId={i} onClick={() => openOnChainWar(i)} />
                  ))}
                </div>
              </div>
            )}

            {/* Featured campaign */}
            {activeCategory === "All" && (
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                  letterSpacing: "0.15em", textTransform: "uppercase",
                  color: "var(--text-dim)", marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Flame size={14} color="var(--red-glow)" /> TRENDING
                </div>
                {featuredWarId !== null ? (
                  <OnChainWarCard warId={featuredWarId} onClick={() => openOnChainWar(featuredWarId)} featured />
                ) : featured ? (
                  <CampaignCard {...featured} onClick={() => openCampaign(featured)} featured />
                ) : null}
              </div>
            )}

            {/* Campaign grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 16,
            }}>
              {rest.map((c) => (
                <CampaignCard key={c.id} {...c} onClick={() => openCampaign(c)} />
              ))}
            </div>


          </motion.div>
        )}

        {/* Arena view — detailed campaign view */}
        {view === "arena" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Back button */}
            <button
              onClick={() => { setView("grid"); setSelectedMock(null); }}
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.85rem",
                color: "var(--text-dim)", background: "none", border: "none",
                cursor: "pointer", padding: "8px 0", marginBottom: 12,
                display: "flex", alignItems: "center", gap: 6,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
            >
              ← Back to Markets
            </button>

            {/* If viewing a mock campaign */}
            {selectedMock && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <TugOfWarArena
                  nameA={selectedMock.nameA}
                  nameB={selectedMock.nameB}
                  tvlA={BigInt(selectedMock.tvlA * 1e6)}
                  tvlB={BigInt(selectedMock.tvlB * 1e6)}
                  pctA={selectedMock.pctA * 100}
                  pctB={(100 - selectedMock.pctA) * 100}
                  status={0}
                  winningSide={0}
                  yieldBps={selectedMock.yieldBps}
                  totalDeposits={BigInt((selectedMock.tvlA + selectedMock.tvlB) * 1e6)}
                />
                <div style={{
                  padding: 24, background: "var(--bg-card)",
                  border: "1px solid rgba(255,215,0,0.15)", borderRadius: 12,
                  textAlign: "center",
                }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: 8 }}>
                    DEMO CAMPAIGN
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--text-dim)", maxWidth: 400, margin: "0 auto" }}>
                    This is a mock campaign for preview. Create a real on-chain campaign via the Admin panel to start playing.
                  </p>
                </div>
              </div>
            )}

            {/* If viewing an on-chain war */}
            {!selectedMock && hasWar && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <TugOfWarArena
                  nameA={war.nameA}
                  nameB={war.nameB}
                  tvlA={war.tvlA}
                  tvlB={war.tvlB}
                  pctA={tugPosition ? Number(tugPosition.pctA) : 5000}
                  pctB={tugPosition ? Number(tugPosition.pctB) : 5000}
                  status={Number(war.status)}
                  winningSide={Number(war.winningSide)}
                  yieldBps={Number(war.mockYieldBps)}
                  totalDeposits={war.totalDeposits}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <WarInfo
                    warId={activeWarId}
                    nameA={war.nameA}
                    nameB={war.nameB}
                    startTime={Number(war.startTime)}
                    endTime={Number(war.endTime)}
                    status={Number(war.status)}
                    participantCount={Number(war.participantCount)}
                    totalDeposits={war.totalDeposits}
                    yieldBps={Number(war.mockYieldBps)}
                    totalYield={war.totalYield}
                  />
                  <ActionPanel
                    warId={activeWarId}
                    nameA={war.nameA}
                    nameB={war.nameB}
                    isOpen={!!isOpen}
                    status={Number(war.status)}
                    winningSide={Number(war.winningSide)}
                    war={war}
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
        {/* Lootboxes View */}
        {view === "lootboxes" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: "40px 0" }}
          >
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", color: "var(--gold)", letterSpacing: "0.1em" }}>
                YOUR LOOTBOXES
              </h2>
              <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                Unseal the crates you've won to claim your yield.
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 32 }}>
              {/* Show actual un-opened crates if any */}
              {warCount > 0 && Array.from({ length: warCount }).map((_, i) => {
                if (i === activeWarId && hasCrate && !crateOpened) {
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

              {/* Show a demo crate for the user to try if they have none */}
              {(!hasCrate) && (
                <div style={{ width: 300 }}>
                  <div style={{ textAlign: "center", marginBottom: 12, fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-dim)" }}>
                    Demo Crate (Try it!)
                  </div>
                  <VictoryCrate
                    yieldAmount={BigInt(25000000)} // $25.00
                    isOpened={false}
                    onOpen={() => {}}
                    isOpening={false}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}


        {/* Leaderboard View */}
        {view === "leaderboard" && (
          <Leaderboard />
        )}

        {/* Admin View */}
        {view === "admin" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: "40px 0" }}
          >
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", color: "var(--gold)", letterSpacing: "0.1em" }}>
                ADMIN DASHBOARD
              </h2>
              <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                Manage campaigns, resolve wars, and control the yield flow.
              </p>
            </div>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <AdminPanel onSetFeatured={setFeaturedWarId} />
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <footer style={{
          marginTop: 48, paddingTop: 20,
          borderTop: "1px solid var(--border-subtle)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)" }}>
            TARIK · Lossless Yield Wars
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)" }}>
            Built on <span style={{ color: "var(--text-secondary)" }}>Monad</span> · {new Date().getFullYear()}
          </div>
        </footer>
      </main>
    </div>
  );
}

// Mini component to render on-chain war as a card
function OnChainWarCard({ warId, onClick, featured }: { warId: number; onClick: () => void; featured?: boolean }) {
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

  if (!war) return null;

  const pctA = tug ? Number(tug[0]) / 100 : 50;
  const status = Number(war.status);
  const statusLabels = ["LIVE", "RESOLVED", "CANCELLED"];
  const statusColors = ["#4caf50", "var(--gold)", "#ff5252"];

  return (
    <CampaignCard
      id={warId}
      nameA={war.nameA}
      nameB={war.nameB}
      imageUrl={`https://placehold.co/600x340/0b0c10/4caf50?text=⚡+LIVE+WAR+%23${warId}&font=montserrat`}
      category={statusLabels[status]}
      pctA={pctA}
      tvlA={Number(war.tvlA) / 1e6}
      tvlB={Number(war.tvlB) / 1e6}
      participants={Number(war.participantCount)}
      endTime={Number(war.endTime)}
      yieldBps={Number(war.mockYieldBps)}
      featured={featured}
      hot={status === 0}
      onClick={onClick}
    />
  );
}
