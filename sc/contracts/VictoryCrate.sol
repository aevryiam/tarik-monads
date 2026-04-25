// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title VictoryCrate
/// @notice ERC1155 NFT representing Victory Crates from TARIK yield wars.
///         Each round/war generates a unique token ID. Only the TarikVault
///         contract (minter role) can mint crates to winners.
///
/// Token ID scheme:
///   - Each resolved war round gets a unique token ID
///   - Token ID = roundId (managed by TarikVault)
///
/// Rarity tiers are determined off-chain when the crate is "opened" on the frontend:
///   - Common (90%): Normal yield USDC
///   - Rare (9%): Yield + bonus token
///   - SSR (1%): Jackpot NFT / multiplier
contract VictoryCrate is ERC1155, ERC1155Supply, Ownable {
    using Strings for uint256;

    string public name = "TARIK Victory Crate";
    string public symbol = "CRATE";

    /// @notice Address of TarikVault contract allowed to mint
    address public minter;

    /// @notice Base URI for token metadata
    string private _baseURI;

    /// @notice Yield amount in USDC (6 decimals) claimable per crate per round  
    mapping(uint256 roundId => uint256 yieldAmount) public crateYield;

    /// @notice Whether a specific crate has been opened (yield claimed)
    mapping(uint256 roundId => mapping(address owner => bool)) public crateOpened;

    error OnlyMinter();
    error CrateAlreadyOpened();
    error NoCrateOwned();

    event MinterUpdated(address indexed oldMinter, address indexed newMinter);
    event CrateOpened(address indexed opener, uint256 indexed roundId, uint256 yieldAmount);
    event CrateMinted(address indexed winner, uint256 indexed roundId, uint256 yieldAmount);

    modifier onlyMinter() {
        if (msg.sender != minter) revert OnlyMinter();
        _;
    }

    constructor(
        address initialOwner,
        string memory baseURI
    ) ERC1155(baseURI) Ownable(initialOwner) {
        _baseURI = baseURI;
    }

    /// @notice Set the minter address (TarikVault contract)
    function setMinter(address _minter) external onlyOwner {
        address oldMinter = minter;
        minter = _minter;
        emit MinterUpdated(oldMinter, _minter);
    }

    /// @notice Called by TarikVault when a winner claims — mints a Victory Crate NFT
    /// @param winner Address of the winning user
    /// @param roundId The round/war ID
    /// @param yieldAmount The yield USDC amount this crate is worth
    function mintCrate(
        address winner,
        uint256 roundId,
        uint256 yieldAmount
    ) external onlyMinter {
        crateYield[roundId] = yieldAmount;
        _mint(winner, roundId, 1, "");
        emit CrateMinted(winner, roundId, yieldAmount);
    }

    /// @notice Mark crate as opened (called by TarikVault during yield distribution)
    /// @dev Yield USDC transfer happens in TarikVault, this just tracks the "open" state
    function markOpened(address owner, uint256 roundId) external onlyMinter {
        if (balanceOf(owner, roundId) == 0) revert NoCrateOwned();
        if (crateOpened[roundId][owner]) revert CrateAlreadyOpened();
        
        crateOpened[roundId][owner] = true;
        emit CrateOpened(owner, roundId, crateYield[roundId]);
    }

    /// @notice Update base URI for metadata
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseURI = newBaseURI;
        _setURI(newBaseURI);
    }

    /// @notice Returns URI for a specific token ID
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_baseURI, tokenId.toString(), ".json"));
    }

    // =========================================================================
    // Required overrides for ERC1155 + ERC1155Supply
    // =========================================================================

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }
}
