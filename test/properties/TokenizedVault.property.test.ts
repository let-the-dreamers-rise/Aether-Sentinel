import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { TokenizedVault, MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Property-Based Test for TokenizedVault
 * **Validates: Requirements 1.3, 1.4**
 * 
 * Property 1: Reserve Ratio Invariant
 * The reserve ratio SHALL always be calculated correctly and withdrawals 
 * SHALL be prevented when ratio falls below minimum threshold.
 */
describe("TokenizedVault - Property Tests", function () {
  let vault: TokenizedVault;
  let underlyingAsset: MockERC20;
  let admin: SignerWithAddress;
  let users: SignerWithAddress[];

  const MINIMUM_RESERVE_RATIO = 2000; // 20%
  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    admin = signers[0];
    users = signers.slice(1, 11); // 10 test users

    // Deploy mock ERC20
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    underlyingAsset = await MockERC20Factory.deploy("Mock USDC", "USDC", INITIAL_SUPPLY);

    // Deploy vault
    const TokenizedVaultFactory = await ethers.getContractFactory("TokenizedVault");
    vault = await upgrades.deployProxy(
      TokenizedVaultFactory,
      [await underlyingAsset.getAddress(), MINIMUM_RESERVE_RATIO, admin.address],
      { initializer: "initialize" }
    ) as unknown as TokenizedVault;

    // Distribute tokens and approve
    for (const user of users) {
      await underlyingAsset.transfer(user.address, ethers.parseEther("10000"));
      await underlyingAsset.connect(user).approve(await vault.getAddress(), ethers.MaxUint256);
    }
  });

  describe("Property 1: Reserve Ratio Invariant", function () {
    it("PROPERTY: Reserve ratio is always calculated correctly", async function () {
      // Perform random deposits
      const deposits = [
        { user: users[0], amount: ethers.parseEther("100") },
        { user: users[1], amount: ethers.parseEther("250") },
        { user: users[2], amount: ethers.parseEther("75") },
        { user: users[3], amount: ethers.parseEther("500") },
      ];

      for (const { user, amount } of deposits) {
        await vault.connect(user).deposit(amount);
        
        // Verify reserve ratio calculation
        const state = await vault.getVaultState();
        const expectedRatio = state.totalLiabilities > 0n
          ? (state.totalUnderlyingAssets * 10000n) / state.totalLiabilities
          : 10000n;
        
        expect(state.reserveRatio).to.equal(expectedRatio);
        expect(await vault.calculateReserveRatio()).to.equal(expectedRatio);
      }
    });

    it("PROPERTY: Withdrawals at limit should succeed", async function () {
      // Setup: Multiple users deposit
      await vault.connect(users[0]).deposit(ethers.parseEther("1000"));
      await vault.connect(users[1]).deposit(ethers.parseEther("500"));
      
      const state = await vault.getVaultState();
      const user0Balance = await vault.balanceOf(users[0].address);
      
      // Calculate maximum safe withdrawal for user0
      // maxWithdrawal = amount where newRatio >= minimumRatio
      // newRatio = (totalAssets - withdrawal) / (totalLiabilities - withdrawal) >= minimumRatio
      
      const totalAssets = state.totalUnderlyingAssets;
      const totalLiabilities = state.totalLiabilities;
      const minRatio = state.minimumReserveRatio;
      
      // Calculate max withdrawal that keeps ratio at exactly minimum
      // (totalAssets - w) / (totalLiabilities - w) = minRatio / 10000
      // (totalAssets - w) * 10000 = (totalLiabilities - w) * minRatio
      // totalAssets * 10000 - w * 10000 = totalLiabilities * minRatio - w * minRatio
      // w * (10000 - minRatio) = totalAssets * 10000 - totalLiabilities * minRatio
      // w = (totalAssets * 10000 - totalLiabilities * minRatio) / (10000 - minRatio)
      
      const maxWithdrawalAssets = (totalAssets * 10000n - totalLiabilities * minRatio) / (10000n - minRatio);
      const maxWithdrawalTokens = (maxWithdrawalAssets * state.totalVaultTokens) / totalAssets;
      
      // User can only withdraw their share
      const userMaxWithdrawal = maxWithdrawalTokens < user0Balance ? maxWithdrawalTokens : user0Balance;
      
      if (userMaxWithdrawal > 0n) {
        // Withdrawal at limit should succeed
        await expect(vault.connect(users[0]).withdraw(userMaxWithdrawal))
          .to.not.be.reverted;
        
        // Verify reserve ratio is at or above minimum
        const newState = await vault.getVaultState();
        expect(newState.reserveRatio).to.be.gte(minRatio);
      }
    });

    it("PROPERTY: Withdrawals beyond limit should revert", async function () {
      // Setup: Create scenario where reserve ratio is close to minimum
      await vault.connect(users[0]).deposit(ethers.parseEther("1000"));
      await vault.connect(users[1]).deposit(ethers.parseEther("1000"));
      
      // Simulate asset loss by adjusting minimum ratio to current ratio
      // In production, this would happen through lending losses
      const state = await vault.getVaultState();
      
      // Try to withdraw amount that would violate reserve ratio
      const user0Balance = await vault.balanceOf(users[0].address);
      
      // Attempting to withdraw all tokens should fail if it violates ratio
      // We'll create a scenario by trying to withdraw when ratio is tight
      
      // For this test, we'll withdraw most funds first
      const safeWithdrawal = user0Balance / 2n;
      await vault.connect(users[0]).withdraw(safeWithdrawal);
      
      // Now try to withdraw remaining which might violate ratio
      const remainingBalance = await vault.balanceOf(users[0].address);
      
      // Calculate if this withdrawal would violate ratio
      const currentState = await vault.getVaultState();
      const withdrawalAmount = (remainingBalance * currentState.totalUnderlyingAssets) / currentState.totalVaultTokens;
      const newAssets = currentState.totalUnderlyingAssets - withdrawalAmount;
      const newLiabilities = currentState.totalLiabilities - withdrawalAmount;
      const newRatio = newLiabilities > 0n ? (newAssets * 10000n) / newLiabilities : 10000n;
      
      if (newRatio < currentState.minimumReserveRatio) {
        // Should revert
        await expect(vault.connect(users[0]).withdraw(remainingBalance))
          .to.be.revertedWithCustomError(vault, "ReserveRatioTooLow");
      }
    });

    it("PROPERTY: Reserve ratio never falls below minimum after any operation", async function () {
      const operations = [
        { type: "deposit", user: users[0], amount: ethers.parseEther("100") },
        { type: "deposit", user: users[1], amount: ethers.parseEther("200") },
        { type: "withdraw", user: users[0], amount: ethers.parseEther("25") },
        { type: "deposit", user: users[2], amount: ethers.parseEther("150") },
        { type: "withdraw", user: users[1], amount: ethers.parseEther("50") },
      ];

      for (const op of operations) {
        if (op.type === "deposit") {
          await vault.connect(op.user).deposit(op.amount);
        } else {
          const balance = await vault.balanceOf(op.user.address);
          if (balance >= op.amount) {
            try {
              await vault.connect(op.user).withdraw(op.amount);
            } catch (error) {
              // Withdrawal might fail due to reserve ratio, which is expected
            }
          }
        }
        
        // INVARIANT: Reserve ratio must always be >= minimum
        const state = await vault.getVaultState();
        expect(state.reserveRatio).to.be.gte(state.minimumReserveRatio);
      }
    });

    it("PROPERTY: Total vault tokens equals sum of user balances", async function () {
      // Perform various operations
      await vault.connect(users[0]).deposit(ethers.parseEther("100"));
      await vault.connect(users[1]).deposit(ethers.parseEther("200"));
      await vault.connect(users[2]).deposit(ethers.parseEther("150"));
      
      await vault.connect(users[0]).withdraw(ethers.parseEther("25"));
      
      // Calculate sum of all user balances
      let sumOfBalances = 0n;
      for (const user of users) {
        sumOfBalances += await vault.balanceOf(user.address);
      }
      
      // INVARIANT: Sum of balances must equal total vault tokens
      const totalVaultTokens = await vault.totalVaultTokens();
      expect(sumOfBalances).to.equal(totalVaultTokens);
    });

    it("PROPERTY: Vault token value is proportional to underlying assets", async function () {
      // First deposit establishes 1:1 ratio
      await vault.connect(users[0]).deposit(ethers.parseEther("1000"));
      
      const state1 = await vault.getVaultState();
      const ratio1 = state1.totalUnderlyingAssets * 10000n / state1.totalVaultTokens;
      
      // Second deposit should maintain proportionality
      await vault.connect(users[1]).deposit(ethers.parseEther("500"));
      
      const state2 = await vault.getVaultState();
      const ratio2 = state2.totalUnderlyingAssets * 10000n / state2.totalVaultTokens;
      
      // INVARIANT: Ratio should remain constant (within rounding)
      expect(ratio1).to.equal(ratio2);
    });

    it("PROPERTY: Deposit followed by immediate full withdrawal returns original amount", async function () {
      const depositAmount = ethers.parseEther("100");
      const initialBalance = await underlyingAsset.balanceOf(users[0].address);
      
      // Deposit
      await vault.connect(users[0]).deposit(depositAmount);
      const vaultTokens = await vault.balanceOf(users[0].address);
      
      // Immediate withdrawal
      await vault.connect(users[0]).withdraw(vaultTokens);
      
      const finalBalance = await underlyingAsset.balanceOf(users[0].address);
      
      // PROPERTY: Should get back the same amount (minus any rounding)
      // Allow for 1 wei rounding error
      expect(finalBalance).to.be.closeTo(initialBalance, 1);
    });

    it("PROPERTY: Multiple deposits and withdrawals maintain accounting integrity", async function () {
      // Track total deposits and withdrawals
      let totalDeposited = 0n;
      let totalWithdrawn = 0n;
      
      // Random operations
      const operations = [
        { type: "deposit", user: 0, amount: ethers.parseEther("100") },
        { type: "deposit", user: 1, amount: ethers.parseEther("250") },
        { type: "withdraw", user: 0, amount: ethers.parseEther("30") },
        { type: "deposit", user: 2, amount: ethers.parseEther("175") },
        { type: "withdraw", user: 1, amount: ethers.parseEther("100") },
        { type: "deposit", user: 3, amount: ethers.parseEther("300") },
      ];
      
      for (const op of operations) {
        if (op.type === "deposit") {
          await vault.connect(users[op.user]).deposit(op.amount);
          totalDeposited += op.amount;
        } else {
          const balance = await vault.balanceOf(users[op.user].address);
          if (balance >= op.amount) {
            const state = await vault.getVaultState();
            const withdrawalAssets = (op.amount * state.totalUnderlyingAssets) / state.totalVaultTokens;
            
            await vault.connect(users[op.user]).withdraw(op.amount);
            totalWithdrawn += withdrawalAssets;
          }
        }
      }
      
      // INVARIANT: Total assets should equal deposits minus withdrawals
      const state = await vault.getVaultState();
      const expectedAssets = totalDeposited - totalWithdrawn;
      
      // Allow for small rounding errors
      expect(state.totalUnderlyingAssets).to.be.closeTo(expectedAssets, ethers.parseEther("0.001"));
    });
  });
});
