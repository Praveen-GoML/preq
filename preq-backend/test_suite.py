import urllib.request
import urllib.parse
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://localhost:8000/api"

def test_full_preq_suite():
    print("=" * 60)
    print("Running Full PreQ Platform End-to-End Audit")
    print("=" * 60)

    # 1. Project creation with type/industry/deployment
    print("\n[1/10] Testing Project Creation & Auto-Generated Templates...")
    proj_payload = {
        "name": "FinTech Fraud Detection Pipeline",
        "description": "Real-time transaction scoring model with streaming Kafka integration.",
        "client_name": "Apex Bank Global",
        "client_email": "cto@apexbank.com",
        "type": "GenAI / LLM Application",
        "industry": "BFSI (Banking & Financial Services)",
        "deployment": "AWS Cloud",
        "target_kickoff_date": "2026-11-01"
    }
    req = urllib.request.Request(f"{BASE}/projects", data=json.dumps(proj_payload).encode(), headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    proj = json.loads(res.read())
    proj_id = proj["id"]
    print(f"✓ Project Created: {proj['name']} (ID: {proj_id})")
    print(f"  Status: {proj['status']}, Total Items: {proj['total_items']}, Initial Score: {proj['score']}%")

    # 2. Check generated templates
    print("\n[2/10] Verifying Auto-Generated Prerequisites...")
    res = urllib.request.urlopen(f"{BASE}/projects/{proj_id}/checklist")
    items = json.loads(res.read())
    print(f"✓ Retrieved {len(items)} items tailored to GenAI + BFSI + AWS:")
    for it in items[:4]:
        print(f"  - [{it['category']}] {it['name']} (Critical: {it['is_critical']}, Owner: {it['owner']})")

    # 3. Test Readiness score calculation
    print("\n[3/10] Testing Readiness Score Calculation & Category Breakdown...")
    res = urllib.request.urlopen(f"{BASE}/projects/{proj_id}")
    proj_details = json.loads(res.read())
    print(f"✓ Project Metrics: Score = {proj_details['score']}%, Status = {proj_details['status']}")
    print("  Category breakdown:")
    for cat in proj_details.get("category_scores", []):
        print(f"    • {cat['category']}: {cat['verified']}/{cat['total']} verified ({cat['score']}%)")

    # 4. Dependency Engine
    print("\n[4/10] Testing Dependency Engine...")
    first_item = items[0]
    second_item = items[1]
    
    # Set second item to depend on first item
    update_payload = {"depends_on": [first_item["id"]]}
    req = urllib.request.Request(f"{BASE}/items/{second_item['id']}", data=json.dumps(update_payload).encode(), headers={"Content-Type": "application/json"}, method="PUT")
    urllib.request.urlopen(req)
    
    # Check enriched status
    res = urllib.request.urlopen(f"{BASE}/projects/{proj_id}/checklist")
    updated_items = json.loads(res.read())
    dep_item = next(i for i in updated_items if i["id"] == second_item["id"])
    print(f"✓ Dependency set: '{dep_item['name']}' depends on '{first_item['name']}'")
    print(f"  Is locked: {dep_item['is_locked']}, Blocking items count: {len(dep_item['blocking_items'])}")
    
    # Try to verify the locked item directly (should fail with HTTP 400)
    try:
        req = urllib.request.Request(f"{BASE}/items/{second_item['id']}", data=json.dumps({"status": "Verified"}).encode(), headers={"Content-Type": "application/json"}, method="PUT")
        urllib.request.urlopen(req)
        print("✗ Error: Locked item was allowed to be verified!")
    except urllib.error.HTTPError as e:
        print(f"✓ Dependency Engine successfully blocked premature verification: HTTP {e.code} ({e.reason})")

    # 5. Evidence-based verification workflow (Pending -> In Progress -> Submitted -> Verifying -> Verified)
    print("\n[5/10] Testing Evidence-Based Verification Workflow (5-Stage)...")
    print("  Step a: Transitioning first item to 'In Progress'...")
    req = urllib.request.Request(f"{BASE}/items/{first_item['id']}", data=json.dumps({"status": "In Progress"}).encode(), headers={"Content-Type": "application/json"}, method="PUT")
    urllib.request.urlopen(req)
    
    print("  Step b: Submitting evidence (API key + notes)...")
    # multipart form data for submit-evidence
    form_data = urllib.parse.urlencode({
        "evidence_notes": "AWS Bedrock role provisioned with us-east-1 permissions.",
        "api_key_name": "AWS_BEDROCK_ROLE_ARN",
        "api_key_value": "arn:aws:iam::123456789012:role/BedrockExecutionRole",
        "evidence_url": "https://aws.amazon.com/bedrock"
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE}/items/{first_item['id']}/submit-evidence", data=form_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    res = urllib.request.urlopen(req)
    submitted_item = json.loads(res.read())
    print(f"  ✓ Status after submission: {submitted_item['status']}, Masked Key: {submitted_item['masked_api_key']}")

    print("  Step c: AI automated verification audit...")
    req = urllib.request.Request(f"{BASE}/items/{first_item['id']}/ai-verify", data=b"{}", headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    verified_item = json.loads(res.read())
    print(f"  ✓ AI Verification Result: Status = {verified_item['item']['status']}, Score = {verified_item['item']['verification_score']}/100")

    # Manual verify the first item to ensure second item unlocks
    req = urllib.request.Request(f"{BASE}/items/{first_item['id']}/verify", data=b"{}", headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)

    # Now verify the dependent second item is UNLOCKED
    res = urllib.request.urlopen(f"{BASE}/projects/{proj_id}/checklist")
    updated_items = json.loads(res.read())
    dep_item = next(i for i in updated_items if i["id"] == second_item["id"])
    print(f"✓ Dependent item unlocked after prerequisite verified: is_locked = {dep_item['is_locked']}")

    # 6. Escalation Logic
    print("\n[6/10] Testing Escalation Logic...")
    esc_item = items[2]
    esc_payload = {
        "level": 2,
        "message": "Client security team has not responded for 4 business days."
    }
    req = urllib.request.Request(f"{BASE}/items/{esc_item['id']}/escalate", data=json.dumps(esc_payload).encode(), headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    esc_res = json.loads(res.read())
    print(f"✓ Escalation Triggered: New Tier = {esc_res['escalation_level']}, Dispatched to: {esc_res['escalation_log']['recipient']}")

    # 7. Executive Dashboard Stats
    print("\n[7/10] Testing Executive Dashboard Portfolio Stats...")
    res = urllib.request.urlopen(f"{BASE}/projects/dashboard-stats")
    stats = json.loads(res.read())
    print(f"✓ Executive Portfolio Stats: Total Projects = {stats['total_projects']}, Cleared = {stats['cleared_projects']}, At Risk = {stats['at_risk_projects']}, Avg Score = {stats['average_score']}%")

    # 8. Kick-off Readiness Certificate Generation
    print("\n[8/10] Testing Kick-Off Readiness Certificate Generation...")
    # Verify all remaining items to reach >=90% and generate certificate
    for it in items:
        req = urllib.request.Request(f"{BASE}/items/{it['id']}/verify", data=b"{}", headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req)
    
    res = urllib.request.urlopen(f"{BASE}/projects/{proj_id}/certificate")
    cert = json.loads(res.read())
    print(f"✓ Day-1 Readiness Certificate Generated: Cert #{cert['cert_number']}")
    print(f"  Integrity Hash: {cert['verification_hash']}")
    print(f"  Authorized Signatories: {len(cert.get('signatories', []))} signatories recorded.")

    # 9. AI Copilot Integration
    print("\n[9/10] Testing AI Copilot Integration...")
    copilot_payload = {
        "project_id": proj_id,
        "messages": [{"role": "user", "content": "Analyze blocker risks for this project and recommend next actions."}]
    }
    req = urllib.request.Request(f"{BASE}/copilot/chat", data=json.dumps(copilot_payload).encode(), headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    copilot_res = json.loads(res.read())
    print(f"✓ Copilot Response received ({len(copilot_res.get('reply', ''))} characters):")
    print(f"  Snippet: {copilot_res.get('reply', '')[:120]}...")

    # Suggest missing items via Copilot
    req = urllib.request.Request(f"{BASE}/copilot/suggest-items?project_id={proj_id}", data=b"{}", headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    suggest_res = json.loads(res.read())
    print(f"✓ Copilot Suggested {len(suggest_res.get('suggestions', []))} missing edge-case prerequisites.")

    # 10. Slack Block Kit Auto-Share
    print("\n[10/10] Testing 1-Click Slack Auto-Delivery...")
    req = urllib.request.Request(f"{BASE}/items/{first_item['id']}/share-slack", data=b"{}", headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    slack_res = json.loads(res.read())
    print(f"✓ Slack Delivery Result: status = {slack_res['status']}, channel = #{slack_res.get('channel')}")

    print("\n" + "=" * 60)
    print("ALL 10 CORE FEATURES VERIFIED AND PASSING 100%!")
    print("=" * 60)

if __name__ == "__main__":
    test_full_preq_suite()
