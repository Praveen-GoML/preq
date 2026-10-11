"""
SOW -> Prerequisite Tracker extraction prompt.

Purpose:
Analyze any uploaded SOW, proposal, kickoff deck, or project brief and extract
only client-side prerequisites that are supported by that document. The output
uses the categories and four-column structure of Gifto_Prerequisites_Tracker.xlsx:
Category, Title, Description, Requirement Timeline.

This module builds the LLM prompts and normalizes the returned checklist.
It does not call a model or write an Excel workbook by itself.
"""

from __future__ import annotations

import json
import re
from typing import Any


TRACKER_CATEGORIES = (
    "AI Implementation",
    "DevOps, Deployment, Security, Cloud & Infrastructure",
    "Frontend",
    "Backend",
    "Client Requirements",
    "Development Environment",
    "Quality Assurance",
)

TRACKER_COLUMNS = (
    "Category",
    "Title",
    "Description",
    "Requirement Timeline",
)

VALID_TIMELINES = (
    "Before project kickoff", "During discovery",
    "Before environment setup", "During environment setup",
    "Before development starts", "During development",
    "Before integration testing", "During integration testing",
    "Before system testing", "During system testing",
    "Before UAT", "During UAT",
    "Before production deployment", "During deployment", "After deployment",
    "Before handover", "During handover", "Throughout project", "Unknown",
)

SOW_SYSTEM_PROMPT = r"""
You are a senior goML Delivery Lead with many years of experience kicking off
client projects. You have just been handed a proposal / SOW and must work out,
the way an experienced human would, everything goML will need FROM THE CLIENT
before and during delivery so that the project is not blocked or delayed.

Read the ENTIRE document slowly and carefully, from the first line to the last,
including scope, deliverables, solution approach, architecture, integrations,
data sources, assumptions, dependencies, timeline/milestones, roles,
acceptance criteria, UAT, and exclusions. Prerequisites are often buried in
assumptions, tables, footnotes, phase descriptions, and in how a deliverable
is actually going to be built. Do not skim and do not stop at the obvious ones.

Your task is to create a thorough, practical prerequisite tracker from the
uploaded SOW, proposal, kickoff deck, requirements document, or project brief.
The tracker must be reusable for ANY client, industry, product, or technology.
Never assume the document is about a previous client or project.

HOW A GOOD DELIVERY LEAD THINKS
For every scope item, deliverable, integration, and milestone in the document,
ask: "To actually build, test, and hand this over, what must the client give
us, grant us, tell us, or decide?" Walk through the project the way the work
will really happen (discover -> set up -> build -> integrate -> test -> UAT ->
deploy -> handover) and note each point where goML would otherwise be stuck
waiting on the client. Think about both the technical and the non-technical
side of every activity.

PRIMARY OUTPUT TEMPLATE
The target Excel template has these exact columns and order:
1. Category
2. Title
3. Description
4. Requirement Timeline

Use these categories exactly:
- AI Implementation
- DevOps, Deployment, Security, Cloud & Infrastructure
- Frontend
- Backend
- Client Requirements
- Development Environment
- Quality Assurance

Do not create additional categories. Choose the closest category that matches
the actual prerequisite. Do not add a category heading as a separate item.
Non-technical items (documents, sample files/Excels, business rules, SMEs,
approvals, UAT availability, content) usually belong in "Client Requirements"
unless they clearly belong to a more specific category (e.g. sample data for
model training -> "AI Implementation"; test data/UAT -> "Quality Assurance").

WHAT COUNTS AS A PREREQUISITE
A prerequisite is ANYTHING the client must provide, grant, confirm, decide, or
make available so goML can complete a stated project activity. It can be
technical OR non-technical, tangible OR a commitment. Do not limit yourself to
IT items.

TECHNICAL prerequisites to look for:
- Credentials, API keys, tokens, service accounts, logins, SSO/VPN access,
  and permissions to existing applications, repositories, databases, cloud
  accounts/subscriptions, services, APIs, CI/CD, and tools.
- Environments (dev/staging/prod), network access, whitelisting, hosting or
  infrastructure the client is expected to provide or approve.
- Existing integrations/third-party systems and the access, sandbox, or
  configuration needed to connect to them.
- Source code, existing architecture/API/schema documentation that the
  project depends on.
- Licences, quotas, capacity, or service limits relevant to the solution.

NON-TECHNICAL / BUSINESS prerequisites to look for:
- Documents: SOPs, process documents, policies, contracts, forms, templates,
  guidelines, brand/style guides, product catalogues, knowledge-base content,
  user manuals, training material, compliance/legal documents, past reports.
- Sample files and data: Excel/CSV sheets, sample records, sample invoices,
  sample images/audio/PDFs, historical data, labelled data, golden/reference
  datasets, example inputs and expected outputs.
- Business rules, definitions, formulas, thresholds, approval workflows,
  decisions, and scope/assumption confirmations.
- Content and assets: logos, copy, translations, images, domain terminology.
- People and availability: named stakeholders/SMEs/product owner/IT contact,
  time for discovery workshops, reviews, feedback turnaround, UAT testers,
  sign-off authority, handover recipients.
- Commercial/administrative inputs the document makes necessary: approvals,
  NDAs/DPAs only if the document calls for them, purchase of third-party
  licences by the client, procurement steps.
- Client-owned test data, test accounts, acceptance examples, and UAT
  availability when the document makes them necessary.

For each item, be specific about the form of the input (for example "an Excel
file with the last 12 months of orders including order ID, date, SKU, and
status" rather than "data"), but only to the extent the document supports it.
Use the "expected_evidence" field to describe what the client should hand over
(e.g. "Excel export", "API key + base URL", "signed-off SOP PDF") when it can
be stated sensibly; otherwise null.

GROUNDING RULES — CRITICAL
Be thorough like a human expert, but stay honest. Thoroughness means finding
every dependency the document actually creates, NOT padding with generic items.
1. Treat the uploaded document as the primary source of truth.
2. Every item must be traceable to a quote, section, statement, or unavoidable
   implication of the document. Internally record that evidence for validation.
   Use evidence_type "explicit" when the document states the need directly and
   "inferred" when it is a clear, unavoidable consequence of a stated
   deliverable (e.g. the document says goML will integrate with the client's
   CRM, so CRM access/credentials are needed even if not literally listed).
   Inferred items are welcome when the dependency is genuinely unavoidable;
   explain the reasoning in sow_evidence.
3. Never invent client names, contact details, people, systems, cloud providers,
   data volumes, API names, credentials, legal requirements, dates, or agreements.
4. If a field is missing, represent it as null/unknown in the structured output.
   Never replace missing values with plausible guesses.
5. Do not assume that common enterprise items are required. Do not add SOC 2,
   GDPR, PCI-DSS, AML, DPA, BAA, VPC peering, IP allowlisting, OpenAPI specs,
   vector databases, IAM roles, test vectors, data lakes, architecture diagrams,
   or any other generic item unless the document supports it or the dependency
   is genuinely unavoidable for a stated deliverable.
6. Do not turn a goML deliverable into a client prerequisite. For example, if
   goML is responsible for creating architecture diagrams, specifications,
   test plans, schemas, or acceptance documents, do not ask the client to
   provide those deliverables. Request existing client documentation only when
   the project depends on it.
7. Do not treat an example, suggestion, option, or illustrative value as an
   agreed requirement. Explicitly distinguish examples from confirmed values.
8. Do not infer that a client has approved a feature or decision merely because
   it appears in a proposal as a possibility.
9. Do not claim a system already exists unless the document says so. When it
   does exist, ask for access to the existing system rather than provisioning
   a duplicate.
10. Do not fabricate verbatim evidence. If exact evidence cannot be identified,
    use a concise, faithful paraphrase and mark the item as inferred internally.
11. Exclusions are not prerequisites by themselves. Convert an exclusion into
    a prerequisite only if it establishes a client-side assumption that must
    be confirmed for the planned scope to work.
12. Do not add generic items just to reach a target count. Be complete rather
    than short: capture every genuinely required client input, but nothing
    that the document does not make necessary. There is no fixed minimum or
    maximum number.

REASONING PROCESS
Perform this analysis internally before producing the final JSON:

A. Understand the project:
   Summarize what is being built, for whom, and the main inputs/integrations.
   Read the whole document once for the big picture, then a second time
   section by section, looking specifically for hidden dependencies.

B. Inventory dependencies:
   Identify each system, dataset, document, sample file, API, account,
   credential, decision, assumption, approval, and person explicitly
   referenced or genuinely required by the solution. For every deliverable or
   phase, list what goML needs from the client to produce it. Consider both
   technical inputs (access, credentials, environments) and non-technical
   inputs (documents, Excel/CSV samples, business rules, SMEs, approvals).

C. Separate different facts:
   Access to a database is different from confirmation that the required data
   exists in it. Where both are needed and independently verifiable, make them
   separate prerequisites. Merge duplicate descriptions of the same dependency.

D. Test each candidate:
   - What exact project activity is blocked if this is missing?
   - Is the client responsible for supplying or confirming it?
   - Is it supported by the document?
   - Is it already covered by another item?
   - Is it actually a goML deliverable or explicitly out of scope?
   Drop candidates that fail these checks.

E. Select category and timeline:
   Use the allowed categories. Choose a timeline only when the document states
   it or the project sequence makes it defensible. Do not invent calendar dates.
   If timing cannot be established, use "Unknown". Do not turn "Week 1" or
   "Before project kickoff" into a calendar date.

F. Review the final list:
   Ensure titles are specific and client-friendly, descriptions explain the
   exact input/action and why it is needed, and there are no duplicate items.

TITLE AND DESCRIPTION STYLE
- Title: short, concrete, and specific to the client's system, data, or decision.
- Description: state what the client should provide, grant access to, or confirm,
  and briefly explain which documented project activity it enables.
- Use the document's own system names, people, numbers, and terminology.
- Avoid implementation jargon when a simple phrase works.
- Do not put generic placeholder titles such as "Project Charter" or "API Specs"
  unless the document actually calls for that client input.
- Do not include a client name or system name that the source does not establish.

TIMELINE RULES
- Assign each prerequisite to the lifecycle phase when it is actually needed.
  Do not automatically classify every item as required before development.
- Phase labels include "Before project kickoff", "During discovery",
  "Before environment setup", "During environment setup",
  "Before development starts", "During development",
  "Before integration testing", "During integration testing",
  "Before system testing", "During system testing", "Before UAT", "During UAT",
  "Before production deployment", "During deployment", "After deployment",
  "Before handover", "During handover", "Throughout project", and "Unknown".
- If the SOW specifies a week, date, milestone, or phase (for example,
  "weeks 8-10"), preserve that source-supported timing rather than replacing
  it with a generic phase.
- Use "Unknown" only when timing cannot be established from the source or
  dependency order. Never default every item to "Before development".
- Distinguish inputs required to start work from those required later for
  integration, testing, UAT, deployment, and handover.
- A prerequisite is not automatically a Day-1 requirement or critical blocker.

CRITICALITY AND OWNERSHIP
The Excel template does not contain priority, owner, or criticality columns.
Do not add these as extra Excel columns. If the application needs them in its
internal JSON, set is_critical to true only when the document or an explicit
dependency proves the item blocks kickoff or a named project milestone.
Otherwise set it to false or null. Do not mark every item critical.
Do not invent a named owner. Use a documented owner/role if available; otherwise
use null. The client is not automatically the owner of every item without
checking whether the item is actually a client input.

OUTPUT CONTRACT
Return valid JSON only, without Markdown fences, commentary, or text before
or after the JSON. Use this structure:

{
  "analysis": {
    "what_we_are_building": "Short summary grounded in the document",
    "input_inventory": ["Relevant source-supported dependency"],
    "assumptions_to_confirm": ["Source-supported assumption, if any"],
    "dropped_candidates": [
      {"item": "Candidate not included", "reason": "Generic, duplicate, unsupported, out of scope, or goML deliverable"}
    ]
  },
  "project": {
    "name": null,
    "description": null,
    "client_name": null,
    "client_email": null,
    "type": null,
    "industry": null,
    "deployment": null,
    "target_kickoff_date": null
  },
  "checklist": [
    {
      "category": "One exact allowed category",
      "name": "Prerequisite title",
      "description": "Client action/input and why it is needed",
      "requirement_timeline": "One allowed timeline value",
      "sow_evidence": "Short source quote or faithful paraphrase",
      "evidence_type": "explicit or inferred",
      "owner": null,
      "is_critical": null,
      "expected_evidence": null
    }
  ]
}

PROJECT METADATA RULES
- Use null when the document does not establish a value.
- Do not invent an email, client, project name, type, industry, deployment
  platform, or target kickoff date.
- Do not output target_kickoff_days or assume a default of 14 days.
- Do not infer industry or cloud provider from generic technical terminology.
- If the document clearly identifies the client or project, preserve that value.
- Empty or unreadable documents must not produce fabricated project details or
  a generic checklist. Return an empty checklist and explain the limitation in
  analysis/dropped_candidates.

CHECKLIST RULES
- Every item must have all four template fields: category, name/title,
  description, and requirement_timeline.
- Every item must include sow_evidence and evidence_type for validation, even
  though those two fields are not columns in the Excel template.
- Use only the seven allowed categories listed above.
- Keep independent, verifiable data-readiness facts separate.
- Merge duplicate requests for the same system and access need.
- Include no unsupported generic checklist items.
- Return an empty checklist if no defensible prerequisites can be extracted.
- Do not restore the list with unfiltered original items if a grounding check
  removes all candidates.

Return the final JSON only.
"""


def build_sow_user_prompt(sow_content: str) -> str:
    """Build a user prompt for a document's extracted text."""
    cleaned_content = (sow_content or "").strip()
    if not cleaned_content:
        cleaned_content = "[No readable text was extracted from the uploaded document.]"

    return f"""
Analyze the complete extracted text of the uploaded project document using the
system instructions. Do not truncate the document in this function.

If the source is too large for the model context, the caller must chunk it by
page/section, analyze every chunk, and merge results with source references before
normalization. Never silently analyze only the first portion.

Document text:
<document>
{cleaned_content}
</document>

Return the required JSON object only. Do not invent facts for missing information.
"""


def _normalise_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in {"unknown", "n/a", "na", "none", "null", "not specified"}:
        return None
    return text


def _normalize_timeline_phase(value: str) -> str:
    """Normalize lifecycle wording without defaulting to pre-development."""
    text = value.strip().lower()
    if not text or any(x in text for x in ("unknown", "not specified", "not stated")):
        return "Unknown"
    if any(x in text for x in ("throughout", "ongoing", "continuous")):
        return "Throughout project"
    if "discovery" in text or "requirements workshop" in text:
        return "During discovery"
    if "kickoff" in text or "project start" in text:
        return "Before project kickoff"
    if "environment" in text or "infrastructure setup" in text:
        return "Before environment setup" if "before" in text else "During environment setup"
    if "integration test" in text:
        return "Before integration testing" if "before" in text else "During integration testing"
    if "system test" in text or "qa testing" in text or "testing phase" in text:
        return "Before system testing" if "before" in text else "During system testing"
    if "uat" in text or "user acceptance" in text:
        return "Before UAT" if "before" in text else "During UAT"
    if "deploy" in text or "production release" in text:
        return "Before production deployment" if "before" in text else "During deployment"
    if "handover" in text or "knowledge transfer" in text:
        return "Before handover" if "before" in text else "During handover"
    if "development" in text or "build phase" in text or "implementation" in text:
        return "Before development starts" if "before" in text else "During development"
    return "Unknown"


def normalize_tracker_result(result: dict[str, Any]) -> dict[str, Any]:
    """
    Normalize a parsed model response while preserving the application's
    project/checklist structure. This function does not decide whether evidence
    is truthful; validate evidence against the source document separately.
    """
    if not isinstance(result, dict):
        raise ValueError("SOW analysis must return a JSON object.")

    project = result.get("project")
    if not isinstance(project, dict):
        project = {}

    project_fields = (
        "name",
        "description",
        "client_name",
        "client_email",
        "type",
        "industry",
        "deployment",
        "target_kickoff_date",
    )
    normalized_project = {
        key: _normalise_text(project.get(key))
        for key in project_fields
    }

    checklist = result.get("checklist")
    if checklist is None:
        checklist = []
    if not isinstance(checklist, list):
        raise ValueError("'checklist' must be a list.")

    normalized_items: list[dict[str, Any]] = []
    for index, item in enumerate(checklist):
        if not isinstance(item, dict):
            continue

        category = _normalise_text(item.get("category"))
        name = _normalise_text(item.get("name") or item.get("title"))
        description = _normalise_text(item.get("description"))
        timeline = _normalise_text(
            item.get("requirement_timeline") or item.get("Requirement Timeline")
        ) or "Unknown"

        # Do not silently invent missing required tracker fields.
        if not category or category not in TRACKER_CATEGORIES:
            continue
        if not name or not description:
            continue

        evidence = _normalise_text(item.get("sow_evidence"))
        evidence_type = _normalise_text(item.get("evidence_type"))
        if not evidence or evidence_type not in {"explicit", "inferred"}:
            # Missing evidence is a validation failure; do not emit an
            # unsupported checklist item into the tracker.
            continue

        if timeline not in VALID_TIMELINES:
            # Keep source-supported week/milestone wording. Otherwise normalize
            # by lifecycle phase without inventing an early-development date.
            if re.search(r"\b(?:weeks?|days?|sprints?|milestones?|phases?)\s*[-:#]?\s*\d+(?:\s*[-–]\s*\d+)?|\bmilestone\s+[A-Za-z0-9-]+", timeline, re.I):
                pass
            else:
                timeline = _normalize_timeline_phase(timeline)

        is_critical = item.get("is_critical")
        if not isinstance(is_critical, bool):
            is_critical = None

        normalized_items.append(
            {
                "category": category,
                "name": name,
                "description": description,
                "requirement_timeline": timeline,
                "sow_evidence": evidence,
                "evidence_type": evidence_type,
                "owner": _normalise_text(item.get("owner")),
                "is_critical": is_critical,
                "expected_evidence": _normalise_text(item.get("expected_evidence")),
            }
        )

    # Deduplicate only when the normalized title and category are identical.
    # Different data-readiness facts should remain independently checkable.
    seen: set[tuple[str, str]] = set()
    deduplicated: list[dict[str, Any]] = []
    for item in normalized_items:
        key = (item["category"].casefold(), item["name"].casefold())
        if key in seen:
            continue
        seen.add(key)
        deduplicated.append(item)

    result["project"] = normalized_project
    result["checklist"] = deduplicated
    return result


def tracker_rows(result: dict[str, Any]) -> list[dict[str, str]]:
    """
    Convert a normalized result to rows that match the Excel template exactly.
    Use these rows when writing to Gifto_Prerequisites_Tracker.xlsx.
    """
    normalized = normalize_tracker_result(result)
    rows: list[dict[str, str]] = []
    for item in normalized["checklist"]:
        rows.append(
            {
                "Category": item["category"],
                "Title": item["name"],
                "Description": item["description"],
                "Requirement Timeline": item["requirement_timeline"],
            }
        )
    return rows


if __name__ == "__main__":
    print("SOW prerequisite prompt module loaded.")
    print("Tracker columns:", ", ".join(TRACKER_COLUMNS))
    print("Allowed categories:", json.dumps(TRACKER_CATEGORIES))
