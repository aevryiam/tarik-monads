// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {VictoryCrate} from "../src/VictoryCrate.sol";
import {TarikVault} from "../src/TarikVault.sol";

/// @title TarikVaultTest
/// @notice Comprehensive test suite for the TARIK smart contract system.
///         Covers the complete lifecycle: deploy → create war → deposit → resolve → claim → open crate
contract TarikVaultTest is Test {
    // =========================================================================
    // State
    // =========================================================================

    VictoryCrate public crate;
    TarikVault public vault;

    address public owner = makeAddr("owner");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    uint256 constant INITIAL_BALANCE = 100_000 ether; // 100k MON
    uint256 constant YIELD_RESERVE = 500_000 ether;   // 500k MON for yield

    // =========================================================================
    // Setup
    // =========================================================================

    function setUp() public {
        vm.deal(owner, YIELD_RESERVE);

        vm.startPrank(owner);

        // Deploy contracts
        crate = new VictoryCrate(owner, "https://tarik.gg/api/metadata/crate/");
        vault = new TarikVault(owner);

        // Wire contracts
        crate.setMinter(address(vault));
        vault.setVictoryCrate(address(crate));

        // Fund vault with yield reserve
        vault.fundYieldReserve{value: YIELD_RESERVE}(YIELD_RESERVE);

        vm.stopPrank();

        // Give users native MON
        vm.deal(alice, INITIAL_BALANCE);
        vm.deal(bob, INITIAL_BALANCE);
        vm.deal(charlie, INITIAL_BALANCE);
    }

    // =========================================================================
    // Helper
    // =========================================================================

    /// @dev Creates a standard war: deposits open now, closes in 1 hour, 5% yield
    function _createDefaultWar() internal returns (uint256 warId) {
        vm.prank(owner);
        warId = vault.createWar(
            "DEGEN",
            "HIGHER",
            block.timestamp,
            block.timestamp + 1 hours,
            500 // 5% yield
        );
    }

    /// @dev Helper: user deposits amount to a side
    function _deposit(address user, uint256 warId, uint8 side, uint256 amount) internal {
        vm.startPrank(user);
        vault.deposit{value: amount}(warId, side, amount);
        vm.stopPrank();
    }

    // =========================================================================
    // War Creation Tests
    // =========================================================================

    function test_CreateWar() public {
        uint256 warId = _createDefaultWar();
        
        TarikVault.War memory war = vault.getWar(warId);
        assertEq(war.nameA, "DEGEN");
        assertEq(war.nameB, "HIGHER");
        assertEq(war.mockYieldBps, 500);
        assertEq(uint8(war.status), uint8(TarikVault.WarStatus.Active));
        assertEq(war.winningSide, 0);
    }

    function test_CreateWar_RevertInvalidTime() public {
        vm.prank(owner);
        vm.expectRevert(TarikVault.InvalidTimeRange.selector);
        vault.createWar("A", "B", block.timestamp + 2 hours, block.timestamp + 1 hours, 500);
    }

    function test_CreateWar_RevertInvalidYield() public {
        vm.prank(owner);
        vm.expectRevert(TarikVault.InvalidYieldBps.selector);
        vault.createWar("A", "B", block.timestamp, block.timestamp + 1 hours, 0);

        vm.prank(owner);
        vm.expectRevert(TarikVault.InvalidYieldBps.selector);
        vault.createWar("A", "B", block.timestamp, block.timestamp + 1 hours, 10001);
    }

    function test_CreateWar_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.createWar("A", "B", block.timestamp, block.timestamp + 1 hours, 500);
    }

    function test_CreateWar_AutoIncrementId() public {
        uint256 id0 = _createDefaultWar();
        uint256 id1 = _createDefaultWar();
        assertEq(id0, 0);
        assertEq(id1, 1);
    }

    // =========================================================================
    // Deposit Tests
    // =========================================================================

    function test_Deposit_SideA() public {
        uint256 warId = _createDefaultWar();
        uint256 depositAmount = 1000 ether;

        _deposit(alice, warId, 1, depositAmount);

        TarikVault.UserDeposit memory dep = vault.getUserDeposit(warId, alice);
        assertEq(dep.amount, depositAmount);
        assertEq(dep.side, 1);
        assertFalse(dep.claimed);

        TarikVault.War memory war = vault.getWar(warId);
        assertEq(war.tvlA, depositAmount);
        assertEq(war.tvlB, 0);
        assertEq(war.totalDeposits, depositAmount);
        assertEq(war.participantCount, 1);
    }

    function test_Deposit_SideB() public {
        uint256 warId = _createDefaultWar();

        _deposit(bob, warId, 2, 2000 ether);

        TarikVault.War memory war = vault.getWar(warId);
        assertEq(war.tvlA, 0);
        assertEq(war.tvlB, 2000 ether);
    }

    function test_Deposit_MultipleToSameSide() public {
        uint256 warId = _createDefaultWar();

        _deposit(alice, warId, 1, 500 ether);
        _deposit(alice, warId, 1, 300 ether);

        TarikVault.UserDeposit memory dep = vault.getUserDeposit(warId, alice);
        assertEq(dep.amount, 800 ether);
    }

    function test_Deposit_RevertWrongSide() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 500 ether);

        // Try to deposit to opposite side
        vm.startPrank(alice);
        vm.expectRevert(TarikVault.InvalidSide.selector);
        vault.deposit{value: 500 ether}(warId, 2, 500 ether);
        vm.stopPrank();
    }

    function test_Deposit_RevertInvalidSide() public {
        uint256 warId = _createDefaultWar();

        vm.startPrank(alice);
        vm.expectRevert(TarikVault.InvalidSide.selector);
        vault.deposit{value: 500 ether}(warId, 3, 500 ether);
        vm.stopPrank();
    }

    function test_Deposit_RevertZeroAmount() public {
        uint256 warId = _createDefaultWar();

        vm.startPrank(alice);
        vm.expectRevert(TarikVault.ZeroAmount.selector);
        vault.deposit(warId, 1, 0);
        vm.stopPrank();
    }

    function test_Deposit_RevertInvalidMsgValue() public {
        uint256 warId = _createDefaultWar();

        vm.startPrank(alice);
        vm.expectRevert(TarikVault.InvalidMsgValue.selector);
        vault.deposit{value: 1 ether}(warId, 1, 2 ether);
        vm.stopPrank();
    }

    function test_Deposit_RevertBeforeStart() public {
        vm.prank(owner);
        uint256 warId = vault.createWar(
            "A", "B",
            block.timestamp + 1 hours,
            block.timestamp + 2 hours,
            500
        );

        vm.startPrank(alice);
        vm.expectRevert(TarikVault.DepositWindowClosed.selector);
        vault.deposit{value: 500 ether}(warId, 1, 500 ether);
        vm.stopPrank();
    }

    function test_Deposit_RevertAfterEnd() public {
        uint256 warId = _createDefaultWar();
        vm.warp(block.timestamp + 2 hours); // Past end time

        vm.startPrank(alice);
        vm.expectRevert(TarikVault.DepositWindowClosed.selector);
        vault.deposit{value: 500 ether}(warId, 1, 500 ether);
        vm.stopPrank();
    }

    // =========================================================================
    // Tug-of-War View Tests
    // =========================================================================

    function test_TugOfWar_NoDeposits() public {
        uint256 warId = _createDefaultWar();
        (uint256 pctA, uint256 pctB) = vault.getTugOfWarPosition(warId);
        assertEq(pctA, 5000); // 50%
        assertEq(pctB, 5000); // 50%
    }

    function test_TugOfWar_EqualDeposits() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 1000 ether);
        _deposit(bob, warId, 2, 1000 ether);

        (uint256 pctA, uint256 pctB) = vault.getTugOfWarPosition(warId);
        assertEq(pctA, 5000);
        assertEq(pctB, 5000);
    }

    function test_TugOfWar_UnequalDeposits() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 3000 ether); // 75%
        _deposit(bob, warId, 2, 1000 ether);   // 25%

        (uint256 pctA, uint256 pctB) = vault.getTugOfWarPosition(warId);
        assertEq(pctA, 7500);
        assertEq(pctB, 2500);
    }

    // =========================================================================
    // Resolve Tests
    // =========================================================================

    function test_Resolve_SideAWins() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 5000 ether);
        _deposit(bob, warId, 2, 5000 ether);

        // Fast forward past end
        vm.warp(block.timestamp + 2 hours);

        vm.prank(owner);
        vault.resolve(warId, 1);

        TarikVault.War memory war = vault.getWar(warId);
        assertEq(war.winningSide, 1);
        assertEq(uint8(war.status), uint8(TarikVault.WarStatus.Resolved));
        // Total yield = 10000 ether * 500 / 10000 = 500 ether (5%)
        assertEq(war.totalYield, 500 ether);
    }

    function test_Resolve_RevertBeforeEnd() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 1000 ether);

        vm.prank(owner);
        vm.expectRevert(TarikVault.DepositWindowOpen.selector);
        vault.resolve(warId, 1);
    }

    function test_Resolve_RevertDoubleResolve() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 1000 ether);
        vm.warp(block.timestamp + 2 hours);

        vm.prank(owner);
        vault.resolve(warId, 1);

        vm.prank(owner);
        vm.expectRevert(TarikVault.WarAlreadyResolved.selector);
        vault.resolve(warId, 2);
    }

    // =========================================================================
    // Cancel Tests
    // =========================================================================

    function test_CancelWar() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 1000 ether);

        vm.prank(owner);
        vault.cancelWar(warId);

        TarikVault.War memory war = vault.getWar(warId);
        assertEq(uint8(war.status), uint8(TarikVault.WarStatus.Cancelled));
    }

    function test_CancelWar_ClaimRefund() public {
        uint256 warId = _createDefaultWar();
        uint256 depositAmount = 5000 ether;
        _deposit(alice, warId, 1, depositAmount);

        uint256 balBefore = alice.balance;

        vm.prank(owner);
        vault.cancelWar(warId);

        vm.prank(alice);
        vault.claim(warId);

        assertEq(alice.balance, balBefore + depositAmount);
    }

    // =========================================================================
    // Claim Tests (Principal)
    // =========================================================================

    function test_Claim_WinnerGetsPrincipalAndCrate() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 5000 ether); // Alice → Side A
        _deposit(bob, warId, 2, 5000 ether);   // Bob → Side B

        vm.warp(block.timestamp + 2 hours);

        // Side A wins
        vm.prank(owner);
        vault.resolve(warId, 1);

        uint256 aliceBalBefore = alice.balance;

        // Alice (winner) claims
        vm.prank(alice);
        vault.claim(warId);

        // Principal returned
        assertEq(alice.balance, aliceBalBefore + 5000 ether);

        // Victory Crate NFT minted
        assertEq(crate.balanceOf(alice, warId), 1);

        // Crate yield should be recorded
        // totalYield = 10000 ether * 500 / 10000 = 500 ether
        // Alice's share = 500 ether * 5000 ether / 5000 ether = 500 ether (she's the only winner)
        assertEq(crate.crateYield(warId), 500 ether);
    }

    function test_Claim_LoserGetsPrincipalOnly() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 5000 ether);
        _deposit(bob, warId, 2, 5000 ether);

        vm.warp(block.timestamp + 2 hours);
        vm.prank(owner);
        vault.resolve(warId, 1); // Side A wins

        uint256 bobBalBefore = bob.balance;

        // Bob (loser) claims
        vm.prank(bob);
        vault.claim(warId);

        // Principal returned, no NFT
        assertEq(bob.balance, bobBalBefore + 5000 ether);
        assertEq(crate.balanceOf(bob, warId), 0);
    }

    function test_Claim_RevertDoubleClaim() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 1000 ether);

        vm.warp(block.timestamp + 2 hours);
        vm.prank(owner);
        vault.resolve(warId, 1);

        vm.prank(alice);
        vault.claim(warId);

        vm.prank(alice);
        vm.expectRevert(TarikVault.AlreadyClaimed.selector);
        vault.claim(warId);
    }

    function test_Claim_RevertNoDeposit() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 1000 ether);

        vm.warp(block.timestamp + 2 hours);
        vm.prank(owner);
        vault.resolve(warId, 1);

        vm.prank(charlie); // Never deposited
        vm.expectRevert(TarikVault.NoDeposit.selector);
        vault.claim(warId);
    }

    // =========================================================================
    // Open Crate (Yield Claim) Tests
    // =========================================================================

    function test_OpenCrate_FullFlow() public {
        uint256 warId = _createDefaultWar();

        // Alice deposits 3000 to Side A, Bob deposits 2000 to Side A, Charlie deposits 5000 to Side B
        _deposit(alice, warId, 1, 3000 ether);
        _deposit(bob, warId, 1, 2000 ether);
        _deposit(charlie, warId, 2, 5000 ether);

        // Total deposits: 10,000 MON
        // Total yield at 5%: 500 MON
        // Side A wins → winners: Alice + Bob
        // Alice's yield share: 500 * 3000 / 5000 = 300 MON
        // Bob's yield share: 500 * 2000 / 5000 = 200 MON

        vm.warp(block.timestamp + 2 hours);
        vm.prank(owner);
        vault.resolve(warId, 1);

        // Both winners claim principal + get crate
        vm.prank(alice);
        vault.claim(warId);
        vm.prank(bob);
        vault.claim(warId);

        // Charlie (loser) claims principal
        vm.prank(charlie);
        vault.claim(warId);

        // Now winners open crates
        uint256 aliceBalBefore = alice.balance;
        vm.prank(alice);
        vault.openCrate(warId);
        assertEq(alice.balance, aliceBalBefore + 300 ether);

        uint256 bobBalBefore = bob.balance;
        vm.prank(bob);
        vault.openCrate(warId);
        assertEq(bob.balance, bobBalBefore + 200 ether);

        // Crates marked as opened
        assertTrue(crate.crateOpened(warId, alice));
        assertTrue(crate.crateOpened(warId, bob));
    }

    function test_OpenCrate_RevertNotWinner() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 5000 ether);
        _deposit(bob, warId, 2, 5000 ether);

        vm.warp(block.timestamp + 2 hours);
        vm.prank(owner);
        vault.resolve(warId, 1);

        vm.prank(bob);
        vault.claim(warId); // Loser claims principal

        vm.prank(bob);
        vm.expectRevert(TarikVault.NotWinner.selector);
        vault.openCrate(warId); // Can't open crate as loser
    }

    function test_OpenCrate_RevertDoubleClaim() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 5000 ether);
        _deposit(bob, warId, 2, 5000 ether);

        vm.warp(block.timestamp + 2 hours);
        vm.prank(owner);
        vault.resolve(warId, 1);

        vm.prank(alice);
        vault.claim(warId);

        vm.prank(alice);
        vault.openCrate(warId);

        vm.prank(alice);
        vm.expectRevert(TarikVault.AlreadyClaimedYield.selector);
        vault.openCrate(warId);
    }

    // =========================================================================
    // View Function Tests
    // =========================================================================

    function test_GetEstimatedYield() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 6000 ether);
        _deposit(bob, warId, 2, 4000 ether);

        // totalYield = 10000 ether * 500 / 10000 = 500 ether
        // Alice's estimated = 500 ether * 6000 ether / 6000 ether = 500 ether (only winner on her side)
        uint256 aliceYield = vault.getEstimatedYield(warId, alice);
        assertEq(aliceYield, 500 ether);

        // Bob's estimated = 500 ether * 4000 ether / 4000 ether = 500 ether (only winner on his side)
        uint256 bobYield = vault.getEstimatedYield(warId, bob);
        assertEq(bobYield, 500 ether);
    }

    function test_IsDepositOpen() public {
        vm.prank(owner);
        uint256 warId = vault.createWar(
            "A", "B",
            block.timestamp + 1 hours,
            block.timestamp + 2 hours,
            500
        );

        // Before start
        assertFalse(vault.isDepositOpen(warId));

        // During deposit window
        vm.warp(block.timestamp + 1 hours + 30 minutes);
        assertTrue(vault.isDepositOpen(warId));

        // After end
        vm.warp(block.timestamp + 1 hours);
        assertFalse(vault.isDepositOpen(warId));
    }

    function test_GetTimeRemaining() public {
        uint256 warId = _createDefaultWar();

        uint256 remaining = vault.getTimeRemaining(warId);
        assertEq(remaining, 1 hours);

        vm.warp(block.timestamp + 30 minutes);
        remaining = vault.getTimeRemaining(warId);
        assertEq(remaining, 30 minutes);

        vm.warp(block.timestamp + 1 hours);
        remaining = vault.getTimeRemaining(warId);
        assertEq(remaining, 0);
    }

    function test_GetWarParticipants() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 1000 ether);
        _deposit(bob, warId, 2, 1000 ether);
        _deposit(alice, warId, 1, 500 ether); // Alice deposits again — no duplicate

        address[] memory participants = vault.getWarParticipants(warId);
        assertEq(participants.length, 2);
        assertEq(participants[0], alice);
        assertEq(participants[1], bob);
    }

    // =========================================================================
    // Full E2E Scenario
    // =========================================================================

    function test_E2E_CompleteWarCycle() public {
        // --- 1. Create War ---
        uint256 warId = _createDefaultWar();

        // --- 2. Deposits ---
        _deposit(alice, warId, 1, 10_000 ether);   // Alice: 10k on Side A
        _deposit(bob, warId, 2, 5_000 ether);      // Bob: 5k on Side B
        _deposit(charlie, warId, 2, 5_000 ether);  // Charlie: 5k on Side B

        // Check TVL
        TarikVault.War memory war = vault.getWar(warId);
        assertEq(war.tvlA, 10_000 ether);
        assertEq(war.tvlB, 10_000 ether);
        assertEq(war.totalDeposits, 20_000 ether);

        // --- 3. Time passes, resolve ---
        vm.warp(block.timestamp + 2 hours);
        vm.prank(owner);
        vault.resolve(warId, 2); // Side B wins!

        war = vault.getWar(warId);
        // Total yield = 20000 ether * 500 / 10000 = 1000 ether
        assertEq(war.totalYield, 1000 ether);

        // --- 4. Claims ---
        // Alice (loser) gets principal back
        uint256 aliceBal = alice.balance;
        vm.prank(alice);
        vault.claim(warId);
        assertEq(alice.balance, aliceBal + 10_000 ether);
        assertEq(crate.balanceOf(alice, warId), 0); // No crate for loser

        // Bob (winner) gets principal + crate
        uint256 bobBal = bob.balance;
        vm.prank(bob);
        vault.claim(warId);
        assertEq(bob.balance, bobBal + 5_000 ether);
        assertEq(crate.balanceOf(bob, warId), 1);

        // Charlie (winner) gets principal + crate
        uint256 charlieBal = charlie.balance;
        vm.prank(charlie);
        vault.claim(warId);
        assertEq(charlie.balance, charlieBal + 5_000 ether);
        assertEq(crate.balanceOf(charlie, warId), 1);

        // --- 5. Open Crates ---
        // Bob's yield: 1000 ether * 5000 ether / 10000 ether = 500 ether
        bobBal = bob.balance;
        vm.prank(bob);
        vault.openCrate(warId);
        assertEq(bob.balance, bobBal + 500 ether);

        // Charlie's yield: 1000 ether * 5000 ether / 10000 ether = 500 ether
        charlieBal = charlie.balance;
        vm.prank(charlie);
        vault.openCrate(warId);
        assertEq(charlie.balance, charlieBal + 500 ether);

        // --- 6. Verify final state ---
        TarikVault.UserDeposit memory aliceDep = vault.getUserDeposit(warId, alice);
        assertTrue(aliceDep.claimed);
        assertFalse(aliceDep.yieldClaimed); // Loser never claims yield

        TarikVault.UserDeposit memory bobDep = vault.getUserDeposit(warId, bob);
        assertTrue(bobDep.claimed);
        assertTrue(bobDep.yieldClaimed);
    }

    // =========================================================================
    // VictoryCrate Direct Tests
    // =========================================================================

    function test_VictoryCrate_URI() public view {
        string memory tokenUri = crate.uri(42);
        assertEq(tokenUri, "https://tarik.gg/api/metadata/crate/42.json");
    }

    function test_VictoryCrate_OnlyMinterCanMint() public {
        vm.prank(alice);
        vm.expectRevert(VictoryCrate.OnlyMinter.selector);
        crate.mintCrate(alice, 0, 100 ether);
    }

    function test_VictoryCrate_SetMinter() public {
        vm.prank(owner);
        crate.setMinter(alice);
        assertEq(crate.minter(), alice);
    }
}
