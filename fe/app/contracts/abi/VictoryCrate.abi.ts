// ============================================================================
// VictoryCrate ABI — ERC1155 Victory Crate NFT on Monad Testnet
// ============================================================================

export const VICTORY_CRATE_ABI = [
  // --- ERC1155 Standard ---
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "uri",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },

  // --- Custom View ---
  {
    type: "function",
    name: "crateOpened",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "owner", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "crateYield",
    inputs: [{ name: "roundId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "minter",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },

  // --- Events ---
  {
    type: "event",
    name: "CrateMinted",
    inputs: [
      { name: "winner", type: "address", indexed: true },
      { name: "roundId", type: "uint256", indexed: true },
      { name: "yieldAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CrateOpened",
    inputs: [
      { name: "opener", type: "address", indexed: true },
      { name: "roundId", type: "uint256", indexed: true },
      { name: "yieldAmount", type: "uint256", indexed: false },
    ],
  },
] as const;
