// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./VendorRegistry.sol";
import "./RecipientRegistry.sol";

/// @notice Stores the definition and lifecycle status of every need.
///         Status transitions: Open → Funded → Fulfilled
///                             Open → Cancelled
///
///         The DonationEscrow is the only contract authorized to call
///         markFunded() and markFulfilled(). The owner calls cancelNeed().
contract NeedRegistry is Ownable2Step {
    enum NeedStatus {
        Open,
        Funded,
        Fulfilled,
        Cancelled
    }

    struct Need {
        uint256 recipientId;
        address vendor;
        string descriptionHash; // IPFS CID — item description, photo, estimated cost breakdown
        uint256 targetAmount;   // USDC (6 decimals)
        NeedStatus status;
        string receiptHash;     // IPFS CID — populated after fulfillment (proof of purchase)
        uint256 createdAt;
        uint256 fulfilledAt;
    }

    VendorRegistry public immutable vendorRegistry;
    RecipientRegistry public immutable recipientRegistry;

    mapping(uint256 => Need) public needs;
    uint256 public needCount;

    // recipientId → list of needIds
    mapping(uint256 => uint256[]) private _recipientNeeds;

    // The DonationEscrow contract; set once after escrow deployment
    address public escrow;

    event NeedCreated(
        uint256 indexed needId,
        uint256 indexed recipientId,
        address indexed vendor,
        uint256 targetAmount,
        string descriptionHash
    );
    event NeedFunded(uint256 indexed needId);
    event NeedFulfilled(uint256 indexed needId, string receiptHash);
    event NeedCancelled(uint256 indexed needId);
    event EscrowSet(address indexed escrow);

    error InvalidRecipient(uint256 recipientId);
    error InvalidVendor(address vendor);
    error InvalidNeed(uint256 needId);
    error WrongStatus(uint256 needId, NeedStatus current, NeedStatus required);
    error NotAuthorized();
    error EscrowAlreadySet();
    error ZeroAmount();

    modifier onlyEscrowOrOwner() {
        if (msg.sender != escrow && msg.sender != owner()) revert NotAuthorized();
        _;
    }

    constructor(
        address initialOwner,
        address _vendorRegistry,
        address _recipientRegistry
    ) Ownable(initialOwner) {
        vendorRegistry = VendorRegistry(_vendorRegistry);
        recipientRegistry = RecipientRegistry(_recipientRegistry);
    }

    /// @notice Called once after DonationEscrow is deployed.
    function setEscrow(address _escrow) external onlyOwner {
        if (escrow != address(0)) revert EscrowAlreadySet();
        escrow = _escrow;
        emit EscrowSet(_escrow);
    }

    function createNeed(
        uint256 recipientId,
        address vendor,
        string calldata descriptionHash,
        uint256 targetAmount
    ) external onlyOwner returns (uint256 needId) {
        if (!recipientRegistry.isActiveRecipient(recipientId)) revert InvalidRecipient(recipientId);
        if (!vendorRegistry.isActiveVendor(vendor)) revert InvalidVendor(vendor);
        if (targetAmount == 0) revert ZeroAmount();

        needId = needCount++;
        needs[needId] = Need({
            recipientId: recipientId,
            vendor: vendor,
            descriptionHash: descriptionHash,
            targetAmount: targetAmount,
            status: NeedStatus.Open,
            receiptHash: "",
            createdAt: block.timestamp,
            fulfilledAt: 0
        });
        _recipientNeeds[recipientId].push(needId);

        emit NeedCreated(needId, recipientId, vendor, targetAmount, descriptionHash);
    }

    /// @notice Called by DonationEscrow once a need reaches its target amount.
    function markFunded(uint256 needId) external onlyEscrowOrOwner {
        Need storage need = _requireNeed(needId);
        if (need.status != NeedStatus.Open) revert WrongStatus(needId, need.status, NeedStatus.Open);
        need.status = NeedStatus.Funded;
        emit NeedFunded(needId);
    }

    /// @notice Called by DonationEscrow when USDC is released to the vendor with a receipt.
    function markFulfilled(uint256 needId, string calldata receiptHash) external onlyEscrowOrOwner {
        Need storage need = _requireNeed(needId);
        if (need.status != NeedStatus.Funded) revert WrongStatus(needId, need.status, NeedStatus.Funded);
        need.status = NeedStatus.Fulfilled;
        need.receiptHash = receiptHash;
        need.fulfilledAt = block.timestamp;
        emit NeedFulfilled(needId, receiptHash);
    }

    /// @notice Owner can cancel an Open need (before it receives any donations).
    function cancelNeed(uint256 needId) external onlyOwner {
        Need storage need = _requireNeed(needId);
        if (need.status != NeedStatus.Open) revert WrongStatus(needId, need.status, NeedStatus.Open);
        need.status = NeedStatus.Cancelled;
        emit NeedCancelled(needId);
    }

    function getNeed(uint256 needId) external view returns (Need memory) {
        if (needId >= needCount) revert InvalidNeed(needId);
        return needs[needId];
    }

    function getRecipientNeeds(uint256 recipientId) external view returns (uint256[] memory) {
        return _recipientNeeds[recipientId];
    }

    function _requireNeed(uint256 needId) internal view returns (Need storage) {
        if (needId >= needCount) revert InvalidNeed(needId);
        return needs[needId];
    }
}
