// ============================================================================
// contracts/index.ts — Barrel export untuk semua contract ABIs dan addresses
// ============================================================================

export { TARIK_VAULT_ABI } from "./abi/TarikVault.abi";
export { VICTORY_CRATE_ABI } from "./abi/VictoryCrate.abi";

// Re-export addresses untuk backward-compatibility
export { ADDRESSES, OWNER_ADDRESS } from "@/app/config/addresses";
