# 🎁 Giving Chain

Earmarked charitable giving on Base L2. Donors fund a **specific need** for a
**specific person**, the money sits in escrow until that need is fully funded,
and it is then paid **directly to a verified vendor** — never to the recipient,
and never into a general pot. If a need is cancelled, donors take their money
back.

[![Base L2](https://img.shields.io/badge/Network-Base%20L2-blue.svg)](https://base.org)
[![Tests](https://img.shields.io/badge/forge%20test-20%20passing-brightgreen.svg)](test/GivingChain.t.sol)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## The problem it addresses

Charitable giving suffers from donor distrust: opaque overhead, no line of sight
between a donation and an outcome, and no way to verify that money reached what
it was raised for.

Giving Chain narrows that gap structurally rather than by reporting. A donation
is tied to one need with a target amount; funds are held in escrow rather than
forwarded; disbursement goes to a pre-registered vendor for that need; and a
receipt hash is written on-chain at fulfilment. The donor can follow their money
from deposit to vendor payment without trusting an intermediary's accounting.

## How it works

```
  RecipientRegistry          VendorRegistry
        │                          │
        └──────────┬───────────────┘
                   ▼
             NeedRegistry              a need = recipient + vendor + target amount
                   │
                   ▼
            DonationEscrow             donors deposit USDC; excess auto-refunded
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   target reached         need cancelled
        │                     │
        ▼                     ▼
   paid to vendor        donors claim
   + receipt hash          refunds
```

1. **Register** a recipient and a vendor (`RecipientRegistry`, `VendorRegistry`).
2. **Create a need** — recipient, vendor, description hash, target amount
   (`NeedRegistry.createNeed`). A need cannot be created against an inactive
   recipient or vendor.
3. **Donate** USDC toward it (`DonationEscrow.donate`). Contributions accumulate;
   anything above the remaining target is returned in the same transaction.
4. **Fulfil** once funded (`DonationEscrow.fulfillNeed`) — USDC transfers
   directly to the vendor and a receipt hash is recorded. The vendor must still
   be active at fulfilment time.
5. **Refund** if the need is cancelled (`DonationEscrow.claimRefund`) — each
   donor withdraws exactly what they put in.

## Contracts

| Contract | Role |
| :--- | :--- |
| [`DonationEscrow.sol`](src/DonationEscrow.sol) | Holds contributions per need; handles excess refunds, fulfilment, and per-donor refunds |
| [`NeedRegistry.sol`](src/NeedRegistry.sol) | Needs and their lifecycle (Open → Funded → Fulfilled, or Cancelled) |
| [`RecipientRegistry.sol`](src/RecipientRegistry.sol) | Registered recipients, activation state |
| [`VendorRegistry.sol`](src/VendorRegistry.sol) | Registered vendors, activation state |

Settlement is in USDC; the test suite supplies its own ERC-20 mock. Uses
OpenZeppelin `SafeERC20` and `ReentrancyGuard`, and state changes precede
external calls (checks-effects-interactions) in `fulfillNeed`.

## Quickstart

```bash
forge build
forge test
```

20 tests cover the full lifecycle: registration, need creation and cancellation,
single- and multi-donor funding, excess refunding, fulfilment, refunds after
cancellation, and the revert paths (double refund, donating to a funded need,
fulfilling an unfunded need, non-owner fulfilment).

The frontend is a Next.js app under [`frontend/`](frontend) with need listing,
transparency, and admin views.

## Status and limitations

* **Not audited.** Nothing here has had a professional security review, and it
  has not held real funds.
* **Owner-privileged.** Need creation, fulfilment, and registry management are
  `onlyOwner`. That is a deliberate trust assumption for a pilot, not a
  decentralised design — a donor trusts the operator to create honest needs and
  fulfil them correctly. Escrow and refunds are what protect the donor if that
  trust fails, not the absence of trust.
* **Receipt hashes are attestations**, not proofs. The chain records that a
  receipt hash was submitted; it cannot verify that the receipt is genuine.

## History

Earlier versions of this repository described a "Quantum AI-Governed Philanthropy
Protocol" gating disbursement behind an "80% Quantum GHZ Entanglement Consensus
Proof." That layer has been removed. It verified nothing — the contract was
owner-only, took the impact score as an argument, and derived its "proof hash"
from the asserted number itself — and it was never deployed, never called by any
other contract or the frontend, and never tested.

The related empirical claims, inherited from a linked project, are retracted in
full: see
[CORRECTIONS.md](https://github.com/JonathanReiser/quantum-orch-or/blob/main/CORRECTIONS.md).
[`BASE_ECOSYSTEM_GRANT_PROPOSAL.md`](BASE_ECOSYSTEM_GRANT_PROPOSAL.md) is
retained with a withdrawal notice; it was never submitted.

None of that affected the contracts above, which were always independent of it.

## License

MIT.
