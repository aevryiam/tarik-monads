// ============================================================================
// TarikVault ABI — TARIK Lossless Yield Wars (Monad Testnet)
// ============================================================================

export const TARIK_VAULT_ABI = [
  // --- Constructor ---
  {
    type: "constructor",
    inputs: [{ name: "_owner", type: "address" }],
    stateMutability: "nonpayable",
  },

  // --- Admin Functions ---
  {
    type: "function",
    name: "createWar",
    inputs: [
      { name: "nameA", type: "string" },
      { name: "nameB", type: "string" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "mockYieldBps", type: "uint256" },
    ],
    outputs: [{ name: "warId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resolve",
    inputs: [
      { name: "warId", type: "uint256" },
      { name: "winningSide", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelWar",
    inputs: [{ name: "warId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "fundYieldReserve",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "setVictoryCrate",
    inputs: [{ name: "_victoryCrate", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // --- User Functions ---
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "warId", type: "uint256" },
      { name: "side", type: "uint8" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "claim",
    inputs: [{ name: "warId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "openCrate",
    inputs: [{ name: "warId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // --- View Functions ---
  {
    type: "function",
    name: "currentWarId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "victoryCrate",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWar",
    inputs: [{ name: "warId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "nameA", type: "string" },
          { name: "nameB", type: "string" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "tvlA", type: "uint256" },
          { name: "tvlB", type: "uint256" },
          { name: "totalDeposits", type: "uint256" },
          { name: "mockYieldBps", type: "uint256" },
          { name: "totalYield", type: "uint256" },
          { name: "winningSide", type: "uint8" },
          { name: "status", type: "uint8" },
          { name: "participantCount", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserDeposit",
    inputs: [
      { name: "warId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "amount", type: "uint256" },
          { name: "side", type: "uint8" },
          { name: "claimed", type: "bool" },
          { name: "yieldClaimed", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTugOfWarPosition",
    inputs: [{ name: "warId", type: "uint256" }],
    outputs: [
      { name: "pctA", type: "uint256" },
      { name: "pctB", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEstimatedYield",
    inputs: [
      { name: "warId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWarParticipants",
    inputs: [{ name: "warId", type: "uint256" }],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isDepositOpen",
    inputs: [{ name: "warId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTimeRemaining",
    inputs: [{ name: "warId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },

  // --- Events ---
  {
    type: "event",
    name: "WarCreated",
    inputs: [
      { name: "warId", type: "uint256", indexed: true },
      { name: "nameA", type: "string", indexed: false },
      { name: "nameB", type: "string", indexed: false },
      { name: "startTime", type: "uint256", indexed: false },
      { name: "endTime", type: "uint256", indexed: false },
      { name: "mockYieldBps", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "warId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "side", type: "uint8", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "WarResolved",
    inputs: [
      { name: "warId", type: "uint256", indexed: true },
      { name: "winningSide", type: "uint8", indexed: false },
      { name: "totalYield", type: "uint256", indexed: false },
      { name: "winnerTVL", type: "uint256", indexed: false },
      { name: "loserTVL", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "WarCancelled",
    inputs: [{ name: "warId", type: "uint256", indexed: true }],
  },
  {
    type: "event",
    name: "PrincipalClaimed",
    inputs: [
      { name: "warId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "YieldClaimed",
    inputs: [
      { name: "warId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "yieldAmount", type: "uint256", indexed: false },
    ],
  },
] as const;
