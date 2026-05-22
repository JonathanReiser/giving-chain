// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @notice Registry of recipients (people in need). Profiles are stored as IPFS
///         hashes so sensitive data stays off-chain while still being verifiable.
///         IDs are monotonically incrementing integers to preserve privacy.
contract RecipientRegistry is Ownable2Step {
    struct Recipient {
        string profileHash; // IPFS CID — anonymized profile (first name, location, story)
        bool active;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(uint256 => Recipient) public recipients;
    uint256 public recipientCount;

    event RecipientAdded(uint256 indexed recipientId, string profileHash);
    event RecipientProfileUpdated(uint256 indexed recipientId, string newProfileHash);
    event RecipientDeactivated(uint256 indexed recipientId);
    event RecipientActivated(uint256 indexed recipientId);

    error InvalidRecipient(uint256 recipientId);
    error AlreadyActive(uint256 recipientId);
    error AlreadyInactive(uint256 recipientId);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function addRecipient(string calldata profileHash) external onlyOwner returns (uint256 recipientId) {
        recipientId = recipientCount++;
        recipients[recipientId] = Recipient({
            profileHash: profileHash,
            active: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        emit RecipientAdded(recipientId, profileHash);
    }

    function updateProfile(uint256 recipientId, string calldata newProfileHash) external onlyOwner {
        if (recipientId >= recipientCount) revert InvalidRecipient(recipientId);
        recipients[recipientId].profileHash = newProfileHash;
        recipients[recipientId].updatedAt = block.timestamp;
        emit RecipientProfileUpdated(recipientId, newProfileHash);
    }

    function deactivateRecipient(uint256 recipientId) external onlyOwner {
        if (recipientId >= recipientCount) revert InvalidRecipient(recipientId);
        if (!recipients[recipientId].active) revert AlreadyInactive(recipientId);
        recipients[recipientId].active = false;
        emit RecipientDeactivated(recipientId);
    }

    function activateRecipient(uint256 recipientId) external onlyOwner {
        if (recipientId >= recipientCount) revert InvalidRecipient(recipientId);
        if (recipients[recipientId].active) revert AlreadyActive(recipientId);
        recipients[recipientId].active = true;
        emit RecipientActivated(recipientId);
    }

    function isActiveRecipient(uint256 recipientId) external view returns (bool) {
        return recipientId < recipientCount && recipients[recipientId].active;
    }
}
