// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

interface IWorldID {
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view;
}

/**
 * @title PrivateLiquidationAuction
 * @notice Confidential liquidation auction contract deployed on Oasis Sapphire
 * @dev Bids are encrypted and only decrypted in TEE during finalization
 */
contract PrivateLiquidationAuction is 
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable 
{
    bytes32 public constant AUCTION_MANAGER_ROLE = keccak256("AUCTION_MANAGER_ROLE");
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    enum AuctionStatus {
        Active,
        Finalized,
        Settled,
        Cancelled
    }

    struct EncryptedBid {
        address bidder;
        bytes encryptedAmount;
        uint256 timestamp;
        bytes32 commitment;
    }

    struct Auction {
        uint256 auctionId;
        address collateralAsset;
        uint256 collateralAmount;
        uint256 minimumBid;
        uint256 startTime;
        uint256 endTime;
        AuctionStatus status;
        address winner;
        uint256 winningAmount;
        uint256 bidCount;
    }

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => EncryptedBid[]) private auctionBids;
    uint256 public auctionCount;

    IWorldID public worldId;
    uint256 public externalNullifierHash;
    mapping(uint256 => bool) public usedBidderNullifiers;

    event AuctionCreated(
        uint256 indexed auctionId,
        address collateralAsset,
        uint256 collateralAmount,
        uint256 minimumBid,
        uint256 endTime
    );
    event BidSubmitted(
        uint256 indexed auctionId,
        address indexed bidder,
        bytes32 commitment,
        uint256 timestamp
    );
    event AuctionFinalized(
        uint256 indexed auctionId,
        address winner,
        uint256 winningAmount
    );
    event AuctionSettled(uint256 indexed auctionId);
    event AuctionCancelled(uint256 indexed auctionId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _worldId,
        uint256 _externalNullifierHash
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AUCTION_MANAGER_ROLE, msg.sender);

        worldId = IWorldID(_worldId);
        externalNullifierHash = _externalNullifierHash;
    }

    /**
     * @notice Create a new liquidation auction
     * @param collateralAsset Address of the collateral token
     * @param collateralAmount Amount of collateral to auction
     * @param minimumBid Minimum acceptable bid
     * @param duration Auction duration in seconds
     */
    function createAuction(
        address collateralAsset,
        uint256 collateralAmount,
        uint256 minimumBid,
        uint256 duration
    ) external onlyRole(AUCTION_MANAGER_ROLE) returns (uint256) {
        require(collateralAmount > 0, "Invalid collateral amount");
        require(duration >= 300, "Duration too short"); // Min 5 minutes
        require(duration <= 86400, "Duration too long"); // Max 24 hours

        uint256 auctionId = auctionCount++;
        
        auctions[auctionId] = Auction({
            auctionId: auctionId,
            collateralAsset: collateralAsset,
            collateralAmount: collateralAmount,
            minimumBid: minimumBid,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            status: AuctionStatus.Active,
            winner: address(0),
            winningAmount: 0,
            bidCount: 0
        });

        emit AuctionCreated(
            auctionId,
            collateralAsset,
            collateralAmount,
            minimumBid,
            block.timestamp + duration
        );

        return auctionId;
    }

    /**
     * @notice Submit an encrypted bid with World ID verification
     * @param auctionId The auction to bid on
     * @param encryptedBidAmount Encrypted bid amount
     * @param commitment Commitment hash for bid verification
     * @param merkleRoot World ID merkle root
     * @param nullifierHash World ID nullifier hash
     * @param proof World ID ZK proof
     */
    function submitBid(
        uint256 auctionId,
        bytes calldata encryptedBidAmount,
        bytes32 commitment,
        uint256 merkleRoot,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.Active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(encryptedBidAmount.length > 0, "Invalid encrypted bid");

        // Verify World ID proof
        worldId.verifyProof(
            merkleRoot,
            1,
            uint256(keccak256(abi.encodePacked(auctionId))) >> 8,
            nullifierHash,
            externalNullifierHash,
            proof
        );

        require(!usedBidderNullifiers[nullifierHash], "Already bid in this auction");
        usedBidderNullifiers[nullifierHash] = true;

        // Store encrypted bid
        auctionBids[auctionId].push(EncryptedBid({
            bidder: msg.sender,
            encryptedAmount: encryptedBidAmount,
            timestamp: block.timestamp,
            commitment: commitment
        }));

        auction.bidCount++;

        emit BidSubmitted(auctionId, msg.sender, commitment, block.timestamp);
    }

    /**
     * @notice Finalize auction by decrypting and comparing bids in TEE
     * @param auctionId The auction to finalize
     */
    function finalizeAuction(uint256 auctionId) external onlyRole(AUCTION_MANAGER_ROLE) {
        Auction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.Active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction still ongoing");
        require(auction.bidCount > 0, "No bids submitted");

        // Decrypt and compare bids in TEE
        uint256 highestBid = 0;
        address highestBidder = address(0);

        EncryptedBid[] storage bids = auctionBids[auctionId];
        for (uint i = 0; i < bids.length; i++) {
            // Decrypt bid amount in TEE
            uint256 bidAmount = abi.decode(
                Sapphire.decrypt(
                    bytes32(0), // Use default key
                    0, // nonce
                    bids[i].encryptedAmount,
                    ""
                ),
                (uint256)
            );

            if (bidAmount > highestBid) {
                highestBid = bidAmount;
                highestBidder = bids[i].bidder;
            }
        }

        require(highestBid >= auction.minimumBid, "No valid bids");

        auction.winner = highestBidder;
        auction.winningAmount = highestBid;
        auction.status = AuctionStatus.Finalized;

        emit AuctionFinalized(auctionId, highestBidder, highestBid);
    }

    /**
     * @notice Mark auction as settled after cross-chain settlement
     * @param auctionId The auction to mark as settled
     */
    function markSettled(uint256 auctionId) external onlyRole(BRIDGE_ROLE) {
        Auction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.Finalized, "Auction not finalized");

        auction.status = AuctionStatus.Settled;

        emit AuctionSettled(auctionId);
    }

    /**
     * @notice Cancel an auction (only if no bids)
     * @param auctionId The auction to cancel
     */
    function cancelAuction(uint256 auctionId) external onlyRole(AUCTION_MANAGER_ROLE) {
        Auction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.Active, "Auction not active");
        require(auction.bidCount == 0, "Cannot cancel auction with bids");

        auction.status = AuctionStatus.Cancelled;

        emit AuctionCancelled(auctionId);
    }

    /**
     * @notice Get auction details
     * @param auctionId The auction ID
     */
    function getAuction(uint256 auctionId) external view returns (Auction memory) {
        return auctions[auctionId];
    }

    /**
     * @notice Get number of bids for an auction
     * @param auctionId The auction ID
     */
    function getBidCount(uint256 auctionId) external view returns (uint256) {
        return auctionBids[auctionId].length;
    }

    /**
     * @notice Get bid commitment (public info only)
     * @param auctionId The auction ID
     * @param bidIndex The bid index
     */
    function getBidCommitment(uint256 auctionId, uint256 bidIndex) 
        external 
        view 
        returns (address bidder, bytes32 commitment, uint256 timestamp) 
    {
        require(bidIndex < auctionBids[auctionId].length, "Invalid bid index");
        EncryptedBid storage bid = auctionBids[auctionId][bidIndex];
        return (bid.bidder, bid.commitment, bid.timestamp);
    }
}
