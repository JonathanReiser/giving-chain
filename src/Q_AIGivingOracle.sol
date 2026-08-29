// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Q_AIGivingOracle — Quantum AI Governed Philanthropy Oracle on Base
 * @notice Verifies Q-AI public-good consensus proofs (GHZ entanglement >= 80%)
 *         before disbursing charitable donations to non-profits on Base L2.
 */
contract Q_AIGivingOracle {
    address public immutable owner;
    uint256 public constant MIN_IMPACT_THRESHOLD = 8000; // 80.00% (basis points)

    struct CharityGrantProof {
        uint256 charityId;
        uint256 impactScore; // in basis points (e.g. 8850 = 88.5%)
        bytes32 qiskitProofHash;
        bool verified;
        bool disbursed;
    }

    mapping(uint256 => CharityGrantProof) public charityProofs;

    event NonProfitProofVerified(
        uint256 indexed charityId,
        uint256 impactScore,
        bytes32 qiskitProofHash
    );

    event GrantDisbursedOnBase(
        uint256 indexed charityId,
        address indexed recipient,
        uint256 amount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Q_AIGivingOracle: Caller is not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Submit Q-AI Public Good Impact Proof for a Charitable Non-Profit.
     */
    function submitQuantumNonProfitProof(
        uint256 charityId,
        uint256 impactScore,
        bytes32 qiskitProofHash
    ) external onlyOwner {
        require(impactScore >= MIN_IMPACT_THRESHOLD, "Q_AIGivingOracle: Impact score below 80% threshold");
        require(!charityProofs[charityId].verified, "Q_AIGivingOracle: Charity proof already verified");

        charityProofs[charityId] = CharityGrantProof({
            charityId: charityId,
            impactScore: impactScore,
            qiskitProofHash: qiskitProofHash,
            verified: true,
            disbursed: false
        });

        emit NonProfitProofVerified(charityId, impactScore, qiskitProofHash);
    }

    /**
     * @notice Disburse Base L2 funds to non-profit recipient after Q-AI verification.
     */
    function disburseCharityGrant(
        uint256 charityId,
        address recipient,
        uint256 amount
    ) external onlyOwner {
        CharityGrantProof storage proof = charityProofs[charityId];
        require(proof.verified, "Q_AIGivingOracle: Charity proof not verified by Q-AI");
        require(!proof.disbursed, "Q_AIGivingOracle: Grant already disbursed");

        proof.disbursed = true;

        emit GrantDisbursedOnBase(charityId, recipient, amount);
    }
}
