import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PredictionMarket", function () {
  let market: any;
  let mockWorldID: any;
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let resolver: SignerWithAddress;

  const EXTERNAL_NULLIFIER_HASH = ethers.keccak256(ethers.toUtf8Bytes("prediction-market"));
  const GROUP_ID = 1;
  const MINIMUM_STAKE = ethers.parseEther("0.01");
  const PLATFORM_FEE = 200; // 2%

  // Mock World ID proof data
  const mockProof: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [
    1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n
  ];
  const mockMerkleRoot = 12345n;
  const mockNullifierHash1 = 67890n;
  const mockNullifierHash2 = 11111n;
  const mockNullifierHash3 = 22222n;

  beforeEach(async function () {
    [admin, user1, user2, resolver] = await ethers.getSigners();

    // Deploy mock World ID verifier
    const MockWorldIDFactory = await ethers.getContractFactory("MockWorldID");
    mockWorldID = await MockWorldIDFactory.deploy();

    // Deploy PredictionMarket
    const PredictionMarketFactory = await ethers.getContractFactory("PredictionMarket");
    market = await PredictionMarketFactory.deploy();
    
    await market.initialize(
      await mockWorldID.getAddress(),
      EXTERNAL_NULLIFIER_HASH,
      GROUP_ID,
      MINIMUM_STAKE,
      PLATFORM_FEE
    );

    // Authorize resolver
    await market.connect(admin).authorizeResolver(resolver.address);
  });

  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      expect(await market.worldId()).to.equal(await mockWorldID.getAddress());
      expect(await market.externalNullifierHash()).to.equal(EXTERNAL_NULLIFIER_HASH);
      expect(await market.groupId()).to.equal(GROUP_ID);
      expect(await market.minimumStake()).to.equal(MINIMUM_STAKE);
      expect(await market.platformFee()).to.equal(PLATFORM_FEE);
    });

    it("Should grant admin role to deployer", async function () {
      const ADMIN_ROLE = await market.ADMIN_ROLE();
      expect(await market.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });
  });

  describe("Create Market", function () {
    it("Should allow verified user to create market", async function () {
      const question = "Will ETH reach $5000 by end of 2024?";
      const outcomes = ["Yes", "No"];
      const duration = 7 * 24 * 60 * 60; // 7 days

      await expect(
        market.connect(user1).createMarket(
          question,
          outcomes,
          duration,
          mockMerkleRoot,
          mockNullifierHash1,
          mockProof
        )
      )
        .to.emit(market, "MarketCreated")
        .withArgs(0, user1.address, question, outcomes, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1 + duration));

      const marketData = await market.getMarket(0);
      expect(marketData.creator).to.equal(user1.address);
      expect(marketData.question).to.equal(question);
      expect(marketData.outcomes).to.deep.equal(outcomes);
    });

    it("Should revert with invalid World ID proof", async function () {
      // Configure mock to reject proof
      await mockWorldID.setShouldRevert(true);

      await expect(
        market.connect(user1).createMarket(
          "Question?",
          ["Yes", "No"],
          7 * 24 * 60 * 60,
          mockMerkleRoot,
          mockNullifierHash1,
          mockProof
        )
      ).to.be.revertedWithCustomError(market, "InvalidWorldIDProof");

      // Reset mock
      await mockWorldID.setShouldRevert(false);
    });

    it("Should revert with too few outcomes", async function () {
      await expect(
        market.connect(user1).createMarket(
          "Question?",
          ["Only one"],
          7 * 24 * 60 * 60,
          mockMerkleRoot,
          mockNullifierHash1,
          mockProof
        )
      ).to.be.revertedWithCustomError(market, "InvalidOutcomeCount");
    });

    it("Should revert with too many outcomes", async function () {
      const tooManyOutcomes = Array(11).fill("Outcome");
      
      await expect(
        market.connect(user1).createMarket(
          "Question?",
          tooManyOutcomes,
          7 * 24 * 60 * 60,
          mockMerkleRoot,
          mockNullifierHash1,
          mockProof
        )
      ).to.be.revertedWithCustomError(market, "InvalidOutcomeCount");
    });

    it("Should revert with invalid duration (too short)", async function () {
      await expect(
        market.connect(user1).createMarket(
          "Question?",
          ["Yes", "No"],
          30 * 60, // 30 minutes
          mockMerkleRoot,
          mockNullifierHash1,
          mockProof
        )
      ).to.be.revertedWithCustomError(market, "InvalidDuration");
    });

    it("Should revert with invalid duration (too long)", async function () {
      await expect(
        market.connect(user1).createMarket(
          "Question?",
          ["Yes", "No"],
          31 * 24 * 60 * 60, // 31 days
          mockMerkleRoot,
          mockNullifierHash1,
          mockProof
        )
      ).to.be.revertedWithCustomError(market, "InvalidDuration");
    });
  });

  describe("Participate in Market", function () {
    let marketId: number;

    beforeEach(async function () {
      // Create a market first
      const question = "Will ETH reach $5000 by end of 2024?";
      const outcomes = ["Yes", "No"];
      const duration = 7 * 24 * 60 * 60;

      await market.connect(user1).createMarket(
        question,
        outcomes,
        duration,
        mockMerkleRoot,
        mockNullifierHash1,
        mockProof
      );

      marketId = 0;
    });

    it("Should allow verified user to participate in market", async function () {
      const stakeAmount = ethers.parseEther("0.1");
      const outcomeIndex = 0; // "Yes"

      await expect(
        market.connect(user2).participateInMarket(
          marketId,
          outcomeIndex,
          mockMerkleRoot,
          mockNullifierHash2,
          mockProof,
          { value: stakeAmount }
        )
      )
        .to.emit(market, "MarketParticipation")
        .withArgs(marketId, user2.address, outcomeIndex, stakeAmount);

      const participation = await market.getParticipation(marketId, user2.address);
      expect(participation.outcomeIndex).to.equal(outcomeIndex);
      expect(participation.stakeAmount).to.equal(stakeAmount);
      expect(participation.claimed).to.be.false;
    });

    it("Should update market state after participation", async function () {
      const stakeAmount = ethers.parseEther("0.1");
      const outcomeIndex = 0;

      await market.connect(user2).participateInMarket(
        marketId,
        outcomeIndex,
        mockMerkleRoot,
        mockNullifierHash2,
        mockProof,
        { value: stakeAmount }
      );

      const marketData = await market.getMarket(marketId);
      expect(marketData.totalStake).to.equal(stakeAmount);

      const outcomeStake = await market.getOutcomeStake(marketId, outcomeIndex);
      expect(outcomeStake).to.equal(stakeAmount);
    });

    it("Should prevent duplicate participation with same nullifier", async function () {
      const stakeAmount = ethers.parseEther("0.1");
      const outcomeIndex = 0;

      // First participation
      await market.connect(user2).participateInMarket(
        marketId,
        outcomeIndex,
        mockMerkleRoot,
        mockNullifierHash2,
        mockProof,
        { value: stakeAmount }
      );

      // Second participation with same nullifier should fail
      await expect(
        market.connect(user1).participateInMarket(
          marketId,
          outcomeIndex,
          mockMerkleRoot,
          mockNullifierHash2, // Same nullifier
          mockProof,
          { value: stakeAmount }
        )
      ).to.be.revertedWithCustomError(market, "NullifierAlreadyUsed");
    });

    it("Should allow same user to participate in different markets", async function () {
      // Create second market
      await market.connect(user1).createMarket(
        "Another question?",
        ["A", "B"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash3,
        mockProof
      );

      const stakeAmount = ethers.parseEther("0.1");

      // Participate in first market
      await market.connect(user2).participateInMarket(
        0,
        0,
        mockMerkleRoot,
        mockNullifierHash2,
        mockProof,
        { value: stakeAmount }
      );

      // Participate in second market with different nullifier
      await expect(
        market.connect(user2).participateInMarket(
          1,
          0,
          mockMerkleRoot,
          mockNullifierHash2, // Can reuse nullifier in different market
          mockProof,
          { value: stakeAmount }
        )
      ).to.not.be.reverted;
    });

    it("Should revert with invalid World ID proof", async function () {
      await mockWorldID.setShouldRevert(true);

      await expect(
        market.connect(user2).participateInMarket(
          marketId,
          0,
          mockMerkleRoot,
          mockNullifierHash2,
          mockProof,
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWithCustomError(market, "InvalidWorldIDProof");

      await mockWorldID.setShouldRevert(false);
    });

    it("Should revert with insufficient stake", async function () {
      await expect(
        market.connect(user2).participateInMarket(
          marketId,
          0,
          mockMerkleRoot,
          mockNullifierHash2,
          mockProof,
          { value: ethers.parseEther("0.001") } // Below minimum
        )
      ).to.be.revertedWithCustomError(market, "InsufficientStake");
    });

    it("Should revert with invalid outcome index", async function () {
      await expect(
        market.connect(user2).participateInMarket(
          marketId,
          5, // Invalid index
          mockMerkleRoot,
          mockNullifierHash2,
          mockProof,
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWithCustomError(market, "InvalidOutcomeIndex");
    });

    it("Should revert for non-existent market", async function () {
      await expect(
        market.connect(user2).participateInMarket(
          999, // Non-existent
          0,
          mockMerkleRoot,
          mockNullifierHash2,
          mockProof,
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWithCustomError(market, "MarketNotFound");
    });

    it("Should revert after market ends", async function () {
      // Fast forward time past market end
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]); // 8 days
      await ethers.provider.send("evm_mine", []);

      await expect(
        market.connect(user2).participateInMarket(
          marketId,
          0,
          mockMerkleRoot,
          mockNullifierHash2,
          mockProof,
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWithCustomError(market, "MarketNotEnded");
    });
  });

  describe("Close Market", function () {
    let marketId: number;

    beforeEach(async function () {
      await market.connect(user1).createMarket(
        "Question?",
        ["Yes", "No"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash1,
        mockProof
      );
      marketId = 0;
    });

    it("Should allow closing market after end time", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(market.closeMarket(marketId))
        .to.emit(market, "MarketClosed")
        .withArgs(marketId, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      const marketData = await market.getMarket(marketId);
      expect(marketData.status).to.equal(2); // ResolutionPending
    });

    it("Should revert if market not ended", async function () {
      await expect(market.closeMarket(marketId))
        .to.be.revertedWithCustomError(market, "MarketNotEnded");
    });
  });

  describe("Complete State Transition Flow", function () {
    it("Should transition through all states: Active → ResolutionPending → Settled", async function () {
      // Create market (Active state)
      await market.connect(user1).createMarket(
        "Will ETH reach $5000?",
        ["Yes", "No"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash1,
        mockProof
      );
      const marketId = 0;

      // Verify Active state
      let marketData = await market.getMarket(marketId);
      expect(marketData.status).to.equal(0); // Active

      // Add participation
      await market.connect(user2).participateInMarket(
        marketId,
        0,
        mockMerkleRoot,
        mockNullifierHash2,
        mockProof,
        { value: ethers.parseEther("1") }
      );

      // Fast forward past end time
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Transition to ResolutionPending
      await market.closeMarket(marketId);
      marketData = await market.getMarket(marketId);
      expect(marketData.status).to.equal(2); // ResolutionPending

      // Transition to Settled
      await market.connect(resolver).settleMarket(marketId, 0, "Oracle verified outcome");
      marketData = await market.getMarket(marketId);
      expect(marketData.status).to.equal(3); // Settled
    });

    it("Should prevent skipping states in the transition flow", async function () {
      // Create market
      await market.connect(user1).createMarket(
        "Question?",
        ["Yes", "No"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash1,
        mockProof
      );
      const marketId = 0;

      // Try to settle without closing first (should fail)
      await expect(
        market.connect(resolver).settleMarket(marketId, 0, "Data")
      ).to.be.revertedWithCustomError(market, "InvalidMarketStatus");
    });
  });

  describe("Settle Market", function () {
    let marketId: number;

    beforeEach(async function () {
      // Create market
      await market.connect(user1).createMarket(
        "Question?",
        ["Yes", "No"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash1,
        mockProof
      );
      marketId = 0;

      // Add participants
      await market.connect(user2).participateInMarket(
        marketId,
        0,
        mockMerkleRoot,
        mockNullifierHash2,
        mockProof,
        { value: ethers.parseEther("1") }
      );

      // Close market
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      await market.closeMarket(marketId);
    });

    it("Should allow resolver to settle market", async function () {
      const winningOutcome = 0;
      const resolutionData = "Verified from oracle";

      // Authorize resolver first
      await market.connect(admin).authorizeResolver(resolver.address);

      await expect(
        market.connect(resolver).settleMarket(marketId, winningOutcome, resolutionData)
      )
        .to.emit(market, "MarketSettled")
        .withArgs(marketId, winningOutcome, resolutionData, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      const marketData = await market.getMarket(marketId);
      expect(marketData.status).to.equal(3); // Settled
    });

    it("Should revert if not resolver role", async function () {
      await expect(
        market.connect(user1).settleMarket(marketId, 0, "Data")
      ).to.be.revertedWithCustomError(market, "NotResolver");
    });

    it("Should revert with invalid outcome", async function () {
      await market.connect(admin).authorizeResolver(resolver.address);
      
      await expect(
        market.connect(resolver).settleMarket(marketId, 5, "Data")
      ).to.be.revertedWithCustomError(market, "InvalidOutcomeIndex");
    });
  });

  describe("Claim Winnings", function () {
    let marketId: number;

    beforeEach(async function () {
      // Create and setup market
      await market.connect(user1).createMarket(
        "Question?",
        ["Yes", "No"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash1,
        mockProof
      );
      marketId = 0;

      // User2 bets on outcome 0
      await market.connect(user2).participateInMarket(
        marketId,
        0,
        mockMerkleRoot,
        mockNullifierHash2,
        mockProof,
        { value: ethers.parseEther("1") }
      );

      // Close and settle
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      await market.closeMarket(marketId);
      await market.connect(admin).authorizeResolver(resolver.address);
      await market.connect(resolver).settleMarket(marketId, 0, "Data");
    });

    it("Should allow winner to claim winnings", async function () {
      const balanceBefore = await ethers.provider.getBalance(user2.address);

      const tx = await market.connect(user2).claimWinnings(marketId);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user2.address);
      
      // Should receive stake minus platform fee minus gas
      const expectedPayout = ethers.parseEther("1") * BigInt(10000 - PLATFORM_FEE) / 10000n;
      expect(balanceAfter + gasUsed - balanceBefore).to.be.closeTo(expectedPayout, ethers.parseEther("0.001"));
    });

    it("Should mark winnings as claimed", async function () {
      await market.connect(user2).claimWinnings(marketId);

      const participation = await market.getParticipation(marketId, user2.address);
      expect(participation.claimed).to.be.true;
    });

    it("Should revert on double claim", async function () {
      await market.connect(user2).claimWinnings(marketId);

      await expect(
        market.connect(user2).claimWinnings(marketId)
      ).to.be.revertedWithCustomError(market, "AlreadyClaimed");
    });

    it("Should revert for non-winner", async function () {
      // User1 didn't participate or bet on wrong outcome
      await expect(
        market.connect(user1).claimWinnings(marketId)
      ).to.be.revertedWithCustomError(market, "NotParticipant");
    });
  });

  describe("Dispute Market", function () {
    let marketId: number;

    beforeEach(async function () {
      // Create and setup market
      await market.connect(user1).createMarket(
        "Question?",
        ["Yes", "No"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash1,
        mockProof
      );
      marketId = 0;

      // User2 participates
      await market.connect(user2).participateInMarket(
        marketId,
        0,
        mockMerkleRoot,
        mockNullifierHash2,
        mockProof,
        { value: ethers.parseEther("1") }
      );

      // Close and settle
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      await market.closeMarket(marketId);
      await market.connect(admin).authorizeResolver(resolver.address);
      await market.connect(resolver).settleMarket(marketId, 0, "Data");
    });

    it("Should allow participant to dispute settled market within 7 days", async function () {
      const reason = "The oracle data was incorrect";

      await expect(
        market.connect(user2).disputeMarket(marketId, reason)
      )
        .to.emit(market, "MarketDisputed")
        .withArgs(marketId, user2.address, reason);

      const marketData = await market.getMarket(marketId);
      expect(marketData.status).to.equal(4); // Disputed
    });

    it("Should revert if non-participant tries to dispute", async function () {
      await expect(
        market.connect(user1).disputeMarket(marketId, "Reason")
      ).to.be.revertedWithCustomError(market, "NotParticipant");
    });

    it("Should revert if market is not settled", async function () {
      // Create new market that's not settled
      await market.connect(user1).createMarket(
        "Another question?",
        ["A", "B"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash3,
        mockProof
      );

      await expect(
        market.connect(user1).disputeMarket(1, "Reason")
      ).to.be.revertedWithCustomError(market, "InvalidMarketStatus");
    });

    it("Should revert if dispute window (7 days) has passed", async function () {
      // Fast forward 8 days after settlement
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        market.connect(user2).disputeMarket(marketId, "Too late")
      ).to.be.revertedWithCustomError(market, "DisputePeriodExpired");
    });

    it("Should allow dispute on the last day of the 7-day window", async function () {
      // Fast forward to just before 7 days
      await ethers.provider.send("evm_increaseTime", [6 * 24 * 60 * 60 + 23 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        market.connect(user2).disputeMarket(marketId, "Last minute dispute")
      ).to.not.be.reverted;

      const marketData = await market.getMarket(marketId);
      expect(marketData.status).to.equal(4); // Disputed
    });

    it("Should prevent claiming winnings after dispute", async function () {
      // Dispute the market
      await market.connect(user2).disputeMarket(marketId, "Incorrect settlement");

      // Try to claim winnings - should fail because market is now Disputed
      await expect(
        market.connect(user2).claimWinnings(marketId)
      ).to.be.revertedWithCustomError(market, "MarketNotSettled");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update minimum stake", async function () {
      const newMinimum = ethers.parseEther("0.05");
      await market.connect(admin).updateMinimumStake(newMinimum);
      expect(await market.minimumStake()).to.equal(newMinimum);
    });

    it("Should allow admin to update platform fee", async function () {
      const newFee = 300; // 3%
      await market.connect(admin).updatePlatformFee(newFee);
      expect(await market.platformFee()).to.equal(newFee);
    });

    it("Should revert if platform fee too high", async function () {
      await expect(
        market.connect(admin).updatePlatformFee(1500) // 15%
      ).to.be.revertedWithCustomError(market, "InvalidPlatformFee");
    });

    it("Should allow admin to withdraw fees", async function () {
      // Setup: Create market, participate, settle, claim (generates fees)
      await market.connect(user1).createMarket(
        "Q?",
        ["A", "B"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash1,
        mockProof
      );

      await market.connect(user2).participateInMarket(
        0,
        0,
        mockMerkleRoot,
        mockNullifierHash2,
        mockProof,
        { value: ethers.parseEther("1") }
      );

      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      await market.closeMarket(0);
      await market.connect(admin).authorizeResolver(resolver.address);
      await market.connect(resolver).settleMarket(0, 0, "Data");
      await market.connect(user2).claimWinnings(0);

      const feesBefore = await market.accumulatedFees();
      expect(feesBefore).to.be.gt(0);

      const balanceBefore = await ethers.provider.getBalance(admin.address);
      const tx = await market.connect(admin).withdrawFees(admin.address, feesBefore);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(admin.address);

      expect(balanceAfter + gasUsed - balanceBefore).to.be.closeTo(feesBefore, ethers.parseEther("0.001"));
      expect(await market.accumulatedFees()).to.equal(0);
    });

    it("Should revert if non-admin tries to update minimum stake", async function () {
      await expect(
        market.connect(user1).updateMinimumStake(ethers.parseEther("0.05"))
      ).to.be.reverted;
    });

    it("Should revert if non-admin tries to update platform fee", async function () {
      await expect(
        market.connect(user1).updatePlatformFee(300)
      ).to.be.reverted;
    });

    it("Should revert if non-admin tries to withdraw fees", async function () {
      await expect(
        market.connect(user1).withdrawFees(user1.address, ethers.parseEther("0.1"))
      ).to.be.reverted;
    });

    it("Should revert if withdrawing more fees than accumulated", async function () {
      await expect(
        market.connect(admin).withdrawFees(admin.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(market, "InsufficientFees");
    });

    it("Should allow admin to authorize resolver", async function () {
      const newResolver = user1.address;
      await expect(
        market.connect(admin).authorizeResolver(newResolver)
      ).to.emit(market, "ResolverAuthorized").withArgs(newResolver);

      expect(await market.authorizedResolvers(newResolver)).to.be.true;
    });

    it("Should allow admin to revoke resolver", async function () {
      await market.connect(admin).authorizeResolver(user1.address);
      
      await expect(
        market.connect(admin).revokeResolver(user1.address)
      ).to.emit(market, "ResolverRevoked").withArgs(user1.address);

      expect(await market.authorizedResolvers(user1.address)).to.be.false;
    });
  });

  describe("View Functions", function () {
    let marketId: number;

    beforeEach(async function () {
      await market.connect(user1).createMarket(
        "Test Question?",
        ["Option A", "Option B", "Option C"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash1,
        mockProof
      );
      marketId = 0;

      await market.connect(user2).participateInMarket(
        marketId,
        1,
        mockMerkleRoot,
        mockNullifierHash2,
        mockProof,
        { value: ethers.parseEther("0.5") }
      );
    });

    it("Should return correct market details", async function () {
      const marketData = await market.getMarket(marketId);
      
      expect(marketData.creator).to.equal(user1.address);
      expect(marketData.question).to.equal("Test Question?");
      expect(marketData.outcomes).to.deep.equal(["Option A", "Option B", "Option C"]);
      expect(marketData.status).to.equal(0); // Active
      expect(marketData.totalStake).to.equal(ethers.parseEther("0.5"));
    });

    it("Should return correct participation details", async function () {
      const participation = await market.getParticipation(marketId, user2.address);
      
      expect(participation.outcomeIndex).to.equal(1);
      expect(participation.stakeAmount).to.equal(ethers.parseEther("0.5"));
      expect(participation.claimed).to.be.false;
    });

    it("Should return correct outcome stake", async function () {
      const outcomeStake = await market.getOutcomeStake(marketId, 1);
      expect(outcomeStake).to.equal(ethers.parseEther("0.5"));
    });

    it("Should return empty outcome stake for outcome with no bets", async function () {
      const outcomeStake = await market.getOutcomeStake(marketId, 0);
      expect(outcomeStake).to.equal(0);
    });

    it("Should return list of participants", async function () {
      const participants = await market.getParticipants(marketId);
      expect(participants).to.deep.equal([user2.address]);
    });

    it("Should return multiple participants", async function () {
      // Create another market and have both users participate
      await market.connect(user1).createMarket(
        "Another Question?",
        ["Yes", "No"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash3,
        mockProof
      );

      const newMarketId = 1;
      
      await market.connect(user2).participateInMarket(
        newMarketId,
        0,
        mockMerkleRoot,
        mockNullifierHash2,
        mockProof,
        { value: ethers.parseEther("0.1") }
      );

      await market.connect(resolver).participateInMarket(
        newMarketId,
        1,
        mockMerkleRoot,
        67891n,
        mockProof,
        { value: ethers.parseEther("0.2") }
      );

      const participants = await market.getParticipants(newMarketId);
      expect(participants.length).to.equal(2);
      expect(participants).to.include(user2.address);
      expect(participants).to.include(resolver.address);
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle market with maximum outcomes (10)", async function () {
      const maxOutcomes = Array(10).fill(0).map((_, i) => `Outcome ${i + 1}`);
      
      await expect(
        market.connect(user1).createMarket(
          "Max outcomes question?",
          maxOutcomes,
          7 * 24 * 60 * 60,
          mockMerkleRoot,
          mockNullifierHash1,
          mockProof
        )
      ).to.not.be.reverted;
    });

    it("Should handle market with minimum duration (1 hour)", async function () {
      await expect(
        market.connect(user1).createMarket(
          "Short duration?",
          ["Yes", "No"],
          60 * 60, // 1 hour
          mockMerkleRoot,
          mockNullifierHash1,
          mockProof
        )
      ).to.not.be.reverted;
    });

    it("Should handle market with maximum duration (30 days)", async function () {
      await expect(
        market.connect(user1).createMarket(
          "Long duration?",
          ["Yes", "No"],
          30 * 24 * 60 * 60, // 30 days
          mockMerkleRoot,
          mockNullifierHash1,
          mockProof
        )
      ).to.not.be.reverted;
    });

    it("Should handle multiple participants betting on same outcome", async function () {
      await market.connect(user1).createMarket(
        "Question?",
        ["A", "B"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash1,
        mockProof
      );

      const marketId = 0;

      await market.connect(user2).participateInMarket(
        marketId,
        0,
        mockMerkleRoot,
        mockNullifierHash2,
        mockProof,
        { value: ethers.parseEther("1") }
      );

      await market.connect(resolver).participateInMarket(
        marketId,
        0,
        mockMerkleRoot,
        67891n,
        mockProof,
        { value: ethers.parseEther("2") }
      );

      const outcomeStake = await market.getOutcomeStake(marketId, 0);
      expect(outcomeStake).to.equal(ethers.parseEther("3"));
    });

    it("Should handle payout calculation with multiple winners", async function () {
      await market.connect(user1).createMarket(
        "Question?",
        ["A", "B"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash1,
        mockProof
      );

      const marketId = 0;

      // Two winners betting on outcome 0
      await market.connect(user2).participateInMarket(
        marketId,
        0,
        mockMerkleRoot,
        mockNullifierHash2,
        mockProof,
        { value: ethers.parseEther("1") }
      );

      await market.connect(resolver).participateInMarket(
        marketId,
        0,
        mockMerkleRoot,
        67891n,
        mockProof,
        { value: ethers.parseEther("1") }
      );

      // One loser betting on outcome 1
      await market.connect(admin).participateInMarket(
        marketId,
        1,
        mockMerkleRoot,
        67892n,
        mockProof,
        { value: ethers.parseEther("1") }
      );

      // Close and settle
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      await market.closeMarket(marketId);
      await market.connect(admin).authorizeResolver(resolver.address);
      await market.connect(resolver).settleMarket(marketId, 0, "Data");

      // Both winners should be able to claim
      await expect(market.connect(user2).claimWinnings(marketId)).to.not.be.reverted;
      await expect(market.connect(resolver).claimWinnings(marketId)).to.not.be.reverted;
    });

    it("Should prevent participation after market is closed", async function () {
      await market.connect(user1).createMarket(
        "Question?",
        ["A", "B"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash1,
        mockProof
      );

      const marketId = 0;

      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      await market.closeMarket(marketId);

      await expect(
        market.connect(user2).participateInMarket(
          marketId,
          0,
          mockMerkleRoot,
          mockNullifierHash2,
          mockProof,
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWithCustomError(market, "MarketNotActive");
    });

    it("Should handle zero platform fee correctly", async function () {
      // Deploy new market with 0% fee
      const PredictionMarketFactory = await ethers.getContractFactory("PredictionMarket");
      const zeroFeeMarket = await PredictionMarketFactory.deploy();
      await zeroFeeMarket.initialize(
        await mockWorldID.getAddress(),
        EXTERNAL_NULLIFIER_HASH,
        GROUP_ID,
        MINIMUM_STAKE,
        0 // 0% fee
      );

      await zeroFeeMarket.connect(admin).authorizeResolver(resolver.address);

      await zeroFeeMarket.connect(user1).createMarket(
        "Question?",
        ["A", "B"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        mockNullifierHash1,
        mockProof
      );

      await zeroFeeMarket.connect(user2).participateInMarket(
        0,
        0,
        mockMerkleRoot,
        mockNullifierHash2,
        mockProof,
        { value: ethers.parseEther("1") }
      );

      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      await zeroFeeMarket.closeMarket(0);
      await zeroFeeMarket.connect(resolver).settleMarket(0, 0, "Data");

      const balanceBefore = await ethers.provider.getBalance(user2.address);
      const tx = await zeroFeeMarket.connect(user2).claimWinnings(0);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(user2.address);

      // Should receive full stake (no fee deduction)
      expect(balanceAfter + gasUsed - balanceBefore).to.be.closeTo(
        ethers.parseEther("1"),
        ethers.parseEther("0.001")
      );
    });
  });
});
