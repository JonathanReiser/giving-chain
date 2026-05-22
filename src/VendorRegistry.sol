// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @notice Registry of vendors approved to receive payments from DonationEscrow.
///         Only whitelisted vendors can be assigned to a need or receive USDC.
contract VendorRegistry is Ownable2Step {
    struct Vendor {
        string name;
        string metadataHash; // IPFS CID with vendor details (address, certifications, etc.)
        bool active;
        uint256 addedAt;
    }

    mapping(address => Vendor) public vendors;
    address[] private _vendorList;

    event VendorAdded(address indexed vendor, string name, string metadataHash);
    event VendorDeactivated(address indexed vendor);
    event VendorActivated(address indexed vendor);
    event VendorMetadataUpdated(address indexed vendor, string newMetadataHash);

    error NotAVendor();
    error AlreadyActiveVendor();
    error AlreadyInactiveVendor();
    error ZeroAddress();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function addVendor(
        address vendor,
        string calldata name,
        string calldata metadataHash
    ) external onlyOwner {
        if (vendor == address(0)) revert ZeroAddress();
        if (vendors[vendor].active) revert AlreadyActiveVendor();

        vendors[vendor] = Vendor({
            name: name,
            metadataHash: metadataHash,
            active: true,
            addedAt: block.timestamp
        });
        _vendorList.push(vendor);

        emit VendorAdded(vendor, name, metadataHash);
    }

    function deactivateVendor(address vendor) external onlyOwner {
        if (!vendors[vendor].active) revert AlreadyInactiveVendor();
        vendors[vendor].active = false;
        emit VendorDeactivated(vendor);
    }

    function activateVendor(address vendor) external onlyOwner {
        if (vendors[vendor].addedAt == 0) revert NotAVendor();
        if (vendors[vendor].active) revert AlreadyActiveVendor();
        vendors[vendor].active = true;
        emit VendorActivated(vendor);
    }

    function updateVendorMetadata(address vendor, string calldata newMetadataHash) external onlyOwner {
        if (vendors[vendor].addedAt == 0) revert NotAVendor();
        vendors[vendor].metadataHash = newMetadataHash;
        emit VendorMetadataUpdated(vendor, newMetadataHash);
    }

    function isActiveVendor(address vendor) external view returns (bool) {
        return vendors[vendor].active;
    }

    function getVendorList() external view returns (address[] memory) {
        return _vendorList;
    }

    function getVendorCount() external view returns (uint256) {
        return _vendorList.length;
    }
}
