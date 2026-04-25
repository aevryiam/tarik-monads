// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockUSDC
/// @notice A mock ERC20 token simulating USDC for the TARIK platform.
///         Anyone can mint tokens via the faucet for testing purposes.
///         Decimals are set to 6 to match real USDC.
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;
    uint256 public constant FAUCET_AMOUNT = 10_000 * 10 ** DECIMALS; // 10,000 USDC per faucet call
    uint256 public constant FAUCET_COOLDOWN = 1 hours;

    mapping(address => uint256) public lastFaucetTime;

    error FaucetCooldown(uint256 remainingTime);

    event FaucetDrip(address indexed recipient, uint256 amount);

    constructor(address initialOwner) ERC20("Mock USDC", "mUSDC") Ownable(initialOwner) {
        // Mint initial supply to deployer for liquidity
        _mint(initialOwner, 1_000_000 * 10 ** DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /// @notice Anyone can call this to get test USDC tokens (once per cooldown period)
    function faucet() external {
        uint256 timeSinceLast = block.timestamp - lastFaucetTime[msg.sender];
        if (lastFaucetTime[msg.sender] != 0 && timeSinceLast < FAUCET_COOLDOWN) {
            revert FaucetCooldown(FAUCET_COOLDOWN - timeSinceLast);
        }

        lastFaucetTime[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);

        emit FaucetDrip(msg.sender, FAUCET_AMOUNT);
    }

    /// @notice Owner can mint arbitrary amounts (for seeding pools, etc.)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
