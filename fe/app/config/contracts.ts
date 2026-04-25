// ============================================================================
// TARIK — Contract ABIs & Addresses (Monad Testnet)
// ============================================================================

export const CHAIN_ID = 10143;

export const ADDRESSES = {
  mockUSDC: (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || "0x46bb4853279adc27223fcd944655833bc8919ca7") as `0x${string}`,
  victoryCrate: (process.env.NEXT_PUBLIC_VICTORY_CRATE_ADDRESS || "0xd672b4c3939d2b5a0cddd3aad5b1f2a1686c5ed7") as `0x${string}`,
  tarikVault: (process.env.NEXT_PUBLIC_TARIK_VAULT_ADDRESS || "0x919d409142179d8df2acfca9b0f3c3643e733446") as `0x${string}`,
} as const;

// Owner / deployer — used for admin check on the frontend
export const OWNER_ADDRESS = "0x8B35e6241D00Fa03C7b36e923b41590bb6B94478" as const;

export const TARIK_VAULT_ABI = [
  { type: "constructor", inputs: [{ name: "_stakingToken", type: "address" }, { name: "_owner", type: "address" }], stateMutability: "nonpayable" },
  // Admin
  { type: "function", name: "createWar", inputs: [{ name: "nameA", type: "string" }, { name: "nameB", type: "string" }, { name: "startTime", type: "uint256" }, { name: "endTime", type: "uint256" }, { name: "mockYieldBps", type: "uint256" }], outputs: [{ name: "warId", type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "resolve", inputs: [{ name: "warId", type: "uint256" }, { name: "winningSide", type: "uint8" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "cancelWar", inputs: [{ name: "warId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "fundYieldReserve", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setVictoryCrate", inputs: [{ name: "_victoryCrate", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  // User
  { type: "function", name: "deposit", inputs: [{ name: "warId", type: "uint256" }, { name: "side", type: "uint8" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "claim", inputs: [{ name: "warId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "openCrate", inputs: [{ name: "warId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  // View
  { type: "function", name: "currentWarId", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "owner", inputs: [], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
  { type: "function", name: "stakingToken", inputs: [], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
  { type: "function", name: "victoryCrate", inputs: [], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
  {
    type: "function", name: "getWar", inputs: [{ name: "warId", type: "uint256" }],
    outputs: [{
      name: "", type: "tuple",
      components: [
        { name: "nameA", type: "string" }, { name: "nameB", type: "string" },
        { name: "startTime", type: "uint256" }, { name: "endTime", type: "uint256" },
        { name: "tvlA", type: "uint256" }, { name: "tvlB", type: "uint256" },
        { name: "totalDeposits", type: "uint256" }, { name: "mockYieldBps", type: "uint256" },
        { name: "totalYield", type: "uint256" }, { name: "winningSide", type: "uint8" },
        { name: "status", type: "uint8" }, { name: "participantCount", type: "uint256" },
      ]
    }], stateMutability: "view"
  },
  {
    type: "function", name: "getUserDeposit", inputs: [{ name: "warId", type: "uint256" }, { name: "user", type: "address" }],
    outputs: [{
      name: "", type: "tuple",
      components: [
        { name: "amount", type: "uint256" }, { name: "side", type: "uint8" },
        { name: "claimed", type: "bool" }, { name: "yieldClaimed", type: "bool" },
      ]
    }], stateMutability: "view"
  },
  { type: "function", name: "getTugOfWarPosition", inputs: [{ name: "warId", type: "uint256" }], outputs: [{ name: "pctA", type: "uint256" }, { name: "pctB", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getEstimatedYield", inputs: [{ name: "warId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getWarParticipants", inputs: [{ name: "warId", type: "uint256" }], outputs: [{ name: "", type: "address[]" }], stateMutability: "view" },
  { type: "function", name: "isDepositOpen", inputs: [{ name: "warId", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "view" },
  { type: "function", name: "getTimeRemaining", inputs: [{ name: "warId", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  // Events
  { type: "event", name: "WarCreated", inputs: [{ name: "warId", type: "uint256", indexed: true }, { name: "nameA", type: "string" }, { name: "nameB", type: "string" }, { name: "startTime", type: "uint256" }, { name: "endTime", type: "uint256" }, { name: "mockYieldBps", type: "uint256" }] },
  { type: "event", name: "Deposited", inputs: [{ name: "warId", type: "uint256", indexed: true }, { name: "user", type: "address", indexed: true }, { name: "side", type: "uint8" }, { name: "amount", type: "uint256" }] },
  { type: "event", name: "WarResolved", inputs: [{ name: "warId", type: "uint256", indexed: true }, { name: "winningSide", type: "uint8" }, { name: "totalYield", type: "uint256" }, { name: "winnerTVL", type: "uint256" }, { name: "loserTVL", type: "uint256" }] },
  { type: "event", name: "PrincipalClaimed", inputs: [{ name: "warId", type: "uint256", indexed: true }, { name: "user", type: "address", indexed: true }, { name: "amount", type: "uint256" }] },
  { type: "event", name: "YieldClaimed", inputs: [{ name: "warId", type: "uint256", indexed: true }, { name: "user", type: "address", indexed: true }, { name: "yieldAmount", type: "uint256" }] },
] as const;

export const MOCK_USDC_ABI = [
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "allowance", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "faucet", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ name: "", type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ name: "", type: "string" }], stateMutability: "view" },
  { type: "function", name: "FAUCET_AMOUNT", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "FAUCET_COOLDOWN", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "lastFaucetTime", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "mint", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "event", name: "FaucetDrip", inputs: [{ name: "recipient", type: "address", indexed: true }, { name: "amount", type: "uint256" }] },
] as const;

export const VICTORY_CRATE_ABI = [
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }, { name: "id", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "crateOpened", inputs: [{ name: "roundId", type: "uint256" }, { name: "owner", type: "address" }], outputs: [{ name: "", type: "bool" }], stateMutability: "view" },
  { type: "function", name: "crateYield", inputs: [{ name: "roundId", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;
