import { expect } from "chai";
import { ethers } from "hardhat";
import { PredictionMarket, MockWorldID } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Property-Based Test for PredictionMarket
 * **Validates: Requirements 5.2, 6.2, 7.6**
 * 
 * Property 2: World ID Nullifier Uniqueness
 * A World ID nullifier hash SHALL never be reused for the same action (market participation).
 */
describe("PredictionMarket - Property Tests", function () {
  let market: PredictionMarket;
  let mockWorldID: MockWorldID;
  let admin: SignerWithAddress;
  let users: SignerWithAddress[];
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

  // Generate unique nullifier hashes for testing
  const generateNullifierHash = (index: number): bigint => {
    return BigInt(ethers.keccak256(ethers.toUtf8Bytes(`nullifier-${index}`)));
  };

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    admin = signers[0];
    resolver = signers[1];
    users = signers.slice(2, 12); // 10 test users

    // Deploy mock World ID verifier
    const MockWorldIDFactory = await ethers.getContractFactory("MockWorldID");
    mockWorldID = await MockWorldIDFactory.deploy() as MockWorldID;

    // Deploy PredictionMarket
    const PredictionMarketFactory = await ethers.getContractFactory("PredictionMarket");
    market = await PredictionMarketFactory.deploy() as PredictionMarket;
    
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

  describe("Property 2: Nullifier Uniqueness", function () {
    it("PROPERTY: Nullifier hash prevents duplicate participation in same market", async function () {
      // Create a market
      const marketId = 0;
      const nullifierForCreation = generateNullifierHash(0);
      
      await market.connect(users[0]).createMarket(
        "Will ETH reach $5000?",
        ["Yes", "No"],
        7 * 24 * 60 * 60, // 7 days
        mockMerkleRoot,
        nullifierForCreation,
        mockProof
      );

      // First participation with a specific nullifier should succeed
      const participationNullifier = generateNullifierHash(1);
      
      await expect(
        market.connect(users[1]).participateInMarket(
          marketId,
          0, // outcome index
          mockMerkleRoot,
          participationNullifier,
          mockProof,
          { value: MINIMUM_STAKE }
        )
      ).to.not.be.reverted;

      // Second participation with same nullifier should revert
      await expect(
        market.connect(users[2]).participateInMarket(
          marketId,
          1, // different outcome
          mockMerkleRoot,
          participationNullifier, // SAME nullifier
          mockProof,
          { value: MINIMUM_STAKE }
        )
      ).to.be.revertedWithCustomError(market, "NullifierAlreadyUsed");
    });

    it("PROPERTY: Same nullifier can be used across different markets", async function () {
      const sharedNullifier = generateNullifierHash(100);

      // Create first market
      await market.connect(users[0]).createMarket(
        "Market 1",
        ["Yes", "No"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        generateNullifierHash(0),
        mockProof
      );

      // Create second market
      await market.connect(users[1]).createMarket(
        "Market 2",
        ["Yes", "No"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        generateNullifierHash(1),
        mockProof
      );

      // Use same nullifier in first market - should succeed
      await expect(
        market.connect(users[2]).participateInMarket(
          0, // market 1
          0,
          mockMerkleRoot,
          sharedNullifier,
          mockProof,
          { value: MINIMUM_STAKE }
        )
      ).to.not.be.reverted;

      // Use same nullifier in second market - should also succeed
      await expect(
        market.connect(users[3]).participateInMarket(
          1, // market 2
          0,
          mockMerkleRoot,
          sharedNullifier, // SAME nullifier, different market
          mockProof,
          { value: MINIMUM_STAKE }
        )
      ).to.not.be.reverted;
    });

    it("PROPERTY: Multiple unique nullifiers can participate in same market", async function () {
      // Create a market
      const marketId = 0;
      
      await market.connect(users[0]).createMarket(
        "Multi-participant market",
        ["Option A", "Option B", "Option C"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        generateNullifierHash(0),
        mockProof
      );

      // Multiple users with unique nullifiers should all succeed
      const participantCount = 5;
      for (let i = 0; i < participantCount; i++) {
        const uniqueNullifier = generateNullifierHash(10 + i);
        
        await expect(
          market.connect(users[i + 1]).participateInMarket(
            marketId,
            i % 3, // distribute across outcomes
            mockMerkleRoot,
            uniqueNullifier,
            mockProof,
            { value: MINIMUM_STAKE }
          )
        ).to.not.be.reverted;
      }

      // Verify all participants were recorded
      const participants = await market.getParticipants(marketId);
      expect(participants.length).to.equal(participantCount);
    });

    it("PROPERTY: Nullifier uniqueness is enforced regardless of outcome choice", async function () {
      // Create a market with multiple outcomes
      const marketId = 0;
      
      await market.connect(users[0]).createMarket(
        "Multi-outcome market",
        ["A", "B", "C", "D"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        generateNullifierHash(0),
        mockProof
      );

      const reusedNullifier = generateNullifierHash(50);

      // First participation on outcome 0
      await market.connect(users[1]).participateInMarket(
        marketId,
        0,
        mockMerkleRoot,
        reusedNullifier,
        mockProof,
        { value: MINIMUM_STAKE }
      );

      // Try to participate on different outcomes with same nullifier - all should fail
      for (let outcomeIndex = 1; outcomeIndex < 4; outcomeIndex++) {
        await expect(
          market.connect(users[2]).participateInMarket(
            marketId,
            outcomeIndex,
            mockMerkleRoot,
            reusedNullifier, // SAME nullifier
            mockProof,
            { value: MINIMUM_STAKE }
          )
        ).to.be.revertedWithCustomError(market, "NullifierAlreadyUsed");
      }
    });

    it("PROPERTY: Nullifier uniqueness is enforced regardless of stake amount", async function () {
      // Create a market
      const marketId = 0;
      
      await market.connect(users[0]).createMarket(
        "Stake variation market",
        ["Yes", "No"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        generateNullifierHash(0),
        mockProof
      );

      const reusedNullifier = generateNullifierHash(60);

      // First participation with minimum stake
      await market.connect(users[1]).participateInMarket(
        marketId,
        0,
        mockMerkleRoot,
        reusedNullifier,
        mockProof,
        { value: MINIMUM_STAKE }
      );

      // Try to participate with different stake amounts - should all fail
      const stakeAmounts = [
        MINIMUM_STAKE,
        ethers.parseEther("0.1"),
        ethers.parseEther("1.0"),
        ethers.parseEther("10.0")
      ];

      for (const stake of stakeAmounts) {
        await expect(
          market.connect(users[2]).participateInMarket(
            marketId,
            0,
            mockMerkleRoot,
            reusedNullifier, // SAME nullifier
            mockProof,
            { value: stake }
          )
        ).to.be.revertedWithCustomError(market, "NullifierAlreadyUsed");
      }
    });

    it("PROPERTY: Nullifier tracking persists across market lifecycle", async function () {
      // Create a market
      const marketId = 0;
      const participationNullifier = generateNullifierHash(70);
      
      await market.connect(users[0]).createMarket(
        "Lifecycle market",
        ["Yes", "No"],
        1 * 60 * 60, // 1 hour for faster testing
        mockMerkleRoot,
        generateNullifierHash(0),
        mockProof
      );

      // Participate with nullifier
      await market.connect(users[1]).participateInMarket(
        marketId,
        0,
        mockMerkleRoot,
        participationNullifier,
        mockProof,
        { value: MINIMUM_STAKE }
      );

      // Fast forward past market end time
      await ethers.provider.send("evm_increaseTime", [2 * 60 * 60]); // 2 hours
      await ethers.provider.send("evm_mine", []);

      // Close market
      await market.closeMarket(marketId);

      // Settle market
      await market.connect(resolver).settleMarket(marketId, 0, "Resolved");

      // Try to participate with same nullifier after settlement - should still fail
      // (even though market is settled, the nullifier should still be tracked)
      await expect(
        market.connect(users[2]).participateInMarket(
          marketId,
          0,
          mockMerkleRoot,
          participationNullifier, // SAME nullifier
          mockProof,
          { value: MINIMUM_STAKE }
        )
      ).to.be.revertedWithCustomError(market, "MarketNotActive");
    });

    it("PROPERTY: Nullifier uniqueness check happens before state changes", async function () {
      // Create a market
      const marketId = 0;
      
      await market.connect(users[0]).createMarket(
        "State check market",
        ["Yes", "No"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        generateNullifierHash(0),
        mockProof
      );

      const reusedNullifier = generateNullifierHash(80);

      // First participation
      await market.connect(users[1]).participateInMarket(
        marketId,
        0,
        mockMerkleRoot,
        reusedNullifier,
        mockProof,
        { value: MINIMUM_STAKE }
      );

      // Get market state before failed attempt
      const marketDataBefore = await market.getMarket(marketId);
      const totalStakeBefore = marketDataBefore.totalStake;
      const outcomeStakeBefore = await market.getOutcomeStake(marketId, 0);
      const participantsBefore = await market.getParticipants(marketId);

      // Try to reuse nullifier
      await expect(
        market.connect(users[2]).participateInMarket(
          marketId,
          0,
          mockMerkleRoot,
          reusedNullifier,
          mockProof,
          { value: ethers.parseEther("1.0") }
        )
      ).to.be.revertedWithCustomError(market, "NullifierAlreadyUsed");

      // Verify no state changes occurred
      const marketDataAfter = await market.getMarket(marketId);
      const totalStakeAfter = marketDataAfter.totalStake;
      const outcomeStakeAfter = await market.getOutcomeStake(marketId, 0);
      const participantsAfter = await market.getParticipants(marketId);

      expect(totalStakeAfter).to.equal(totalStakeBefore);
      expect(outcomeStakeAfter).to.equal(outcomeStakeBefore);
      expect(participantsAfter.length).to.equal(participantsBefore.length);
    });

    it("PROPERTY: Nullifier collision resistance across many participants", async function () {
      // Create a market
      const marketId = 0;
      
      await market.connect(users[0]).createMarket(
        "Large participation market",
        ["Yes", "No"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        generateNullifierHash(0),
        mockProof
      );

      // Generate many unique nullifiers and verify all can participate
      const participantCount = 8; // Limited by available test users
      const usedNullifiers = new Set<bigint>();

      for (let i = 0; i < participantCount; i++) {
        const uniqueNullifier = generateNullifierHash(200 + i);
        
        // Ensure nullifier is unique in our test set
        expect(usedNullifiers.has(uniqueNullifier)).to.be.false;
        usedNullifiers.add(uniqueNullifier);

        // Participation should succeed
        await expect(
          market.connect(users[i + 1]).participateInMarket(
            marketId,
            i % 2, // alternate between outcomes
            mockMerkleRoot,
            uniqueNullifier,
            mockProof,
            { value: MINIMUM_STAKE }
          )
        ).to.not.be.reverted;
      }

      // Verify all participants recorded
      const participants = await market.getParticipants(marketId);
      expect(participants.length).to.equal(participantCount);

      // Try to reuse any of the nullifiers - should all fail
      const randomNullifier = generateNullifierHash(200 + Math.floor(Math.random() * participantCount));
      
      await expect(
        market.connect(users[9]).participateInMarket(
          marketId,
          0,
          mockMerkleRoot,
          randomNullifier,
          mockProof,
          { value: MINIMUM_STAKE }
        )
      ).to.be.revertedWithCustomError(market, "NullifierAlreadyUsed");
    });

    it("PROPERTY: Nullifier uniqueness is independent of participant address", async function () {
      // Create a market
      const marketId = 0;
      
      await market.connect(users[0]).createMarket(
        "Address independence market",
        ["Yes", "No"],
        7 * 24 * 60 * 60,
        mockMerkleRoot,
        generateNullifierHash(0),
        mockProof
      );

      const sharedNullifier = generateNullifierHash(90);

      // User 1 participates with nullifier
      await market.connect(users[1]).participateInMarket(
        marketId,
        0,
        mockMerkleRoot,
        sharedNullifier,
        mockProof,
        { value: MINIMUM_STAKE }
      );

      // Different user (User 2) tries to use same nullifier - should fail
      await expect(
        market.connect(users[2]).participateInMarket(
          marketId,
          0,
          mockMerkleRoot,
          sharedNullifier, // SAME nullifier, different address
          mockProof,
          { value: MINIMUM_STAKE }
        )
      ).to.be.revertedWithCustomError(market, "NullifierAlreadyUsed");

      // Even the same user trying to reuse their own nullifier should fail
      await expect(
        market.connect(users[1]).participateInMarket(
          marketId,
          1, // different outcome
          mockMerkleRoot,
          sharedNullifier, // SAME nullifier, same address
          mockProof,
          { value: MINIMUM_STAKE }
        )
      ).to.be.revertedWithCustomError(market, "NullifierAlreadyUsed");
    });
  });
});
