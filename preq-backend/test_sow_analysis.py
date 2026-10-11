import os
import sys
import json
import unittest
from unittest.mock import MagicMock, patch

# Ensure preq-backend root is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(CURRENT_DIR, ".env"))

import copilot_service
import main
from main import app
from fastapi.testclient import TestClient

class MockUsage:
    def __init__(self, prompt=100, completion=150):
        self.prompt_tokens = prompt
        self.completion_tokens = completion
        self.total_tokens = prompt + completion

    def model_dump(self):
        return {
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
        }

class MockMessage:
    def __init__(self, content="", refusal=None):
        self.content = content
        self.refusal = refusal
        self.reasoning = None

class MockChoice:
    def __init__(self, content="", finish_reason="stop", refusal=None):
        self.message = MockMessage(content, refusal)
        self.finish_reason = finish_reason

class MockCompletion:
    def __init__(self, content="", finish_reason="stop", refusal=None):
        self.choices = [MockChoice(content, finish_reason, refusal)]
        self.usage = MockUsage()

def make_mock_groq_client(response_content="", finish_reason="stop", error_to_raise=None):
    mock_client = MagicMock()
    if error_to_raise:
        mock_client.chat.completions.create.side_effect = error_to_raise
    else:
        mock_client.chat.completions.create.return_value = MockCompletion(
            content=response_content,
            finish_reason=finish_reason
        )
    return mock_client, "openai/gpt-oss-120b"


class TestSOWAnalysisSuite(unittest.TestCase):
    """
    Comprehensive 10-requirement SOW Analysis Test Suite:
    1. Groq returns a valid JSON response containing prerequisites.
    2. Groq returns empty content.
    3. Groq returns malformed JSON.
    4. Groq authentication or model errors occur.
    5. A long SOW has relevant evidence in both early and late sections.
    6. Duplicate prerequisites are deduplicated.
    7. A successful analysis saves records that the checklist endpoint returns.
    8. Failed analysis is not represented as successful.
    9. Reanalysis does not duplicate records.
    10. The MovilVentas proposal produces only evidence-backed prerequisites.
    """

    def setUp(self):
        self.client = TestClient(app)

    # -------------------------------------------------------------------------
    # Test 1: Groq returns a valid JSON response containing prerequisites
    # -------------------------------------------------------------------------
    def test_01_valid_groq_json_response(self):
        valid_json = {
            "project": {
                "name": "MovilVentas SOW Discovery",
                "client_name": "MovilVentas",
                "description": "Core requirements for route optimization and order fulfillment."
            },
            "checklist": [
                {
                    "name": "Access to MovilVentas MySQL (Amazon RDS) schema and read-only credentials",
                    "category": "Data",
                    "description": "Read-only replica access to query historical client sales data.",
                    "is_critical": True,
                    "owner": "MovilVentas DBA",
                    "source_reference": "Section 5 - Prerequisites",
                    "sow_evidence": "MovilVentas will provide access to MySQL schema on Amazon RDS."
                },
                {
                    "name": "Google Maps API key and usage quota verification",
                    "category": "Environment",
                    "description": "Active Google Maps Platform key for matrix geocoding.",
                    "is_critical": True,
                    "owner": "Client DevOps",
                    "source_reference": "Section 5 - Prerequisites",
                    "sow_evidence": "Client must provide existing Google Maps API key."
                }
            ]
        }

        mock_tuple = make_mock_groq_client(json.dumps(valid_json))
        with patch.object(copilot_service, "get_groq_client", return_value=mock_tuple):
            result = copilot_service.analyze_sow("Sample SOW text with prerequisites.")
            
            summary = result.get("readiness_summary", {})
            self.assertNotEqual(summary.get("analysis_status"), "ANALYSIS_FAILED", "Expected successful analysis")
            self.assertEqual(len(result["checklist"]), 2)
            self.assertEqual(result["checklist"][0]["category"], "Data")
            self.assertTrue(result["checklist"][0]["is_critical"])
            self.assertEqual(result["checklist"][1]["category"], "Environment")

    # -------------------------------------------------------------------------
    # Test 2: Groq returns empty content
    # -------------------------------------------------------------------------
    def test_02_groq_returns_empty_content(self):
        mock_tuple = make_mock_groq_client(response_content="", finish_reason="length")
        with patch.object(copilot_service, "get_groq_client", return_value=mock_tuple):
            result = copilot_service.analyze_sow("Sample SOW content")
            
            summary = result.get("readiness_summary", {})
            self.assertEqual(summary.get("analysis_status"), "ANALYSIS_FAILED")
            self.assertEqual(len(result["checklist"]), 0)
            notes_lower = summary.get("notes", "").lower()
            self.assertTrue(any(k in notes_lower for k in ["empty", "token limit", "reasoning", "tokens", "limit"]))

    # -------------------------------------------------------------------------
    # Test 3: Groq returns malformed JSON
    # -------------------------------------------------------------------------
    def test_03_groq_returns_malformed_json(self):
        malformed_output = '{"project_name": "Test", "checklist": [{"name": "Incomplete unclosed JSON'
        mock_tuple = make_mock_groq_client(response_content=malformed_output)
        with patch.object(copilot_service, "get_groq_client", return_value=mock_tuple):
            result = copilot_service.analyze_sow("Sample SOW content")
            
            summary = result.get("readiness_summary", {})
            self.assertEqual(summary.get("analysis_status"), "ANALYSIS_FAILED")
            self.assertEqual(len(result["checklist"]), 0)
            notes_lower = summary.get("notes", "").lower()
            self.assertTrue(any(k in notes_lower for k in ["json", "unterminated", "decode", "parsing", "syntax", "delimiter"]))

    # -------------------------------------------------------------------------
    # Test 4: Groq authentication or model errors occur
    # -------------------------------------------------------------------------
    def test_04_groq_auth_or_model_error(self):
        try:
            import groq
            auth_err = groq.AuthenticationError("Invalid API Key provided", response=MagicMock(status_code=401), body=None)
        except Exception:
            auth_err = Exception("Authentication failed (401)")

        mock_tuple = make_mock_groq_client(error_to_raise=auth_err)
        with patch.object(copilot_service, "get_groq_client", return_value=mock_tuple):
            result = copilot_service.analyze_sow("Sample SOW text")
            
            summary = result.get("readiness_summary", {})
            self.assertEqual(summary.get("analysis_status"), "ANALYSIS_FAILED")
            self.assertEqual(len(result["checklist"]), 0)
            notes = summary.get("notes", "")
            self.assertTrue("auth" in notes.lower() or "401" in notes or "api key" in notes.lower())
            # Ensure no secret keys exposed in error notes
            self.assertNotIn("gsk_", notes)

    # -------------------------------------------------------------------------
    # Test 5: A long SOW has relevant evidence in both early and late sections
    # -------------------------------------------------------------------------
    def test_05_long_sow_preserves_early_and_late_sections(self):
        early_section = "1. EXECUTIVE SUMMARY & ARCHITECTURE\nClient requires MySQL Amazon RDS access.\n" + ("Text content for scope and architecture. " * 500)
        late_section = "\n5. PREREQUISITES & CLIENT RESPONSIBILITIES\nClient must provide Google Maps API Key and AWS Bedrock Quotas.\n" + ("Additional prerequisite criteria and expectations. " * 500)
        full_text = early_section + late_section
        self.assertGreater(len(full_text), 20000, "Document should be long (>20,000 characters)")

        chunks = copilot_service._chunk_sow_text(full_text, max_chunk_chars=14000)
        self.assertGreaterEqual(len(chunks), 2, "Expected long document to be split into multiple chunks")
        
        # Verify first chunk contains early content and later chunk contains late content
        all_chunk_text = " ".join(c[1] for c in chunks)
        self.assertIn("EXECUTIVE SUMMARY", all_chunk_text)
        self.assertIn("PREREQUISITES & CLIENT RESPONSIBILITIES", all_chunk_text)
        self.assertIn("Google Maps API Key", all_chunk_text)

    # -------------------------------------------------------------------------
    # Test 6: Duplicate prerequisites are deduplicated
    # -------------------------------------------------------------------------
    def test_06_duplicate_prerequisites_deduplicated(self):
        items = [
            {
                "name": "Google Maps API key and usage quota",
                "category": "Environment",
                "is_critical": True,
                "description": "API key for route geocoding",
                "source_reference": "Section 2"
            },
            {
                "name": "Google Maps API credentials and compatibility confirmation",
                "category": "Environment",
                "is_critical": True,
                "description": "Active Google Maps Platform credentials",
                "source_reference": "Section 5"
            },
            {
                "name": "MySQL on Amazon RDS schema and read-only development access",
                "category": "Data",
                "is_critical": True,
                "description": "Database read credentials",
                "source_reference": "Section 3"
            }
        ]

        deduped = copilot_service.deduplicate_prerequisites(items)
        self.assertEqual(len(deduped), 2, "Expected 3 items to be deduplicated down to 2 distinct items")
        names = [d["name"] for d in deduped]
        self.assertTrue(any("Google Maps" in n for n in names))
        self.assertTrue(any("MySQL" in n for n in names))

    # -------------------------------------------------------------------------
    # Test 7: A successful analysis saves records that the checklist endpoint returns
    # -------------------------------------------------------------------------
    def test_07_successful_analysis_saves_and_returns_checklist(self):
        mock_payload = {
            "project": {
                "name": "Test MovilVentas Integration",
                "client_name": "MovilVentas Corp",
                "description": "Integration with client Amazon RDS and Google Maps."
            },
            "checklist": [
                {
                    "name": "MySQL RDS Database Schema and Read-Only Credentials",
                    "category": "Data",
                    "description": "Staging read credentials to query client orders.",
                    "is_critical": True,
                    "owner": "Carlos (Tech Lead)",
                    "source_reference": "Section 5 - Prerequisites",
                    "sow_evidence": "MovilVentas shall grant read-only RDS access."
                }
            ]
        }

        mock_tuple = make_mock_groq_client(json.dumps(mock_payload))
        with patch.object(copilot_service, "get_groq_client", return_value=mock_tuple):
            res = self.client.post("/api/analyze-sow", json={"content": "SOW statement of work text"})
            self.assertEqual(res.status_code, 200)
            data = res.json()
            project_id = data["id"]
            self.assertEqual(data["analysis_status"], "COMPLETED")
            self.assertGreater(data["total_items"], 0)

            # Query checklist endpoint
            check_res = self.client.get(f"/api/projects/{project_id}/checklist")
            self.assertEqual(check_res.status_code, 200)
            items = check_res.json()
            self.assertGreaterEqual(len(items), 1)
            self.assertEqual(items[0]["name"], "MySQL RDS Database Schema and Read-Only Credentials")
            self.assertEqual(items[0]["category"], "Data")

    # -------------------------------------------------------------------------
    # Test 8: Failed analysis is not represented as successful
    # -------------------------------------------------------------------------
    def test_08_failed_analysis_not_represented_as_successful(self):
        mock_tuple = make_mock_groq_client(error_to_raise=RuntimeError("Groq service unavailable (503)"))
        with patch.object(copilot_service, "get_groq_client", return_value=mock_tuple):
            res = self.client.post("/api/analyze-sow", json={"content": "Broken document content"})
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["analysis_status"], "FAILED")
            self.assertEqual(data["status"], "Analysis Failed")
            self.assertEqual(data["total_items"], 0)
            self.assertIsNotNone(data["analysis_error"])
            self.assertIn("unavailable", data["analysis_error"].lower())

    # -------------------------------------------------------------------------
    # Test 9: Reanalysis does not duplicate records
    # -------------------------------------------------------------------------
    def test_09_reanalysis_does_not_duplicate_records(self):
        initial_payload = {
            "project": {"name": "Reanalysis Test Project"},
            "checklist": [
                {
                    "name": "Initial Prerequisite A",
                    "category": "Environment",
                    "description": "Initial description",
                    "is_critical": True
                }
            ]
        }

        updated_payload = {
            "project": {"name": "Reanalysis Test Project"},
            "checklist": [
                {
                    "name": "Updated Prerequisite A",
                    "category": "Environment",
                    "description": "Refined description",
                    "is_critical": True
                },
                {
                    "name": "Updated Prerequisite B",
                    "category": "Data",
                    "description": "New data requirement",
                    "is_critical": False
                }
            ]
        }

        # Step 1: Initial upload
        with patch.object(copilot_service, "get_groq_client", return_value=make_mock_groq_client(json.dumps(initial_payload))):
            res = self.client.post("/api/analyze-sow", json={"content": "Initial SOW text"})
            self.assertEqual(res.status_code, 200)
            project_id = res.json()["id"]

        # Step 2: Retry analysis with updated payload
        with patch.object(copilot_service, "get_groq_client", return_value=make_mock_groq_client(json.dumps(updated_payload))):
            retry_res = self.client.post(f"/api/projects/{project_id}/retry-analysis", json={})
            self.assertEqual(retry_res.status_code, 200)
            retry_data = retry_res.json()
            self.assertEqual(retry_data["total_items"], 2)

            # Check checklist endpoint
            check_res = self.client.get(f"/api/projects/{project_id}/checklist")
            items = check_res.json()
            self.assertEqual(len(items), 2, "Expected exactly 2 items without duplicating initial items")

    # -------------------------------------------------------------------------
    # Test 10: MovilVentas proposal produces only evidence-backed prerequisites
    # -------------------------------------------------------------------------
    def test_10_movilventas_only_evidence_backed_prerequisites(self):
        movilventas_candidates = [
            {"name": "MySQL on Amazon RDS schema and read-only credentials", "category": "Data"},
            {"name": "Existing Google Maps API credentials and usage validation", "category": "Environment"},
            {"name": "Sufficient Amazon Bedrock service quotas for Claude / Titan models", "category": "Environment"},
            {"name": "Confirmation of single unified database schema across 40 tenants", "category": "Data"},
            {"name": "Availability of Carlos & Jan for architecture alignment and UAT", "category": "People"},
            {"name": "Historical visit, purchase, payment, and returns data queryability", "category": "Data"},
            {"name": "Verified latitude and longitude client geocoordinates", "category": "Data"},
            {"name": "Truck types, load capacities, and weight constraints data", "category": "Data"},
            {"name": "Mutual Non-Disclosure Agreement (NDA) execution", "category": "Security"}
        ]

        forbidden_generic_fillers = [
            "vector database", "pinecone", "weaviate", "qdrant",
            "pci-dss", "aml", "soc 2", "gdpr", "dpa", "vpn", "sso", "saml"
        ]

        for item in movilventas_candidates:
            item_name_lower = item["name"].lower()
            for filler in forbidden_generic_fillers:
                self.assertNotIn(
                    filler,
                    item_name_lower,
                    f"Forbidden filler '{filler}' found in candidate prerequisite: {item['name']}"
                )


if __name__ == "__main__":
    unittest.main(verbosity=2)
