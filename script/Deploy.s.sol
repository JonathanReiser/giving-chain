// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/VendorRegistry.sol";
import "../src/RecipientRegistry.sol";
import "../src/NeedRegistry.sol";
import "../src/DonationEscrow.sol";

/// @notice Deploys the full GivingChain stack.
///
/// Usage (Base Sepolia):
///   source .env && forge script script/Deploy.s.sol \
///     --rpc-url $BASE_SEPOLIA_RPC_URL \
///     --private-key $PRIVATE_KEY \
///     --broadcast --verify \
///     --etherscan-api-key $BASESCAN_API_KEY \
///     --chain 84532
///
/// Required env vars (set in .env):
///   PRIVATE_KEY       — deployer private key (0x…)
///   DEPLOYER_ADDRESS  — corresponding wallet address
///   USDC_ADDRESS      — 0x036CbD53842c5426634e7929541eC2318f3dCF7e on Base Sepolia
contract Deploy is Script {
    function run() external {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");

        vm.startBroadcast();

        VendorRegistry vendorRegistry = new VendorRegistry(deployer);
        console.log("VendorRegistry:   ", address(vendorRegistry));

        RecipientRegistry recipientRegistry = new RecipientRegistry(deployer);
        console.log("RecipientRegistry:", address(recipientRegistry));

        NeedRegistry needRegistry = new NeedRegistry(
            deployer,
            address(vendorRegistry),
            address(recipientRegistry)
        );
        console.log("NeedRegistry:     ", address(needRegistry));

        DonationEscrow donationEscrow = new DonationEscrow(
            deployer,
            usdcAddress,
            address(needRegistry),
            address(vendorRegistry)
        );
        console.log("DonationEscrow:   ", address(donationEscrow));

        // Wire escrow into NeedRegistry (one-time, immutable after this)
        needRegistry.setEscrow(address(donationEscrow));
        console.log("Escrow wired to NeedRegistry");

        vm.stopBroadcast();
    }
}
