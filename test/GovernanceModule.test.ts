import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { GovernanceModule, MockWorldID } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("GovernanceModule", function () {
  let governance: GovernanceModule;
  let mockWorldID: MockWorldID;
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let guardian: SignerWithAddress;
  let targetContract: SignerWithAddress;

  const EXTERNAL_NULLIFIER_HASH = ethers.keccak256(ethers.toUtf8Bytes("governance"));
  const GROUP_ID = 1;
  const QUORUM_PERCENTAGE = 40; // 40%
  const VOTING_PERIOD = 7 * 24 * 60 * 60; // 7 days
  const EMERGENCY_VOTING_PERIOD = 24 * 60 * 60; // 24 hours

  const mockProof: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [
    1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n
  ];
  const mockMerkleRoot = 12345n;

  const generateNullifierHash = (index: number): bigint => {
    return BigInt(ethers.keccak256(ethers.toUtf8Bytes(`nullifier-${index}`)));
  };

  beforeEach(async function () {
    [admin, user1, user2, guardian, targetContract] = await ethers.getSigners();

    const MockWorldIDFactory = await ethers.getContractFactory("MockWorldID");
    mockWorldID = await MockWorldIDFactory.deploy() as MockWorldID;

    const GovernanceModuleFactory = await ethers.getContractFactory("GovernanceModule");
    governance = await upgrades.deployProxy(
      GovernanceModuleFactory,
      [
        await mockWorldID.getAddress(),
        EXTERNAL_NULLIFIER_HASH,
        GROUP_ID,
        QUORUM_PERCENTAGE,
        VOTING_PERIOD,
        EMERGENCY_VOTING_PERIOD,
        guardian.address
      ],
      { initializer: "initialize" }
    ) as unknown as GovernanceModule;

    const ORACLE_ROLE = await governance.ORACLE_ROLE();
    await governance.connect(admin).grantRole(ORACLE_ROLE, admin.address);
    
    await governance.connect(admin).whitelistTarget(targetContract.address);
    await governance.connect(admin).updateTotalVerifiedHumans(100);
  });

  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      expect(await governance.worldId()).to.equal(await mockWorldID.getAddress());
      expect(await governance.externalNullifierHash()).to.equal(EXTERNAL_NULLIFIER_HASH);
      expect(await governance.groupId()).to.equal(GROUP_ID);
      expect(await governance.quorumPercentage()).to.equal(QUORUM_PERCENTAGE);
      expect(await governance.votingPeriod()).to.equal(VOTING_PERIOD);
      expect(await governance.emergencyVotingPeriod()).to.equal(EMERGENCY_VOTING_PERIOD);
      expect(await governance.guardianMultiSig()).to.equal(guardian.address);
    });
  });

  describe("Create Proposal", function () {
    it("Should allow verified user to create proposal", async function () {
      const title = "Upgrade Contract";
      const description = "Upgrade to v2";
      const callData = "0x";

      await expect(
        governance.connect(user1).createProposal(
          title,
          description,
          targetContract.address,
          callData,
          mockMerkleRoot,
          generateNullifierHash(1),
          mockProof
        )
      ).to.emit(governance, "ProposalCreated");

      const proposal = await governance.getProposal(0);
      expect(proposal.proposer).to.equal(user1.address);
      expect(proposal.title).to.equal(title);
    });

    it("Should revert if target not whitelisted", async function () {
      await expect(
        governance.connect(user1).createProposal(
          "Title",
          "Description",
          user2.address,
          "0x",
          mockMerkleRoot,
          generateNullifierHash(1),
          mockProof
        )
      ).to.be.revertedWithCustomError(governance, "TargetNotWhitelisted");
    });
  });

  describe("Voting", function () {
    let proposalId: number;

    beforeEach(async function () {
      await governance.connect(user1).createProposal(
        "Test Proposal",
        "Description",
        targetContract.address,
        "0x",
        mockMerkleRoot,
        generateNullifierHash(1),
        mockProof
      );
      proposalId = 0;
    });

    it("Should allow verified user to vote", async function () {
      await expect(
        governance.connect(user2).vote(
          proposalId,
          true,
          mockMerkleRoot,
          generateNullifierHash(2),
          mockProof
        )
      ).to.emit(governance, "VoteCast");

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.votesFor).to.equal(1);
    });

    it("Should prevent double voting with same nullifier", async function () {
      const nullifier = generateNullifierHash(2);
      
      await governance.connect(user2).vote(
        proposalId,
        true,
        mockMerkleRoot,
        nullifier,
        mockProof
      );

      await expect(
        governance.connect(user1).vote(
          proposalId,
          false,
          mockMerkleRoot,
          nullifier,
          mockProof
        )
      ).to.be.revertedWithCustomError(governance, "NullifierAlreadyUsed");
    });
  });

  describe("Execute Proposal", function () {
    it("Should execute proposal if quorum reached and votes pass", async function () {
      await governance.connect(user1).createProposal(
        "Test",
        "Desc",
        targetContract.address,
        "0x",
        mockMerkleRoot,
        generateNullifierHash(1),
        mockProof
      );

      for (let i = 0; i < 45; i++) {
        await governance.connect(user1).vote(
          0,
          true,
          mockMerkleRoot,
          generateNullifierHash(100 + i),
          mockProof
        );
      }

      await ethers.provider.send("evm_increaseTime", [VOTING_PERIOD + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(governance.executeProposal(0))
        .to.emit(governance, "ProposalExecuted");
    });
  });
});
