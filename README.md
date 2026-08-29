## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

# Giving Chain 🎁

Transparent, AI-governed non-profit donation platform tracked on the **Base Blockchain**.

---

## ⚛️ Quantum AI Philanthropy Integration (`Q-Giving`)

`giving-chain` integrates with **[`q-ai-governance`](https://github.com/JonathanReiser/quantum-orch-or)** (`pip install q-ai-governance`) to enforce **Quantum-Cognitive GHZ Entanglement Consensus proofs ($\ge 80\%$)** on Base L2 before disbursing non-profit grant allocations.

### Key Components

* 🔵 **Base L2 Smart Contract:** [`src/Q_AIGivingOracle.sol`](src/Q_AIGivingOracle.sol) (Enforces $\ge 80\%$ impact score)
* ⚡ **Python Web3 Oracle:** [`q_ai_giving_engine.py`](q_ai_giving_engine.py)
* 📄 **$100,000 Base Ecosystem Grant Proposal:** [`BASE_ECOSYSTEM_GRANT_PROPOSAL.md`](BASE_ECOSYSTEM_GRANT_PROPOSAL.md)

---

## Features

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
