// ============================================================================
// types/contracts.ts — TypeScript types untuk data on-chain TARIK
// ============================================================================

/** Status sebuah war/round */
export enum WarStatus {
  Active = 0,
  Resolved = 1,
  Cancelled = 2,
}

/** Side dalam sebuah war */
export enum WarSide {
  None = 0,
  SideA = 1,
  SideB = 2,
}

/**
 * Struct War dari TarikVault.getWar()
 * Semua BigInt berasal dari uint256 di Solidity.
 */
export interface War {
  nameA: string;
  nameB: string;
  startTime: bigint;
  endTime: bigint;
  tvlA: bigint;
  tvlB: bigint;
  totalDeposits: bigint;
  mockYieldBps: bigint;
  totalYield: bigint;
  winningSide: number; // uint8: 0 = belum resolved, 1 = A, 2 = B
  status: WarStatus;   // uint8: 0=Active, 1=Resolved, 2=Cancelled
  participantCount: bigint;
}

/**
 * Struct UserDeposit dari TarikVault.getUserDeposit()
 */
export interface UserDeposit {
  amount: bigint;       // Principal deposited (dalam mUSDC 6 desimal)
  side: number;         // 1 = Side A, 2 = Side B
  claimed: boolean;     // Principal sudah diklaim?
  yieldClaimed: boolean;// Yield (crate) sudah dibuka?
}

/**
 * Posisi Tug-of-War dari TarikVault.getTugOfWarPosition()
 * Nilai dalam basis points (0–10000 = 0%–100%).
 */
export interface TugPosition {
  pctA: bigint; // basis points Side A
  pctB: bigint; // basis points Side B
}

/** War dengan data tambahan yang sudah diolah untuk UI */
export interface WarWithId extends War {
  warId: number;
}

/** State dari sebuah war yang sedang ditampilkan di UI */
export interface ActiveWarState {
  war: War;
  warId: number;
  tugPosition: TugPosition;
  isOpen: boolean;
  timeRemaining: bigint;
}
