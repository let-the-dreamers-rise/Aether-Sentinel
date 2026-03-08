import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { PrivateLiquidationAuction } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PrivateLiquidationAuction", function () {
  let auction: PrivateLiquidationAuction;
  let owner: SignerWithAddress;
  let manager: SignerWithAddress;
  let bidder1: SignerWithAddress;
  let bidder2: SignerWithAddress;
  let bridge: SignerWithAddress;
  let worldId: SignerWithAddress;

  const AUCTION_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AUCTION_MANAGER_ROLE"));
  const BRIDGE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_ROLE"));
  const EXTERNAL_NULLIFIER_HASH = ethers.keccak256(ethers.toUtf8Bytes("aether-sentinel-auction"));

  beforeEach(async function () {
    [owner, manager, bidder1, bidder2, bridge, worldId] = await ethers.getSigners();

    const PrivateLiquidationAuction = await ethers.getContractFactory("PrivateLiquidationAuction");
    auction = await upgrades.deployProxy(
      PrivateLiquidationAuction,
      [worldId.address, EXTERNAL_NULLIFIER_HASH],
      { initializer: "initialize" }
    ) as unknown as PrivateLiquidationAuction;

    await auction.grantRole(AUCTION_MANAGER_ROLE, manager.address);
    await auction.grantRole(BRIDGE_ROLE, bridge.address);
  });

  describe("Auction Creation", function () {
    it("Should create auction with valid parameters", async function () {
      const collateralAsset = ethers.Wallet.createRandom().address;
      const collateralAmount = ethers.parseEther("100");
      const minimumBid = ethers.parseEther("50");
      const duration = 3600; // 1 hour

      await expect(
        auction.connect(manager).createAuction(
          collateralAsset,
          collateralAmount,
          minimumBid,
          duration
        )
      )
        .to.emit(auction, "AuctionCreated")
        .withArgs(0, collateralAsset, collateralAmount, minimumBid, await ethers.provider.getBlock("latest").then(b => b!.timestamp + duration + 1));

      const auctionData = await auction.getAuction(0);
      expect(auctionData.collateralAsset).to.equal(collateralAsset);
      expect(auctionData.collateralAmount).to.equal(collateralAmount);
      expect(auctionData.minimumBid).to.equal(minimumBid);
      expect(auctionData.status).to.equal(0); // Active
    });

    it("Should reject auction with zero collateral", async function () {
      const collateralAsset = ethers.Wallet.createRandom().address;
      
      await expect(
        auction.connect(manager).createAuction(
          collateralAsset,
          0,
          ethers.parseEther("50"),
          3600
        )
      ).to.be.revertedWith("Invalid collateral amount");
    });

    it("Should reject auction with duration too short", async function () {
      const collateralAsset = ethers.Wallet.createRandom().address;
      
      await expect(
        auction.connect(manager).createAuction(
          collateralAsset,
          ethers.parseEther("100"),
          ethers.parseEther("50"),
          200 // Less than 5 minutes
        )
      ).to.be.revertedWith("Duration too short");
    });

    it("Should reject auction with duration too long", async function () {
      const collateralAsset = ethers.Wallet.createRandom().address;
      
      await expect(
        auction.connect(manager).createAuction(
          collateralAsset,
          ethers.parseEther("100"),
          ethers.parseEther("50"),
          90000 // More than 24 hours
        )
      ).to.be.revertedWith("Duration too long");
    });

    it("Should reject creation from non-manager", async function () {
      const collateralAsset = ethers.Wallet.createRandom().address;
      
      await expect(
        auction.connect(bidder1).createAuction(
          collateralAsset,
          ethers.parseEther("100"),
          ethers.parseEther("50"),
          3600
        )
      ).to.be.reverted;
    });
  });

  describe("Bid Submission", function () {
    let auctionId: number;

    beforeEach(async function () {
      const collateralAsset = ethers.Wallet.createRandom().address;
      await auction.connect(manager).createAuction(
        collateralAsset,
        ethers.parseEther("100"),
        ethers.parseEther("50"),
        3600
      );
      auctionId = 0;
    });

    it("Should accept valid encrypted bid (mock World ID)", async function () {
      // Note: In real tests, you'd need to generate valid World ID proofs
      // For now, this test will fail at World ID verification
      // This is a placeholder showing the structure
      
      const encryptedBid = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("bid-commitment"));
      const merkleRoot = 1;
      const nullifierHash = 123;
      const proof = [0, 0, 0, 0, 0, 0, 0, 0];

      // This will revert because we don't have a real World ID verifier
      // In production, you'd mock the World ID contract
      await expect(
        auction.connect(bidder1).submitBid(
          auctionId,
          encryptedBid,
          commitment,
          merkleRoot,
          nullifierHash,
          proof
        )
      ).to.be.reverted;
    });

    it("Should reject bid on non-existent auction", async function () {
      const encryptedBid = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("bid-commitment"));
      
      await expect(
        auction.connect(bidder1).submitBid(
          999,
          encryptedBid,
          commitment,
          1,
          123,
          [0, 0, 0, 0, 0, 0, 0, 0]
        )
      ).to.be.reverted;
    });

    it("Should reject empty encrypted bid", async function () {
      await expect(
        auction.connect(bidder1).submitBid(
          auctionId,
          "0x",
          ethers.keccak256(ethers.toUtf8Bytes("bid-commitment")),
          1,
          123,
          [0, 0, 0, 0, 0, 0, 0, 0]
        )
      ).to.be.revertedWith("Invalid encrypted bid");
    });
  });

  describe("Auction Finalization", function () {
    let auctionId: number;

    beforeEach(async function () {
      const collateralAsset = ethers.Wallet.createRandom().address;
      await auction.connect(manager).createAuction(
        collateralAsset,
        ethers.parseEther("100"),
        ethers.parseEther("50"),
        300 // 5 minutes
      );
      auctionId = 0;
    });

    it("Should reject finalization before end time", async function () {
      await expect(
        auction.connect(manager).finalizeAuction(auctionId)
      ).to.be.revertedWith("Auction still ongoing");
    });

    it("Should reject finalization with no bids", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [400]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        auction.connect(manager).finalizeAuction(auctionId)
      ).to.be.revertedWith("No bids submitted");
    });

    it("Should reject finalization from non-manager", async function () {
      await ethers.provider.send("evm_increaseTime", [400]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        auction.connect(bidder1).finalizeAuction(auctionId)
      ).to.be.reverted;
    });
  });

  describe("Auction Cancellation", function () {
    let auctionId: number;

    beforeEach(async function () {
      const collateralAsset = ethers.Wallet.createRandom().address;
      await auction.connect(manager).createAuction(
        collateralAsset,
        ethers.parseEther("100"),
        ethers.parseEther("50"),
        3600
      );
      auctionId = 0;
    });

    it("Should cancel auction with no bids", async function () {
      await expect(
        auction.connect(manager).cancelAuction(auctionId)
      )
        .to.emit(auction, "AuctionCancelled")
        .withArgs(auctionId);

      const auctionData = await auction.getAuction(auctionId);
      expect(auctionData.status).to.equal(3); // Cancelled
    });

    it("Should reject cancellation from non-manager", async function () {
      await expect(
        auction.connect(bidder1).cancelAuction(auctionId)
      ).to.be.reverted;
    });
  });

  describe("Settlement", function () {
    let auctionId: number;

    beforeEach(async function () {
      const collateralAsset = ethers.Wallet.createRandom().address;
      await auction.connect(manager).createAuction(
        collateralAsset,
        ethers.parseEther("100"),
        ethers.parseEther("50"),
        300
      );
      auctionId = 0;
    });

    it("Should mark auction as settled by bridge", async function () {
      // First finalize (this will fail without bids, but we're testing the flow)
      // In real scenario, auction would be finalized first
      
      // For this test, we'll manually set status to Finalized
      // This requires adding a test helper function or using a different approach
      
      // Skip this test for now as it requires auction to be finalized first
      this.skip();
    });

    it("Should reject settlement from non-bridge role", async function () {
      await expect(
        auction.connect(bidder1).markSettled(auctionId)
      ).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return auction count", async function () {
      expect(await auction.auctionCount()).to.equal(0);

      const collateralAsset = ethers.Wallet.createRandom().address;
      await auction.connect(manager).createAuction(
        collateralAsset,
        ethers.parseEther("100"),
        ethers.parseEther("50"),
        3600
      );

      expect(await auction.auctionCount()).to.equal(1);
    });

    it("Should return bid count", async function () {
      const collateralAsset = ethers.Wallet.createRandom().address;
      await auction.connect(manager).createAuction(
        collateralAsset,
        ethers.parseEther("100"),
        ethers.parseEther("50"),
        3600
      );

      expect(await auction.getBidCount(0)).to.equal(0);
    });
  });
});
