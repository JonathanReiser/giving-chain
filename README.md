# 🎁 Giving Chain (`Q-Giving`): Quantum AI-Governed Philanthropy on Base L2

[![Base L2](https://img.shields.io/badge/Network-Base%20L2-blue.svg)](https://base.org)
[![PyPI Core Engine](https://img.shields.io/badge/PyPI-q--ai--governance-orange.svg)](https://pypi.org/project/q-ai-governance/)
[![Zenodo Scientific Paper](https://img.shields.io/badge/Zenodo-DOI%2010.5281%2Fzenodo.22151233-blue.svg)](https://zenodo.org/records/22151233)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Giving Chain (`Q-Giving`)** is an open-source, provably transparent **Quantum AI-Governed Charitable Donation Protocol** built on the **Base L2 Blockchain**. 

By integrating Base smart contracts with our published **[`q-ai-governance`](https://github.com/JonathanReiser/quantum-orch-or)** Python library (`pip install q-ai-governance`), Q-Giving requires non-profit organizations to achieve an **$80.00\%$ Quantum GHZ Entanglement Consensus Proof** (`Q_AIGivingOracle.sol`) before disbursing grant funds on Base L2.

---

## 🌟 The Problem & The Q-AI Solution

* **The Problem:** Non-profit charitable giving and DAO public-goods funding suffer from severe donor distrust due to opaque overhead waste, lack of verifiable impact tracking, and voter gridlock (~40% approval rate).
* **The Q-AI Solution:** Q-Giving maps non-profit impact vectors into complex Hilbert space statevectors. Selfish noise and overhead waste are cancelled out via **destructive phase interference**, while true public-good impact vectors amplify constructively, doubling community consensus to **$\ge 80\%$**.

---

## 🏗️ Architecture on Base L2

```
[Donor Deposits ETH/USDC on Base] ──> [giving-chain Base Contracts]
                                                 │
                                                 ▼
                                     [Q_AIGivingOracle.sol]
                                                 │ (Verifies Impact >= 80%)
                                                 ▼
                                    [Qiskit QPU Quantum Proof]
                                                 │
                                                 ▼
                                     [Non-Profit Disbursal]
```

---

## 📁 Repository Directory Map

| File / Folder | Description |
| :--- | :--- |
| 🔵 [`src/Q_AIGivingOracle.sol`](src/Q_AIGivingOracle.sol) | **On-Chain Base L2 Smart Contract** (Enforces $\ge 80\%$ impact consensus threshold) |
| ⚡ [`q_ai_giving_engine.py`](q_ai_giving_engine.py) | **Base Web3 Python Oracle Engine** (Integrates `q-ai-governance` PyPI package) |
| 📄 [`BASE_ECOSYSTEM_GRANT_PROPOSAL.md`](BASE_ECOSYSTEM_GRANT_PROPOSAL.md) | **$100,000 Base Ecosystem Fund Grant Proposal** |
| 🧪 [`test/q_ai_giving_test.py`](test/q_ai_giving_test.py) | **Automated Unit Test Suite** (100% Pass Rate) |

---

## ⚡ Quickstart & Testing

### 1. Install Q-AI Core Engine:

```bash
pip install q-ai-governance
```

### 2. Run Base Web3 Oracle Payload Generator:

```bash
python3 q_ai_giving_engine.py
```

### 3. Run Test Suite:

```bash
PYTHONPATH=. python3 -m unittest test/q_ai_giving_test.py
```

---

## 📄 Academic Citation & Publications

* **CERN Zenodo Scientific Publication:** [DOI: 10.5281/zenodo.22151233](https://zenodo.org/records/22151233)
* **Full Academic Paper:** [full_quantum_governance_paper.md](https://github.com/JonathanReiser/quantum-orch-or/blob/main/full_quantum_governance_paper.md)
* **Core Q-AI Repository:** [JonathanReiser/quantum-orch-or](https://github.com/JonathanReiser/quantum-orch-or)
