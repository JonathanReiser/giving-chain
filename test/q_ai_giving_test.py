"""
test/q_ai_giving_test.py — Unit tests for Q-AI Giving-Chain Integration.
"""

import os
import unittest
from q_ai_giving_engine import QAIGivingEngine

class TestQAIGiving(unittest.TestCase):
    def test_solidity_contract_exists(self):
        sol_path = "src/Q_AIGivingOracle.sol"
        self.assertTrue(os.path.exists(sol_path))
        content = open(sol_path).read()
        self.assertIn("contract Q_AIGivingOracle", content)
        self.assertIn("MIN_IMPACT_THRESHOLD = 8000", content)
        self.assertIn("submitQuantumNonProfitProof", content)
        self.assertIn("disburseCharityGrant", content)

    def test_generate_base_charity_payload(self):
        engine = QAIGivingEngine()
        payload = engine.generate_base_charity_payload(charity_id=101, impact_score=8850)
        self.assertEqual(payload["params"]["charityId"], 101)
        self.assertEqual(payload["params"]["impactScore"], 8850)
        self.assertTrue(payload["params"]["qiskitProofHash"].startswith("0x"))

    def test_grant_proposal_doc_exists(self):
        doc_path = "BASE_ECOSYSTEM_GRANT_PROPOSAL.md"
        self.assertTrue(os.path.exists(doc_path))
        content = open(doc_path).read()
        self.assertIn("Base Ecosystem Fund Grant Proposal", content)
        self.assertIn("$100,000 USD", content)

if __name__ == "__main__":
    unittest.main()
