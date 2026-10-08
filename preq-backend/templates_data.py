from __future__ import annotations

import datetime
import json
import uuid
from copy import deepcopy
from typing import Any


# ============================================================
# MASTER CONFIGURATION
# ============================================================

PROJECT_TYPES = [
    "GenAI / LLM Application",
    "Cloud Migration & Modernization",
    "Enterprise Data Platform & Lakehouse",
    "Full-Stack Web & Microservices",
    "Cybersecurity & Zero Trust Architecture",
    "ERP / CRM Enterprise System Integration",
]

INDUSTRIES = [
    "BFSI (Banking & Financial Services)",
    "Healthcare & Life Sciences",
    "Retail & E-Commerce",
    "Manufacturing & Supply Chain",
    "Public Sector & GovTech",
    "Telecom & Technology",
]

DEPLOYMENT_TARGETS = [
    "AWS Cloud",
    "Microsoft Azure",
    "Google Cloud Platform (GCP)",
    "Hybrid & On-Premise",
    "Multi-Cloud Kubernetes",
]

CATEGORIES = [
    "Environment",
    "Security",
    "Data",
    "Compliance",
    "People",
    "Integration",
    "Architecture",
    "Testing",
    "Operations",
    "Infrastructure",
    "Application",
    "Governance",
    "Networking",
    "Monitoring",
    "Documentation",
]


# ============================================================
# HELPER
# ============================================================

def prerequisite(
    slug: str,
    category: str,
    name: str,
    description: str,
    owner: str,
    *,
    stakeholder: str = "Project Manager",
    critical: bool = False,
    blocking: bool = False,
    priority: str = "P1",
    days_offset: int = -7,
    effort_hours: int = 4,
    evidence: str = "Verification document or screenshot",
    validation_method: str = "Manual",
    acceptance_criteria: list[str] | None = None,
    risk_if_missing: str = "Project delay or implementation risk",
    escalation_after_days: int = 3,
    auto_verifiable: bool = False,
    verification_type: str = "Manual",
    deps: list[str] | None = None,
) -> dict[str, Any]:

    return {
        "slug": slug,
        "category": category,
        "name": name,
        "description": description,
        "owner": owner,
        "stakeholder": stakeholder,
        "is_critical": critical,
        "blocking": blocking,
        "priority": priority,
        "days_offset": days_offset,
        "estimated_effort_hours": effort_hours,
        "expected_evidence": evidence,
        "validation_method": validation_method,
        "acceptance_criteria": acceptance_criteria or [],
        "risk_if_missing": risk_if_missing,
        "escalation_after_days": escalation_after_days,
        "auto_verifiable": auto_verifiable,
        "verification_type": verification_type,
        "deps": deps or [],
    }


# ============================================================
# CORE PREREQUISITES
# ============================================================

CORE_PREREQUISITES = [

    prerequisite(
        "project_charter",
        "Governance",
        "Project Charter & Scope Approval",
        "Formal project charter defining business objectives, scope, exclusions, stakeholders and success criteria.",
        "Project Manager",
        stakeholder="Executive Sponsor",
        critical=True,
        blocking=True,
        priority="P0",
        days_offset=-21,
        effort_hours=4,
        evidence="Approved project charter document",
        validation_method="Document",
        acceptance_criteria=[
            "Business objective is documented",
            "Project scope is approved",
            "Out-of-scope items are identified",
            "Executive sponsor approval is recorded",
        ],
        risk_if_missing="Scope ambiguity and uncontrolled requirements",
        verification_type="Approval",
    ),

    prerequisite(
        "business_requirements",
        "Documentation",
        "Business Requirements Specification",
        "Approved functional and business requirements covering user journeys and expected outcomes.",
        "Business Analyst",
        stakeholder="Product Owner",
        critical=True,
        blocking=True,
        priority="P0",
        days_offset=-18,
        effort_hours=16,
        evidence="Approved BRD or requirements document",
        validation_method="Document",
        acceptance_criteria=[
            "Requirements are documented",
            "Business owners approved requirements",
            "Acceptance criteria are defined",
        ],
        risk_if_missing="Development may proceed against incorrect requirements",
        verification_type="Approval",
        deps=["project_charter"],
    ),

    prerequisite(
        "stakeholder_matrix",
        "People",
        "Stakeholder & Responsibility Matrix",
        "RACI matrix identifying owners, approvers, technical teams and escalation contacts.",
        "Project Manager",
        stakeholder="Executive Sponsor",
        critical=True,
        priority="P1",
        days_offset=-16,
        effort_hours=4,
        evidence="Approved RACI matrix",
        validation_method="Document",
        acceptance_criteria=[
            "All major responsibilities have owners",
            "Approvers are identified",
            "Escalation contacts are available",
        ],
        verification_type="Approval",
        deps=["project_charter"],
    ),

    prerequisite(
        "technical_architecture",
        "Architecture",
        "Solution Architecture Approval",
        "Approved architecture covering applications, infrastructure, data flows, integrations and security boundaries.",
        "Solution Architect",
        stakeholder="Enterprise Architect",
        critical=True,
        blocking=True,
        priority="P0",
        days_offset=-16,
        effort_hours=12,
        evidence="Architecture diagram and ADR",
        validation_method="Document",
        acceptance_criteria=[
            "Architecture diagram is approved",
            "Major components are identified",
            "Integration boundaries are documented",
            "Security boundaries are documented",
        ],
        verification_type="Approval",
        deps=["business_requirements"],
    ),

    prerequisite(
        "source_control",
        "Environment",
        "Source Control Repository & Branch Strategy",
        "Git repository, branch protection and development access configured.",
        "Engineering Lead",
        stakeholder="DevOps Lead",
        critical=True,
        blocking=True,
        priority="P0",
        days_offset=-14,
        effort_hours=3,
        evidence="Repository URL and branch protection configuration",
        validation_method="API",
        acceptance_criteria=[
            "Repository exists",
            "Developers have correct access",
            "Protected branches are configured",
            "Branch strategy is documented",
        ],
        auto_verifiable=True,
        verification_type="API",
    ),

    prerequisite(
        "development_environment",
        "Environment",
        "Developer Environment Provisioning",
        "Required SDKs, runtimes, IDE tools and CLI dependencies are installed.",
        "Engineering Lead",
        stakeholder="Development Team",
        critical=True,
        blocking=True,
        priority="P0",
        days_offset=-12,
        effort_hours=8,
        evidence="Environment validation report",
        validation_method="CLI",
        acceptance_criteria=[
            "Required runtime versions are installed",
            "Required CLI tools are available",
            "Project builds locally",
        ],
        auto_verifiable=True,
        verification_type="CLI",
        deps=["source_control"],
    ),

    prerequisite(
        "access_matrix",
        "Security",
        "Application & Infrastructure Access Matrix",
        "Least-privilege access matrix defining users, roles, resources and permissions.",
        "Security Lead",
        stakeholder="IT Administrator",
        critical=True,
        blocking=True,
        priority="P0",
        days_offset=-12,
        effort_hours=6,
        evidence="Approved access control matrix",
        validation_method="Document",
        acceptance_criteria=[
            "Required roles are defined",
            "Least privilege is applied",
            "Privileged access is identified",
        ],
        verification_type="Approval",
        deps=["stakeholder_matrix"],
    ),

    prerequisite(
        "secrets_management",
        "Security",
        "Secrets Management & Credential Provisioning",
        "Centralized secure storage for API keys, passwords, certificates and service credentials.",
        "DevOps Lead",
        stakeholder="Security Lead",
        critical=True,
        blocking=True,
        priority="P0",
        days_offset=-10,
        effort_hours=6,
        evidence="Secrets manager configuration and retrieval test",
        validation_method="API",
        acceptance_criteria=[
            "Secrets are not stored in source code",
            "Secret access is role-based",
            "Secret rotation policy exists",
        ],
        auto_verifiable=True,
        verification_type="API",
        deps=["access_matrix"],
    ),

    prerequisite(
        "security_review",
        "Security",
        "Security Architecture Review",
        "Formal review of authentication, authorization, encryption, networking and data handling.",
        "Security Architect",
        stakeholder="CISO",
        critical=True,
        blocking=True,
        priority="P0",
        days_offset=-8,
        effort_hours=8,
        evidence="Security architecture review approval",
        validation_method="Approval",
        acceptance_criteria=[
            "Security architecture is reviewed",
            "Critical findings are resolved",
            "Exceptions are documented",
        ],
        verification_type="Approval",
        deps=["technical_architecture", "access_matrix"],
    ),

    prerequisite(
        "logging_monitoring",
        "Monitoring",
        "Centralized Logging & Monitoring",
        "Application, infrastructure and security logs are routed to an approved monitoring platform.",
        "DevOps Lead",
        stakeholder="SOC Team",
        critical=True,
        priority="P1",
        days_offset=-6,
        effort_hours=8,
        evidence="Monitoring dashboard and live log ingestion",
        validation_method="API",
        acceptance_criteria=[
            "Application logs are visible",
            "Infrastructure logs are visible",
            "Critical alerts are configured",
        ],
        auto_verifiable=True,
        verification_type="API",
        deps=["security_review"],
    ),

    prerequisite(
        "backup_restore",
        "Operations",
        "Backup & Restore Strategy",
        "Backup schedules, retention policies and restore procedures are defined and tested.",
        "Infrastructure Lead",
        stakeholder="Operations Lead",
        critical=True,
        priority="P1",
        days_offset=-5,
        effort_hours=6,
        evidence="Backup configuration and restore test report",
        validation_method="Automated Test",
        acceptance_criteria=[
            "Backup is configured",
            "Retention is defined",
            "Restore test succeeds",
        ],
        auto_verifiable=True,
        verification_type="Automated Test",
    ),

    prerequisite(
        "incident_response",
        "Operations",
        "Incident Response & Escalation Plan",
        "Incident severity levels, response SLAs, escalation paths and communication channels.",
        "Operations Lead",
        stakeholder="Project Sponsor",
        priority="P1",
        days_offset=-4,
        effort_hours=4,
        evidence="Approved incident response runbook",
        validation_method="Document",
        acceptance_criteria=[
            "Severity levels are defined",
            "On-call owners are assigned",
            "Escalation contacts are available",
        ],
        verification_type="Document",
        deps=["stakeholder_matrix"],
    ),

    prerequisite(
        "documentation",
        "Documentation",
        "Technical Documentation & Runbooks",
        "Architecture, deployment, troubleshooting and operational documentation.",
        "Technical Lead",
        stakeholder="Operations Lead",
        priority="P1",
        days_offset=-3,
        effort_hours=10,
        evidence="Documentation repository",
        validation_method="Document",
        acceptance_criteria=[
            "Architecture is documented",
            "Deployment procedure exists",
            "Troubleshooting procedure exists",
        ],
        verification_type="Document",
    ),
]


# ============================================================
# GENAI / LLM
# ============================================================

PROJECT_PREREQUISITES = {

    "GenAI / LLM Application": [

        prerequisite(
            "llm_model_access",
            "Environment",
            "Foundation Model API Access",
            "Enterprise access to Bedrock, Azure OpenAI, OpenAI or another approved model provider.",
            "AI Platform Lead",
            stakeholder="Cloud Administrator",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-14,
            effort_hours=4,
            evidence="Successful model API test",
            validation_method="API",
            acceptance_criteria=[
                "Required model is enabled",
                "API request succeeds",
                "Enterprise account is authorized",
            ],
            auto_verifiable=True,
            verification_type="API",
        ),

        prerequisite(
            "llm_quotas",
            "Environment",
            "Foundation Model API Quotas",
            "TPM/RPM quotas sufficient for development and staging workloads.",
            "DevOps Lead",
            stakeholder="AI Platform Owner",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-12,
            effort_hours=3,
            evidence="Quota configuration report",
            validation_method="API",
            acceptance_criteria=[
                "TPM quota approved",
                "RPM quota approved",
                "Quota supports expected load",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["llm_model_access"],
        ),

        prerequisite(
            "curated_data",
            "Data",
            "Ground Truth Knowledge Corpus",
            "Sanitized PDF, Markdown or structured business corpus for RAG.",
            "Client Data Steward",
            stakeholder="Business SME",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-10,
            effort_hours=16,
            evidence="Document manifest and storage URI",
            validation_method="Document",
            acceptance_criteria=[
                "Required documents are available",
                "Documents are sanitized",
                "Metadata is available",
            ],
            verification_type="Document",
        ),

        prerequisite(
            "vector_database",
            "Environment",
            "Vector Database Provisioning",
            "Provision Pinecone, pgvector, Milvus, OpenSearch or equivalent.",
            "DevOps Lead",
            stakeholder="AI Engineer",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-8,
            effort_hours=6,
            evidence="Vector database connectivity test",
            validation_method="API",
            acceptance_criteria=[
                "Vector index exists",
                "Embedding dimensions match",
                "TLS is enabled",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["llm_model_access"],
        ),

        prerequisite(
            "embedding_model",
            "Architecture",
            "Embedding Model Selection",
            "Embedding model selected based on language, quality, latency and cost.",
            "AI Engineer",
            stakeholder="Solution Architect",
            critical=True,
            priority="P1",
            days_offset=-8,
            effort_hours=4,
            evidence="Embedding model ADR",
            validation_method="Document",
            acceptance_criteria=[
                "Model is approved",
                "Embedding dimensions documented",
                "Cost evaluated",
            ],
            verification_type="Document",
        ),

        prerequisite(
            "chunking_strategy",
            "Architecture",
            "Document Chunking & Retrieval Strategy",
            "Chunk size, overlap, metadata and retrieval approach are defined.",
            "AI Engineer",
            stakeholder="Business SME",
            priority="P1",
            days_offset=-6,
            effort_hours=6,
            evidence="RAG architecture document",
            validation_method="Document",
            acceptance_criteria=[
                "Chunking strategy documented",
                "Metadata strategy documented",
                "Retrieval strategy documented",
            ],
            verification_type="Document",
            deps=["curated_data", "embedding_model"],
        ),

        prerequisite(
            "ai_safety",
            "Compliance",
            "AI Safety & Responsible AI Policy",
            "Policy covering hallucination, prohibited content, prompt injection, PII and safety thresholds.",
            "Security & Compliance Lead",
            stakeholder="CISO",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-8,
            effort_hours=8,
            evidence="Signed AI governance policy",
            validation_method="Approval",
            acceptance_criteria=[
                "Safety policy approved",
                "Prohibited use cases defined",
                "Failure thresholds defined",
            ],
            verification_type="Approval",
        ),

        prerequisite(
            "prompt_injection",
            "Security",
            "Prompt Injection Protection",
            "Controls against direct and indirect prompt injection attacks.",
            "AI Security Engineer",
            stakeholder="Security Architect",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-5,
            effort_hours=8,
            evidence="Prompt injection security test report",
            validation_method="Automated Test",
            acceptance_criteria=[
                "Attack test suite exists",
                "Critical injection attacks are blocked",
                "Residual risks are documented",
            ],
            auto_verifiable=True,
            verification_type="Automated Test",
            deps=["ai_safety"],
        ),

        prerequisite(
            "pii_filtering",
            "Security",
            "PII Detection & Redaction",
            "Sensitive personal information is detected and redacted before model processing.",
            "Security Engineer",
            stakeholder="Privacy Officer",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-6,
            effort_hours=8,
            evidence="PII detection test report",
            validation_method="Automated Test",
            acceptance_criteria=[
                "PII categories defined",
                "Detection enabled",
                "Sensitive values are redacted",
            ],
            auto_verifiable=True,
            verification_type="Automated Test",
            deps=["ai_safety"],
        ),

        prerequisite(
            "rag_evaluation",
            "Testing",
            "RAG Evaluation Framework",
            "Automated evaluation for faithfulness, relevance, context precision and context recall.",
            "ML Engineer",
            stakeholder="AI Product Owner",
            critical=True,
            priority="P1",
            days_offset=-4,
            effort_hours=10,
            evidence="Evaluation dashboard",
            validation_method="Automated Test",
            acceptance_criteria=[
                "Golden dataset exists",
                "Evaluation metrics configured",
                "Baseline score recorded",
            ],
            auto_verifiable=True,
            verification_type="Automated Test",
            deps=["curated_data", "vector_database"],
        ),

        prerequisite(
            "ai_observability",
            "Monitoring",
            "LLM Observability & Cost Monitoring",
            "Monitor latency, tokens, cost, failures, model responses and retrieval quality.",
            "DevOps Lead",
            stakeholder="AI Platform Owner",
            priority="P1",
            days_offset=-3,
            effort_hours=8,
            evidence="LLM observability dashboard",
            validation_method="API",
            acceptance_criteria=[
                "Token usage visible",
                "Latency monitored",
                "Errors monitored",
                "Cost tracked",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["llm_model_access"],
        ),

        prerequisite(
            "prompt_library",
            "Application",
            "Approved Prompt Template Library",
            "Version-controlled prompts with owners, versions and evaluation results.",
            "AI Engineer",
            stakeholder="Business SME",
            priority="P1",
            days_offset=-4,
            effort_hours=6,
            evidence="Prompt repository",
            validation_method="Document",
            acceptance_criteria=[
                "Prompts are version controlled",
                "Prompt owners identified",
                "Prompts are evaluated",
            ],
            verification_type="Document",
            deps=["rag_evaluation"],
        ),

        prerequisite(
            "model_fallback",
            "Architecture",
            "Model Fallback & Failure Strategy",
            "Fallback model or graceful degradation behavior defined for model outages.",
            "Solution Architect",
            stakeholder="AI Platform Owner",
            priority="P1",
            days_offset=-3,
            effort_hours=6,
            evidence="Failure strategy document and test result",
            validation_method="Automated Test",
            acceptance_criteria=[
                "Failure behavior is defined",
                "Fallback path exists",
                "Timeout handling is implemented",
            ],
            verification_type="Automated Test",
            deps=["llm_model_access"],
        ),
    ],


    # ========================================================
    # CLOUD MIGRATION
    # ========================================================

    "Cloud Migration & Modernization": [

        prerequisite(
            "landing_zone",
            "Environment",
            "Cloud Landing Zone",
            "Enterprise cloud accounts, IAM boundaries, audit logging and baseline policies.",
            "Cloud Architect",
            stakeholder="Cloud Platform Owner",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-14,
            effort_hours=16,
            evidence="Cloud landing zone audit report",
            validation_method="API",
            acceptance_criteria=[
                "Cloud accounts exist",
                "IAM baseline configured",
                "Audit logging enabled",
            ],
            auto_verifiable=True,
            verification_type="API",
        ),

        prerequisite(
            "network_interconnect",
            "Networking",
            "On-Premise to Cloud Connectivity",
            "DirectConnect, ExpressRoute, VPN or equivalent connectivity.",
            "Network Engineering",
            stakeholder="Cloud Architect",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-11,
            effort_hours=16,
            evidence="Connectivity and routing test",
            validation_method="CLI",
            acceptance_criteria=[
                "Tunnel is active",
                "Required routes exist",
                "Connectivity test succeeds",
            ],
            auto_verifiable=True,
            verification_type="CLI",
            deps=["landing_zone"],
        ),

        prerequisite(
            "source_inventory",
            "Data",
            "Source Infrastructure Dependency Inventory",
            "Inventory of VMs, databases, applications, storage and network dependencies.",
            "Client Tech Lead",
            stakeholder="Migration Lead",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-10,
            effort_hours=20,
            evidence="Dependency mapping matrix",
            validation_method="Document",
            acceptance_criteria=[
                "All workloads identified",
                "Dependencies mapped",
                "Network dependencies documented",
            ],
            verification_type="Document",
        ),

        prerequisite(
            "migration_wave_plan",
            "Governance",
            "Migration Wave & Cutover Plan",
            "Applications grouped into migration waves with sequencing and rollback planning.",
            "Migration Lead",
            stakeholder="Project Sponsor",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-8,
            effort_hours=12,
            evidence="Approved migration wave plan",
            validation_method="Approval",
            acceptance_criteria=[
                "Migration waves defined",
                "Dependencies considered",
                "Cutover windows approved",
            ],
            verification_type="Approval",
            deps=["source_inventory"],
        ),

        prerequisite(
            "migration_dr",
            "Operations",
            "Business Continuity & Rollback Plan",
            "RPO, RTO, maintenance window and rollback triggers approved.",
            "Client Sponsor",
            stakeholder="Operations Lead",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-6,
            effort_hours=8,
            evidence="Signed DR and rollback runbook",
            validation_method="Approval",
            acceptance_criteria=[
                "RPO defined",
                "RTO defined",
                "Rollback procedure tested",
            ],
            verification_type="Approval",
            deps=["migration_wave_plan"],
        ),

        prerequisite(
            "migration_team",
            "People",
            "Cutover Engineering & DBA Roster",
            "Dedicated engineers and legacy administrators available during migration.",
            "Client Sponsor",
            stakeholder="Migration Lead",
            priority="P1",
            days_offset=-4,
            effort_hours=3,
            evidence="On-call roster",
            validation_method="Document",
            acceptance_criteria=[
                "Engineers assigned",
                "DBA assigned",
                "Vendor contacts available",
            ],
            verification_type="Document",
        ),

        prerequisite(
            "database_replication",
            "Data",
            "Database Replication & Synchronization",
            "Replication or migration mechanism validated between source and target databases.",
            "Database Architect",
            stakeholder="DBA",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-5,
            effort_hours=12,
            evidence="Replication test report",
            validation_method="Automated Test",
            acceptance_criteria=[
                "Replication is active",
                "Data consistency validated",
                "Replication lag is acceptable",
            ],
            auto_verifiable=True,
            verification_type="Automated Test",
            deps=["network_interconnect"],
        ),
    ],


    # ========================================================
    # DATA PLATFORM
    # ========================================================

    "Enterprise Data Platform & Lakehouse": [

        prerequisite(
            "lake_storage",
            "Environment",
            "Lakehouse Object Storage",
            "Bronze, Silver and Gold object storage zones configured.",
            "Data Engineering Lead",
            stakeholder="Cloud Architect",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-12,
            effort_hours=8,
            evidence="Bucket configuration and KMS configuration",
            validation_method="API",
            acceptance_criteria=[
                "Storage zones exist",
                "Encryption enabled",
                "Lifecycle policy configured",
            ],
            auto_verifiable=True,
            verification_type="API",
        ),

        prerequisite(
            "source_connectors",
            "Data",
            "CDC & Source Database Connectors",
            "Read-only credentials and CDC connectivity configured.",
            "Client DBA",
            stakeholder="Data Engineering Lead",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-10,
            effort_hours=10,
            evidence="CDC connectivity report",
            validation_method="API",
            acceptance_criteria=[
                "CDC is enabled",
                "Credentials work",
                "Required tables are accessible",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["lake_storage"],
        ),

        prerequisite(
            "data_dictionary",
            "Data",
            "Enterprise Data Dictionary",
            "Approved definitions for fields, keys, data types and business meaning.",
            "Client Data Steward",
            stakeholder="Data Architect",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-7,
            effort_hours=12,
            evidence="Approved data dictionary",
            validation_method="Document",
            acceptance_criteria=[
                "Columns defined",
                "Business definitions available",
                "Primary keys identified",
            ],
            verification_type="Approval",
        ),

        prerequisite(
            "data_quality_rules",
            "Data",
            "Data Quality Rules & Thresholds",
            "Validation rules for completeness, uniqueness, accuracy and consistency.",
            "Data Quality Lead",
            stakeholder="Business Data Owner",
            critical=True,
            priority="P1",
            days_offset=-6,
            effort_hours=10,
            evidence="Data quality rule catalog",
            validation_method="Document",
            acceptance_criteria=[
                "Quality rules documented",
                "Thresholds defined",
                "Failed records handling defined",
            ],
            verification_type="Document",
            deps=["data_dictionary"],
        ),

        prerequisite(
            "data_lineage",
            "Governance",
            "Data Lineage & Governance",
            "End-to-end lineage from source systems to curated datasets.",
            "Data Governance Lead",
            stakeholder="Data Privacy Officer",
            critical=True,
            priority="P1",
            days_offset=-5,
            effort_hours=12,
            evidence="Data lineage catalog",
            validation_method="Document",
            acceptance_criteria=[
                "Source lineage documented",
                "Transformation lineage documented",
                "Data owners assigned",
            ],
            verification_type="Document",
            deps=["data_dictionary"],
        ),

        prerequisite(
            "compute_engine",
            "Environment",
            "Data Processing Compute",
            "Spark, Databricks, Snowflake or equivalent compute environment.",
            "Data Engineering Lead",
            stakeholder="DevOps Lead",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-5,
            effort_hours=8,
            evidence="Cluster initialization test",
            validation_method="API",
            acceptance_criteria=[
                "Compute is provisioned",
                "Autoscaling configured",
                "Cost controls configured",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["lake_storage"],
        ),
    ],


    # ========================================================
    # FULL STACK
    # ========================================================

    "Full-Stack Web & Microservices": [

        prerequisite(
            "k8s_cluster",
            "Environment",
            "Kubernetes Staging Cluster",
            "EKS, AKS, GKE or equivalent staging cluster with ingress.",
            "DevOps Lead",
            stakeholder="Platform Engineer",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-10,
            effort_hours=12,
            evidence="kubectl cluster-info output",
            validation_method="CLI",
            acceptance_criteria=[
                "Cluster is accessible",
                "Ingress is configured",
                "RBAC is configured",
            ],
            auto_verifiable=True,
            verification_type="CLI",
        ),

        prerequisite(
            "cicd_pipeline",
            "Environment",
            "CI/CD Pipeline",
            "Automated build, test and deployment pipeline.",
            "DevOps Lead",
            stakeholder="Engineering Lead",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-8,
            effort_hours=10,
            evidence="Successful pipeline execution",
            validation_method="API",
            acceptance_criteria=[
                "Build succeeds",
                "Tests execute",
                "Deployment succeeds",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["k8s_cluster"],
        ),

        prerequisite(
            "api_contract",
            "Integration",
            "API Contract & OpenAPI Specification",
            "Approved REST/GraphQL API contract with request, response and error definitions.",
            "Backend Lead",
            stakeholder="Product Owner",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-7,
            effort_hours=8,
            evidence="OpenAPI specification",
            validation_method="Document",
            acceptance_criteria=[
                "Endpoints documented",
                "Schemas defined",
                "Error responses defined",
            ],
            verification_type="Document",
        ),

        prerequisite(
            "figma_design",
            "Application",
            "Approved UI/UX Design",
            "Approved Figma designs, responsive layouts and accessibility requirements.",
            "Product Designer",
            stakeholder="Product Lead",
            critical=True,
            priority="P1",
            days_offset=-6,
            effort_hours=10,
            evidence="Approved Figma design",
            validation_method="Approval",
            acceptance_criteria=[
                "Screens approved",
                "Responsive behavior defined",
                "Accessibility reviewed",
            ],
            verification_type="Approval",
        ),

        prerequisite(
            "auth_sso",
            "Integration",
            "Identity Provider Integration",
            "Auth0, Okta, Azure AD or equivalent OIDC/OAuth provider configured.",
            "Client IT Security",
            stakeholder="Security Lead",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-5,
            effort_hours=8,
            evidence="OIDC authentication test",
            validation_method="API",
            acceptance_criteria=[
                "OIDC client exists",
                "Redirect URIs configured",
                "Role claims mapped",
            ],
            auto_verifiable=True,
            verification_type="API",
        ),

        prerequisite(
            "database_schema",
            "Data",
            "Database Schema Approval",
            "Production-ready relational or NoSQL schema reviewed and approved.",
            "Backend Lead",
            stakeholder="Database Architect",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-6,
            effort_hours=8,
            evidence="Schema diagram and migration scripts",
            validation_method="Document",
            acceptance_criteria=[
                "Tables defined",
                "Indexes defined",
                "Relationships reviewed",
            ],
            verification_type="Approval",
        ),

        prerequisite(
            "sast_dast",
            "Security",
            "SAST & DAST Security Testing",
            "Static and dynamic application security testing integrated into CI/CD.",
            "Security Engineer",
            stakeholder="CISO",
            critical=True,
            priority="P1",
            days_offset=-3,
            effort_hours=8,
            evidence="Security scan report",
            validation_method="Automated Test",
            acceptance_criteria=[
                "SAST scan passes",
                "DAST scan passes",
                "Critical vulnerabilities resolved",
            ],
            auto_verifiable=True,
            verification_type="Automated Test",
            deps=["cicd_pipeline"],
        ),
    ],


    # ========================================================
    # CYBERSECURITY
    # ========================================================

    "Cybersecurity & Zero Trust Architecture": [

        prerequisite(
            "mfa_pki",
            "Security",
            "Enterprise MFA & PKI",
            "FIDO2, WebAuthn, hardware tokens and enterprise CA configured.",
            "Security Architect",
            stakeholder="CISO",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-12,
            effort_hours=12,
            evidence="Conditional access configuration",
            validation_method="API",
            acceptance_criteria=[
                "MFA enforced",
                "Administrative accounts protected",
                "Certificate trust chain configured",
            ],
            verification_type="API",
        ),

        prerequisite(
            "siem_forwarding",
            "Monitoring",
            "SIEM Log Ingestion",
            "Security and cloud logs forwarded to Splunk, Sentinel, Datadog or equivalent.",
            "SOC Team Lead",
            stakeholder="CISO",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-9,
            effort_hours=10,
            evidence="Live SIEM ingestion query",
            validation_method="API",
            acceptance_criteria=[
                "Logs are received",
                "Alerts are configured",
                "Retention is configured",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["mfa_pki"],
        ),

        prerequisite(
            "ztna_broker",
            "Networking",
            "Zero Trust Network Access",
            "ZTNA broker configured to eliminate unnecessary public access.",
            "Network Engineering",
            stakeholder="Security Architect",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-7,
            effort_hours=10,
            evidence="ZTNA connection test",
            validation_method="API",
            acceptance_criteria=[
                "ZTNA connector active",
                "Policies configured",
                "Public ingress minimized",
            ],
            auto_verifiable=True,
            verification_type="API",
        ),

        prerequisite(
            "vulnerability_management",
            "Security",
            "Vulnerability Management Program",
            "SAST, DAST, dependency scanning, container scanning and remediation SLAs.",
            "Security Engineer",
            stakeholder="CISO",
            critical=True,
            priority="P1",
            days_offset=-5,
            effort_hours=8,
            evidence="Vulnerability management report",
            validation_method="Automated Test",
            acceptance_criteria=[
                "Scanning enabled",
                "Critical vulnerabilities identified",
                "Remediation SLA defined",
            ],
            auto_verifiable=True,
            verification_type="Automated Test",
        ),

        prerequisite(
            "penetration_testing",
            "Testing",
            "Penetration Testing Approval",
            "Rules of engagement and scope for penetration testing.",
            "CISO",
            stakeholder="Security Architect",
            critical=True,
            priority="P1",
            days_offset=-3,
            effort_hours=6,
            evidence="Signed penetration testing scope",
            validation_method="Approval",
            acceptance_criteria=[
                "Scope approved",
                "Testing window approved",
                "Rules of engagement signed",
            ],
            verification_type="Approval",
        ),
    ],


    # ========================================================
    # ERP / CRM
    # ========================================================

    "ERP / CRM Enterprise System Integration": [

        prerequisite(
            "erp_sandbox",
            "Environment",
            "ERP / CRM Sandbox",
            "Dedicated SAP, Salesforce, Workday or equivalent sandbox.",
            "Client System Administrator",
            stakeholder="Integration Architect",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-12,
            effort_hours=8,
            evidence="Sandbox login and API access",
            validation_method="API",
            acceptance_criteria=[
                "Sandbox available",
                "Integration account exists",
                "Required modules enabled",
            ],
            auto_verifiable=True,
            verification_type="API",
        ),

        prerequisite(
            "integration_api",
            "Integration",
            "ERP / CRM API Access",
            "OData, BAPI, REST, SOAP or equivalent APIs enabled.",
            "Integration Architect",
            stakeholder="System Administrator",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-8,
            effort_hours=8,
            evidence="Postman API collection with successful responses",
            validation_method="API",
            acceptance_criteria=[
                "API endpoints reachable",
                "Authentication works",
                "Required objects accessible",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["erp_sandbox"],
        ),

        prerequisite(
            "business_process_map",
            "People",
            "Business Process Mapping",
            "Order-to-Cash, Lead-to-Opportunity or equivalent workflows mapped.",
            "Business Process Lead",
            stakeholder="Business Owner",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-6,
            effort_hours=12,
            evidence="Signed process swimlane",
            validation_method="Approval",
            acceptance_criteria=[
                "Business workflow documented",
                "Source of truth defined",
                "Business owner approved",
            ],
            verification_type="Approval",
        ),

        prerequisite(
            "master_data_mapping",
            "Data",
            "Master Data Mapping",
            "Field-level mapping between ERP, CRM and target application.",
            "Data Architect",
            stakeholder="Business Data Owner",
            critical=True,
            priority="P1",
            days_offset=-5,
            effort_hours=16,
            evidence="Field mapping spreadsheet",
            validation_method="Document",
            acceptance_criteria=[
                "Source fields mapped",
                "Target fields mapped",
                "Transformation rules defined",
            ],
            verification_type="Document",
            deps=["business_process_map"],
        ),

        prerequisite(
            "integration_error_strategy",
            "Integration",
            "Integration Error & Retry Strategy",
            "Retry, dead-letter, reconciliation and failure notification strategy.",
            "Integration Architect",
            stakeholder="Operations Lead",
            critical=True,
            priority="P1",
            days_offset=-3,
            effort_hours=8,
            evidence="Integration error handling design",
            validation_method="Document",
            acceptance_criteria=[
                "Retry policy defined",
                "Dead-letter strategy defined",
                "Reconciliation process defined",
            ],
            verification_type="Document",
            deps=["integration_api"],
        ),
    ],
}


# ============================================================
# INDUSTRY ADDONS
# ============================================================

INDUSTRY_PREREQUISITES = {

    "BFSI (Banking & Financial Services)": [

        prerequisite(
            "bfsi_pci",
            "Compliance",
            "PCI-DSS Compliance Validation",
            "Validation of cardholder data handling, tokenization and masking.",
            "Compliance Officer",
            stakeholder="CISO",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-8,
            effort_hours=10,
            evidence="PCI compliance assessment",
            validation_method="Approval",
            acceptance_criteria=[
                "PAN is protected",
                "Tokenization validated",
                "Sensitive data is masked",
            ],
            verification_type="Approval",
        ),

        prerequisite(
            "bfsi_aml",
            "Compliance",
            "AML & Transaction Monitoring Requirements",
            "AML rules, suspicious transaction scenarios and monitoring requirements documented.",
            "Compliance Officer",
            stakeholder="Business Compliance Lead",
            critical=True,
            priority="P1",
            days_offset=-6,
            effort_hours=10,
            evidence="AML requirements document",
            validation_method="Document",
            acceptance_criteria=[
                "AML scenarios documented",
                "Monitoring rules defined",
                "Escalation process defined",
            ],
            verification_type="Document",
        ),

        prerequisite(
            "bfsi_synthetic_data",
            "Data",
            "Synthetic Financial Dataset",
            "Synthetic transactions covering normal and edge-case financial scenarios.",
            "Client Data Team",
            stakeholder="Data Steward",
            priority="P1",
            days_offset=-5,
            effort_hours=8,
            evidence="Synthetic transaction dataset",
            validation_method="Document",
            acceptance_criteria=[
                "Transactions available",
                "Edge cases included",
                "Schema validated",
            ],
            verification_type="Document",
        ),
    ],


    "Healthcare & Life Sciences": [

        prerequisite(
            "health_baa",
            "Compliance",
            "HIPAA Business Associate Agreement",
            "Executed BAA covering vendor, cloud and service providers.",
            "Legal / Compliance Lead",
            stakeholder="Privacy Officer",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-10,
            effort_hours=6,
            evidence="Countersigned BAA",
            validation_method="Approval",
            acceptance_criteria=[
                "BAA signed",
                "Required vendors included",
                "Responsibilities documented",
            ],
            verification_type="Approval",
        ),

        prerequisite(
            "health_phi",
            "Data",
            "De-Identified Clinical Dataset",
            "Clinical data scrubbed according to applicable de-identification requirements.",
            "Privacy Officer",
            stakeholder="Clinical Data Owner",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-7,
            effort_hours=12,
            evidence="De-identification report and dataset hash",
            validation_method="Document",
            acceptance_criteria=[
                "PHI removed",
                "De-identification validated",
                "Dataset approved for testing",
            ],
            verification_type="Approval",
        ),

        prerequisite(
            "health_audit",
            "Compliance",
            "Healthcare Audit Logging",
            "Audit logging for access to protected health information.",
            "Security Lead",
            stakeholder="Privacy Officer",
            critical=True,
            priority="P0",
            days_offset=-5,
            effort_hours=8,
            evidence="Audit log test",
            validation_method="API",
            acceptance_criteria=[
                "User access logged",
                "Data access logged",
                "Logs retained according to policy",
            ],
            auto_verifiable=True,
            verification_type="API",
        ),
    ],


    "Retail & E-Commerce": [

        prerequisite(
            "retail_payment_sandbox",
            "Integration",
            "Payment Gateway Sandbox",
            "Stripe, Adyen, PayPal or equivalent sandbox credentials and webhooks.",
            "Client Tech Lead",
            stakeholder="Payment Product Owner",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-6,
            effort_hours=6,
            evidence="Payment API test and webhook confirmation",
            validation_method="API",
            acceptance_criteria=[
                "Sandbox credentials work",
                "Webhooks received",
                "Test transactions succeed",
            ],
            auto_verifiable=True,
            verification_type="API",
        ),

        prerequisite(
            "retail_inventory",
            "Integration",
            "Inventory System Integration",
            "Access to inventory APIs and stock synchronization mechanism.",
            "Integration Lead",
            stakeholder="Retail Operations",
            critical=True,
            priority="P1",
            days_offset=-5,
            effort_hours=8,
            evidence="Inventory API test",
            validation_method="API",
            acceptance_criteria=[
                "Inventory API reachable",
                "Stock data available",
                "Synchronization interval defined",
            ],
            auto_verifiable=True,
            verification_type="API",
        ),
    ],


    "Manufacturing & Supply Chain": [

        prerequisite(
            "mfg_ot_dmz",
            "Security",
            "OT / IT DMZ Firewall Clearance",
            "Approved connectivity between IT systems and operational technology environments.",
            "Plant IT Director",
            stakeholder="Plant Safety Engineer",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-9,
            effort_hours=10,
            evidence="Signed network topology",
            validation_method="Approval",
            acceptance_criteria=[
                "DMZ architecture approved",
                "PLC network isolated",
                "Firewall rules approved",
            ],
            verification_type="Approval",
        ),

        prerequisite(
            "mfg_plant_schedule",
            "Operations",
            "Plant Maintenance Window",
            "Approved maintenance window for deployment without disrupting plant operations.",
            "Plant Operations Lead",
            stakeholder="Plant Manager",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-7,
            effort_hours=3,
            evidence="Approved maintenance calendar",
            validation_method="Approval",
            acceptance_criteria=[
                "Maintenance window approved",
                "Plant operations notified",
            ],
            verification_type="Approval",
        ),
    ],


    "Public Sector & GovTech": [

        prerequisite(
            "gov_security_authorization",
            "Compliance",
            "Government Security Authorization",
            "Required security authorization package and authority approval.",
            "Government ISSO",
            stakeholder="Agency CISO",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-14,
            effort_hours=20,
            evidence="ATO or authorization memorandum",
            validation_method="Approval",
            acceptance_criteria=[
                "Security package submitted",
                "Required controls assessed",
                "Authorization obtained",
            ],
            verification_type="Approval",
        ),

        prerequisite(
            "gov_data_residency",
            "Compliance",
            "Government Data Residency Approval",
            "Approval of where government data may be stored and processed.",
            "Government Data Officer",
            stakeholder="Agency Security Officer",
            critical=True,
            priority="P0",
            days_offset=-10,
            effort_hours=6,
            evidence="Data residency approval",
            validation_method="Approval",
            acceptance_criteria=[
                "Allowed regions documented",
                "Cloud regions approved",
                "Data transfer restrictions documented",
            ],
            verification_type="Approval",
        ),
    ],


    "Telecom & Technology": [

        prerequisite(
            "telecom_interconnect",
            "Integration",
            "Carrier Interconnect Agreement",
            "Carrier signaling, API or network interconnect specification.",
            "Telecom Operations Lead",
            stakeholder="Network Operations",
            critical=True,
            priority="P1",
            days_offset=-7,
            effort_hours=10,
            evidence="Interconnect specification",
            validation_method="Document",
            acceptance_criteria=[
                "Interface documented",
                "Network endpoints available",
                "Support SLA defined",
            ],
            verification_type="Approval",
        ),

        prerequisite(
            "telecom_sla",
            "Operations",
            "Carrier SLA & Escalation Agreement",
            "Availability, MTTR and escalation requirements agreed.",
            "Telecom Operations Lead",
            stakeholder="Service Owner",
            priority="P1",
            days_offset=-5,
            effort_hours=4,
            evidence="Signed SLA",
            validation_method="Approval",
            acceptance_criteria=[
                "Availability target defined",
                "MTTR defined",
                "Escalation path defined",
            ],
            verification_type="Approval",
        ),
    ],
}


# ============================================================
# DEPLOYMENT ADDONS
# ============================================================

DEPLOYMENT_PREREQUISITES = {

    "AWS Cloud": [

        prerequisite(
            "aws_account",
            "Environment",
            "AWS Account & Organization Access",
            "Target AWS account, organization membership and required administrative access.",
            "AWS Administrator",
            stakeholder="Cloud Security Lead",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-12,
            effort_hours=4,
            evidence="AWS account validation",
            validation_method="API",
            acceptance_criteria=[
                "Account exists",
                "Required users have access",
                "Organization policies apply",
            ],
            auto_verifiable=True,
            verification_type="API",
        ),

        prerequisite(
            "aws_iam_role",
            "Security",
            "AWS Cross-Account IAM Role",
            "Scoped deployment role with trust policy and External ID.",
            "Cloud Security Lead",
            stakeholder="AWS Administrator",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-8,
            effort_hours=5,
            evidence="IAM role ARN and STS assume-role test",
            validation_method="API",
            acceptance_criteria=[
                "Role exists",
                "Trust policy is restricted",
                "Least privilege applied",
                "STS test succeeds",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["aws_account"],
        ),

        prerequisite(
            "aws_kms",
            "Security",
            "AWS KMS Encryption Keys",
            "KMS keys provisioned for application, storage and database encryption.",
            "Cloud Security Lead",
            stakeholder="Security Architect",
            critical=True,
            priority="P1",
            days_offset=-7,
            effort_hours=5,
            evidence="KMS key policy",
            validation_method="API",
            acceptance_criteria=[
                "KMS keys exist",
                "Key policies are restricted",
                "Encryption enabled",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["aws_account"],
        ),

        prerequisite(
            "aws_vpc",
            "Networking",
            "AWS VPC & Subnet Configuration",
            "VPC, private/public subnets, routing and security groups configured.",
            "Cloud Engineer",
            stakeholder="Network Engineer",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-9,
            effort_hours=10,
            evidence="VPC architecture and connectivity test",
            validation_method="API",
            acceptance_criteria=[
                "VPC exists",
                "Required subnets exist",
                "Routes are configured",
                "Security groups are configured",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["aws_account"],
        ),

        prerequisite(
            "aws_cloudwatch",
            "Monitoring",
            "CloudWatch Monitoring",
            "Metrics, logs, alarms and dashboards configured.",
            "DevOps Lead",
            stakeholder="Operations Lead",
            priority="P1",
            days_offset=-4,
            effort_hours=6,
            evidence="CloudWatch dashboard",
            validation_method="API",
            acceptance_criteria=[
                "Metrics available",
                "Logs available",
                "Critical alarms configured",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["aws_account"],
        ),

        prerequisite(
            "aws_cloudtrail",
            "Security",
            "AWS CloudTrail Audit Logging",
            "AWS API activity captured for security and compliance.",
            "Security Lead",
            stakeholder="SOC Team",
            critical=True,
            priority="P1",
            days_offset=-5,
            effort_hours=4,
            evidence="CloudTrail event validation",
            validation_method="API",
            acceptance_criteria=[
                "CloudTrail enabled",
                "Events recorded",
                "Retention configured",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["aws_account"],
        ),
    ],


    "Microsoft Azure": [

        prerequisite(
            "azure_subscription",
            "Environment",
            "Azure Subscription & Tenant Access",
            "Target subscription and tenant access configured.",
            "Azure Tenant Admin",
            stakeholder="Cloud Architect",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-12,
            effort_hours=4,
            evidence="Subscription validation",
            validation_method="API",
            acceptance_criteria=[
                "Subscription exists",
                "Tenant access works",
                "Required roles assigned",
            ],
            auto_verifiable=True,
            verification_type="API",
        ),

        prerequisite(
            "azure_service_principal",
            "Security",
            "Azure Service Principal & RBAC",
            "Enterprise application registration and scoped RBAC permissions.",
            "Azure Tenant Admin",
            stakeholder="Security Lead",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-8,
            effort_hours=5,
            evidence="App registration and RBAC assignment",
            validation_method="API",
            acceptance_criteria=[
                "Service principal exists",
                "RBAC is scoped",
                "Authentication succeeds",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["azure_subscription"],
        ),

        prerequisite(
            "azure_keyvault",
            "Security",
            "Azure Key Vault",
            "Key Vault configured for application secrets, keys and certificates.",
            "Azure Security Lead",
            stakeholder="DevOps Lead",
            critical=True,
            priority="P1",
            days_offset=-7,
            effort_hours=5,
            evidence="Key Vault access test",
            validation_method="API",
            acceptance_criteria=[
                "Key Vault exists",
                "Access policies configured",
                "Secret retrieval succeeds",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["azure_service_principal"],
        ),

        prerequisite(
            "azure_network",
            "Networking",
            "Azure VNet & Network Security",
            "VNet, subnets, NSGs and routing configured.",
            "Azure Network Engineer",
            stakeholder="Cloud Architect",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-9,
            effort_hours=10,
            evidence="VNet configuration and connectivity test",
            validation_method="API",
            acceptance_criteria=[
                "VNet exists",
                "Subnets exist",
                "NSGs configured",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["azure_subscription"],
        ),
    ],


    "Google Cloud Platform (GCP)": [

        prerequisite(
            "gcp_project",
            "Environment",
            "GCP Project & Billing Configuration",
            "GCP project, billing account and organization policies configured.",
            "GCP Administrator",
            stakeholder="Cloud Architect",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-12,
            effort_hours=4,
            evidence="GCP project validation",
            validation_method="API",
            acceptance_criteria=[
                "Project exists",
                "Billing enabled",
                "Organization policies applied",
            ],
            auto_verifiable=True,
            verification_type="API",
        ),

        prerequisite(
            "gcp_workload_identity",
            "Security",
            "GCP Workload Identity Federation",
            "Keyless CI/CD authentication using workload identity.",
            "GCP Admin",
            stakeholder="Security Lead",
            critical=True,
            priority="P0",
            days_offset=-8,
            effort_hours=6,
            evidence="Workload identity authentication test",
            validation_method="CLI",
            acceptance_criteria=[
                "Identity pool configured",
                "Service account mapping exists",
                "Keyless authentication succeeds",
            ],
            auto_verifiable=True,
            verification_type="CLI",
            deps=["gcp_project"],
        ),

        prerequisite(
            "gcp_network",
            "Networking",
            "GCP VPC Network",
            "VPC, subnet, firewall and routing configuration.",
            "GCP Network Engineer",
            stakeholder="Cloud Architect",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-9,
            effort_hours=10,
            evidence="VPC configuration and connectivity test",
            validation_method="API",
            acceptance_criteria=[
                "VPC exists",
                "Subnets exist",
                "Firewall rules configured",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["gcp_project"],
        ),
    ],


    "Hybrid & On-Premise": [

        prerequisite(
            "onprem_hardware",
            "Infrastructure",
            "On-Premise Compute & Storage Allocation",
            "VMware, Hyper-V, Proxmox or bare-metal compute and storage allocated.",
            "Infrastructure Lead",
            stakeholder="IT Director",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-10,
            effort_hours=8,
            evidence="Resource allocation report",
            validation_method="Document",
            acceptance_criteria=[
                "CPU allocated",
                "RAM allocated",
                "Storage allocated",
                "Capacity meets requirements",
            ],
            verification_type="Document",
        ),

        prerequisite(
            "onprem_network",
            "Networking",
            "On-Premise Network & Firewall Rules",
            "Required VLANs, routes and firewall rules configured.",
            "Network Engineer",
            stakeholder="Infrastructure Lead",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-8,
            effort_hours=8,
            evidence="Firewall and routing validation",
            validation_method="CLI",
            acceptance_criteria=[
                "Required VLAN exists",
                "Routes configured",
                "Firewall rules approved",
            ],
            auto_verifiable=True,
            verification_type="CLI",
        ),

        prerequisite(
            "onprem_backup",
            "Operations",
            "On-Premise Backup Infrastructure",
            "Backup repository and restore process configured.",
            "Infrastructure Lead",
            stakeholder="Operations Lead",
            critical=True,
            priority="P1",
            days_offset=-5,
            effort_hours=8,
            evidence="Backup restore test",
            validation_method="Automated Test",
            acceptance_criteria=[
                "Backup succeeds",
                "Restore succeeds",
                "Retention configured",
            ],
            auto_verifiable=True,
            verification_type="Automated Test",
        ),
    ],


    "Multi-Cloud Kubernetes": [

        prerequisite(
            "multi_cluster",
            "Environment",
            "Multi-Cluster Kubernetes Provisioning",
            "Kubernetes clusters provisioned across target cloud providers.",
            "Platform Engineer",
            stakeholder="Cloud Architect",
            critical=True,
            blocking=True,
            priority="P0",
            days_offset=-12,
            effort_hours=20,
            evidence="kubectl cluster validation",
            validation_method="CLI",
            acceptance_criteria=[
                "All clusters accessible",
                "Namespaces configured",
                "RBAC configured",
            ],
            auto_verifiable=True,
            verification_type="CLI",
        ),

        prerequisite(
            "k8s_mesh",
            "Networking",
            "Multi-Cluster Service Mesh",
            "Istio, Cilium or equivalent service mesh with mTLS.",
            "Platform Engineer",
            stakeholder="Security Architect",
            critical=True,
            priority="P0",
            days_offset=-7,
            effort_hours=16,
            evidence="Service mesh connectivity test",
            validation_method="CLI",
            acceptance_criteria=[
                "Mesh installed",
                "mTLS enabled",
                "Cross-cluster connectivity succeeds",
            ],
            auto_verifiable=True,
            verification_type="CLI",
            deps=["multi_cluster"],
        ),

        prerequisite(
            "multi_cloud_observability",
            "Monitoring",
            "Multi-Cloud Observability",
            "Unified monitoring and logging across all Kubernetes clusters.",
            "SRE Lead",
            stakeholder="Platform Owner",
            critical=True,
            priority="P1",
            days_offset=-5,
            effort_hours=12,
            evidence="Unified observability dashboard",
            validation_method="API",
            acceptance_criteria=[
                "All clusters visible",
                "Metrics available",
                "Logs available",
            ],
            auto_verifiable=True,
            verification_type="API",
            deps=["multi_cluster"],
        ),
    ],
}


# ============================================================
# GENERATOR
# ============================================================

def generate_checklist_for_project(
    project_type: str,
    industry: str,
    deployment: str,
    target_kickoff_date_str: str = "",
) -> list[dict[str, Any]]:
    """
    Generate a complete enterprise prerequisite checklist.

    Combines:

    1. Core prerequisites
    2. Project-type prerequisites
    3. Industry prerequisites
    4. Deployment prerequisites

    Duplicate slugs are automatically removed.
    Dependencies are converted from slugs to UUIDs.
    """

    today = datetime.date.today()

    # --------------------------------------------------------
    # Kickoff date
    # --------------------------------------------------------

    if target_kickoff_date_str:
        try:
            kickoff_date = datetime.date.fromisoformat(
                target_kickoff_date_str
            )
        except ValueError:
            kickoff_date = today + datetime.timedelta(days=14)
    else:
        kickoff_date = today + datetime.timedelta(days=14)

    # Normalize project_type
    matched_type = None
    for pt in PROJECT_TYPES:
        if pt.lower() == str(project_type).lower() or str(project_type).lower() in pt.lower() or pt.lower() in str(project_type).lower():
            matched_type = pt
            break
    project_type = matched_type or PROJECT_TYPES[0]

    # Normalize industry
    matched_ind = None
    for ind in INDUSTRIES:
        if ind.lower() == str(industry).lower() or str(industry).lower() in ind.lower() or ind.lower() in str(industry).lower():
            matched_ind = ind
            break
    industry = matched_ind or INDUSTRIES[0]

    # Normalize deployment
    matched_dep = None
    for dep in DEPLOYMENT_TARGETS:
        if dep.lower() == str(deployment).lower() or str(deployment).lower() in dep.lower() or dep.lower() in str(deployment).lower():
            matched_dep = dep
            break
    deployment = matched_dep or DEPLOYMENT_TARGETS[0]

    # --------------------------------------------------------
    # Collect prerequisites (Curated high-impact selection: ~10-12 milestones)
    # --------------------------------------------------------

    raw_items = []

    # 1. Top 4 Essential Core Prerequisites (Governance, Architecture, Security, Access)
    core_selected = [
        item for item in CORE_PREREQUISITES 
        if item.get("slug") in ["project_charter", "architecture_design", "security_compliance_plan", "dev_environment_access", "repo_branching_strategy"]
        or item.get("is_critical")
    ][:4]
    raw_items.extend(deepcopy(core_selected))

    # 2. Top 3-4 Project-Type Specific Prerequisites
    proj_items = PROJECT_PREREQUISITES.get(project_type, [])
    raw_items.extend(deepcopy(proj_items[:4]))

    # 3. Top 2 Industry Governance & Compliance Prerequisites
    ind_items = INDUSTRY_PREREQUISITES.get(industry, [])
    raw_items.extend(deepcopy(ind_items[:2]))

    # 4. Top 2 Target Deployment & Cloud Prerequisites
    dep_items = DEPLOYMENT_PREREQUISITES.get(deployment, [])
    raw_items.extend(deepcopy(dep_items[:2]))

    # --------------------------------------------------------
    # Remove duplicate slugs
    # --------------------------------------------------------

    unique_items = {}

    for item in raw_items:
        slug = item["slug"]

        if slug not in unique_items:
            unique_items[slug] = item

    raw_items = list(unique_items.values())

    # --------------------------------------------------------
    # Generate UUIDs
    # --------------------------------------------------------

    slug_to_id = {}

    for item in raw_items:
        slug_to_id[item["slug"]] = str(uuid.uuid4())

    # --------------------------------------------------------
    # Build final checklist
    # --------------------------------------------------------

    built_items = []

    for item in raw_items:

        item_id = slug_to_id[item["slug"]]

        offset = item.get(
            "days_offset",
            -7
        )

        due_date = (
            kickoff_date
            + datetime.timedelta(days=offset)
        )

        # If prerequisite date has already passed,
        # keep it actionable.
        if due_date < today:
            due_date = today + datetime.timedelta(days=2)

        # ----------------------------------------------------
        # Dependency mapping
        # ----------------------------------------------------

        mapped_dependencies = []

        for dependency in item.get("deps", []):

            dependency_id = slug_to_id.get(
                dependency
            )

            if dependency_id:
                mapped_dependencies.append(
                    dependency_id
                )

        # ----------------------------------------------------
        # Final object
        # ----------------------------------------------------

        built_items.append({

            "id": item_id,

            "slug": item["slug"],

            "category": item.get(
                "category",
                "General"
            ),

            "name": item.get(
                "name"
            ),

            "description": item.get(
                "description",
                ""
            ),

            "owner": item.get(
                "owner",
                "Project Manager"
            ),

            "stakeholder": item.get(
                "stakeholder",
                "Project Manager"
            ),

            "is_critical": item.get(
                "is_critical",
                False
            ),

            "blocking": item.get(
                "blocking",
                False
            ),

            "priority": item.get(
                "priority",
                "P1"
            ),

            "estimated_effort_hours": item.get(
                "estimated_effort_hours",
                4
            ),

            "due_date": due_date.isoformat(),

            "status": "Pending",

            "expected_evidence": item.get(
                "expected_evidence",
                "Verification document or screenshot"
            ),

            "validation_method": item.get(
                "validation_method",
                "Manual"
            ),

            "acceptance_criteria": item.get(
                "acceptance_criteria",
                []
            ),

            "risk_if_missing": item.get(
                "risk_if_missing",
                "Project delay or implementation risk"
            ),

            "auto_verifiable": item.get(
                "auto_verifiable",
                False
            ),

            "verification_type": item.get(
                "verification_type",
                "Manual"
            ),

            "escalation_after_days": item.get(
                "escalation_after_days",
                3
            ),

            "depends_on": mapped_dependencies,

            "evidence_url": None,

            "evidence_file": None,

            "evidence_notes": None,

            "rejection_reason": None,

            "verification_score": None,

            "verification_notes": None,

            "escalation_level": 0,

            "completed_at": None,

            "verified_at": None,

            "verified_by": None,
        })

    return built_items


# ============================================================
# READINESS ENGINE
# ============================================================

def calculate_readiness(
    checklist: list[dict[str, Any]]
) -> dict[str, Any]:

    total = len(checklist)

    completed = sum(
        1
        for item in checklist
        if item["status"] == "Completed"
    )

    pending = sum(
        1
        for item in checklist
        if item["status"] == "Pending"
    )

    in_progress = sum(
        1
        for item in checklist
        if item["status"] == "In Progress"
    )

    blocked = sum(
        1
        for item in checklist
        if item["status"] == "Blocked"
    )

    rejected = sum(
        1
        for item in checklist
        if item["status"] == "Rejected"
    )

    critical_total = sum(
        1
        for item in checklist
        if item["is_critical"]
    )

    critical_completed = sum(
        1
        for item in checklist
        if item["is_critical"]
        and item["status"] == "Completed"
    )

    critical_pending = (
        critical_total
        - critical_completed
    )

    blocking_items = [
        item
        for item in checklist
        if item["blocking"]
        and item["status"] != "Completed"
    ]

    # --------------------------------------------------------
    # Score
    # --------------------------------------------------------

    if total == 0:
        score = 0
    else:
        score = round(
            (completed / total) * 100
        )

    # --------------------------------------------------------
    # Readiness state
    # --------------------------------------------------------

    if blocking_items:
        readiness = "BLOCKED"

    elif critical_pending > 0:
        readiness = "AT_RISK"

    elif score >= 90:
        readiness = "READY"

    elif score >= 75:
        readiness = "NEARLY_READY"

    else:
        readiness = "NOT_READY"

    return {

        "total_prerequisites": total,

        "completed": completed,

        "pending": pending,

        "in_progress": in_progress,

        "blocked": blocked,

        "rejected": rejected,

        "critical_total": critical_total,

        "critical_completed": critical_completed,

        "critical_pending": critical_pending,

        "blocking_count": len(blocking_items),

        "readiness_score": score,

        "readiness": readiness,

        "blocking_items": [
            {
                "id": item["id"],
                "name": item["name"],
                "owner": item["owner"],
                "priority": item["priority"],
            }
            for item in blocking_items
        ],
    }


# ============================================================
# CATEGORY SUMMARY
# ============================================================

def get_category_summary(
    checklist: list[dict[str, Any]]
) -> dict[str, Any]:

    summary = {}

    for item in checklist:

        category = item["category"]

        if category not in summary:

            summary[category] = {
                "total": 0,
                "completed": 0,
                "pending": 0,
                "blocked": 0,
                "critical": 0,
            }

        summary[category]["total"] += 1

        if item["status"] == "Completed":
            summary[category]["completed"] += 1

        elif item["status"] == "Pending":
            summary[category]["pending"] += 1

        elif item["status"] == "Blocked":
            summary[category]["blocked"] += 1

        if item["is_critical"]:
            summary[category]["critical"] += 1

    return summary


# ============================================================
# DEPENDENCY VALIDATION
# ============================================================

def validate_dependencies(
    checklist: list[dict[str, Any]]
) -> list[dict[str, Any]]:

    item_map = {
        item["id"]: item
        for item in checklist
    }

    issues = []

    for item in checklist:

        if item["status"] == "Completed":
            continue

        for dependency_id in item["depends_on"]:

            dependency = item_map.get(
                dependency_id
            )

            if not dependency:
                issues.append({
                    "item": item["name"],
                    "issue": "Missing dependency",
                    "dependency_id": dependency_id,
                })

                continue

            if dependency["status"] != "Completed":

                issues.append({
                    "item": item["name"],
                    "issue": "Dependency not completed",
                    "dependency": dependency["name"],
                    "dependency_status": dependency["status"],
                })

    return issues


# ============================================================
# EXPORT FUNCTION
# ============================================================

def export_project_checklist(
    project_type: str,
    industry: str,
    deployment: str,
    kickoff_date: str,
) -> dict[str, Any]:

    checklist = generate_checklist_for_project(
        project_type=project_type,
        industry=industry,
        deployment=deployment,
        target_kickoff_date_str=kickoff_date,
    )

    readiness = calculate_readiness(
        checklist
    )

    category_summary = get_category_summary(
        checklist
    )

    dependency_issues = validate_dependencies(
        checklist
    )

    return {

        "project": {

            "project_type": project_type,

            "industry": industry,

            "deployment": deployment,

            "kickoff_date": kickoff_date,
        },

        "readiness": readiness,

        "category_summary": category_summary,

        "dependency_issues": dependency_issues,

        "prerequisites": checklist,
    }


# ============================================================
# EXAMPLE
# ============================================================

if __name__ == "__main__":

    project = export_project_checklist(

        project_type="GenAI / LLM Application",

        industry="Healthcare & Life Sciences",

        deployment="AWS Cloud",

        kickoff_date="2026-10-25",
    )

    print(
        json.dumps(
            project,
            indent=2
        )
    )