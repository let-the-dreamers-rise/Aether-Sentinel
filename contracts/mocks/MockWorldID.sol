// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockWorldID
 * @notice Mock World ID verifier for testing purposes
 */
contract MockWorldID {
    bool public shouldRevert;

    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }

    function verifyProof(
        uint256, // root
        uint256, // groupId
        uint256, // signalHash
        uint256, // nullifierHash
        uint256, // externalNullifierHash
        uint256[8] calldata // proof
    ) external view {
        if (shouldRevert) {
            revert("Invalid proof");
        }
        // If not reverting, proof is considered valid
    }
}
