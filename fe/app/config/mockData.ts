// ============================================================================
// Mock campaigns — shown when no on-chain wars exist
// These demonstrate the UI and get replaced by real data
// ============================================================================

export interface MockCampaign {
  id: number;
  nameA: string;
  nameB: string;
  imageUrl: string;
  category: string;
  pctA: number;  // 0-100
  tvlA: number;  // in USDC
  tvlB: number;
  participants: number;
  endTime: number;
  yieldBps: number;
  hot: boolean;  // trending
}

const now = Math.floor(Date.now() / 1000);

export const MOCK_CAMPAIGNS: MockCampaign[] = [
  {
    id: 0,
    nameA: "Jokowi",
    nameB: "Prabowo",
    imageUrl: "https://placehold.co/600x340/1a1c2e/e63946?text=PILPRES+2029&font=montserrat",
    category: "Politik",
    pctA: 47.3,
    tvlA: 125_000,
    tvlB: 140_500,
    participants: 342,
    endTime: now + 7200,
    yieldBps: 2000,
    hot: true,
  },
  {
    id: 1,
    nameA: "Bitcoin",
    nameB: "Ethereum",
    imageUrl: "https://placehold.co/600x340/1a1c2e/ffd700?text=BTC+vs+ETH+FLIPPENING&font=montserrat",
    category: "Crypto",
    pctA: 62.1,
    tvlA: 310_000,
    tvlB: 189_000,
    participants: 1205,
    endTime: now + 3600,
    yieldBps: 1500,
    hot: true,
  },
  {
    id: 2,
    nameA: "MU",
    nameB: "Liverpool",
    imageUrl: "https://placehold.co/600x340/1a1c2e/1d6fff?text=PREMIER+LEAGUE&font=montserrat",
    category: "Sports",
    pctA: 38.8,
    tvlA: 78_000,
    tvlB: 123_000,
    participants: 567,
    endTime: now + 14400,
    yieldBps: 1000,
    hot: false,
  },
  {
    id: 3,
    nameA: "Monad",
    nameB: "Solana",
    imageUrl: "https://placehold.co/600x340/1a1c2e/836efb?text=CHAIN+WARS&font=montserrat",
    category: "Crypto",
    pctA: 71.5,
    tvlA: 450_000,
    tvlB: 179_000,
    participants: 2341,
    endTime: now + 1800,
    yieldBps: 2500,
    hot: true,
  },
  {
    id: 4,
    nameA: "AI Bull",
    nameB: "AI Bear",
    imageUrl: "https://placehold.co/600x340/1a1c2e/4caf50?text=AI+MARKET+2026&font=montserrat",
    category: "Tech",
    pctA: 55.2,
    tvlA: 220_000,
    tvlB: 178_000,
    participants: 891,
    endTime: now + 5400,
    yieldBps: 1800,
    hot: false,
  },
  {
    id: 5,
    nameA: "Anies",
    nameB: "Ganjar",
    imageUrl: "https://placehold.co/600x340/1a1c2e/ff6b6b?text=GUBERNUR+DKI&font=montserrat",
    category: "Politik",
    pctA: 52.7,
    tvlA: 95_000,
    tvlB: 85_000,
    participants: 456,
    endTime: now + 10800,
    yieldBps: 1200,
    hot: false,
  },
];
