// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {VictoryCrate} from "../src/VictoryCrate.sol";
import {TarikVault} from "../src/TarikVault.sol";

/// @title TarikVaultTest
/// @notice Comprehensive test suite for the TARIK smart contract system.
///         Covers the complete lifecycle: deploy → create war → deposit → resolve → claim → open crate
contract TarikVaultTest is Test {
    // =========================================================================
    // State
    // =========================================================================

    MockUSDC public usdc;
    VictoryCrate public crate;
    TarikVault public vault;

    address public owner = makeAddr("owner");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    uint256 constant INITIAL_BALANCE = 100_000e6; // 100k USDC
    uint256 constant YIELD_RESERVE = 500_000e6;   // 500k USDC for yield

    // =========================================================================
    // Setup
    // =========================================================================

    function setUp() public {
        vm.startPrank(owner);

        // Deploy contracts
        usdc = new MockUSDC(owner);
        crate = new VictoryCrate(owner, "https://tarik.gg/api/metadata/crate/");
        vault = new TarikVault(address(usdc), owner);

        // Wire contracts
        crate.setMinter(address(vault));
        vault.setVictoryCrate(address(crate));

        // Fund vault with yield reserve
        usdc.mint(owner, YIELD_RESERVE);
        usdc.approve(address(vault), YIELD_RESERVE);
        vault.fundYieldReserve(YIELD_RESERVE);

        vm.stopPrank();

        // Give users USDC
        vm.prank(owner);
        usdc.mint(alice, INITIAL_BALANCE);
        vm.prank(owner);
        usdc.mint(bob, INITIAL_BALANCE);
        vm.prank(owner);
        usdc.mint(charlie, INITIAL_BALANCE);
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
        usdc.approve(address(vault), amount);
        vault.deposit(warId, side, amount);
        vm.stopPrank();
    }

    // =========================================================================
    // MockUSDC Tests
    // =========================================================================

    function test_MockUSDC_Decimals() public view {
        assertEq(usdc.decimals(), 6);
    }

    function test_MockUSDC_Faucet() public {
        address newUser = makeAddr("newUser");
        vm.prank(newUser);
        usdc.faucet();
        assertEq(usdc.balanceOf(newUser), 10_000e6);
    }

    function test_MockUSDC_FaucetCooldown() public {
        address newUser = makeAddr("newUser");
        vm.prank(newUser);
        usdc.faucet();

        vm.prank(newUser);
        vm.expectRevert();
        usdc.faucet();

        // After cooldown, can faucet again
        vm.warp(block.timestamp + 1 hours + 1);
        vm.prank(newUser);
        usdc.faucet();
        assertEq(usdc.balanceOf(newUser), 20_000e6);
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
        uint256 depositAmount = 1000e6;

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

        _deposit(bob, warId, 2, 2000e6);

        TarikVault.War memory war = vault.getWar(warId);
        assertEq(war.tvlA, 0);
        assertEq(war.tvlB, 2000e6);
    }

    function test_Deposit_MultipleToSameSide() public {
        uint256 warId = _createDefaultWar();

        _deposit(alice, warId, 1, 500e6);
        _deposit(alice, warId, 1, 300e6);

        TarikVault.UserDeposit memory dep = vault.getUserDeposit(warId, alice);
        assertEq(dep.amount, 800e6);
    }

    function test_Deposit_RevertWrongSide() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 500e6);

        // Try to deposit to opposite side
        vm.startPrank(alice);
        usdc.approve(address(vault), 500e6);
        vm.expectRevert(TarikVault.InvalidSide.selector);
        vault.deposit(warId, 2, 500e6);
        vm.stopPrank();
    }

    function test_Deposit_RevertInvalidSide() public {
        uint256 warId = _createDefaultWar();

        vm.startPrank(alice);
        usdc.approve(address(vault), 500e6);
        vm.expectRevert(TarikVault.InvalidSide.selector);
        vault.deposit(warId, 3, 500e6);
        vm.stopPrank();
    }

    function test_Deposit_RevertZeroAmount() public {
        uint256 warId = _createDefaultWar();

        vm.startPrank(alice);
        vm.expectRevert(TarikVault.ZeroAmount.selector);
        vault.deposit(warId, 1, 0);
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
        usdc.approve(address(vault), 500e6);
        vm.expectRevert(TarikVault.DepositWindowClosed.selector);
        vault.deposit(warId, 1, 500e6);
        vm.stopPrank();
    }

    function test_Deposit_RevertAfterEnd() public {
        uint256 warId = _createDefaultWar();
        vm.warp(block.timestamp + 2 hours); // Past end time

        vm.startPrank(alice);
        usdc.approve(address(vault), 500e6);
        vm.expectRevert(TarikVault.DepositWindowClosed.selector);
        vault.deposit(warId, 1, 500e6);
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
        _deposit(alice, warId, 1, 1000e6);
        _deposit(bob, warId, 2, 1000e6);

        (uint256 pctA, uint256 pctB) = vault.getTugOfWarPosition(warId);
        assertEq(pctA, 5000);
        assertEq(pctB, 5000);
    }

    function test_TugOfWar_UnequalDeposits() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 3000e6); // 75%
        _deposit(bob, warId, 2, 1000e6);   // 25%

        (uint256 pctA, uint256 pctB) = vault.getTugOfWarPosition(warId);
        assertEq(pctA, 7500);
        assertEq(pctB, 2500);
    }

    // =========================================================================
    // Resolve Tests
    // =========================================================================

    function test_Resolve_SideAWins() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 5000e6);
        _deposit(bob, warId, 2, 5000e6);

        // Fast forward past end
        vm.warp(block.timestamp + 2 hours);

        vm.prank(owner);
        vault.resolve(warId, 1);

        TarikVault.War memory war = vault.getWar(warId);
        assertEq(war.winningSide, 1);
        assertEq(uint8(war.status), uint8(TarikVault.WarStatus.Resolved));
        // Total yield = 10000e6 * 500 / 10000 = 500e6 (5%)
        assertEq(war.totalYield, 500e6);
    }

    function test_Resolve_RevertBeforeEnd() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 1000e6);

        vm.prank(owner);
        vm.expectRevert(TarikVault.DepositWindowOpen.selector);
        vault.resolve(warId, 1);
    }

    function test_Resolve_RevertDoubleResolve() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 1000e6);
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
        _deposit(alice, warId, 1, 1000e6);

        vm.prank(owner);
        vault.cancelWar(warId);

        TarikVault.War memory war = vault.getWar(warId);
        assertEq(uint8(war.status), uint8(TarikVault.WarStatus.Cancelled));
    }

    function test_CancelWar_ClaimRefund() public {
        uint256 warId = _createDefaultWar();
        uint256 depositAmount = 5000e6;
        _deposit(alice, warId, 1, depositAmount);

        uint256 balBefore = usdc.balanceOf(alice);

        vm.prank(owner);
        vault.cancelWar(warId);

        vm.prank(alice);
        vault.claim(warId);

        assertEq(usdc.balanceOf(alice), balBefore + depositAmount);
    }

    // =========================================================================
    // Claim Tests (Principal)
    // =========================================================================

    function test_Claim_WinnerGetsPrincipalAndCrate() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 5000e6); // Alice → Side A
        _deposit(bob, warId, 2, 5000e6);   // Bob → Side B

        vm.warp(block.timestamp + 2 hours);

        // Side A wins
        vm.prank(owner);
        vault.resolve(warId, 1);

        uint256 aliceBalBefore = usdc.balanceOf(alice);

        // Alice (winner) claims
        vm.prank(alice);
        vault.claim(warId);

        // Principal returned
        assertEq(usdc.balanceOf(alice), aliceBalBefore + 5000e6);

        // Victory Crate NFT minted
        assertEq(crate.balanceOf(alice, warId), 1);

        // Crate yield should be recorded
        // totalYield = 10000e6 * 500 / 10000 = 500e6
        // Alice's share = 500e6 * 5000e6 / 5000e6 = 500e6 (she's the only winner)
        assertEq(crate.crateYield(warId), 500e6);
    }

    function test_Claim_LoserGetsPrincipalOnly() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 5000e6);
        _deposit(bob, warId, 2, 5000e6);

        vm.warp(block.timestamp + 2 hours);
        vm.prank(owner);
        vault.resolve(warId, 1); // Side A wins

        uint256 bobBalBefore = usdc.balanceOf(bob);

        // Bob (loser) claims
        vm.prank(bob);
        vault.claim(warId);

        // Principal returned, no NFT
        assertEq(usdc.balanceOf(bob), bobBalBefore + 5000e6);
        assertEq(crate.balanceOf(bob, warId), 0);
    }

    function test_Claim_RevertDoubleClaim() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 1000e6);

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
        _deposit(alice, warId, 1, 1000e6);

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
        _deposit(alice, warId, 1, 3000e6);
        _deposit(bob, warId, 1, 2000e6);
        _deposit(charlie, warId, 2, 5000e6);

        // Total deposits: 10,000 USDC
        // Total yield at 5%: 500 USDC
        // Side A wins → winners: Alice + Bob
        // Alice's yield share: 500 * 3000 / 5000 = 300 USDC
        // Bob's yield share: 500 * 2000 / 5000 = 200 USDC

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
        uint256 aliceBalBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        vault.openCrate(warId);
        assertEq(usdc.balanceOf(alice), aliceBalBefore + 300e6);

        uint256 bobBalBefore = usdc.balanceOf(bob);
        vm.prank(bob);
        vault.openCrate(warId);
        assertEq(usdc.balanceOf(bob), bobBalBefore + 200e6);

        // Crates marked as opened
        assertTrue(crate.crateOpened(warId, alice));
        assertTrue(crate.crateOpened(warId, bob));
    }

    function test_OpenCrate_RevertNotWinner() public {
        uint256 warId = _createDefaultWar();
        _deposit(alice, warId, 1, 5000e6);
        _deposit(bob, warId, 2, 5000e6);

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
        _deposit(alice, warId, 1, 5000e6);
        _deposit(bob, warId, 2, 5000e6);

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
        _deposit(alice, warId, 1, 6000e6);
        _deposit(bob, warId, 2, 4000e6);

        // totalYield = 10000e6 * 500 / 10000 = 500e6
        // Alice's estimated = 500e6 * 6000e6 / 6000e6 = 500e6 (only winner on her side)
        uint256 aliceYield = vault.getEstimatedYield(warId, alice);
        assertEq(aliceYield, 500e6);

        // Bob's estimated = 500e6 * 4000e6 / 4000e6 = 500e6 (only winner on his side)
        uint256 bobYield = vault.getEstimatedYield(warId, bob);
        assertEq(bobYield, 500e6);
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
        _deposit(alice, warId, 1, 1000e6);
        _deposit(bob, warId, 2, 1000e6);
        _deposit(alice, warId, 1, 500e6); // Alice deposits again — no duplicate

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
        _deposit(alice, warId, 1, 10_000e6);   // Alice: 10k on Side A
        _deposit(bob, warId, 2, 5_000e6);      // Bob: 5k on Side B
        _deposit(charlie, warId, 2, 5_000e6);  // Charlie: 5k on Side B

        // Check TVL
        TarikVault.War memory war = vault.getWar(warId);
        assertEq(war.tvlA, 10_000e6);
        assertEq(war.tvlB, 10_000e6);
        assertEq(war.totalDeposits, 20_000e6);

        // --- 3. Time passes, resolve ---
        vm.warp(block.timestamp + 2 hours);
        vm.prank(owner);
        vault.resolve(warId, 2); // Side B wins!

        war = vault.getWar(warId);
        // Total yield = 20000e6 * 500 / 10000 = 1000e6
        assertEq(war.totalYield, 1000e6);

        // --- 4. Claims ---
        // Alice (loser) gets principal back
        uint256 aliceBal = usdc.balanceOf(alice);
        vm.prank(alice);
        vault.claim(warId);
        assertEq(usdc.balanceOf(alice), aliceBal + 10_000e6);
        assertEq(crate.balanceOf(alice, warId), 0); // No crate for loser

        // Bob (winner) gets principal + crate
        uint256 bobBal = usdc.balanceOf(bob);
        vm.prank(bob);
        vault.claim(warId);
        assertEq(usdc.balanceOf(bob), bobBal + 5_000e6);
        assertEq(crate.balanceOf(bob, warId), 1);

        // Charlie (winner) gets principal + crate
        uint256 charlieBal = usdc.balanceOf(charlie);
        vm.prank(charlie);
        vault.claim(warId);
        assertEq(usdc.balanceOf(charlie), charlieBal + 5_000e6);
        assertEq(crate.balanceOf(charlie, warId), 1);

        // --- 5. Open Crates ---
        // Bob's yield: 1000e6 * 5000e6 / 10000e6 = 500e6
        bobBal = usdc.balanceOf(bob);
        vm.prank(bob);
        vault.openCrate(warId);
        assertEq(usdc.balanceOf(bob), bobBal + 500e6);

        // Charlie's yield: 1000e6 * 5000e6 / 10000e6 = 500e6
        charlieBal = usdc.balanceOf(charlie);
        vm.prank(charlie);
        vault.openCrate(warId);
        assertEq(usdc.balanceOf(charlie), charlieBal + 500e6);

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
        crate.mintCrate(alice, 0, 100e6);
    }

    function test_VictoryCrate_SetMinter() public {
        vm.prank(owner);
        crate.setMinter(alice);
        assertEq(crate.minter(), alice);
    }
}
