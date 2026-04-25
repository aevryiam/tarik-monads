// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {VictoryCrate} from "../src/VictoryCrate.sol";
import {TarikVault} from "../src/TarikVault.sol";

/// @title DeployTarik
/// @notice Deployment script for the full TARIK smart contract suite.
///         Deploys VictoryCrate -> TarikVault, then wires them together.
///
/// Usage:
///   forge script script/DeployTarik.s.sol:DeployTarik --rpc-url <RPC> --broadcast --verify
contract DeployTarik is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy VictoryCrate NFT
        string memory baseURI = vm.envOr("CRATE_BASE_URI", string("https://tarik.gg/api/metadata/crate/"));
        VictoryCrate crate = new VictoryCrate(deployer, baseURI);
        console.log("VictoryCrate deployed at:", address(crate));

        // 2. Deploy TarikVault
        TarikVault vault = new TarikVault(deployer);
        console.log("TarikVault deployed at:", address(vault));

        // 3. Wire contracts: set TarikVault as the minter on VictoryCrate
        crate.setMinter(address(vault));
        console.log("VictoryCrate minter set to TarikVault");

        // 4. Set VictoryCrate on TarikVault
        vault.setVictoryCrate(address(crate));
        console.log("TarikVault victoryCrate set");

        // 5. Fund the vault with native MON yield reserve
        uint256 yieldReserve = 100_000 ether;
        vault.fundYieldReserve{value: yieldReserve}(yieldReserve);
        console.log("Vault funded with yield reserve:", yieldReserve);

        vm.stopBroadcast();

        // Summary
        console.log("\n========== DEPLOYMENT SUMMARY ==========");
        console.log("VictoryCrate: ", address(crate));
        console.log("TarikVault:   ", address(vault));
        console.log("=========================================\n");
    }
}
