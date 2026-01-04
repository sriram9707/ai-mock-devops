---
id: aws-security-landing-zone
tags: [auto-tagged]
---

# AWS Security & Landing Zone: Interviewer Reference

This document provides deep knowledge for conducting scenario-based interviews on AWS security architecture and multi-account strategies. Essential for AWS Cloud Architect roles.

---

## How to Use This Document

For AWS Cloud Architect interviews, focus on enterprise-scale security patterns and multi-account governance. Present scenarios that require understanding of AWS Organizations, Control Tower, and security services.

---

## AWS Organizations & Multi-Account Strategy

### Core Concepts

AWS Organizations enables centralized management of multiple AWS accounts. The key components include the Management Account (formerly master), which is the root of the organization and should contain minimal workloads. Organizational Units (OUs) provide hierarchical grouping of accounts, while Service Control Policies (SCPs) set permission guardrails across accounts.

### Scenario: Multi-Account Design

"You're designing an AWS environment for a company with 500 developers, multiple business units, and strict compliance requirements. How do you structure the accounts?"

**Expected architecture:**

The recommended OU structure typically includes a Security OU containing Log Archive and Security Tooling accounts, an Infrastructure OU with Network and Shared Services accounts, a Workloads OU divided into Production and Non-Production sub-OUs, a Sandbox OU for developer experimentation, and a Suspended OU for accounts pending deletion.

**Natural follow-up directions:**

If candidate proposes structure → "Why separate Security OU from others? What goes in each account?"
- Expected: Separation of duties, Log Archive for centralized logging (immutable), Security Tooling for GuardDuty/Security Hub aggregation

If candidate mentions "one account per team" → "What are the trade-offs of many small accounts vs fewer large accounts?"
- Expected: More accounts = better isolation but more overhead. Consider account vending automation, shared services strategy.

### Scenario: Service Control Policies

"Developers keep launching resources in unapproved regions. How do you prevent this?"

**Expected SCP:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyUnapprovedRegions",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": ["us-east-1", "us-west-2", "eu-west-1"]
        }
      }
    }
  ]
}
```

**Follow-up directions:**

If candidate writes SCP → "This blocks global services like IAM and CloudFront. How do you handle that?"
- Expected: Add condition to exclude global services, or use NotAction with specific regional services

If candidate mentions "IAM policies instead" → "What's the difference between SCPs and IAM policies?"
- Expected: SCPs are guardrails (maximum permissions), IAM policies grant permissions. SCPs don't grant anything, only restrict. SCPs apply to entire account.

---

## AWS Control Tower

### Core Concepts

Control Tower provides automated landing zone setup with best practices. It includes Account Factory for standardized account provisioning, Guardrails (preventive and detective) for governance, and a Dashboard for compliance visibility.

### Scenario: Landing Zone Setup

"You're setting up AWS for a new enterprise client. They want to follow AWS best practices. How do you approach this?"

**Expected approach:**

Start with Control Tower for the foundation, which provides pre-configured OUs (Security, Sandbox), mandatory guardrails, centralized logging to S3, and CloudTrail organization trail. Customize by adding additional OUs for workloads, enabling additional guardrails based on compliance needs, and integrating with existing identity provider.

**Follow-up directions:**

If candidate mentions Control Tower → "What if the client has existing AWS accounts? Can you use Control Tower?"
- Expected: Yes, can enroll existing accounts, but they must meet prerequisites. May need to remediate non-compliant resources first.

If candidate mentions "build custom" → "When would you build a custom landing zone instead of using Control Tower?"
- Expected: Very specific requirements Control Tower can't meet, existing mature automation, need for customization Control Tower doesn't allow. But usually Control Tower is recommended.

### Scenario: Guardrails

"Explain the difference between preventive and detective guardrails. Give examples of each."

**Expected understanding:**

Preventive guardrails use SCPs to block actions before they happen. Examples include disallowing public S3 buckets, preventing root user access, and restricting regions.

Detective guardrails use AWS Config rules to detect non-compliance after the fact. Examples include detecting unencrypted EBS volumes, identifying IAM users without MFA, and finding public RDS instances.

**Follow-up:** "A detective guardrail shows non-compliance. How do you remediate?"
- Expected: AWS Config remediation actions (Lambda, SSM), manual remediation, or accept risk with documentation

---

## Security Services Deep-Dive

### GuardDuty

GuardDuty provides intelligent threat detection using ML to analyze CloudTrail, VPC Flow Logs, and DNS logs.

**Scenario: GuardDuty Alert**
"GuardDuty alerts on 'UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration'. What does this mean and what do you do?"

**Expected response:**

This finding indicates EC2 instance credentials are being used from outside AWS, suggesting the instance may be compromised or credentials were stolen.

Immediate actions include identifying the affected instance, revoking the instance role's sessions, investigating the instance for compromise, and checking CloudTrail for what the credentials accessed.

**Follow-up:** "How do you aggregate GuardDuty findings across 50 accounts?"
- Expected: Designate a GuardDuty administrator account, enable organization-wide GuardDuty, findings aggregate to admin account

### Security Hub

Security Hub provides centralized security findings aggregation and compliance checks.

**Scenario: Compliance Dashboard**
"Leadership wants a single dashboard showing security compliance across all accounts. How do you implement this?"

**Expected approach:**

Enable Security Hub with organization integration, enable relevant standards (CIS, PCI-DSS, AWS Foundational), aggregate findings to central security account, create custom insights for executive reporting, and integrate with ticketing system for remediation tracking.

**Follow-up:** "Security Hub shows 5000 findings. How do you prioritize?"
- Expected: Filter by severity (Critical/High first), focus on findings with active resources, group by finding type, automate remediation for common issues

### AWS Config

Config provides resource inventory, configuration history, and compliance rules.

**Scenario: Compliance Automation**
"Auditors need proof that all S3 buckets are encrypted. How do you provide this?"

**Expected approach:**

Use AWS Config rule `s3-bucket-server-side-encryption-enabled`, enable Config across all accounts (organization), generate compliance reports, set up auto-remediation for non-compliant buckets.

**Follow-up:** "How do you handle false positives or exceptions?"
- Expected: Config rule exceptions, documented risk acceptance, compensating controls

---

## Identity & Access Management at Scale

### Scenario: Enterprise Identity

"The company uses Active Directory for all employees. How do you integrate with AWS?"

**Expected approaches:**

Option 1 involves AWS IAM Identity Center (SSO) with AD Connector or AWS Managed Microsoft AD, providing centralized access to all accounts with permission sets mapped to AD groups.

Option 2 uses SAML federation with existing IdP, which works well if they already have Okta/Azure AD, with role mapping based on SAML attributes.

**Follow-up directions:**

If candidate mentions IAM Identity Center → "How do you manage permissions for 500 developers across 50 accounts?"
- Expected: Permission sets (reusable permission templates), assign to groups not individuals, use attribute-based access control (ABAC) for dynamic permissions

If candidate mentions "IAM users" → "Why not create IAM users in each account?"
- Expected: Doesn't scale, no centralized management, password management nightmare, can't enforce MFA centrally

### Scenario: Break-Glass Access

"How do you handle emergency access when SSO is down?"

**Expected approach:**

Maintain break-glass IAM users in critical accounts (management, security), store credentials securely (hardware security module, sealed envelope), require dual authorization to access, audit all break-glass usage, and test the process regularly.

**Follow-up:** "How do you secure break-glass credentials?"
- Expected: Hardware MFA, credentials split between multiple people, physical security, automated alerts on any usage

---

## Network Security

### Scenario: Centralized Egress

"You have 20 VPCs across 10 accounts. All need internet access but you want centralized security inspection. How do you design this?"

**Expected architecture:**

Use Transit Gateway to connect all VPCs, create a central inspection VPC with AWS Network Firewall or third-party appliance, route all egress traffic through inspection VPC, and implement allow/deny rules centrally.

**Follow-up directions:**

If candidate proposes Transit Gateway → "What about traffic between VPCs? Does that also go through inspection?"
- Expected: Depends on requirements. Can route inter-VPC traffic through inspection (more secure, higher latency) or allow direct (faster, less visibility)

If candidate mentions "NAT Gateway per VPC" → "What are the downsides of this approach?"
- Expected: No centralized inspection, higher cost (NAT Gateway per VPC), no visibility into egress traffic

### Scenario: DDoS Protection

"How do you protect a public-facing application from DDoS attacks?"

**Expected approach:**

Use CloudFront as the entry point (absorbs attacks at edge), enable AWS Shield Standard (automatic, free), consider Shield Advanced for critical apps (DRT support, cost protection), use WAF for application-layer attacks, and implement rate limiting.

**Follow-up:** "What's the difference between Shield Standard and Shield Advanced?"
- Expected: Standard is automatic L3/L4 protection. Advanced adds L7 protection, DRT access, cost protection, and advanced metrics.

---

## Incident Response

### Scenario: Security Incident

"CloudTrail shows an IAM access key being used from an IP in a country where you have no employees. Walk me through your response."

**Expected response:**

Immediate containment involves disabling the access key and identifying the associated user/role.

Investigation includes reviewing CloudTrail for all actions by this key, checking what resources were accessed/modified, determining how the key was compromised, and looking for persistence mechanisms.

Remediation requires rotating all credentials for affected user, reviewing and reverting unauthorized changes, and patching the vulnerability that led to compromise.

Post-incident activities include conducting a blameless postmortem, implementing preventive controls, and updating runbooks.

**Follow-up:** "How do you automate parts of this response?"
- Expected: GuardDuty + EventBridge + Lambda for automatic key disabling, pre-built forensics AMI, automated evidence collection

---

## Compliance & Audit

### Scenario: Audit Preparation

"External auditors are coming for SOC 2 audit. How do you prepare?"

**Expected approach:**

Evidence collection involves CloudTrail logs (immutable in Log Archive account), AWS Config compliance reports, IAM credential reports, and Security Hub compliance scores.

Access for auditors can be provided through read-only role in security account or AWS Artifact for AWS compliance reports.

Continuous compliance is maintained through automated compliance checks, regular internal audits, and remediation tracking.

**Follow-up:** "How do you ensure CloudTrail logs haven't been tampered with?"
- Expected: Log file integrity validation, S3 Object Lock, separate log archive account with restricted access, CloudTrail organization trail

---

## Level-Specific Conversation Starters

### Cloud Architect

"Design a landing zone for a healthcare company that needs HIPAA compliance."
- Listen for: Multi-account strategy, encryption everywhere, audit logging, access controls, BAA considerations
- Follow up on: How do you handle PHI? What additional controls beyond standard landing zone?

"Your client has 100 existing AWS accounts with no central governance. How do you bring them under control?"
- Listen for: Phased approach, AWS Organizations enrollment, Control Tower adoption, remediation strategy
- Follow up on: How do you handle accounts that don't meet prerequisites? What's the migration timeline?

---

## Red Flags vs Green Flags

### Red Flags
- Suggests single account for enterprise
- Doesn't mention SCPs for guardrails
- No understanding of centralized logging importance
- "Just use IAM users"
- No incident response plan

### Green Flags
- Understands multi-account strategy and rationale
- Knows Control Tower and when to use it
- Can design SCPs for specific requirements
- Thinks about security at every layer
- Has incident response experience
- Considers compliance requirements in design
- Understands identity federation at scale
