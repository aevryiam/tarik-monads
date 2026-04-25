// ============================================================================
// config/constants.ts — Magic numbers dan konstanta global
// ============================================================================

/** Native MON uses 18 decimals. */
export const MON_DECIMALS = 18;

/** Asset symbol shown across the Monad edition. */
export const ASSET_SYMBOL = "MON";

/** Interval refetch dalam milidetik.
 *  Monad block time = 400ms, jadi polling setiap 4s sudah cukup responsif.
 */
export const REFETCH_INTERVAL = {
  /** Untuk data yang berubah cepat (TVL, posisi tug-of-war) */
  fast: 4_000,
  /** Untuk data user (deposit, allowance) */
  normal: 8_000,
  /** Untuk data yang jarang berubah (faucet time, crate status) */
  slow: 15_000,
} as const;

/** Chain ID Monad Testnet */
export const MONAD_TESTNET_CHAIN_ID = 10143;
