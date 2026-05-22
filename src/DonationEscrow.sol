// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./NeedRegistry.sol";
import "./VendorRegistry.sol";

/// @notice Core escrow contract. Donors send USDC here; funds are locked until
///         the owner (nonprofit) calls fulfillNeed() with a proof-of-purchase
///         receipt, at which point USDC is released directly to the vendor.
///
///         If a need is cancelled the owner calls cancelNeed() on NeedRegistry,
///         and donors pull their refunds via claimRefund().
///
///         Every donation, fulfillment, and refund emits an event so the full
///         history is permanently auditable on-chain.
contract DonationEscrow is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    NeedRegistry public immutable needRegistry;
    VendorRegistry public immutable vendorRegistry;

    // needId → total USDC donated (in escrow)
    mapping(uint256 => uint256) public needBalance;

    // donor → needId → amount contributed (used for refund accounting)
    mapping(address => mapping(uint256 => uint256)) public contributions;

    // needId → ordered list of donor addresses (for off-chain enumeration)
    mapping(uint256 => address[]) private _needDonors;

    struct DonationRecord {
        address donor;
        uint256 needId;
        uint256 amount;
        uint256 timestamp;
    }

    DonationRecord[] public donationLog;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event Donated(
        uint256 indexed donationId,
        address indexed donor,
        uint256 indexed needId,
        uint256 amount
    );
    event Refunded(address indexed donor, uint256 indexed needId, uint256 amount);
    event NeedFulfilled(
        uint256 indexed needId,
        address indexed vendor,
        uint256 amount,
        string receiptHash
    );
    event ExcessRefunded(address indexed donor, uint256 indexed needId, uint256 excess);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error NeedNotOpen(uint256 needId);
    error NeedNotCancelled(uint256 needId);
    error NeedNotFunded(uint256 needId);
    error VendorInactive(address vendor);
    error NothingToRefund();
    error ZeroAmount();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        address initialOwner,
        address _usdc,
        address _needRegistry,
        address _vendorRegistry
    ) Ownable(initialOwner) {
        usdc = IERC20(_usdc);
        needRegistry = NeedRegistry(_needRegistry);
        vendorRegistry = VendorRegistry(_vendorRegistry);
    }

    // -------------------------------------------------------------------------
    // Donor actions
    // -------------------------------------------------------------------------

    /// @notice Donate USDC toward a specific need.
    ///         Any excess over the target is returned to the donor immediately.
    /// @param needId   The need to fund.
    /// @param amount   USDC amount (6 decimals). Must have approved this contract first.
    function donate(uint256 needId, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        NeedRegistry.Need memory need = needRegistry.getNeed(needId);
        if (need.status != NeedRegistry.NeedStatus.Open) revert NeedNotOpen(needId);

        uint256 remaining = need.targetAmount - needBalance[needId];
        uint256 effective = amount > remaining ? remaining : amount;
        uint256 excess = amount - effective;

        // Pull full amount from donor, then immediately return any excess
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        if (excess > 0) {
            usdc.safeTransfer(msg.sender, excess);
            emit ExcessRefunded(msg.sender, needId, excess);
        }

        // First-time donor for this need → record address for refund enumeration
        if (contributions[msg.sender][needId] == 0) {
            _needDonors[needId].push(msg.sender);
        }

        contributions[msg.sender][needId] += effective;
        needBalance[needId] += effective;

        uint256 donationId = donationLog.length;
        donationLog.push(DonationRecord({
            donor: msg.sender,
            needId: needId,
            amount: effective,
            timestamp: block.timestamp
        }));

        emit Donated(donationId, msg.sender, needId, effective);

        // Transition need to Funded when target is reached
        if (needBalance[needId] >= need.targetAmount) {
            needRegistry.markFunded(needId);
        }
    }

    /// @notice Pull refund for a cancelled need.
    function claimRefund(uint256 needId) external nonReentrant {
        NeedRegistry.Need memory need = needRegistry.getNeed(needId);
        if (need.status != NeedRegistry.NeedStatus.Cancelled) revert NeedNotCancelled(needId);

        uint256 amount = contributions[msg.sender][needId];
        if (amount == 0) revert NothingToRefund();

        contributions[msg.sender][needId] = 0;
        needBalance[needId] -= amount;

        usdc.safeTransfer(msg.sender, amount);
        emit Refunded(msg.sender, needId, amount);
    }

    // -------------------------------------------------------------------------
    // Owner (nonprofit) actions
    // -------------------------------------------------------------------------

    /// @notice Release escrowed USDC to the vendor and record proof of purchase.
    ///         Only callable after the need has been fully funded.
    ///         `receiptHash` is the IPFS CID of the purchase receipt — permanently
    ///         links the on-chain payment to the real-world transaction.
    /// @param needId       The funded need to fulfill.
    /// @param receiptHash  IPFS CID of the purchase receipt / delivery proof.
    function fulfillNeed(uint256 needId, string calldata receiptHash) external onlyOwner nonReentrant {
        NeedRegistry.Need memory need = needRegistry.getNeed(needId);
        if (need.status != NeedRegistry.NeedStatus.Funded) revert NeedNotFunded(needId);
        if (!vendorRegistry.isActiveVendor(need.vendor)) revert VendorInactive(need.vendor);

        uint256 amount = needBalance[needId];
        needBalance[needId] = 0;

        // Update registry state before external call (checks-effects-interactions)
        needRegistry.markFulfilled(needId, receiptHash);

        usdc.safeTransfer(need.vendor, amount);
        emit NeedFulfilled(needId, need.vendor, amount, receiptHash);
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    function getDonationCount() external view returns (uint256) {
        return donationLog.length;
    }

    function getDonation(uint256 donationId) external view returns (DonationRecord memory) {
        return donationLog[donationId];
    }

    /// @notice Returns all donor addresses for a given need (for off-chain UIs).
    function getNeedDonors(uint256 needId) external view returns (address[] memory) {
        return _needDonors[needId];
    }

    /// @notice How much more USDC is needed to fully fund a need.
    function remainingForNeed(uint256 needId) external view returns (uint256) {
        NeedRegistry.Need memory need = needRegistry.getNeed(needId);
        uint256 funded = needBalance[needId];
        return funded >= need.targetAmount ? 0 : need.targetAmount - funded;
    }
}
