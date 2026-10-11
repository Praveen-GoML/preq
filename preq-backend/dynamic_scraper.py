import re
import json
import logging
import asyncio
from typing import Dict, Any, Optional, List
import httpx
from bs4 import BeautifulSoup
import copilot_service

logger = logging.getLogger(__name__)

# In-memory and disk cache for scraped credential guides
_GUIDE_CACHE: Dict[str, Dict[str, Any]] = {}

# Curated high-authority official documentation endpoints for enterprise services
OFFICIAL_DOCS_CATALOG = {
    "whatsapp": {
        "doc_url": "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
        "console_url": "https://business.facebook.com/settings/whatsapp-business-accounts",
        "service_name": "WhatsApp Business Platform (Meta Cloud API)",
        "console_name": "Meta Business Manager / Developer Portal"
    },
    "github": {
        "doc_url": "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
        "console_url": "https://github.com/settings/tokens",
        "service_name": "GitHub Repository & Organization Access",
        "console_name": "GitHub Developer Settings"
    },
    "gitlab": {
        "doc_url": "https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html",
        "console_url": "https://gitlab.com/-/user_settings/personal_access_tokens",
        "service_name": "GitLab Project & Token Access",
        "console_name": "GitLab User Settings"
    },
    "aws": {
        "doc_url": "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-user.html",
        "console_url": "https://console.aws.amazon.com/iam/home#/roles",
        "service_name": "AWS IAM Cross-Account Role & S3 Access",
        "console_name": "AWS IAM Management Console"
    },
    "google maps": {
        "doc_url": "https://developers.google.com/maps/documentation/javascript/get-api-key",
        "console_url": "https://console.cloud.google.com/google/maps-apis/credentials",
        "service_name": "Google Maps Platform API",
        "console_name": "Google Cloud Platform Console"
    },
    "stripe": {
        "doc_url": "https://docs.stripe.com/keys",
        "console_url": "https://dashboard.stripe.com/apikeys",
        "service_name": "Stripe Payments Restricted API Keys",
        "console_name": "Stripe Developer Dashboard"
    },
    "openai": {
        "doc_url": "https://platform.openai.com/docs/quickstart",
        "console_url": "https://platform.openai.com/api-keys",
        "service_name": "OpenAI Platform Model Inference Key",
        "console_name": "OpenAI Platform Console"
    },
    "anthropic": {
        "doc_url": "https://docs.anthropic.com/en/api/getting-started",
        "console_url": "https://console.anthropic.com/settings/keys",
        "service_name": "Anthropic Claude API Key",
        "console_name": "Anthropic Console"
    },
    "salesforce": {
        "doc_url": "https://help.salesforce.com/s/articleView?id=sf.connected_app_create_api_integration.htm",
        "console_url": "https://login.salesforce.com",
        "service_name": "Salesforce Connected App OAuth 2.0",
        "console_name": "Salesforce Setup App Manager"
    },
    "slack": {
        "doc_url": "https://api.slack.com/messaging/webhooks",
        "console_url": "https://api.slack.com/apps",
        "service_name": "Slack Incoming Webhooks & Bot App",
        "console_name": "Slack API App Management"
    },
    "teams": {
        "doc_url": "https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook",
        "console_url": "https://teams.microsoft.com",
        "service_name": "Microsoft Teams Webhook & Connector",
        "console_name": "Microsoft Teams Workflows"
    },
    "snowflake": {
        "doc_url": "https://docs.snowflake.com/en/user-guide/admin-user-management",
        "console_url": "https://app.snowflake.com",
        "service_name": "Snowflake Data Warehouse User & Role",
        "console_name": "Snowflake Snowsight Console"
    },
    "database": {
        "doc_url": "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ConnectToPostgreSQLInstance.html",
        "console_url": "https://console.aws.amazon.com/rds/home",
        "service_name": "PostgreSQL / MySQL Staging Database",
        "console_name": "Cloud Database RDS Console"
    }
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
]

def _find_catalog_match(text: str) -> Optional[Dict[str, str]]:
    text_lower = text.lower()
    for key, data in OFFICIAL_DOCS_CATALOG.items():
        if key in text_lower:
            return data
    return None

async def fetch_and_clean_web_doc(url: str, timeout: int = 8) -> str:
    """
    Acquires HTML from the official documentation URL and extracts clean textual instructions,
    inspired by demo_bundle's AcquireStage and CleanHTML transformers.
    """
    headers = {
        "User-Agent": USER_AGENTS[0],
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
    }
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=timeout) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                # Remove scripts, styles, navigation, footer boilerplate
                for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg"]):
                    tag.decompose()
                
                # Extract clean article/body text
                main_content = soup.find("article") or soup.find("main") or soup.body
                if main_content:
                    text = main_content.get_text(separator=" ", strip=True)
                    # Limit to first 3500 chars of high-value instruction text
                    return re.sub(r"\s+", " ", text)[:3500]
    except Exception as e:
        logger.warning(f"Live web scrape failed for {url}: {e}")
    return ""

async def generate_dynamic_credential_guide(
    name: str,
    category: str = "Integration",
    description: str = "",
    expected_evidence: str = "",
    client_name: str = "Client Sponsor"
) -> Dict[str, Any]:
    """
    Dynamically generates a comprehensive, non-technical credential retrieval guide
    using live web scraping + AI synthesis (Groq Llama 3.3 70B/8B).
    """
    cache_key = f"{name.strip().lower()}:{category.strip().lower()}"
    if cache_key in _GUIDE_CACHE:
        return _GUIDE_CACHE[cache_key]

    # Check if item relates to credentials/access
    text_blob = f"{name} {description} {expected_evidence}".lower()
    is_cred = any(kw in text_blob for kw in [
        "key", "cred", "token", "secret", "access", "api", "auth", "login",
        "webhook", "role", "iam", "account", "database", "sql", "oauth",
        "whatsapp", "repository", "repo", "catalog", "payment", "checkout",
        "dataset", "s3", "storage"
    ])

    if not is_cred:
        res = {
            "isCredential": False,
            "serviceName": "Technical Deliverable",
            "category": category,
            "quickSteps": [
                {"num": 1, "action": "Review Deliverable Specification", "detail": "Inspect the required schemas, SLA benchmarks, or architectural diagrams."},
                {"num": 2, "action": "Assemble Artifact", "detail": "Export OpenAPI YAML, database schema dictionary, or signed DPA agreement."},
                {"num": 3, "action": "Upload to Portal", "detail": "Submit the document or paste link in the verification workspace."}
            ]
        }
        _GUIDE_CACHE[cache_key] = res
        return res

    # 1. Match catalog or scrape live web documentation
    catalog_match = _find_catalog_match(text_blob)
    doc_text = ""
    target_doc_url = catalog_match["doc_url"] if catalog_match else ""
    target_console_url = catalog_match["console_url"] if catalog_match else "https://console.cloud.google.com"
    target_console_name = catalog_match["console_name"] if catalog_match else "Cloud / Admin Console"
    target_service_name = catalog_match["service_name"] if catalog_match else name

    if target_doc_url:
        doc_text = await fetch_and_clean_web_doc(target_doc_url)

    # 2. Synthesize with Groq LLM
    system_prompt = (
        "You are an Elite Enterprise Solution Architect at goML. "
        "Your mission is to generate a crystal-clear, non-technical, step-by-step click guide for a business client "
        "explaining exactly how to retrieve, generate, or delegate a service credential/API key/token. "
        "Speak in friendly, plain English. Format instructions as a sequence of exact UI button clicks (e.g. 'Go to Settings > API Keys > Click + Create'). "
        "Return ONLY a valid JSON object matching the requested schema."
    )

    user_prompt = f"""
Prerequisite Credential Deliverable:
- Name: {name}
- Category: {category}
- Description: {description}
- Expected Evidence: {expected_evidence}
- Client Contact: {client_name}
- Official Documentation Extract: {doc_text[:2000] if doc_text else 'Standard enterprise cloud credential provisioning'}
- Suggested Console URL: {target_console_url}

Generate the dynamic credential retrieval guide in this EXACT JSON structure:
{{
    "isCredential": true,
    "serviceName": "Official Service Name (e.g. WhatsApp Business Cloud API / Meta Developer Portal)",
    "category": "API Key / IAM Role / Storage / Token",
    "consoleName": "{target_console_name}",
    "consoleUrl": "{target_console_url}",
    "estimatedTime": "3-5 minutes",
    "difficulty": "Very Easy|Easy|Moderate",
    "quickSteps": [
        {{
            "num": 1,
            "action": "Short bold action name (e.g. Log in to Meta Business Suite)",
            "detail": "Exact plain-English instruction on where to click in the UI."
        }},
        {{
            "num": 2,
            "action": "Navigate to Settings",
            "detail": "Click Accounts > System Users or API Keys."
        }},
        {{
            "num": 3,
            "action": "Generate Token / Create Key",
            "detail": "Click + Add, specify name 'goML-PreQ', and select required scopes."
        }},
        {{
            "num": 4,
            "action": "Set Security Scope & Ingress IP",
            "detail": "Restrict permissions to read-only and whitelist goML Staging IP 34.120.45.10/32."
        }},
        {{
            "num": 5,
            "action": "Copy and Vault Credentials",
            "detail": "Copy key/token into password vault (1Password) or submit masked in PreQ."
        }}
    ],
    "requiredPermissions": "Plain English summary of exact permissions or scopes required.",
    "securityRecommendation": "Plain English security advice (e.g. Never grant root admin access; enforce least-privilege).",
    "delegationRole": "Exact internal IT job title (e.g. Meta Business Admin / AWS DevOps Lead / Database Admin)",
    "delegationMessage": "Ready-to-send polite email/Slack message template addressed to their IT admin requesting this credential.",
    "isDynamicScraped": true,
    "sourceDocUrl": "{target_doc_url}"
}}
"""

    try:
        raw_json = copilot_service.call_groq_chat(system_prompt, user_prompt, json_mode=True, max_tokens=1400)
        cleaned = copilot_service.clean_json_response(raw_json)
        guide_data = json.loads(cleaned)
        guide_data["isCredential"] = True
        if not guide_data.get("consoleUrl"):
            guide_data["consoleUrl"] = target_console_url
        if not guide_data.get("sourceDocUrl"):
            guide_data["sourceDocUrl"] = target_doc_url
        guide_data["isDynamicScraped"] = True

        # Sanitize quickSteps array to ensure no empty/orphan items
        if isinstance(guide_data.get("quickSteps"), list):
            clean_steps = []
            for s in guide_data["quickSteps"]:
                if isinstance(s, dict):
                    act = str(s.get("action", "") or "").strip()
                    det = str(s.get("detail", "") or "").strip()
                    if act or det:
                        clean_steps.append({
                            "num": len(clean_steps) + 1,
                            "action": act or f"Step {len(clean_steps) + 1}",
                            "detail": det
                        })
            guide_data["quickSteps"] = clean_steps

        _GUIDE_CACHE[cache_key] = guide_data
        return guide_data
    except Exception as e:
        logger.error(f"Dynamic credential generation failed: {e}")
        # Return structured fallback from catalog
        fallback = {
            "isCredential": True,
            "serviceName": target_service_name,
            "category": category,
            "consoleName": target_console_name,
            "consoleUrl": target_console_url,
            "estimatedTime": "3-5 minutes",
            "difficulty": "Easy",
            "quickSteps": [
                {"num": 1, "action": f"Access {target_console_name}", "detail": f"Sign in to {target_console_url} with your corporate account."},
                {"num": 2, "action": "Navigate to API / Access Credentials", "detail": "Locate Developer Settings, IAM Roles, or API Keys tab."},
                {"num": 3, "action": "Generate Dedicated Service Key", "detail": "Create a new token named 'goML-PreQ' with read-only permissions."},
                {"num": 4, "action": "Configure Security & IP Whitelist", "detail": "Set least-privilege scope and whitelist goML IP 34.120.45.10/32."},
                {"num": 5, "action": "Store in Secure Vault", "detail": "Store secret in 1Password and paste masked details into the PreQ portal."}
            ],
            "requiredPermissions": "Least-privilege read access scoped to staging environment.",
            "securityRecommendation": "Never share root admin passwords or unmasked production secrets in plain chat.",
            "delegationRole": "IT Administrator / Cloud Lead",
            "delegationMessage": f"Hi IT Team,\n\nWe require service credentials for our goML project onboarding ({name}).\n\nScope: Staging Environment, Read-Only\nWhitelisted IP: 34.120.45.10/32\n\nPlease provision and store in our corporate 1Password vault.\n\nThank you!",
            "isDynamicScraped": False,
            "sourceDocUrl": target_doc_url
        }
        _GUIDE_CACHE[cache_key] = fallback
        return fallback
