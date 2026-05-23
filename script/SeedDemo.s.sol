// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/VendorRegistry.sol";
import "../src/RecipientRegistry.sol";
import "../src/NeedRegistry.sol";

/// @notice Seeds the production contracts with realistic demo data.
///         Run after pinning metadata to IPFS (see script/seed-demo.sh).
contract SeedDemo is Script {
    address constant VENDOR_REGISTRY    = 0xFd914AA36aEdc1C70656261450b4c169980a05F4;
    address constant RECIPIENT_REGISTRY = 0x1e0E0C4DbbEf0c6d60DDaBa643D5844589Cc952a;
    address constant NEED_REGISTRY      = 0xCaC16f5A3FBC3c4b1306B05302488EaEA59250e0;

    function run(
        address vendorWallet,
        string calldata vendorCid,
        string calldata recipientCid,
        string calldata needCid,
        uint256 targetUsdc   // in whole dollars, e.g. 45
    ) external {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        vm.startBroadcast();

        VendorRegistry vendorReg       = VendorRegistry(VENDOR_REGISTRY);
        RecipientRegistry recipientReg = RecipientRegistry(RECIPIENT_REGISTRY);
        NeedRegistry needReg           = NeedRegistry(NEED_REGISTRY);

        vendorReg.addVendor(vendorWallet, "Green Earth Market", vendorCid);
        console.log("Vendor added:", vendorWallet);

        uint256 recipientId = recipientReg.addRecipient(recipientCid);
        console.log("Recipient ID:", recipientId);

        uint256 needId = needReg.createNeed(
            recipientId,
            vendorWallet,
            needCid,
            targetUsdc * 1_000_000   // convert dollars to USDC (6 decimals)
        );
        console.log("Need ID:     ", needId);

        vm.stopBroadcast();
    }
}
