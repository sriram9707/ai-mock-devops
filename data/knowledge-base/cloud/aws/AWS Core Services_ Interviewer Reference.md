---
id: aws-core-services-ec2-s3-rds
tags: [auto-tagged]
---

# AWS Core Services: Interviewer Reference

This document provides deep knowledge for conducting natural, scenario-based interviews on AWS services. Focus on practical scenarios and service interconnections, not just definitions.

---

## How to Use This Document

When a candidate mentions they've worked with specific AWS services, use this document to drill down with scenario-based questions. Don't ask "What is S3?"—ask "How would you provide S3 bucket access to a third-party company?"

- **Entry Level:** Focus on basic service usage and common configurations.
- **Senior/Medior:** Focus on security, cross-account access, and edge cases.
- **SRE/Architect:** Focus on design patterns, cost optimization, and enterprise scenarios.

---

## S3 (Simple Storage Service)

### If Candidate Mentions S3, Drill Down On:

**Scenario: Cross-Account Access**
"A third-party vendor needs read access to specific objects in your private S3 bucket. How do you set this up?"

**Expected approaches:**
1. **Bucket Policy (resource-based):**
```json
{
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::VENDOR-ACCOUNT:root"},
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::my-bucket/shared/*"
  }]
}
```

2. **Cross-account IAM role:** Vendor assumes role in your account
3. **Presigned URLs:** Time-limited access without AWS credentials

**Follow-up directions:**
- "What if the vendor doesn't have an AWS account?" → Presigned URLs
- "What if you need to audit every access?" → CloudTrail, S3 access logs
- "What if objects are encrypted with KMS?" → Need to grant KMS key access too

**Scenario: Accidental Public Exposure**
"Your security team detected that an S3 bucket is publicly accessible. How do you investigate and remediate?"

**Expected approach:**
1. Check bucket policy and ACLs
2. Check Block Public Access settings
3. Review CloudTrail for who made changes
4. Enable Block Public Access at account level

**Follow-up directions:**
- "How do you prevent this from happening again?" → SCPs, AWS Config rules, Block Public Access
- "How do you find all public buckets in your account?" → AWS Config, S3 console, third-party tools

**Scenario: Large File Uploads**
"Users are uploading 10GB files and experiencing timeouts. How do you solve this?"

**Expected approach:**
- Multipart upload (required for >5GB)
- S3 Transfer Acceleration for global users
- Presigned URLs with multipart

**Follow-up:** "What happens if a multipart upload fails halfway?" → Incomplete parts remain, need lifecycle policy to clean up

**Scenario: Delay in Data replication betweem 2 S3 Buckets**
"The S3 bucket replication is enabled to sync objects between 2 S3 buckets in different regions. However, the replication is taking longer than expected. How do you investigate and resolve this?"

**Expected approach:**
1. Enable S3 Replication Time Control (RTC): Guarantees replication within a set time (e.g., 15 mins) or alerts you; crucial for large-scale deployments.
2. Optimize Network Path: Use AWS Global Accelerator, VPC Endpoints for S3, or AWS Direct Connect.
3. Batch Small Objects: Consolidate many small files into larger archives (e.g., ZIP) before upload.
4. Adjust Replication Rules: Filter objects, use advanced replication for specific needs.
5. Scale Out: For massive workloads, consider multiple replication rules or dedicated buckets.

**Follow-up:** "What's the difference between S3 Sync and S3 cross-region replication?"

**Expected approach:**
- S3 Sync is a command-line tool that syncs objects between two S3 buckets.
- S3 cross-region replication is a feature that automatically replicates objects from one S3 bucket to another S3 bucket in a different region.

**Scenario: S3 Bucket Encryption during replication**
"S3 bucket is encrypted with a KMS key in Account A. How do you replicate the encrypted objects to another S3 bucket in Account B?"

**Expected approach:**
Enable Versioning: Ensure versioning is enabled on the source bucket.
Create Replication Rule: In the S3 Console (Management tab), create a rule, specify Account B as the destination, and select the target bucket.
Configure Destination Encryption: Select "Replicate objects encrypted with AWS Key Management Service (AWS KMS)" and provide the ARN of the KMS key (either the source key or a new one in Account B).
Create/Use IAM Role: Specify or create an IAM Role that S3 assumes for replication. This role needs s3:GetObject, s3:GetObjectVersion, and kms:Decrypt permissions on the source bucket/key. 
Create Destination Bucket: Create the target S3 bucket with versioning enabled and default encryption set to KMS (using a key in Account B).
Update KMS Key Policy (Account B Key): Modify the Key Policy of the KMS key in Account B to allow the IAM role from Account A (or Account A itself) to use kms:Encrypt, kms:Decrypt, kms:GenerateDataKey, etc..
Update S3 Bucket Policy (Account B Bucket): Grant permissions to the IAM role from Account A to s3:PutObject, s3:GetObject, etc. on the destination bucket. 

**Scenario: You are hosting a website in s3 and you want to restrict access to only certain countries. How do you do it?**

**Expected approach:**
1. Use CloudFront to distribute the website.
2. Configure CloudFront to use the S3 bucket as the origin.

**Follow-up:** "How will you restrict access to the website only through CloudFront?"

**Expected approach:**
1. Configure Origin Access Identity (OAI) for CloudFront.
2. Configure S3 bucket policy to allow access only from the OAI.
---

## IAM (Identity and Access Management)

### If Candidate Mentions IAM, Drill Down On:

**Scenario: Least Privilege Implementation**
"A developer needs to deploy Lambda functions but shouldn't be able to access production data. How do you set this up?"

**Expected approach:**
```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["lambda:CreateFunction", "lambda:UpdateFunctionCode"],
      "Resource": "arn:aws:lambda:*:*:function:dev-*"
    },
    {
      "Effect": "Deny",
      "Action": "lambda:*",
      "Resource": "arn:aws:lambda:*:*:function:prod-*"
    }
  ]
}
```

**Follow-up directions:**
- "How do you audit if this policy is actually being followed?" → IAM Access Analyzer, CloudTrail
- "What if they need temporary prod access for debugging?" → Assume role with MFA, time-limited

**Scenario: Cross-Account Access**
"Your application in Account A needs to read from DynamoDB in Account B. How do you set this up?"

**Expected approach:**
1. Create role in Account B with DynamoDB permissions
2. Add trust policy allowing Account A to assume the role
3. Application in Account A assumes the role

```json
// Trust policy in Account B
{
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::ACCOUNT-A:role/app-role"},
    "Action": "sts:AssumeRole"
  }]
}
```

**Follow-up:** "What's the difference between resource-based policies and identity-based policies for cross-account access?"

**Scenario: Service-Linked Roles**
"You're getting 'Unable to create service-linked role' errors when setting up Auto Scaling. What's happening?"

**Expected understanding:**
- Service-linked roles are created automatically by AWS services
- Need `iam:CreateServiceLinkedRole` permission
- Can't be modified, only deleted when service no longer needs it

**Scenario: What is the differnce between Inline and Managed Policies?**

**Expected understanding:**
- Inline policies are attached to a user, group, or role
- Managed policies are attached to a service  

**Follow-up:** "When do you use inline policies and when do you use managed policies?"

**Scenario: You onboarded as a lead engineer to the company. Now you want to audit the IAM policies in the company. How do you do it?**

**Expected approach:**
1. Use IAM Access Analyzer to audit the IAM policies in the company.
2. Use CloudTrail to audit the IAM policies in the company.

**Follow-up:** "You see that there are findings in IAM Access Analyzer. How do you fix it without any downtime?"

---

## EC2 (Elastic Compute Cloud)

### If Candidate Mentions EC2, Drill Down On:

**Scenario: Instance Won't Start**
"An EC2 instance is stuck in 'pending' state. How do you troubleshoot?"

**Expected approach:**
1. Check instance limits (quota)
2. Check subnet/AZ capacity
3. Check if AMI exists and is accessible
4. Check instance type availability in AZ
5. Review system logs (if instance started before)

**Follow-up:** "What's the difference between 'pending', 'running', and 'stopped' states in terms of billing?"

**Scenario: High Availability Design**
"Design an EC2-based web application that can survive an AZ failure."

**Expected approach:**
- Instances in multiple AZs
- Auto Scaling Group spanning AZs
- Application Load Balancer
- Consider: EBS snapshots, cross-AZ data replication

**Follow-up directions:**
- "What about region failure?" → Multi-region with Route 53 failover
- "How do you handle stateful applications?" → Sticky sessions, external session store

**Scenario: Instance Metadata Security**
"A security audit flagged that your EC2 instances are vulnerable to SSRF attacks via instance metadata. How do you mitigate?"

**Expected approach:**
- IMDSv2 (require session tokens)
- Disable metadata service if not needed
- Network segmentation
- IAM role with minimal permissions

```bash
# Require IMDSv2
aws ec2 modify-instance-metadata-options \
  --instance-id i-1234567890 \
  --http-tokens required
```

**Scenario: How do you manage access to ec2 instance for a team of 100 engineers and they need shell access to the instance?**

**Expected approach:**
- Use AWS SSM Session Manager
- Use AWS IAM roles and policies to manage access to the instance.

**Follow-up:** "now those 100 engineers some of them are admin which require root access and some of them are devs, how do you restrict it using session manager"

**Expected approach:**
To restrict access using Session Manager for a mix of admin users needing "root" access (via sudo) and standard developers, you manage permissions primarily through AWS IAM Policies and Linux system configurations.
The key is to leverage the robust policy engine of IAM to define who can start a session and what type of Linux user the session connects as.
1. Differentiate IAM Roles/Users
Create distinct IAM identities and roles for your two groups of engineers within AWS IAM Identity Center:
EC2Admins Role: For engineers who require elevated privileges.
EC2Developers Role: For engineers who only need standard user access.
2. Configure Session Manager IAM Policies
Attach specific IAM policies to these roles to control their access levels:
A. For EC2Developers (Standard User Access)
Developers should connect using their own standard Linux account that lacks sudo privileges. By default, Session Manager uses the ssm-user on most AMIs. This user can be configured not to have sudo rights.
Your IAM policy for EC2Developers should allow starting sessions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:StartSession"
            ],
            "Resource": [
                "arn:aws:ec2:*:*:instance/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "ssm:TerminateSession",
                "ssm:ResumeSession"
            ],
            "Resource": [
                "arn:aws:ssm:*:*:session/${aws:username}-*"
            ]
        }
    ]
}
```

Crucially, you must restrict what user they connect as using the Session Manager run command preferences.
B. For EC2Admins (Admin/Root Access)
Admins need the ability to elevate privileges using sudo. They should be members of the wheel or sudo group on the Linux instances. Their IAM policy is similar but relies on system configuration for actual elevation.
3. Configure the Linux Instance (sudo and Users)
The actual permissions within the Linux shell are controlled by the standard Linux User/Group management (/etc/passwd, /etc/group, and /etc/sudoers).
The Default ssm-user:
By default, the ssm-user created by the SSM agent has sudo privileges on most Amazon Linux distributions.
To restrict developers: You must edit the sudoers file (/etc/sudoers) to remove sudo access for the ssm-user on developer-only instances.
Creating Distinct Users:
A more robust method involves creating specific Linux users (e.g., dev_user, admin_user) and leveraging a Session Manager preference to define which Linux user a connection defaults to.
You use a runAs preference in the session document or account settings to define the default user (dev_user for developers, admin_user for admins).
Ensure only admin_user is in the sudo group.
Summary of Access Control Points
Feature	Developers (EC2Developers IAM Role)	Admins (EC2Admins IAM Role)
AWS IAM Policy	Allows ssm:StartSession	Allows ssm:StartSession
Linux User Config	Connects as dev_user (no sudo)	Connects as admin_user (with sudo)
Session Type	Standard shell access	Privileged root access via sudo
By combining IAM policies (who can connect to the instance) with Linux-level permissions (what they can do once connected), you achieve granular and auditable access control for your team of 100 engineers.

**Scenario: Your application is writing data to a disk attached to an EC2 instance. The disk is getting full. How do you set this up?**

Expected approach:
- Configure CloudWatch alarms to alert when disk space is low
- Use AWS EBS snapshots to backup data
- Use AWS EBS volume lifecycle policies to automatically delete old snapshots

**Follow-up:** "What if the root volume is full and instance stops"

**Expected approach:**
- Stop the impaired instance
- Take a snapshot of the root volume
- Create a new instance and attach the volume as a secondary volume.
- Resize the instance to have more storage
- Take a snapshot of the resized volume and attach to the previous instance.

**Scenario: How do you right size your instance?**

Expected approach:
- Use AWS CloudWatch metrics to monitor instance usage
- Use AWS Cost Explorer to monitor instance usage
- Use AWS Budgets to monitor instance usage

**Follow-up:** "How do you restrict users to provision certain instance types?"

**Expected approach:**
- Use SCP to restrict users to provision certain instance types and creating resource in other regions.

---

## VPC (Virtual Private Cloud)

### If Candidate Mentions VPC, Drill Down On:

**Scenario: Private Subnet Internet Access**
"Instances in a private subnet need to download packages from the internet. How do you set this up?"

**Expected approach:**
- NAT Gateway in public subnet
- Route table: 0.0.0.0/0 → NAT Gateway
- Alternative: NAT Instance (cheaper, less reliable)

**Follow-up directions:**
- "What if you need to access AWS services without going through the internet?" → VPC Endpoints
- "How do you reduce NAT Gateway costs?" → S3/DynamoDB Gateway Endpoints (free), consolidate NAT Gateways

**Scenario: VPC Peering vs Transit Gateway**
"You have 10 VPCs that all need to communicate. What's your approach?"

**Expected understanding:**
- **VPC Peering:** Point-to-point, no transitive routing, good for few VPCs
- **Transit Gateway:** Hub-and-spoke, transitive routing, better for many VPCs

**Follow-up:** "What are the limitations of VPC peering?" → No transitive routing, no overlapping CIDRs, cross-region costs

**Scenario: Connectivity Troubleshooting**
"An EC2 instance can't reach another instance in a different subnet. How do you troubleshoot?"

**Expected approach:**
1. Security Groups (stateful, instance-level)
2. Network ACLs (stateless, subnet-level)
3. Route tables
4. VPC Flow Logs for packet-level analysis

**Follow-up:** "What's the difference between Security Groups and NACLs?" → Stateful vs stateless, allow-only vs allow/deny, instance vs subnet level

---

## RDS (Relational Database Service)

### If Candidate Mentions RDS, Drill Down On:

**Scenario: Database High Availability**
"Your production database needs 99.99% uptime. How do you architect this?"

**Expected approach:**
- Multi-AZ deployment (synchronous replication)
- Automated backups and point-in-time recovery
- Read replicas for read scaling (async)
- Consider: Aurora for higher availability

**Follow-up directions:**
- "What happens during a Multi-AZ failover?" → DNS endpoint updated, 60-120 seconds downtime
- "How do you minimize failover impact?" → Connection pooling, retry logic, health checks

**Scenario: Performance Issues**
"Database queries are slow but CPU/memory look fine. How do you investigate?"

**Expected approach:**
1. Enable Performance Insights
2. Check for slow queries
3. Review indexes
4. Check IOPS limits (storage type)
5. Check connection count

**Follow-up:** "What's the difference between Provisioned IOPS and General Purpose storage?"

---

## Lambda

### If Candidate Mentions Lambda, Drill Down On:

**Scenario: Cold Start Optimization**
"Your Lambda function has 5-second cold starts affecting user experience. How do you optimize?"

**Expected approaches:**
- Provisioned Concurrency
- Reduce package size
- Use lighter runtime (Python vs Java)
- Keep functions warm (scheduled pings)
- Move initialization outside handler

**Follow-up:** "What's the cost implication of Provisioned Concurrency?"

**Scenario: Lambda in VPC**
"Your Lambda needs to access RDS in a private subnet. What are the considerations?"

**Expected understanding:**
- Lambda needs VPC configuration
- Needs NAT Gateway for internet access
- Cold starts are longer in VPC
- Consider RDS Proxy for connection management

**Follow-up:** "Why are cold starts longer for VPC Lambdas?" → ENI creation/attachment

---

## Level-Specific Conversation Starters

### Entry Level
"Tell me about an AWS service you've used. Walk me through how you configured it."
- Listen for: Basic understanding, common configurations
- Follow up on: What challenges did you face? How did you troubleshoot?

### Senior Level
"You're designing a new application on AWS. The requirements are: handle 10,000 requests/second, store 1TB of data, and maintain 99.9% availability. Walk me through your architecture."
- Listen for: Service selection rationale, HA considerations, cost awareness
- Follow up on: What are the failure modes? How do you handle them?

### SRE Level
"Your company is migrating from on-premises to AWS. You have 500 servers, 50TB of data, and strict compliance requirements. How do you approach this?"
- Listen for: Migration strategies, security, compliance, phased approach
- Follow up on: How do you handle the hybrid period? What's your rollback plan?

---

## Red Flags vs Green Flags

### Red Flags
- Only knows service names, not how they work together
- No security considerations (public S3, overly permissive IAM)
- "Just use the biggest instance type"
- No understanding of failure modes
- Can't explain cross-account or cross-region patterns

### Green Flags
- Thinks about security first (least privilege, encryption)
- Considers cost implications
- Understands service limits and quotas
- Can design for failure (HA, DR)
- Knows when to use which service (S3 vs EFS vs EBS)
- Mentions monitoring and observability
