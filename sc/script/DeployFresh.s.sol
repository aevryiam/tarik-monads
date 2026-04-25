// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {VictoryCrate} from "../src/VictoryCrate.sol";
import {TarikVault} from "../src/TarikVault.sol";

contract DeployFresh is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("========================================");
        console.log("Deployer  :", deployer);
        console.log("Chain ID  :", block.chainid);
        console.log("Timestamp :", block.timestamp);
        console.log("========================================");

        vm.startBroadcast(deployerPrivateKey);

        string memory baseURI = vm.envOr(
            "CRATE_BASE_URI",
            string("https://tarik.gg/api/metadata/crate/")
        );
        VictoryCrate crate = new VictoryCrate(deployer, baseURI);
        console.log("[1] VictoryCrate deployed :", address(crate));

        TarikVault vault = new TarikVault(deployer);
        console.log("[2] TarikVault deployed   :", address(vault));

        crate.setMinter(address(vault));
        console.log("[3] crate.minter          = vault OK");

        vault.setVictoryCrate(address(crate));
        console.log("[4] vault.victoryCrate    = crate OK");

        uint256 yieldReserve = 1 ether;
        vault.fundYieldReserve{value: yieldReserve}(yieldReserve);
        console.log("[5] Yield reserve funded  :", yieldReserve);

        uint256 startTime = block.timestamp;
        uint256 endTime   = block.timestamp + 30 minutes;
        uint256 warId = vault.createWar("DEGEN", "HIGHER", startTime, endTime, 500);
        console.log("[6] War #0 created, endTime:", endTime);

        vm.stopBroadcast();

        console.log("\n========== SIMPAN ADDRESS INI ==========");
        console.log("VICTORY_CRATE=", address(crate));
        console.log("TARIK_VAULT=", address(vault));
        console.log("WAR_ID=", warId);
        console.log("WAR_END=", endTime);
        console.log("=========================================");
    }
}
