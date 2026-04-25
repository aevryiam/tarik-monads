// ============================================================================
// Mock campaigns — shown when no on-chain wars exist
// These demonstrate the UI and get replaced by real data
// ============================================================================

export interface MockCampaign {
  id: number;
  nameA: string;
  nameB: string;
  category: string;
  pctA: number;  // 0-100
  tvlA: number;  // in MON
  tvlB: number;  // in MON
  participants: number;
  endTime: number;
  yieldBps: number;
  hot: boolean;  // trending
  iconName: string; // lucide icon name
  trendA: number[]; // historical pctA data for sparkline
}

const now = Math.floor(Date.now() / 1000);

export const MOCK_CAMPAIGNS: MockCampaign[] = [
  {
    id: 0,
    nameA: "Jokowi",
    nameB: "Prabowo",
    category: "Politik",
    pctA: 47.3,
    tvlA: 125_000,
    tvlB: 140_500,
    participants: 342,
    endTime: now + 7200,
    yieldBps: 600,
    hot: true,
    iconName: "Landmark",
    trendA: [50, 48, 49, 46, 45, 47.3]
  },
  {
    id: 1,
    nameA: "Bitcoin",
    nameB: "Ethereum",
    category: "Crypto",
    pctA: 62.1,
    tvlA: 310_000,
    tvlB: 189_000,
    participants: 1205,
    endTime: now + 3600,
    yieldBps: 450,
    hot: true,
    iconName: "Bitcoin",
    trendA: [55, 58, 57, 60, 61.5, 62.1]
  },
  {
    id: 2,
    nameA: "MU",
    nameB: "Liverpool",
    category: "Sports",
    pctA: 38.8,
    tvlA: 78_000,
    tvlB: 123_000,
    participants: 567,
    endTime: now + 14400,
    yieldBps: 300,
    hot: false,
    iconName: "Trophy",
    trendA: [45, 42, 40, 41, 39, 38.8]
  },
  {
    id: 3,
    nameA: "Monad",
    nameB: "Solana",
    category: "Crypto",
    pctA: 71.5,
    tvlA: 450_000,
    tvlB: 179_000,
    participants: 2341,
    endTime: now + 1800,
    yieldBps: 800,
    hot: true,
    iconName: "Zap",
    trendA: [50, 55, 60, 65, 70, 71.5]
  },
  {
    id: 4,
    nameA: "AI Bull",
    nameB: "AI Bear",
    category: "Tech",
    pctA: 55.2,
    tvlA: 220_000,
    tvlB: 178_000,
    participants: 891,
    endTime: now + 5400,
    yieldBps: 550,
    hot: false,
    iconName: "Bot",
    trendA: [50, 52, 51, 54, 53, 55.2]
  },
  {
    id: 5,
    nameA: "Anies",
    nameB: "Ganjar",
    category: "Politik",
    pctA: 52.7,
    tvlA: 95_000,
    tvlB: 85_000,
    participants: 456,
    endTime: now + 10800,
    yieldBps: 400,
    hot: false,
    iconName: "Vote",
    trendA: [50, 49, 51, 52, 53, 52.7]
  },
];
