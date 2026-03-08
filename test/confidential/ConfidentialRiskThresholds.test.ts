import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { ConfidentialRiskThresholds } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ConfidentialRiskThresholds", function () {
  let thresholds: ConfidentialRiskThresholds;
  let owner: SignerWithAddress;
  let guardian: SignerWithAddress;
  let auditor: SignerWithAddress;
  let evaluator: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const GUARDIAN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GUARDIAN_ROLE"));
  const AUDITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AUDITOR_ROLE"));
  const EVALUATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EVALUATOR_ROLE"));

  beforeEach(async function () {
    [owner, guardian, auditor, evaluator, unauthorized] = await ethers.getSigners();

    const ConfidentialRiskThresholds = await ethers.getContractFactory("ConfidentialRiskThresholds");
    thresholds = await upgrades.deployProxy(
      ConfidentialRiskThresholds,
      [],
      { initializer: "initialize" }
    ) as unknown as ConfidentialRiskThresholds;

    await thresholds.grantRole(GUARDIAN_ROLE, guardian.address);
    await thresholds.grantRole(AUDITOR_ROLE, auditor.address);
    await thresholds.grantRole(EVALUATOR_ROLE, evaluator.address);
  });

  describe("Initialization", function () {
    it("Should initialize with default thresholds", async function () {
      const [lastUpdated, updatedBy] = await thresholds.getThresholdMetadata();
      expect(updatedBy).to.equal(owner.address);
      expect(lastUpdated).to.be.gt(0);
    });

    it("Should grant roles correctly", async function () {
      expect(await thresholds.hasRole(GUARDIAN_ROLE, guardian.address)).to.be.true;
      expect(await thresholds.hasRole(AUDITOR_ROLE, auditor.address)).to.be.true;
      expect(await thresholds.hasRole(EVALUATOR_ROLE, evaluator.address)).to.be.true;
    });
  });

  describe("Threshold Updates", function () {
    it("Should allow guardian to update thresholds", async function () {
      const encryptedModerate = ethers.hexlify(ethers.randomBytes(32));
      const encryptedElevated = ethers.hexlify(ethers.randomBytes(32));
      const encryptedCritical = ethers.hexlify(ethers.randomBytes(32));

      await expect(
        thresholds.connect(guardian).updateThresholds(
          encryptedModerate,
          encryptedElevated,
          encryptedCritical
        )
      )
        .to.emit(thresholds, "ThresholdsUpdated")
        .withArgs(await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1), guardian.address);

      const [lastUpdated, updatedBy] = await thresholds.getThresholdMetadata();
      expect(updatedBy).to.equal(guardian.address);
    });

    it("Should reject empty threshold values", async function () {
      await expect(
        thresholds.connect(guardian).updateThresholds(
          "0x",
          ethers.hexlify(ethers.randomBytes(32)),
          ethers.hexlify(ethers.randomBytes(32))
        )
      ).to.be.revertedWith("Invalid moderate threshold");
    });

    it("Should reject updates from non-guardian", async function () {
      const encryptedModerate = ethers.hexlify(ethers.randomBytes(32));
      const encryptedElevated = ethers.hexlify(ethers.randomBytes(32));
      const encryptedCritical = ethers.hexlify(ethers.randomBytes(32));

      await expect(
        thresholds.connect(unauthorized).updateThresholds(
          encryptedModerate,
          encryptedElevated,
          encryptedCritical
        )
      ).to.be.reverted;
    });
  });

  describe("Risk Evaluation", function () {
    it("Should evaluate risk score and return action (default thresholds)", async function () {
      // With default thresholds: moderate=50, elevated=70, critical=90
      
      // Test normal operation (score < 50)
      const action1 = await thresholds.connect(evaluator).evaluateRiskScore.staticCall(30);
      expect(action1).to.equal("NORMAL_OPERATION");

      // Test increase monitoring (50 <= score < 70)
      const action2 = await thresholds.connect(evaluator).evaluateRiskScore.staticCall(60);
      expect(action2).to.equal("INCREASE_MONITORING");

      // Test adjust reserve ratio (70 <= score < 90)
      const action3 = await thresholds.connect(evaluator).evaluateRiskScore.staticCall(80);
      expect(action3).to.equal("ADJUST_RESERVE_RATIO");

      // Test emergency pause (score >= 90)
      const action4 = await thresholds.connect(evaluator).evaluateRiskScore.staticCall(95);
      expect(action4).to.equal("EMERGENCY_PAUSE");
    });

    it("Should emit RiskEvaluated event", async function () {
      await expect(
        thresholds.connect(evaluator).evaluateRiskScore(75)
      ).to.emit(thresholds, "RiskEvaluated");
    });

    it("Should record evaluation in history", async function () {
      await thresholds.connect(evaluator).evaluateRiskScore(75);
      
      const count = await thresholds.getEvaluationHistoryCount();
      expect(count).to.equal(1);

      const evaluation = await thresholds.getEvaluation(0);
      expect(evaluation.evaluator).to.equal(evaluator.address);
      expect(evaluation.action).to.equal("ADJUST_RESERVE_RATIO");
    });

    it("Should reject invalid risk score", async function () {
      await expect(
        thresholds.connect(evaluator).evaluateRiskScore(101)
      ).to.be.revertedWith("Invalid risk score");
    });

    it("Should reject evaluation from non-evaluator", async function () {
      await expect(
        thresholds.connect(unauthorized).evaluateRiskScore(50)
      ).to.be.reverted;
    });
  });

  describe("Evaluation History", function () {
    beforeEach(async function () {
      // Create some evaluation history
      await thresholds.connect(evaluator).evaluateRiskScore(30);
      await thresholds.connect(evaluator).evaluateRiskScore(60);
      await thresholds.connect(evaluator).evaluateRiskScore(85);
    });

    it("Should return correct evaluation count", async function () {
      const count = await thresholds.getEvaluationHistoryCount();
      expect(count).to.equal(3);
    });

    it("Should return evaluation by index", async function () {
      const evaluation = await thresholds.getEvaluation(1);
      expect(evaluation.evaluator).to.equal(evaluator.address);
      expect(evaluation.action).to.equal("INCREASE_MONITORING");
    });

    it("Should return recent evaluations", async function () {
      const recent = await thresholds.getRecentEvaluations(2);
      expect(recent.length).to.equal(2);
      expect(recent[0].action).to.equal("INCREASE_MONITORING");
      expect(recent[1].action).to.equal("ADJUST_RESERVE_RATIO");
    });

    it("Should handle request for more evaluations than exist", async function () {
      const recent = await thresholds.getRecentEvaluations(10);
      expect(recent.length).to.equal(3);
    });

    it("Should reject invalid evaluation index", async function () {
      await expect(
        thresholds.getEvaluation(999)
      ).to.be.revertedWith("Invalid index");
    });
  });

  describe("Auditor Access", function () {
    it("Should allow auditor to verify threshold", async function () {
      const auditorPublicKey = ethers.hexlify(ethers.randomBytes(32));
      
      const encryptedThreshold = await thresholds.connect(auditor).verifyThresholdForAuditor(
        auditorPublicKey,
        "moderate"
      );
      
      expect(encryptedThreshold).to.not.equal("0x");
    });

    it("Should reject empty public key", async function () {
      await expect(
        thresholds.connect(auditor).verifyThresholdForAuditor(
          "0x",
          "moderate"
        )
      ).to.be.revertedWith("Invalid public key");
    });

    it("Should reject invalid threshold type", async function () {
      const auditorPublicKey = ethers.hexlify(ethers.randomBytes(32));
      
      await expect(
        thresholds.connect(auditor).verifyThresholdForAuditor(
          auditorPublicKey,
          "invalid"
        )
      ).to.be.revertedWith("Invalid threshold type");
    });

    it("Should reject access from non-auditor", async function () {
      const auditorPublicKey = ethers.hexlify(ethers.randomBytes(32));
      
      await expect(
        thresholds.connect(unauthorized).verifyThresholdForAuditor(
          auditorPublicKey,
          "moderate"
        )
      ).to.be.reverted;
    });
  });

  describe("Boundary Conditions", function () {
    it("Should handle risk score at exact threshold boundaries", async function () {
      // Test exact boundary values with default thresholds
      const action50 = await thresholds.connect(evaluator).evaluateRiskScore.staticCall(50);
      expect(action50).to.equal("INCREASE_MONITORING");

      const action70 = await thresholds.connect(evaluator).evaluateRiskScore.staticCall(70);
      expect(action70).to.equal("ADJUST_RESERVE_RATIO");

      const action90 = await thresholds.connect(evaluator).evaluateRiskScore.staticCall(90);
      expect(action90).to.equal("EMERGENCY_PAUSE");
    });

    it("Should handle minimum risk score", async function () {
      const action = await thresholds.connect(evaluator).evaluateRiskScore.staticCall(0);
      expect(action).to.equal("NORMAL_OPERATION");
    });

    it("Should handle maximum risk score", async function () {
      const action = await thresholds.connect(evaluator).evaluateRiskScore.staticCall(100);
      expect(action).to.equal("EMERGENCY_PAUSE");
    });
  });
});
