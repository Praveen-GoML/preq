import axios from 'axios';
import { API_URL } from '../apiConfig';
const DYNAMIC_CACHE = {};

/**
 * Non-Technical Credential Retrieval & Delegation Guide
 * Provides step-by-step, click-by-click instructions for non-technical stakeholders
 * on how to locate, generate, or request credentials from internal IT/DevOps teams.
 */

export const fetchDynamicCredentialGuidance = async (item, forceRefresh = false) => {
  if (!item) return null;
  const key = `${item.name}:${item.category || ''}`;
  if (!forceRefresh && DYNAMIC_CACHE[key]) {
    return DYNAMIC_CACHE[key];
  }

  try {
    const res = await axios.post(`${API_URL}/copilot/dynamic-credential-guide`, {
      name: item.name,
      category: item.category,
      description: item.description,
      expected_evidence: item.expected_evidence,
      client_name: 'Client Sponsor'
    });
    if (res.data && res.data.isCredential) {
      DYNAMIC_CACHE[key] = res.data;
      return res.data;
    }
  } catch (err) {
    console.warn("Dynamic scraper fallback to local rules:", err);
  }

  // Fallback to local synchronous rules
  const localGuide = getCredentialGuidance(item);
  DYNAMIC_CACHE[key] = localGuide;
  return localGuide;
};

export const getCredentialGuidance = (item) => {
  if (!item) return null;

  const name = (item.name || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const evidence = (item.expected_evidence || '').toLowerCase();

  const isCred = 
    name.includes('key') || name.includes('cred') || name.includes('token') || 
    name.includes('secret') || name.includes('access') || name.includes('api') || 
    name.includes('auth') || name.includes('login') || name.includes('webhook') ||
    name.includes('role') || name.includes('iam') || name.includes('account') ||
    name.includes('database') || name.includes('sql') || name.includes('oauth') ||
    name.includes('whatsapp') || name.includes('repository') || name.includes('repo') ||
    name.includes('catalog') || name.includes('payment') || name.includes('checkout') ||
    name.includes('environment') || name.includes('data source') || name.includes('dataset') ||
    cat === 'security' || cat === 'integration' || cat === 'devops' ||
    evidence.includes('token') || evidence.includes('key') || evidence.includes('string') ||
    evidence.includes('credential') || evidence.includes('access');

  if (!isCred) {
    return {
      isCredential: false,
      serviceName: 'Technical Architecture Deliverable',
      quickSteps: [
        'Review the deliverable specification and format requirements.',
        'Assemble the required documentation, schema, or configuration artifact.',
        'Upload the file or paste the verification link in the portal.'
      ]
    };
  }

  // 1. WhatsApp Business Platform & Meta Business Account Access (From User Excel Spec)
  if (name.includes('whatsapp') || desc.includes('whatsapp') || name.includes('meta business') || desc.includes('messaging setup')) {
    return {
      isCredential: true,
      serviceName: 'WhatsApp Business Platform (Meta Cloud API)',
      category: 'Messaging & Communication API',
      consoleName: 'Meta for Developers & Business Manager',
      consoleUrl: 'https://business.facebook.com/settings/whatsapp-business-accounts',
      estimatedTime: '4-6 minutes',
      difficulty: 'Easy (Admin access to Meta Business Suite needed)',
      quickSteps: [
        {
          num: 1,
          action: 'Log in to Meta Business Manager',
          detail: 'Go to business.facebook.com/settings and log in with your corporate Facebook/Meta account.'
        },
        {
          num: 2,
          action: 'Navigate to WhatsApp Accounts',
          detail: 'In the left sidebar, go to Accounts > WhatsApp Accounts. Select or create your business WhatsApp account.'
        },
        {
          num: 3,
          action: 'Create Dedicated System User',
          detail: 'Under Users > System Users, click "+ Add". Name it "goml-preq-whatsapp-svc" and set role to "Admin" or "Employee".'
        },
        {
          num: 4,
          action: 'Assign Assets & Generate Access Token',
          detail: 'Click "Assign Assets" > select your WhatsApp Business Account. Click "Generate New Token" > check "whatsapp_business_messaging" and "whatsapp_business_management".'
        },
        {
          num: 5,
          action: 'Copy Phone Number ID & Permanent Token',
          detail: 'Copy your Phone Number ID, WABA ID (WhatsApp Business Account ID), and the Permanent Access Token into your secure vault.'
        }
      ],
      requiredPermissions: 'whatsapp_business_messaging, whatsapp_business_management permissions with a verified phone number.',
      securityRecommendation: 'Use a Permanent System User Token instead of a temporary 24-hour developer token to avoid sudden message delivery outages.',
      delegationRole: 'Marketing Ops Lead / Meta Business Suite Admin',
      delegationMessage: `Hi Meta / Marketing Admin,\n\nWe need WhatsApp Business Platform API access provisioned for our goML AI project.\n\nSpecs Required:\n- WhatsApp Business Account ID (WABA ID)\n- Phone Number ID (verified business sender number)\n- Permanent System User Access Token (Permissions: whatsapp_business_messaging, whatsapp_business_management)\n- Webhook Callback URL: https://staging.goml.io/webhooks/whatsapp\n\nPlease generate the token in Meta Business Manager and store in our 1Password vault or enter in the PreQ portal.\n\nThank you!`
    };
  }

  // 2. Source Code Repository Access (GitHub / GitLab / Bitbucket - From User Excel Spec)
  if (name.includes('source code') || name.includes('repository') || name.includes('repo') || name.includes('github') || name.includes('gitlab')) {
    const isGitLab = name.includes('gitlab');
    return {
      isCredential: true,
      serviceName: isGitLab ? 'GitLab Repository Access' : 'GitHub Organization & Repository Access',
      category: 'Version Control & Codebase Access',
      consoleName: isGitLab ? 'GitLab Group Settings' : 'GitHub Settings / Collaborators',
      consoleUrl: isGitLab ? 'https://gitlab.com' : 'https://github.com/settings/tokens',
      estimatedTime: '2-4 minutes',
      difficulty: 'Very Easy',
      quickSteps: [
        {
          num: 1,
          action: 'Open Repository Settings',
          detail: `Sign in to ${isGitLab ? 'GitLab' : 'GitHub'} with admin permissions for the target project repository.`
        },
        {
          num: 2,
          action: 'Add Outside Collaborator / Team Invite',
          detail: 'Go to Repository Settings > Collaborators & Teams > Click "Add people". Invite `engineering-onboarding@goml.io` (or provision a machine bot user).'
        },
        {
          num: 3,
          action: 'Set Read / Write Permission Level',
          detail: 'Assign "Read" (for code inspection & schema review) or "Triage/Write" (for staging branch pull requests).'
        },
        {
          num: 4,
          action: 'Optional: Generate Fine-Grained Personal Access Token (PAT)',
          detail: 'If automated CI/CD synchronization is required, go to Developer Settings > Personal access tokens > Fine-grained tokens > Grant repository contents:read.'
        },
        {
          num: 5,
          action: 'Confirm Invitation & Share Repo URL',
          detail: 'Confirm the invite or paste the Git clone URL (e.g. `https://github.com/client-org/project-repo.git`) into the portal.'
        }
      ],
      requiredPermissions: 'Repository Read access to main/staging branches and issue tracker.',
      securityRecommendation: 'Do not grant Admin repository permissions. Fine-grained read-only tokens with expiration dates are recommended.',
      delegationRole: 'Lead Engineer / GitHub Organization Owner',
      delegationMessage: `Hi Engineering Lead,\n\nCould you please grant repository access to the goML engineering team for our Day-1 project onboarding?\n\nDetails:\n- Target Repository: [e.g. github.com/clientcorp/core-platform]\n- Permissions Needed: Read-Only (Clone, Pull Requests, Issues)\n- Invite Email / Handle: engineering-onboarding@goml.io\n\nPlease confirm once invited so we can mark this prerequisite cleared in PreQ.\n\nThanks!`
    };
  }

  // 3. Product Catalog APIs, Checkout & Payment APIs (Stripe / Shopify / REST APIs - From User Excel Spec)
  if (name.includes('catalog') || name.includes('checkout') || name.includes('payment') || name.includes('stripe') || name.includes('shopify') || name.includes('order tracking') || desc.includes('checkout') || desc.includes('catalog')) {
    return {
      isCredential: true,
      serviceName: 'E-Commerce, Catalog & Payment Gateway APIs',
      category: 'API Contract & Authentication Keys',
      consoleName: 'Payment Gateway / E-Commerce Admin (Stripe, Shopify, Custom API)',
      consoleUrl: 'https://dashboard.stripe.com/apikeys',
      estimatedTime: '3-5 minutes',
      difficulty: 'Easy',
      quickSteps: [
        {
          num: 1,
          action: 'Log into Payment or E-Commerce Portal',
          detail: 'Open your Stripe Dashboard, Shopify Admin, or internal API Gateway management console in Staging/Sandbox mode.'
        },
        {
          num: 2,
          action: 'Navigate to API Keys / Access Tokens',
          detail: 'In Stripe: Developers > API Keys. In Shopify: Apps and sales channels > Develop apps > API credentials.'
        },
        {
          num: 3,
          action: 'Create Restricted API Key (Least Privilege)',
          detail: 'Click "+ Create restricted key". Grant Read access to Products, Orders, Customers, and Charges (Read-only for Day-1 testing).'
        },
        {
          num: 4,
          action: 'Retrieve Base Endpoint & Auth Headers',
          detail: 'Copy the API base URL (e.g. `https://api.clientcorp.com/v1/catalog`) and authentication header format (Bearer token or API Key).'
        },
        {
          num: 5,
          action: 'Mask and Submit in PreQ Handover Table',
          detail: 'Enter the endpoint URL, key prefix, and whitelisted test credentials into the PreQ Handover form below.'
        }
      ],
      requiredPermissions: 'Read-only access to Product Catalog, Order Status, and Sandbox Checkout test transactions.',
      securityRecommendation: 'Always provide Test/Sandbox API keys first. Never submit live production keys with unrestricted write/payout authority.',
      delegationRole: 'E-Commerce Product Manager / Payment Gateway Admin',
      delegationMessage: `Hi Team,\n\nWe need Sandbox / Staging API credentials for our Product Catalog and Checkout endpoints for goML onboarding.\n\nDetails Required:\n- Product Catalog Base URL & Auth Key (Read-only)\n- Checkout / Payment Sandbox Test API Key (e.g. Stripe rk_test_... or Shopify Storefront Access Token)\n- Order Tracking Endpoint documentation\n- Staging Whitelist IP: 34.120.45.10/32\n\nPlease add details into 1Password or share securely in the PreQ portal.\n\nThank you!`
    };
  }

  // 4. Model Training Data Access & Validation Dataset (From User Excel Spec)
  if (name.includes('training data') || name.includes('validation dataset') || name.includes('data source') || name.includes('dataset') || desc.includes('product catalog data') || desc.includes('customer order history')) {
    return {
      isCredential: true,
      serviceName: 'Model Training & Validation Dataset Storage',
      category: 'Data Lake & Analytics Storage Access',
      consoleName: 'AWS S3 / Google Drive / Snowflake / BigQuery',
      consoleUrl: 'https://s3.console.aws.amazon.com/s3/',
      estimatedTime: '4-6 minutes',
      difficulty: 'Easy to Moderate',
      quickSteps: [
        {
          num: 1,
          action: 'Prepare Anonymized Sample Data',
          detail: 'Ensure dataset containing product catalog items, order history, and recommendation examples has customer PII/credit cards masked or removed.'
        },
        {
          num: 2,
          action: 'Upload to Staging Cloud Bucket or Shared Drive',
          detail: 'Place the CSV/Parquet/JSON files in an S3 bucket (e.g. `s3://clientcorp-goml-training-data/`) or secure Google Drive / Snowflake Share.'
        },
        {
          num: 3,
          action: 'Configure Read-Only Access Policy',
          detail: 'Grant Read permissions to goML Service Principal (`goml-data-ingest@goml-cloud.iam.gserviceaccount.com` or IAM Role ARN).'
        },
        {
          num: 4,
          action: 'Verify Data Dictionary & Record Count',
          detail: 'Confirm the dataset schema includes required columns (product_id, category, tags, order_date, attributes).'
        },
        {
          num: 5,
          action: 'Submit S3 URI or Storage Link in Portal',
          detail: 'Paste the bucket URL or folder share link into the Handover specification table below.'
        }
      ],
      requiredPermissions: 's3:GetObject, s3:ListBucket on the training data bucket prefix.',
      securityRecommendation: 'Never include raw unmasked PII, Social Security Numbers, or plaintext payment card data in AI training datasets.',
      delegationRole: 'Data Steward / BI Analytics Lead',
      delegationMessage: `Hi Data Team,\n\nWe need the sample training and validation dataset provisioned for the goML AI model onboarding.\n\nRequirements:\n- Anonymized product catalog dataset with category tags and attributes\n- Historical order & recommendation interaction logs (sample 5,000 - 50,000 rows)\n- Location: Staging S3 bucket or Google Drive folder\n- Grant Read access to: goml-data-ingest@goml-cloud.iam.gserviceaccount.com\n\nPlease confirm bucket link once uploaded.\n\nThanks!`
    };
  }

  // 5. Cloud Provider Account & IAM Access (AWS / GCP / Azure - From User Excel Spec)
  if (name.includes('cloud provider') || name.includes('iam access') || name.includes('aws') || name.includes('gcp') || name.includes('azure') || name.includes('cloud environment') || desc.includes('cloud environment where the solution will be hosted')) {
    return {
      isCredential: true,
      serviceName: 'Cloud Provider Infrastructure & IAM Access (AWS / GCP / Azure)',
      category: 'Cloud Hosting & Infrastructure IAM Role',
      consoleName: 'Cloud Management Console (AWS / GCP / Azure)',
      consoleUrl: 'https://console.aws.amazon.com/iam/home#/roles',
      estimatedTime: '5-8 minutes',
      difficulty: 'Moderate (Cloud Administrator permissions needed)',
      quickSteps: [
        {
          num: 1,
          action: 'Sign in to Cloud Management Console',
          detail: 'Open your cloud console (AWS Management Console, Google Cloud Console, or Azure Portal) in your Staging/Development account.'
        },
        {
          num: 2,
          action: 'Create Cross-Account IAM Role or Service Principal',
          detail: 'In IAM > Roles > Create Role. Select "Another AWS Account" (or GCP Service Account) and enter goML Account ID.'
        },
        {
          num: 3,
          action: 'Attach Least-Privilege Policy',
          detail: 'Attach policies scoped strictly to the project resource group or ECS/EKS/Cloud Run cluster (e.g. ReadOnlyAccess + ECR/ArtifactRegistry deploy permissions).'
        },
        {
          num: 4,
          action: 'Configure External ID & IP Restriction',
          detail: 'Require an External ID for secure STS assume-role and whitelist goML Staging Ingress IP: `34.120.45.10/32`.'
        },
        {
          num: 5,
          action: 'Copy Role ARN or Service Account Key',
          detail: 'Copy the Role ARN (`arn:aws:iam::123456789012:role/goMLReadWriteExecutionRole`) and paste into the portal.'
        }
      ],
      requiredPermissions: 'Execution role on staging compute cluster (ECS/EKS/Cloud Run/Lambda) and S3/Cloud Storage staging buckets.',
      securityRecommendation: 'Use AssumeRole with External ID instead of static long-lived IAM root keys. Never share root account credentials.',
      delegationRole: 'Cloud Infrastructure Lead / DevOps Administrator',
      delegationMessage: `Hi Cloud / DevOps Admin,\n\nWe need a staging cloud environment IAM role provisioned for the goML engineering team.\n\nSpecs:\n- Environment: Staging / Dev Sandbox\n- Auth Method: Cross-Account IAM AssumeRole with External ID\n- Scopes: ECS/EKS staging cluster deployment, S3 staging bucket read/write, CloudWatch log streaming\n- Whitelisted Ingress IP: 34.120.45.10/32\n\nPlease share the Role ARN securely in 1Password or the PreQ portal.\n\nThank you!`
    };
  }

  // 6. Development Environment Setup Guide & Bastion/VPN (From User Excel Spec)
  if (name.includes('development environment') || name.includes('setup guide') || name.includes('bastion') || name.includes('vpn') || desc.includes('accessing and using development environments')) {
    return {
      isCredential: true,
      serviceName: 'Development Environment & Staging Ingress Setup',
      category: 'Developer Environment & VPN Connectivity',
      consoleName: 'Internal IT / DevOps Confluence / Notion / OpenVPN',
      consoleUrl: 'https://console.aws.amazon.com/vpc/',
      estimatedTime: '3-5 minutes',
      difficulty: 'Easy',
      quickSteps: [
        {
          num: 1,
          action: 'Locate Environment Setup Documentation',
          detail: 'Retrieve your team\'s internal README, Confluence page, or Notion guide detailing local Docker compose or staging environment setup.'
        },
        {
          num: 2,
          action: 'Identify Network Ingress Requirements',
          detail: 'Check if staging requires OpenVPN profile (.ovpn), WireGuard config, or IP whitelisting (add goML IP: 34.120.45.10/32).'
        },
        {
          num: 3,
          action: 'Verify Staging Seed Credentials',
          detail: 'Assemble test login accounts (e.g. staging test customer email & password) for functional validation.'
        },
        {
          num: 4,
          action: 'Document Environment Variables & Ports',
          detail: 'Create a `.env.example` template with required config keys (PORT, DATABASE_URL, REDIS_HOST, API_BASE_URL).'
        },
        {
          num: 5,
          action: 'Upload Guide PDF / Paste Setup URL in PreQ',
          detail: 'Attach the setup document or paste the link and connection details in the verification workspace.'
        }
      ],
      requiredPermissions: 'Staging environment network access and test user profile.',
      securityRecommendation: 'Ensure VPN profiles are scoped only to staging subnets, isolated from internal corporate production networks.',
      delegationRole: 'DevOps Lead / Senior Full-Stack Engineer',
      delegationMessage: `Hi Engineering Team,\n\nCould you please provide the Development Environment Setup Guide and VPN/Ingress credentials for goML Day-1 clearance?\n\nItems Needed:\n- Staging environment architecture overview / README\n- VPN profile (.ovpn) or IP whitelist confirmation (34.120.45.10/32)\n- Staging test user accounts\n- .env variable template\n\nPlease upload or share via the PreQ portal.\n\nThank you!`
    };
  }

  // 7. Google Maps / GCP APIs
  if (name.includes('map') || name.includes('google') || name.includes('geo') || desc.includes('maps') || desc.includes('routing')) {
    return {
      isCredential: true,
      serviceName: 'Google Cloud Platform (Maps Platform API)',
      category: 'Geocoding & Navigation API Key',
      consoleName: 'Google Cloud Console',
      consoleUrl: 'https://console.cloud.google.com/google/maps-apis/credentials',
      estimatedTime: '3-5 minutes',
      difficulty: 'Easy (No code required)',
      quickSteps: [
        {
          num: 1,
          action: 'Log in to Google Cloud Console',
          detail: 'Open console.cloud.google.com with your company Google account and select your project from the top dropdown.'
        },
        {
          num: 2,
          action: 'Navigate to Maps Credentials',
          detail: 'In the search bar at top, type "Maps Credentials" or go to Left Menu > Google Maps Platform > Credentials.'
        },
        {
          num: 3,
          action: 'Create API Key',
          detail: 'Click "+ CREATE CREDENTIALS" at the top and select "API key". A popup will show your new key (starts with "AIza...").'
        },
        {
          num: 4,
          action: 'Set Security Restrictions (Crucial)',
          detail: 'Click "Edit API key". Under "API restrictions", select Restrict Key and check: Directions API, Geocoding API, and Distance Matrix API.'
        },
        {
          num: 5,
          action: 'Save & Copy Key',
          detail: 'Click "Save", copy the key, and store it in your password vault or paste it into the secure handover box below.'
        }
      ],
      requiredPermissions: 'Billing account linked + APIs enabled: Directions API, Geocoding API, Distance Matrix API.',
      securityRecommendation: 'Always restrict the API key to specific APIs and server IPs (34.120.45.10/32) to prevent unauthorized billing.',
      delegationRole: 'Google Cloud Admin / IT Lead',
      delegationMessage: `Hi IT Team,\n\nFor our upcoming goML project onboarding, could you please provision a restricted Google Maps API key?\n\nRequirements:\n- Enabled APIs: Directions API, Geocoding API, Distance Matrix API\n- Application Restriction: IP Whitelist (34.120.45.10/32 - goML Staging)\n- Project Name: ${item.name}\n\nPlease share the key securely or store in our team 1Password vault.\n\nThank you!`
    };
  }

  // 8. OpenAI / Anthropic / LLM API Keys
  if (name.includes('openai') || name.includes('anthropic') || name.includes('llm') || name.includes('gpt') || name.includes('claude') || (cat === 'integration' && desc.includes('model'))) {
    const isOpenAI = !name.includes('anthropic') && !name.includes('claude');
    return {
      isCredential: true,
      serviceName: isOpenAI ? 'OpenAI Platform API' : 'Anthropic Claude API',
      category: 'AI Model Inference API Key',
      consoleName: isOpenAI ? 'OpenAI Platform Console' : 'Anthropic Console',
      consoleUrl: isOpenAI ? 'https://platform.openai.com/api-keys' : 'https://console.anthropic.com/settings/keys',
      estimatedTime: '2-3 minutes',
      difficulty: 'Very Easy',
      quickSteps: [
        {
          num: 1,
          action: `Log in to ${isOpenAI ? 'OpenAI' : 'Anthropic'} Console`,
          detail: `Visit ${isOpenAI ? 'platform.openai.com' : 'console.anthropic.com'} and log in with your organization admin or developer account.`
        },
        {
          num: 2,
          action: 'Go to API Keys Section',
          detail: 'In the left sidebar navigation, click on "API Keys" (or Settings > API Keys).'
        },
        {
          num: 3,
          action: 'Create New Secret Key',
          detail: `Click "+ Create new secret key". Name it "goML-PreQ-Integration" and select your organization project.`
        },
        {
          num: 4,
          action: 'Copy the Secret Key Immediately',
          detail: 'Copy the generated key (starts with "sk-...") immediately and save it in 1Password. (It will never be displayed again).'
        },
        {
          num: 5,
          action: 'Check Usage Limits & Credits',
          detail: 'Go to Billing/Limits tab to ensure an active payment method with at least $20 credit balance is provisioned.'
        }
      ],
      requiredPermissions: 'Model Inference Read/Write (gpt-4o, claude-3-5-sonnet) + active billing balance.',
      securityRecommendation: 'Set monthly spend caps in Billing > Usage Limits to avoid unexpected spikes.',
      delegationRole: 'AI Platform Admin / Engineering Lead',
      delegationMessage: `Hi Team,\n\nWe need an API Key provisioned for ${isOpenAI ? 'OpenAI' : 'Anthropic'} for our goML AI project.\n\nDetails:\n- Label: goML-PreQ-Integration\n- Scope: Standard model inference (Tier 2+ rate limits recommended)\n- Spend Cap: $50/month test budget\n\nPlease drop the secret in our 1Password vault or share via secure channel.\n\nThanks!`
    };
  }

  // 9. Database (PostgreSQL / MySQL / Snowflake / RDS / Cloud SQL - From User Excel Spec)
  if (name.includes('sql') || name.includes('database') || name.includes('schema') || name.includes('mysql') || name.includes('postgres') || name.includes('snowflake') || cat === 'data') {
    return {
      isCredential: true,
      serviceName: 'Database Server (PostgreSQL / MySQL / Snowflake)',
      category: 'Database Connection String & Read-Only User',
      consoleName: 'Database Admin / Cloud RDS Console (AWS RDS, Supabase, Snowflake)',
      consoleUrl: 'https://console.aws.amazon.com/rds/home',
      estimatedTime: '5 minutes',
      difficulty: 'Moderate (DBA / DevOps assistance recommended)',
      quickSteps: [
        {
          num: 1,
          action: 'Open Database Client or Cloud Console',
          detail: 'Connect to your database instance via pgAdmin, DBeaver, Snowflake Snowsight, or AWS RDS.'
        },
        {
          num: 2,
          action: 'Create a Read-Only User Account',
          detail: 'Run SQL: CREATE USER goml_data_ro WITH PASSWORD \'your-secure-password\';'
        },
        {
          num: 3,
          action: 'Grant Schema Read Permissions',
          detail: 'Run SQL: GRANT USAGE ON SCHEMA public TO goml_data_ro; GRANT SELECT ON ALL TABLES IN SCHEMA public TO goml_data_ro;'
        },
        {
          num: 4,
          action: 'Configure Network Security / Firewall',
          detail: 'In AWS RDS Security Group or GCP Cloud SQL Authorized Networks, whitelist goML IP: 34.120.45.10/32.'
        },
        {
          num: 5,
          action: 'Assemble Connection URL',
          detail: 'Format: postgres://goml_data_ro:password@hostname:5432/dbname and store in AWS Secrets Manager or 1Password.'
        }
      ],
      requiredPermissions: 'SELECT on specified staging / sample schema. Ensure PII columns are masked or excluded.',
      securityRecommendation: 'Never provide the superuser (postgres/root) password. Always use a dedicated read-only role with SSL enforced.',
      delegationRole: 'Database Administrator (DBA) / Infrastructure Lead',
      delegationMessage: `Hi DBA Team,\n\nWe need a read-only database credential created for goML schema analysis & Day-1 validation.\n\nSpecs needed:\n- Hostname & Port: [e.g. db-staging.corp.internal:5432]\n- Database Name: [e.g. analytics_staging]\n- User: goml_data_ro (SELECT permissions only on public schema)\n- IP Ingress Whitelist: 34.120.45.10/32\n- Enforce SSL: Enabled\n\nPlease store credentials in Secrets Manager / 1Password and confirm.\n\nThank you!`
    };
  }

  // 10. Salesforce / HubSpot / CRM / OAuth Connected App
  if (name.includes('salesforce') || name.includes('crm') || name.includes('hubspot') || name.includes('oauth') || name.includes('connected app')) {
    return {
      isCredential: true,
      serviceName: 'Salesforce CRM / Connected App OAuth',
      category: 'Enterprise OAuth 2.0 Credentials',
      consoleName: 'Salesforce Setup Portal',
      consoleUrl: 'https://login.salesforce.com',
      estimatedTime: '6-8 minutes',
      difficulty: 'Moderate (Salesforce System Admin needed)',
      quickSteps: [
        {
          num: 1,
          action: 'Log in to Salesforce Setup',
          detail: 'Sign in to Salesforce with a System Administrator profile and click the Gear Icon > Setup.'
        },
        {
          num: 2,
          action: 'Navigate to App Manager',
          detail: 'In the Quick Find box on the left, search for "App Manager" and click "New Connected App".'
        },
        {
          num: 3,
          action: 'Configure Connected App Details',
          detail: 'Enter App Name: "goML Integration", Contact Email, and check "Enable OAuth Settings".'
        },
        {
          num: 4,
          action: 'Set OAuth Scopes',
          detail: 'Add Scopes: "Access and manage your data (api)" and "Perform requests at any time (refresh_token, offline_access)".'
        },
        {
          num: 5,
          action: 'Retrieve Consumer Key & Secret',
          detail: 'Save the app, click "Manage Consumer Details", verify your email with OTP, and copy Consumer Key (Client ID) & Consumer Secret.'
        }
      ],
      requiredPermissions: 'API Enabled user license + Read access to relevant standard/custom objects.',
      securityRecommendation: 'Test against a Salesforce Sandbox first before provisioning in Production.',
      delegationRole: 'Salesforce Administrator / CRM Lead',
      delegationMessage: `Hi Salesforce Admin,\n\nCould you create a Connected App in our Salesforce Sandbox for the goML integration?\n\nRequirements:\n- Connected App Name: goML PreQ Integration\n- Scopes: api, refresh_token, offline_access\n- Callback URL: https://staging.goml.io/oauth/callback\n- Trusted IP Range: 34.120.45.10\n\nPlease share the Consumer Key and Secret securely via 1Password.\n\nThanks!`
    };
  }

  // 11. Generic Fallback for any other API / SSO / System Access
  return {
    isCredential: true,
    serviceName: 'Cloud & System Service Credentials',
    category: 'API Key / Service Account Token',
    consoleName: 'Internal IT / Identity Portal (Okta, Azure AD, AWS, GCP)',
    consoleUrl: 'https://console.cloud.google.com',
    estimatedTime: '3-5 minutes',
    difficulty: 'Easy to Moderate',
    quickSteps: [
      {
        num: 1,
        action: 'Identify the Host Platform',
        detail: 'Check which service (Cloud provider, SaaS tool, or Internal API) manages this deliverable.'
      },
      {
        num: 2,
        action: 'Access Admin / Developer Settings',
        detail: 'Log into the platform dashboard and locate the "API Keys", "Security", or "Developer" tab.'
      },
      {
        num: 3,
        action: 'Provision Dedicated Service Credential',
        detail: 'Create a new key or service account named "goML-PreQ" with read-only or minimum necessary permissions.'
      },
      {
        num: 4,
        action: 'Store in Secure Vault',
        detail: 'Store the secret in 1Password, AWS Secrets Manager, or enter the masked token in the Handover table below.'
      }
    ],
    requiredPermissions: 'Least-privilege read access scoped strictly to project staging environment.',
    securityRecommendation: 'Never send raw unmasked secrets over unencrypted email or public chats.',
    delegationRole: 'IT Administrator / Technical Lead',
    delegationMessage: `Hi IT / Security Lead,\n\nFor our goML project readiness clearance (${item.name}), we require service access credentials.\n\nScope required:\n- Requirement: ${item.name} (${item.category})\n- Environment: Staging / Sandbox\n- Ingress IP Whitelist: 34.120.45.10/32\n\nPlease provision and store in our corporate vault, or enter details in the PreQ portal.\n\nThank you!`
  };
};
