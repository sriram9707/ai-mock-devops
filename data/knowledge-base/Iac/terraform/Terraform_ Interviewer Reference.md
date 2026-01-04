---
id: terraform-basics-syntax
tags: [auto-tagged]
---

# Terraform: Interviewer Reference

This document provides deep knowledge for conducting natural, scenario-based interviews on Terraform Infrastructure as Code. Focus on practical implementation, state management, and team collaboration patterns.

---

## How to Use This Document

- **Entry Level:** Focus on basic HCL syntax, resources, and simple deployments.
- **Senior/Medior:** Focus on modules, state management, and team workflows.
- **SRE/Architect:** Focus on large-scale patterns, security, and organizational standards.

---

## Core Concepts: Terraform Fundamentals

### Basic Structure

```hcl
# Provider configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# Resources
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type
  
  tags = {
    Name        = "web-server"
    Environment = var.environment
  }
}

# Outputs
output "instance_ip" {
  value       = aws_instance.web.public_ip
  description = "Public IP of the web server"
}
```

### What Entry Level Should Know
- Basic HCL syntax
- Resources, variables, outputs
- `terraform init`, `plan`, `apply`
- What state file is and why it matters

### What Senior Level Should Know
- Modules and module composition
- Remote state and locking
- Workspaces vs directory structure
- Import existing resources
- State manipulation commands

### What SRE Should Know
- Large-scale state management
- CI/CD integration patterns
- Policy as Code (Sentinel, OPA)
- Multi-account/multi-region patterns
- Drift detection and remediation

---

## Scenario Pattern: State Issues

### Incident: State Lock Won't Release

**What's happening:** `terraform apply` fails with "Error acquiring the state lock".

**Common causes:**
- Previous run crashed or was interrupted
- Someone else is running Terraform
- Lock wasn't released properly

**Resolution:**
```bash
# Check who holds the lock
terraform force-unlock <LOCK_ID>

# But first, verify no one is actually running
# Check DynamoDB table for lock info
aws dynamodb get-item --table-name terraform-locks --key '{"LockID":{"S":"my-bucket/path/terraform.tfstate"}}'
```

**Natural follow-up directions:**

If candidate uses `force-unlock` → "What are the risks of force-unlocking?"
- Expected: Could corrupt state if someone is actually running. Always verify first. Could lead to conflicting applies.

If candidate mentions DynamoDB → "Why do we use DynamoDB for locking? What happens if DynamoDB is unavailable?"
- Expected: Provides distributed locking. If unavailable, can't acquire lock, Terraform fails safely. Discuss HA considerations.

### Incident: State File Corrupted

**What's happening:** Terraform errors with "Error loading state" or state shows resources that don't exist.

**Recovery options:**
1. Restore from backup (S3 versioning)
2. Import resources back into state
3. Recreate state from scratch (last resort)

```bash
# List state versions (if S3 versioning enabled)
aws s3api list-object-versions --bucket my-terraform-state --prefix prod/terraform.tfstate

# Restore previous version
aws s3api get-object --bucket my-terraform-state --key prod/terraform.tfstate --version-id <VERSION_ID> terraform.tfstate.backup
```

**Natural follow-up directions:**

If candidate mentions S3 versioning → "How do you ensure state backups are actually happening?"
- Expected: Enable S3 versioning, set lifecycle rules, monitor for backup failures, test restore process

If candidate mentions "import" → "Walk me through importing an existing EC2 instance into Terraform."
- Expected: Write resource block first, `terraform import aws_instance.web i-1234567890`, run plan to verify, adjust config to match

### Incident: State Drift Detected

**What's happening:** `terraform plan` shows changes, but no one modified the Terraform code.

**Causes:**
- Manual changes in console/CLI
- Another tool modified resources
- Auto-scaling changed instance count
- AWS made changes (security patches, etc.)

**Natural follow-up directions:**

If candidate identifies manual change → "Someone made an emergency change in the console. How do you handle this?"
- Expected: Options: 1) Update Terraform to match (import/modify), 2) Let Terraform revert the change, 3) Use `ignore_changes` lifecycle. Discuss trade-offs.

If candidate mentions `ignore_changes` → "When is it appropriate to use `ignore_changes`?"
```hcl
lifecycle {
  ignore_changes = [tags, ami]
}
```
- Expected: For attributes managed externally (ASG instance count, tags from other tools). Overuse defeats purpose of IaC.

---

## Scenario Pattern: Module Design

### Incident: Duplicated Code Across Environments

**What's happening:** Dev, staging, and prod have copy-pasted Terraform code with slight differences.

**Module structure:**
```
modules/
├── vpc/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── eks/
    ├── main.tf
    ├── variables.tf
    └── outputs.tf

environments/
├── dev/
│   ├── main.tf      # Calls modules with dev values
│   └── terraform.tfvars
├── staging/
└── prod/
```

**Natural follow-up directions:**

If candidate proposes modules → "How do you version modules? What if a module change breaks existing environments?"
- Expected: Use Git tags for versions, pin module versions in environments, test changes in dev first, semantic versioning

If candidate mentions "module sources" → "What are the different ways to source modules?"
```hcl
# Local
source = "../modules/vpc"

# Git
source = "git::https://github.com/org/modules.git//vpc?ref=v1.0.0"

# Terraform Registry
source = "terraform-aws-modules/vpc/aws"
version = "5.0.0"
```

### Incident: Module Too Complex

**What's happening:** A module has 50 variables and is hard to use correctly.

**Design principles:**
- Single responsibility
- Sensible defaults
- Composition over configuration
- Document required vs optional variables

**Natural follow-up directions:**

If candidate mentions "breaking up the module" → "How do you decide when to split a module?"
- Expected: When it does too many things, when variables become confusing, when different teams need different parts. Follow single responsibility.

---

## Scenario Pattern: Team Collaboration

### Incident: Two Engineers Applied Conflicting Changes

**What's happening:** Engineer A and B both ran `terraform apply` at the same time, causing issues.

**Prevention:**
- Remote state with locking (S3 + DynamoDB)
- CI/CD pipeline for applies (no local applies)
- Pull request workflow for changes
- Plan output in PR for review

**Natural follow-up directions:**

If candidate mentions "CI/CD" → "Walk me through your ideal Terraform CI/CD workflow."
- Expected: PR triggers plan, plan output posted to PR, approval required, merge triggers apply, state locked during apply

If candidate mentions "Atlantis" or "Terraform Cloud" → "What are the benefits of using Atlantis vs Terraform Cloud?"
- Expected: Atlantis: self-hosted, free, PR-based workflow. TFC: managed, policy as code, private registry, cost. Discuss trade-offs.

### Incident: Need to Review Terraform Changes Before Apply

**What's happening:** Team wants to ensure changes are reviewed before applying to production.

**Workflow:**
```yaml
# GitHub Actions example
name: Terraform
on:
  pull_request:
    paths: ['terraform/**']
  push:
    branches: [main]
    paths: ['terraform/**']

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
      - run: terraform plan -out=tfplan
      - uses: actions/upload-artifact@v3
        with:
          name: tfplan
          path: tfplan
  
  apply:
    needs: plan
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production  # Requires approval
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v3
      - run: terraform apply tfplan
```

---

## Scenario Pattern: Security

### Incident: Secrets in Terraform State

**What's happening:** Security audit found database passwords visible in state file.

**The problem:** Terraform state contains all resource attributes, including sensitive ones.

**Mitigations:**
- Encrypt state at rest (S3 encryption)
- Restrict state access (IAM policies)
- Use `sensitive = true` for outputs
- Don't store secrets in Terraform—use Secrets Manager/Vault

```hcl
# Instead of this:
resource "aws_db_instance" "db" {
  password = var.db_password  # Stored in state!
}

# Do this:
resource "aws_db_instance" "db" {
  password = random_password.db.result
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id     = aws_secretsmanager_secret.db.id
  secret_string = random_password.db.result
}

# Application reads from Secrets Manager, not Terraform
```

**Natural follow-up directions:**

If candidate mentions encryption → "State is encrypted at rest, but what about in transit and in logs?"
- Expected: Use HTTPS for backend, mark outputs as sensitive, be careful with `terraform output`, CI/CD logs might expose values

If candidate mentions Secrets Manager → "How do you handle initial secrets that Terraform needs to create resources?"
- Expected: Bootstrap problem. Options: manual creation, separate bootstrap Terraform, use data sources for existing secrets

---

## Handy Terraform Patterns

### Conditional Resources
```hcl
resource "aws_instance" "bastion" {
  count = var.create_bastion ? 1 : 0
  # ...
}
```

### For Each
```hcl
resource "aws_iam_user" "users" {
  for_each = toset(var.user_names)
  name     = each.value
}
```

### Dynamic Blocks
```hcl
resource "aws_security_group" "web" {
  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
    }
  }
}
```

### Data Sources
```hcl
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}
```

### Moved Blocks (Refactoring)
```hcl
moved {
  from = aws_instance.web
  to   = module.web.aws_instance.this
}
```

---

## Level-Specific Conversation Starters

### Entry Level
"Walk me through what happens when you run `terraform apply`."
- Listen for: Plan, confirmation, apply, state update
- Follow up on: What if the apply fails halfway through? What is state?

### Senior Level
"Your team has 100 AWS accounts and needs consistent VPC setup across all of them. How do you approach this?"
- Listen for: Modules, automation, CI/CD, state management per account
- Follow up on: How do you handle account-specific customizations? How do you roll out module updates?

### SRE Level
"Design a Terraform strategy for a company with 500 engineers, multiple cloud providers, and strict compliance requirements."
- Listen for: Module registry, policy as code, state isolation, RBAC, audit logging
- Follow up on: How do you enforce standards? How do you handle drift at scale?

---

## Red Flags vs Green Flags

### Red Flags
- Commits `.tfstate` to Git
- Uses `terraform apply -auto-approve` in production
- No remote state or locking
- Hardcodes secrets in `.tf` files
- "Just delete the state and start over"

### Green Flags
- Uses remote state with locking
- Has a CI/CD workflow for Terraform
- Understands state manipulation commands and when to use them
- Uses modules for reusability
- Considers security implications of state
- Has a strategy for handling drift
- Mentions testing (terraform validate, plan review, terratest)
