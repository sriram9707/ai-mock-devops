---
id: disaster-recovery-across-regions
tags: [auto-tagged]
---

# AWS Well-Architected Framework: Interviewer Reference

This document provides deep knowledge for conducting scenario-based interviews on AWS architecture. Essential for AWS Cloud Architect roles.

---

## How to Use This Document

For AWS Cloud Architect interviews, use the Well-Architected Framework pillars to structure scenario-based questions. Don't ask "What are the pillars?"—present architecture scenarios and evaluate the candidate's thinking across pillars.

---

## The Six Pillars Overview

1. **Operational Excellence:** Run and monitor systems, continually improve
2. **Security:** Protect information, systems, and assets
3. **Reliability:** Recover from failures, meet demand
4. **Performance Efficiency:** Use resources efficiently
5. **Cost Optimization:** Avoid unnecessary costs
6. **Sustainability:** Minimize environmental impact

---

## Pillar 1: Operational Excellence

### Key Principles
- Perform operations as code
- Make frequent, small, reversible changes
- Refine operations procedures frequently
- Anticipate failure
- Learn from all operational failures

### Scenario: Operations as Code

"Your team manually deploys applications through the AWS console. What's wrong with this and how do you fix it?"

**Expected approach:**
- Infrastructure as Code (CloudFormation, Terraform)
- CI/CD pipelines for deployments
- Version control for all configurations
- Automated testing before deployment

**Follow-up directions:**
- "What if the team resists automation?" → Start small, demonstrate value, training
- "How do you handle emergency changes?" → Still use IaC, expedited review process, document exceptions

### Scenario: Runbook Automation

"Your on-call engineers spend hours on repetitive tasks during incidents. How do you improve this?"

**Expected approach:**
- Document runbooks
- Automate common remediation (Lambda, Systems Manager)
- Self-healing infrastructure (Auto Scaling, health checks)
- Reduce MTTR through automation

**Follow-up:** "Give me an example of a self-healing pattern."
- Expected: Auto Scaling replaces unhealthy instances, Lambda restarts failed services, Route 53 health checks failover

---

## Pillar 2: Security

### Key Principles
- Implement a strong identity foundation
- Enable traceability
- Apply security at all layers
- Automate security best practices
- Protect data in transit and at rest
- Keep people away from data
- Prepare for security events

### Scenario: Identity and Access Management

"A developer needs access to production S3 buckets for debugging. How do you handle this?"

**Expected approach:**
- Temporary access through assume role
- MFA required for sensitive operations
- Just-in-time access (AWS SSO, temporary credentials)
- Audit trail (CloudTrail)
- Principle of least privilege

**Follow-up directions:**
- "What if they need access frequently?" → Review if access is appropriate, consider read-only role, automate approval process
- "How do you audit who accessed what?" → CloudTrail, S3 access logs, Athena queries

### Scenario: Data Protection

"You're storing PII (personally identifiable information) in RDS. What security measures do you implement?"

**Expected approach:**
- Encryption at rest (KMS)
- Encryption in transit (TLS)
- VPC isolation (private subnets)
- Security groups (restrict access)
- IAM database authentication
- Audit logging
- Data masking for non-prod environments

**Follow-up:** "How do you handle encryption key management?"
- Expected: AWS KMS, key rotation, separate keys per environment, key policies for access control

### Scenario: Security Incident Response

"CloudTrail shows someone created an IAM user with admin access at 3 AM. What do you do?"

**Expected approach:**
1. Disable the suspicious IAM user immediately
2. Rotate compromised credentials
3. Investigate: Who created it? From where? What did they access?
4. Check for persistence mechanisms (other users, roles, Lambda)
5. Notify security team, consider breach protocol
6. Implement preventive controls (SCPs, GuardDuty)

**Follow-up:** "How do you prevent this from happening again?"
- Expected: SCPs to restrict IAM actions, GuardDuty for anomaly detection, alerts on IAM changes, MFA enforcement

---

## Pillar 3: Reliability

### Key Principles
- Automatically recover from failure
- Test recovery procedures
- Scale horizontally
- Stop guessing capacity
- Manage change in automation

### Scenario: High Availability Design

"Design a web application that can survive an AZ failure with minimal downtime."

**Expected architecture:**
- Multi-AZ deployment (at least 2 AZs)
- Application Load Balancer
- Auto Scaling Group spanning AZs
- RDS Multi-AZ
- S3 for static assets (inherently multi-AZ)
- ElastiCache Multi-AZ (if needed)

**Follow-up directions:**
- "What about region failure?" → Multi-region with Route 53 failover, data replication strategy
- "How do you test this?" → Chaos engineering, AZ failure simulation, game days

### Scenario: Disaster Recovery

"Your RTO is 4 hours and RPO is 1 hour. Design the DR strategy."

**Expected understanding of DR strategies:**
- **Backup & Restore:** Cheapest, highest RTO (hours to days)
- **Pilot Light:** Core systems running, scale up on failover (hours)
- **Warm Standby:** Scaled-down version running (minutes to hours)
- **Active-Active:** Full capacity in multiple regions (near-zero)

For RTO 4h, RPO 1h:
- Warm Standby or Pilot Light
- Cross-region RDS read replica (promote on failover)
- S3 Cross-Region Replication
- Automated failover with Route 53

**Follow-up:** "How do you test DR without affecting production?"
- Expected: Regular DR drills, isolated test environment, runbook validation

### Scenario: Handling Traffic Spikes

"Your application experiences 10x traffic during flash sales. How do you prepare?"

**Expected approach:**
- Auto Scaling with predictive scaling
- Pre-warm load balancers (contact AWS for extreme cases)
- Caching layer (ElastiCache, CloudFront)
- Database read replicas
- Queue-based load leveling (SQS)
- Load testing before events

**Follow-up:** "What if the database can't scale fast enough?"
- Expected: Read replicas, caching, consider Aurora Serverless, DynamoDB for specific use cases

---

## Pillar 4: Performance Efficiency

### Key Principles
- Democratize advanced technologies
- Go global in minutes
- Use serverless architectures
- Experiment more often
- Consider mechanical sympathy

### Scenario: Global Performance

"Your users are worldwide but your application is in us-east-1. Users in Asia report slow performance. How do you fix this?"

**Expected approach:**
- CloudFront for static content
- Global Accelerator for dynamic content
- Consider regional deployments
- Edge computing (Lambda@Edge, CloudFront Functions)
- Database: Global Tables (DynamoDB) or read replicas

**Follow-up:** "How do you decide between CloudFront and Global Accelerator?"
- CloudFront: Caching, static content, edge compute
- Global Accelerator: TCP/UDP, no caching, consistent entry point

### Scenario: Right-Sizing

"Your EC2 instances are running at 10% CPU utilization. What do you do?"

**Expected approach:**
1. Analyze with Compute Optimizer
2. Consider smaller instance types
3. Consider Graviton (ARM) for cost/performance
4. Evaluate if workload suits serverless (Lambda, Fargate)
5. Implement and monitor

**Follow-up:** "What if utilization varies significantly throughout the day?"
- Expected: Auto Scaling, consider Spot instances for variable workloads, scheduled scaling

---

## Pillar 5: Cost Optimization

### Key Principles
- Implement cloud financial management
- Adopt a consumption model
- Measure overall efficiency
- Stop spending money on undifferentiated heavy lifting
- Analyze and attribute expenditure

### Scenario: Cost Reduction Initiative

"Leadership wants to reduce AWS costs by 30%. How do you approach this?"

**Expected approach:**
1. **Visibility:** Cost Explorer, tagging strategy, cost allocation
2. **Right-sizing:** Compute Optimizer, unused resources
3. **Pricing models:** Reserved Instances, Savings Plans, Spot
4. **Architecture:** Serverless where appropriate, storage tiering
5. **Governance:** Budgets, alerts, approval processes

**Follow-up directions:**
- "What's the difference between Reserved Instances and Savings Plans?" → RIs are instance-specific, Savings Plans are more flexible (compute or EC2)
- "How do you handle Spot interruptions?" → Diversify instance types, use Spot Fleet, design for interruption

### Scenario: Cost Allocation

"You have 10 teams sharing one AWS account. How do you track costs per team?"

**Expected approach:**
- Tagging strategy (mandatory tags for team, project, environment)
- Cost allocation tags in Cost Explorer
- Consider AWS Organizations with separate accounts per team
- Budgets and alerts per team
- Regular cost review meetings

**Follow-up:** "What if teams don't tag their resources?"
- Expected: SCPs to require tags, AWS Config rules, automated remediation, make it part of CI/CD

---

## Pillar 6: Sustainability

### Key Principles
- Understand your impact
- Establish sustainability goals
- Maximize utilization
- Anticipate and adopt new, more efficient offerings
- Use managed services
- Reduce downstream impact

### Scenario: Sustainability Improvements

"How do you reduce the environmental impact of your AWS workloads?"

**Expected approach:**
- Right-size resources (reduce waste)
- Use Graviton processors (more efficient)
- Choose regions with renewable energy
- Optimize data storage (lifecycle policies, compression)
- Use serverless (shared infrastructure)
- Measure with Customer Carbon Footprint Tool

**Follow-up:** "How do you balance sustainability with other requirements?"
- Expected: Often aligns with cost optimization, consider in architecture decisions, set sustainability goals alongside other metrics

---

## Architecture Review Scenarios

### Scenario: Complete Architecture Review

"Review this architecture: EC2 instances in a single AZ, public subnets, root credentials stored in code, no monitoring."

**Expected critique across pillars:**
- **Reliability:** Single AZ = single point of failure
- **Security:** Public subnets expose instances, credentials in code is critical vulnerability
- **Operational Excellence:** No monitoring = blind to issues
- **Cost:** Likely not optimized without monitoring data
- **Performance:** Can't measure without monitoring

**Follow-up:** "Prioritize the fixes."
- Expected: Security first (credentials), then reliability (multi-AZ), then operational excellence (monitoring)

### Scenario: Trade-off Discussion

"You can either implement Multi-AZ (costs +50%) or add comprehensive monitoring (costs +10%). Budget allows only one. Which do you choose?"

**Expected discussion:**
- Depends on business requirements and risk tolerance
- Multi-AZ prevents outages, monitoring helps detect and diagnose
- Consider: What's the cost of downtime? How critical is the application?
- Monitoring might be better ROI if you can respond quickly to failures

**Follow-up:** "How do you make this decision with stakeholders?"
- Expected: Present options with trade-offs, quantify risk and cost, let business decide based on priorities

---

## Level-Specific Conversation Starters

### Cloud Architect
"You're designing a new e-commerce platform on AWS. Walk me through your architecture decisions across the Well-Architected pillars."
- Listen for: Balanced consideration of all pillars, trade-off awareness
- Follow up on: How do you prioritize when pillars conflict?

"A client's architecture review shows critical findings in Security and Reliability. They have limited budget. How do you advise them?"
- Listen for: Risk assessment, prioritization, phased approach
- Follow up on: How do you communicate risk to non-technical stakeholders?

---

## Red Flags vs Green Flags

### Red Flags
- Only considers one or two pillars
- "Security can wait until later"
- No understanding of trade-offs
- Can't quantify decisions (cost, risk, performance)
- Designs for current needs only, not future scale

### Green Flags
- Balances all pillars appropriately
- Understands and articulates trade-offs
- Considers both technical and business requirements
- Designs for failure and recovery
- Thinks about operational aspects from the start
- Can adapt recommendations based on constraints
