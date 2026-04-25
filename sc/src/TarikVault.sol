// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Interface for the VictoryCrate NFT contract
interface IVictoryCrate {
    function mintCrate(address winner, uint256 roundId, uint256 yieldAmount) external;
    function markOpened(address owner, uint256 roundId) external;
}

/// @title TarikVault
/// @author TARIK Team
/// @notice Core contract for the TARIK "Lossless Yield Wars" platform.
///
/// How it works:
///   1. A "war" (round) is created by the owner with a duration.
///   2. Users deposit USDC to Side A or Side B during the deposit window.
///   3. Mock yield accrues over time (simulating Aave/Compound).
///   4. Owner resolves the war, picking the winning side.
///   5. Losers claim back 100% of their principal (0 yield).
///   6. Winners claim back 100% principal + receive a Victory Crate NFT
///      representing their share of ALL yield from both sides.
///   7. Winners can later "open" their crate to claim the yield USDC.
///
/// Safety:
///   - ReentrancyGuard on all external state-changing functions
///   - SafeERC20 for all token transfers
///   - Principal is NEVER at risk
contract TarikVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // =========================================================================
    // Types
    // =========================================================================

    enum WarStatus {
        /// @notice War is open for deposits
        Active,
        /// @notice War has been resolved — claims are open
        Resolved,
        /// @notice War was cancelled — everyone gets refund
        Cancelled
    }

    struct UserDeposit {
        uint256 amount;       // Principal deposited
        uint8 side;           // 1 = Side A, 2 = Side B
        bool claimed;         // Whether principal has been claimed
        bool yieldClaimed;    // Whether yield (crate) has been opened/claimed
    }

    struct War {
        string nameA;              // Name of Side A (e.g., "DEGEN", "Bull", "Mangrove")
        string nameB;              // Name of Side B (e.g., "HIGHER", "Bear", "Pantai")
        uint256 startTime;         // When deposits open
        uint256 endTime;           // When deposits close
        uint256 tvlA;              // Total Value Locked in Side A
        uint256 tvlB;              // Total Value Locked in Side B
        uint256 totalDeposits;     // tvlA + tvlB (cached for gas)
        uint256 mockYieldBps;      // Simulated yield in basis points (e.g., 500 = 5%)
        uint256 totalYield;        // Calculated total yield when resolved
        uint8 winningSide;         // 0 = not resolved, 1 = A wins, 2 = B wins
        WarStatus status;          // Current status
        uint256 participantCount;  // Total unique depositors
    }

    // =========================================================================
    // State
    // =========================================================================

    /// @notice The staking token (Mock USDC)
    IERC20 public immutable stakingToken;

    /// @notice The Victory Crate NFT contract
    IVictoryCrate public victoryCrate;

    /// @notice Current round/war ID (auto-incrementing)
    uint256 public currentWarId;

    /// @notice War data by ID
    mapping(uint256 warId => War) public wars;

    /// @notice User deposits per war
    mapping(uint256 warId => mapping(address user => UserDeposit)) public deposits;

    /// @notice Track all depositors per war for enumeration
    mapping(uint256 warId => address[]) internal _warParticipants;

    /// @notice Whether an address has deposited in a specific war (dedup for participant list)
    mapping(uint256 warId => mapping(address => bool)) internal _hasDeposited;

    // =========================================================================
    // Events
    // =========================================================================

    event WarCreated(
        uint256 indexed warId,
        string nameA,
        string nameB,
        uint256 startTime,
        uint256 endTime,
        uint256 mockYieldBps
    );

    event Deposited(
        uint256 indexed warId,
        address indexed user,
        uint8 side,
        uint256 amount
    );

    event WarResolved(
        uint256 indexed warId,
        uint8 winningSide,
        uint256 totalYield,
        uint256 winnerTVL,
        uint256 loserTVL
    );

    event WarCancelled(uint256 indexed warId);

    event PrincipalClaimed(
        uint256 indexed warId,
        address indexed user,
        uint256 amount
    );

    event YieldClaimed(
        uint256 indexed warId,
        address indexed user,
        uint256 yieldAmount
    );

    event VictoryCrateUpdated(address indexed oldCrate, address indexed newCrate);

    // =========================================================================
    // Errors
    // =========================================================================

    error InvalidSide();
    error WarNotActive();
    error WarNotResolved();
    error WarNotCancelledOrResolved();
    error DepositWindowClosed();
    error DepositWindowOpen();
    error ZeroAmount();
    error AlreadyClaimed();
    error AlreadyClaimedYield();
    error NoDeposit();
    error NotWinner();
    error InvalidTimeRange();
    error VictoryCrateNotSet();
    error WarAlreadyResolved();
    error InvalidYieldBps();

    // =========================================================================
    // Constructor
    // =========================================================================

    /// @param _stakingToken Address of the ERC20 token used for deposits (Mock USDC)
    /// @param _owner Address of the contract owner
    constructor(
        address _stakingToken,
        address _owner
    ) Ownable(_owner) {
        stakingToken = IERC20(_stakingToken);
    }

    // =========================================================================
    // Admin Functions
    // =========================================================================

    /// @notice Set the Victory Crate NFT contract address
    function setVictoryCrate(address _victoryCrate) external onlyOwner {
        address old = address(victoryCrate);
        victoryCrate = IVictoryCrate(_victoryCrate);
        emit VictoryCrateUpdated(old, _victoryCrate);
    }

    /// @notice Create a new war/round
    /// @param nameA Display name for Side A
    /// @param nameB Display name for Side B
    /// @param startTime Unix timestamp when deposits open
    /// @param endTime Unix timestamp when deposits close
    /// @param mockYieldBps Simulated yield in basis points (e.g., 500 = 5%)
    /// @return warId The new war's ID
    function createWar(
        string calldata nameA,
        string calldata nameB,
        uint256 startTime,
        uint256 endTime,
        uint256 mockYieldBps
    ) external onlyOwner returns (uint256 warId) {
        if (startTime >= endTime) revert InvalidTimeRange();
        if (mockYieldBps == 0 || mockYieldBps > 10000) revert InvalidYieldBps();

        warId = currentWarId++;

        War storage war = wars[warId];
        war.nameA = nameA;
        war.nameB = nameB;
        war.startTime = startTime;
        war.endTime = endTime;
        war.mockYieldBps = mockYieldBps;
        war.status = WarStatus.Active;

        emit WarCreated(warId, nameA, nameB, startTime, endTime, mockYieldBps);
    }

    /// @notice Resolve a war, declaring a winning side
    /// @param warId ID of the war to resolve
    /// @param winningSide 1 for Side A wins, 2 for Side B wins
    function resolve(uint256 warId, uint8 winningSide) external onlyOwner {
        if (winningSide != 1 && winningSide != 2) revert InvalidSide();

        War storage war = wars[warId];
        if (war.status != WarStatus.Active) revert WarAlreadyResolved();
        if (block.timestamp < war.endTime) revert DepositWindowOpen();

        // Calculate mock yield: totalDeposits * mockYieldBps / 10000
        uint256 totalYield = (war.totalDeposits * war.mockYieldBps) / 10000;
        
        war.winningSide = winningSide;
        war.totalYield = totalYield;
        war.status = WarStatus.Resolved;

        emit WarResolved(
            warId,
            winningSide,
            totalYield,
            winningSide == 1 ? war.tvlA : war.tvlB,
            winningSide == 1 ? war.tvlB : war.tvlA
        );
    }

    /// @notice Cancel a war — allows everyone to reclaim their deposits
    /// @param warId ID of the war to cancel
    function cancelWar(uint256 warId) external onlyOwner {
        War storage war = wars[warId];
        if (war.status != WarStatus.Active) revert WarAlreadyResolved();

        war.status = WarStatus.Cancelled;
        emit WarCancelled(warId);
    }

    /// @notice Owner deposits yield USDC into the vault to cover mock yield payouts.
    ///         This simulates the yield that would come from DeFi protocols.
    /// @param amount Amount of USDC to deposit as yield reserve
    function fundYieldReserve(uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    // =========================================================================
    // User Functions
    // =========================================================================

    /// @notice Deposit USDC to a side in an active war
    /// @param warId ID of the war to deposit into
    /// @param side 1 for Side A, 2 for Side B
    /// @param amount Amount of USDC to deposit
    function deposit(uint256 warId, uint8 side, uint256 amount) external nonReentrant {
        if (side != 1 && side != 2) revert InvalidSide();
        if (amount == 0) revert ZeroAmount();

        War storage war = wars[warId];
        if (war.status != WarStatus.Active) revert WarNotActive();
        if (block.timestamp < war.startTime || block.timestamp >= war.endTime) {
            revert DepositWindowClosed();
        }

        UserDeposit storage userDep = deposits[warId][msg.sender];

        // If user already deposited, they must deposit to the same side
        if (userDep.amount > 0 && userDep.side != side) revert InvalidSide();

        // Transfer tokens from user
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update user deposit
        userDep.amount += amount;
        userDep.side = side;

        // Update war TVL
        if (side == 1) {
            war.tvlA += amount;
        } else {
            war.tvlB += amount;
        }
        war.totalDeposits += amount;

        // Track participant
        if (!_hasDeposited[warId][msg.sender]) {
            _hasDeposited[warId][msg.sender] = true;
            _warParticipants[warId].push(msg.sender);
            war.participantCount++;
        }

        emit Deposited(warId, msg.sender, side, amount);
    }

    /// @notice Claim principal after a war is resolved or cancelled.
    ///         Winners also receive a Victory Crate NFT.
    /// @param warId ID of the war to claim from
    function claim(uint256 warId) external nonReentrant {
        War storage war = wars[warId];
        if (war.status != WarStatus.Resolved && war.status != WarStatus.Cancelled) {
            revert WarNotCancelledOrResolved();
        }

        UserDeposit storage userDep = deposits[warId][msg.sender];
        if (userDep.amount == 0) revert NoDeposit();
        if (userDep.claimed) revert AlreadyClaimed();

        userDep.claimed = true;
        uint256 principal = userDep.amount;

        // Return principal to everyone regardless of outcome
        stakingToken.safeTransfer(msg.sender, principal);

        emit PrincipalClaimed(warId, msg.sender, principal);

        // If resolved (not cancelled) and user is on winning side → mint Victory Crate
        if (war.status == WarStatus.Resolved && userDep.side == war.winningSide) {
            if (address(victoryCrate) == address(0)) revert VictoryCrateNotSet();

            // Calculate this winner's share of total yield
            // userYield = totalYield * userDeposit / winnerSideTVL
            uint256 winnerTVL = war.winningSide == 1 ? war.tvlA : war.tvlB;
            uint256 userYield = (war.totalYield * principal) / winnerTVL;

            victoryCrate.mintCrate(msg.sender, warId, userYield);
        }
    }

    /// @notice Winners open their Victory Crate to claim yield USDC
    /// @param warId ID of the war whose crate to open
    function openCrate(uint256 warId) external nonReentrant {
        War storage war = wars[warId];
        if (war.status != WarStatus.Resolved) revert WarNotResolved();

        UserDeposit storage userDep = deposits[warId][msg.sender];
        if (userDep.amount == 0) revert NoDeposit();
        if (userDep.side != war.winningSide) revert NotWinner();
        if (userDep.yieldClaimed) revert AlreadyClaimedYield();

        userDep.yieldClaimed = true;

        // Calculate yield share
        uint256 winnerTVL = war.winningSide == 1 ? war.tvlA : war.tvlB;
        uint256 userYield = (war.totalYield * userDep.amount) / winnerTVL;

        // Mark crate as opened in NFT contract
        if (address(victoryCrate) != address(0)) {
            victoryCrate.markOpened(msg.sender, warId);
        }

        // Transfer yield USDC
        stakingToken.safeTransfer(msg.sender, userYield);

        emit YieldClaimed(warId, msg.sender, userYield);
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    /// @notice Get full war details
    function getWar(uint256 warId) external view returns (War memory) {
        return wars[warId];
    }

    /// @notice Get user deposit in a specific war
    function getUserDeposit(uint256 warId, address user) external view returns (UserDeposit memory) {
        return deposits[warId][user];
    }

    /// @notice Get current TVL percentages (basis points) for the tug-of-war visualization
    /// @return pctA Side A percentage (0-10000)
    /// @return pctB Side B percentage (0-10000)
    function getTugOfWarPosition(uint256 warId) external view returns (uint256 pctA, uint256 pctB) {
        War storage war = wars[warId];
        if (war.totalDeposits == 0) return (5000, 5000); // 50-50 if no deposits

        pctA = (war.tvlA * 10000) / war.totalDeposits;
        pctB = 10000 - pctA;
    }

    /// @notice Get the estimated yield share for a user if their side wins
    function getEstimatedYield(uint256 warId, address user) external view returns (uint256) {
        War storage war = wars[warId];
        UserDeposit storage userDep = deposits[warId][user];

        if (userDep.amount == 0) return 0;

        uint256 totalYield = (war.totalDeposits * war.mockYieldBps) / 10000;
        uint256 sideTVL = userDep.side == 1 ? war.tvlA : war.tvlB;

        if (sideTVL == 0) return 0;
        return (totalYield * userDep.amount) / sideTVL;
    }

    /// @notice Get all participant addresses for a war
    function getWarParticipants(uint256 warId) external view returns (address[] memory) {
        return _warParticipants[warId];
    }

    /// @notice Check if war is currently accepting deposits
    function isDepositOpen(uint256 warId) external view returns (bool) {
        War storage war = wars[warId];
        return war.status == WarStatus.Active
            && block.timestamp >= war.startTime
            && block.timestamp < war.endTime;
    }

    /// @notice Get time remaining in deposit window (0 if closed)
    function getTimeRemaining(uint256 warId) external view returns (uint256) {
        War storage war = wars[warId];
        if (block.timestamp >= war.endTime) return 0;
        return war.endTime - block.timestamp;
    }
}
