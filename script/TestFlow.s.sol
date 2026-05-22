// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/VendorRegistry.sol";
import "../src/RecipientRegistry.sol";
import "../src/NeedRegistry.sol";
import "../src/DonationEscrow.sol";
import "../test/GivingChain.t.sol";

/// @notice Deploys a complete self-contained test stack with MockUSDC so the
///         full donation flow can be exercised without needing Circle USDC.
///         Seeds a vendor, recipient, and open need ready to donate to.
contract TestFlow is Script {
    function run() external {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        vm.startBroadcast();

        // 1. MockUSDC — freely mintable test token
        MockUSDC mockUsdc = new MockUSDC();
        mockUsdc.mint(deployer, 1_000_000_000); // 1000 USDC (6 decimals)
        console.log("MockUSDC:          ", address(mockUsdc));

        // 2. Registries
        VendorRegistry vendorReg     = new VendorRegistry(deployer);
        RecipientRegistry recipientReg = new RecipientRegistry(deployer);
        NeedRegistry needReg = new NeedRegistry(deployer, address(vendorReg), address(recipientReg));
        console.log("VendorRegistry:    ", address(vendorReg));
        console.log("RecipientRegistry: ", address(recipientReg));
        console.log("NeedRegistry:      ", address(needReg));

        // 3. Escrow wired to MockUSDC
        DonationEscrow escrow = new DonationEscrow(
            deployer, address(mockUsdc), address(needReg), address(vendorReg)
        );
        needReg.setEscrow(address(escrow));
        console.log("DonationEscrow:    ", address(escrow));

        // 4. Seed: vendor (deployer), recipient, need ($40 groceries)
        vendorReg.addVendor(deployer, "Test Grocery Store", "QmVendorHash");
        uint256 recipientId = recipientReg.addRecipient("QmRecipientHash");
        uint256 needId = needReg.createNeed(recipientId, deployer, "QmNeedDescHash", 40_000_000);

        console.log("Vendor:            ", deployer);
        console.log("Recipient ID:      ", recipientId);
        console.log("Need ID:           ", needId);
        console.log("Need target:        $40 USDC");
        console.log("Deployer balance:   1000 MockUSDC");

        vm.stopBroadcast();
    }
}
