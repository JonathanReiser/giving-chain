// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/VendorRegistry.sol";
import "../src/RecipientRegistry.sol";
import "../src/NeedRegistry.sol";
import "../src/DonationEscrow.sol";

/// @dev Minimal ERC-20 mock for USDC in tests
contract MockUSDC {
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract GivingChainTest is Test {
    VendorRegistry internal vendorReg;
    RecipientRegistry internal recipientReg;
    NeedRegistry internal needReg;
    DonationEscrow internal escrow;
    MockUSDC internal usdc;

    address internal owner = makeAddr("owner");
    address internal donor1 = makeAddr("donor1");
    address internal donor2 = makeAddr("donor2");
    address internal vendor = makeAddr("vendor");

    uint256 internal constant TARGET = 40_000_000; // 40 USDC (6 decimals)

    function setUp() public {
        usdc = new MockUSDC();

        vm.startPrank(owner);
        vendorReg = new VendorRegistry(owner);
        recipientReg = new RecipientRegistry(owner);
        needReg = new NeedRegistry(owner, address(vendorReg), address(recipientReg));
        escrow = new DonationEscrow(owner, address(usdc), address(needReg), address(vendorReg));
        needReg.setEscrow(address(escrow));

        vendorReg.addVendor(vendor, "Local Grocery", "QmVendorHash");
        recipientReg.addRecipient("QmRecipientHash");
        vm.stopPrank();

        usdc.mint(donor1, 1_000_000_000); // 1000 USDC
        usdc.mint(donor2, 1_000_000_000);

        vm.prank(donor1);
        usdc.approve(address(escrow), type(uint256).max);
        vm.prank(donor2);
        usdc.approve(address(escrow), type(uint256).max);
    }

    // ------------------------------------------------------------------
    // VendorRegistry
    // ------------------------------------------------------------------

    function test_AddVendor() public view {
        assertTrue(vendorReg.isActiveVendor(vendor));
        (string memory name,, bool active,) = vendorReg.vendors(vendor);
        assertEq(name, "Local Grocery");
        assertTrue(active);
    }

    function test_DeactivateVendor() public {
        vm.prank(owner);
        vendorReg.deactivateVendor(vendor);
        assertFalse(vendorReg.isActiveVendor(vendor));
    }

    function test_RevertAddDuplicateVendor() public {
        vm.prank(owner);
        vm.expectRevert(VendorRegistry.AlreadyActiveVendor.selector);
        vendorReg.addVendor(vendor, "Dup", "QmX");
    }

    // ------------------------------------------------------------------
    // RecipientRegistry
    // ------------------------------------------------------------------

    function test_AddRecipient() public view {
        assertTrue(recipientReg.isActiveRecipient(0));
        (string memory hash,,,) = recipientReg.recipients(0);
        assertEq(hash, "QmRecipientHash");
    }

    function test_DeactivateRecipient() public {
        vm.prank(owner);
        recipientReg.deactivateRecipient(0);
        assertFalse(recipientReg.isActiveRecipient(0));
    }

    // ------------------------------------------------------------------
    // NeedRegistry
    // ------------------------------------------------------------------

    function test_CreateNeed() public {
        uint256 needId = _createNeed();
        NeedRegistry.Need memory n = needReg.getNeed(needId);
        assertEq(n.targetAmount, TARGET);
        assertEq(uint8(n.status), uint8(NeedRegistry.NeedStatus.Open));
        assertEq(n.vendor, vendor);
    }

    function test_CancelNeed() public {
        uint256 needId = _createNeed();
        vm.prank(owner);
        needReg.cancelNeed(needId);
        NeedRegistry.Need memory n = needReg.getNeed(needId);
        assertEq(uint8(n.status), uint8(NeedRegistry.NeedStatus.Cancelled));
    }

    function test_RevertSetEscrowTwice() public {
        vm.prank(owner);
        vm.expectRevert(NeedRegistry.EscrowAlreadySet.selector);
        needReg.setEscrow(address(0x1));
    }

    // ------------------------------------------------------------------
    // DonationEscrow — happy path
    // ------------------------------------------------------------------

    function test_SingleDonorFullFund() public {
        uint256 needId = _createNeed();

        vm.prank(donor1);
        escrow.donate(needId, TARGET);

        assertEq(escrow.needBalance(needId), TARGET);
        assertEq(escrow.contributions(donor1, needId), TARGET);

        NeedRegistry.Need memory n = needReg.getNeed(needId);
        assertEq(uint8(n.status), uint8(NeedRegistry.NeedStatus.Funded));
    }

    function test_TwoDonorsSplitFund() public {
        uint256 needId = _createNeed();
        uint256 half = TARGET / 2;

        vm.prank(donor1);
        escrow.donate(needId, half);

        vm.prank(donor2);
        escrow.donate(needId, half);

        assertEq(escrow.needBalance(needId), TARGET);
        NeedRegistry.Need memory n = needReg.getNeed(needId);
        assertEq(uint8(n.status), uint8(NeedRegistry.NeedStatus.Funded));
    }

    function test_ExcessDonationRefunded() public {
        uint256 needId = _createNeed();
        uint256 overage = TARGET + 5_000_000; // 5 USDC over

        uint256 balanceBefore = usdc.balanceOf(donor1);

        vm.prank(donor1);
        escrow.donate(needId, overage);

        // Donor only loses TARGET, not overage
        assertEq(usdc.balanceOf(donor1), balanceBefore - TARGET);
        assertEq(escrow.contributions(donor1, needId), TARGET);
    }

    function test_FulfillNeed() public {
        uint256 needId = _createNeed();
        vm.prank(donor1);
        escrow.donate(needId, TARGET);

        uint256 vendorBefore = usdc.balanceOf(vendor);

        vm.prank(owner);
        escrow.fulfillNeed(needId, "QmReceiptHash");

        assertEq(usdc.balanceOf(vendor), vendorBefore + TARGET);
        assertEq(escrow.needBalance(needId), 0);

        NeedRegistry.Need memory n = needReg.getNeed(needId);
        assertEq(uint8(n.status), uint8(NeedRegistry.NeedStatus.Fulfilled));
        assertEq(n.receiptHash, "QmReceiptHash");
    }

    // ------------------------------------------------------------------
    // DonationEscrow — refund path
    // ------------------------------------------------------------------

    function test_ClaimRefundAfterCancel() public {
        uint256 needId = _createNeed();
        uint256 donateAmount = 10_000_000; // 10 USDC

        vm.prank(donor1);
        escrow.donate(needId, donateAmount);

        vm.prank(owner);
        needReg.cancelNeed(needId);

        uint256 balanceBefore = usdc.balanceOf(donor1);
        vm.prank(donor1);
        escrow.claimRefund(needId);

        assertEq(usdc.balanceOf(donor1), balanceBefore + donateAmount);
        assertEq(escrow.contributions(donor1, needId), 0);
    }

    function test_RevertDoubleRefund() public {
        uint256 needId = _createNeed();
        vm.prank(donor1);
        escrow.donate(needId, 10_000_000);

        vm.prank(owner);
        needReg.cancelNeed(needId);

        vm.prank(donor1);
        escrow.claimRefund(needId);

        vm.prank(donor1);
        vm.expectRevert(DonationEscrow.NothingToRefund.selector);
        escrow.claimRefund(needId);
    }

    // ------------------------------------------------------------------
    // Access control
    // ------------------------------------------------------------------

    function test_RevertDonateToFundedNeed() public {
        uint256 needId = _createNeed();
        vm.prank(donor1);
        escrow.donate(needId, TARGET);

        vm.prank(donor2);
        vm.expectRevert(abi.encodeWithSelector(DonationEscrow.NeedNotOpen.selector, needId));
        escrow.donate(needId, 1_000_000);
    }

    function test_RevertFulfillUnfundedNeed() public {
        uint256 needId = _createNeed();
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(DonationEscrow.NeedNotFunded.selector, needId));
        escrow.fulfillNeed(needId, "QmX");
    }

    function test_RevertNonOwnerFulfill() public {
        uint256 needId = _createNeed();
        vm.prank(donor1);
        escrow.donate(needId, TARGET);

        vm.prank(donor1);
        vm.expectRevert();
        escrow.fulfillNeed(needId, "QmX");
    }

    // ------------------------------------------------------------------
    // Transparency / view helpers
    // ------------------------------------------------------------------

    function test_RemainingForNeed() public {
        uint256 needId = _createNeed();
        assertEq(escrow.remainingForNeed(needId), TARGET);

        vm.prank(donor1);
        escrow.donate(needId, TARGET / 4);
        assertEq(escrow.remainingForNeed(needId), TARGET - TARGET / 4);
    }

    function test_DonationLogRecorded() public {
        uint256 needId = _createNeed();
        vm.prank(donor1);
        escrow.donate(needId, 5_000_000);

        assertEq(escrow.getDonationCount(), 1);
        DonationEscrow.DonationRecord memory record = escrow.getDonation(0);
        assertEq(record.donor, donor1);
        assertEq(record.needId, needId);
        assertEq(record.amount, 5_000_000);
    }

    function test_NeedDonorsTracked() public {
        uint256 needId = _createNeed();
        vm.prank(donor1);
        escrow.donate(needId, 5_000_000);
        vm.prank(donor2);
        escrow.donate(needId, 5_000_000);

        address[] memory donors = escrow.getNeedDonors(needId);
        assertEq(donors.length, 2);
        assertEq(donors[0], donor1);
        assertEq(donors[1], donor2);
    }

    // ------------------------------------------------------------------
    // Internal helpers
    // ------------------------------------------------------------------

    function _createNeed() internal returns (uint256) {
        vm.prank(owner);
        return needReg.createNeed(0, vendor, "QmNeedHash", TARGET);
    }
}
