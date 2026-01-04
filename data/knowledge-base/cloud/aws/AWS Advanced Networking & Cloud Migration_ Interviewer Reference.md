---
id: aws-advanced-networking-transit-gateway
tags: [auto-tagged]
---

# AWS Advanced Networking & Cloud Migration: Interviewer Reference

This document provides deep knowledge for conducting scenario-based interviews on advanced AWS networking and cloud migration strategies. Essential for AWS Cloud Architect roles.

---

## How to Use This Document

For AWS Cloud Architect interviews, focus on complex networking scenarios and migration planning. Present real-world challenges that require understanding of hybrid connectivity, network design patterns, and migration strategies.

---

## Advanced VPC Networking

### Transit Gateway

Transit Gateway acts as a regional network hub connecting VPCs, VPNs, and Direct Connect.

**Scenario: Hub-and-Spoke Network**

"You have 50 VPCs across 10 accounts that need to communicate. Some are production, some are development, and they shouldn't mix. How do you design this?"

**Expected architecture:**

The design uses Transit Gateway with route tables for segmentation. Create separate TGW route tables for Production and Non-Production. Associate Production VPCs with Production route table and Non-Production VPCs with Non-Production route table. This ensures production and non-production traffic never mix.

For cross-account sharing, share Transit Gateway via Resource Access Manager (RAM) to member accounts.

**Follow-up directions:**

If candidate proposes TGW → "How do you handle a shared services VPC that both prod and non-prod need to access?"
- Expected: Create a Shared Services route table, add routes from both Prod and Non-Prod tables to Shared Services, but not between Prod and Non-Prod

If candidate mentions "VPC peering instead" → "What are the limitations of VPC peering at this scale?"
- Expected: No transitive routing (need full mesh = 1225 peerings for 50 VPCs), management nightmare, doesn't scale

**Scenario: Transit Gateway Bandwidth**

"Applications are experiencing intermittent slowness when communicating across VPCs through Transit Gateway. How do you troubleshoot?"

**Expected approach:**

Check TGW CloudWatch metrics for PacketsDropped and BytesDropped. Verify VPC attachment bandwidth (up to 50 Gbps per attachment). Check if ECMP is enabled for VPN attachments. Review flow logs for traffic patterns.

**Follow-up:** "What's the maximum bandwidth through Transit Gateway?"
- Expected: 50 Gbps per VPC attachment, can aggregate with multiple attachments, VPN limited to 1.25 Gbps per tunnel (use ECMP for more)

---

### AWS PrivateLink

PrivateLink enables private connectivity to services without traversing the internet.

**Scenario: Private API Access**

"Your application in VPC A needs to access an API hosted in VPC B (different account). The API should not be exposed to the internet. How do you design this?"

**Expected architecture:**

In VPC B (provider), create a Network Load Balancer fronting the API service, then create a VPC Endpoint Service pointing to the NLB. In VPC A (consumer), create an Interface VPC Endpoint for the endpoint service. Traffic flows privately through AWS network, never touching the internet.

**Follow-up directions:**

If candidate proposes PrivateLink → "What if you need to expose this to 100 different consumer accounts?"
- Expected: Endpoint service can whitelist multiple accounts, or use AWS Marketplace for broader distribution

If candidate suggests "VPC peering" → "What are the advantages of PrivateLink over VPC peering for this use case?"
- Expected: PrivateLink is unidirectional (more secure), no CIDR overlap concerns, consumer only sees the endpoint not the whole VPC

---

### Hybrid Connectivity

**Scenario: Direct Connect vs VPN**

"Your company needs to connect their on-premises datacenter to AWS. They have latency-sensitive applications and transfer 10TB of data daily. What do you recommend?"

**Expected recommendation:**

Direct Connect is the right choice for this scenario. The reasons include consistent latency (private connection, not over internet), high bandwidth (up to 100 Gbps), lower data transfer costs for high volume, and compliance requirements often mandate private connectivity.

Implementation involves ordering Direct Connect connection (or using partner), setting up Virtual Interfaces (private VIF for VPC, transit VIF for TGW), and configuring BGP peering.

**Follow-up directions:**

If candidate recommends Direct Connect → "What's your failover strategy if the Direct Connect fails?"
- Expected: VPN backup over internet, second Direct Connect in different location, or Direct Connect with multiple connections

If candidate mentions "VPN is cheaper" → "Calculate the cost difference for 10TB daily transfer."
- Expected: VPN data transfer is more expensive at scale, Direct Connect has lower per-GB cost, break-even analysis needed

**Scenario: Direct Connect Resilience**

"Design a highly available Direct Connect architecture for a mission-critical application."

**Expected architecture:**

Maximum resiliency uses connections at two separate Direct Connect locations, with each location having two connections to different AWS devices. This provides resilience against device failure, location failure, and maintenance windows.

High resiliency (more common) uses two connections at a single location to different AWS devices, plus VPN backup for location failure.

**Follow-up:** "What's the difference between a Direct Connect connection and a Virtual Interface?"
- Expected: Connection is the physical port. VIF is the logical connection over that port. One connection can have multiple VIFs (private, public, transit).

---

### Route 53 Advanced

**Scenario: Hybrid DNS**

"Your on-premises applications need to resolve AWS private hosted zones, and your AWS applications need to resolve on-premises DNS names. How do you set this up?"

**Expected architecture:**

For AWS to on-premises resolution, create Route 53 Resolver Outbound Endpoints in VPC, create Resolver Rules forwarding on-premises domains to on-premises DNS servers, and share rules across accounts via RAM.

For on-premises to AWS resolution, create Route 53 Resolver Inbound Endpoints in VPC, configure on-premises DNS to forward AWS domains to Inbound Endpoint IPs.

**Follow-up:** "What if you have 50 VPCs that all need this DNS resolution?"
- Expected: Centralized DNS VPC with Resolver endpoints, share via RAM, associate private hosted zones with all VPCs or use Route 53 Profiles

**Scenario: Multi-Region Failover**

"Design DNS-based failover for an application running in us-east-1 (primary) and eu-west-1 (secondary)."

**Expected approach:**

Use Route 53 health checks on primary region endpoints. Configure failover routing policy with primary pointing to us-east-1 and secondary pointing to eu-west-1. Set appropriate TTL (low for faster failover, but more DNS queries).

**Follow-up directions:**

If candidate configures failover → "Health check shows healthy but users report the site is down. What's happening?"
- Expected: Health check might be checking wrong endpoint, application partially working, health check from different network path than users

If candidate mentions "low TTL" → "What are the trade-offs of very low TTL (e.g., 60 seconds)?"
- Expected: Faster failover but more DNS queries (cost), some resolvers ignore low TTL, increased load on Route 53

---

## Cloud Migration Strategies

### The 7 Rs of Migration

Understanding migration strategies is fundamental for Cloud Architects. The strategies range from least to most transformation.

**Retire** means decommissioning applications no longer needed. **Retain** keeps applications on-premises (not ready or not worth migrating). **Rehost** (lift and shift) moves applications as-is to cloud. **Relocate** moves to cloud without changes using VMware Cloud on AWS. **Replatform** (lift and reshape) makes minor optimizations during migration. **Repurchase** moves to SaaS (e.g., CRM to Salesforce). **Refactor** re-architects for cloud-native.

**Scenario: Migration Strategy Selection**

"You're assessing 200 applications for cloud migration. How do you determine the right strategy for each?"

**Expected approach:**

Discovery phase uses AWS Application Discovery Service or Migration Evaluator to inventory applications, dependencies, and utilization.

Assessment criteria include business criticality, technical complexity, compliance requirements, and cost of migration vs. value.

Strategy mapping typically results in 20% retire (unused/redundant), 40% rehost (quick wins, stable apps), 20% replatform (need minor optimization), 15% refactor (strategic apps benefiting from cloud-native), and 5% retain (too complex or not worth it).

**Follow-up directions:**

If candidate mentions "rehost everything" → "What are the downsides of rehost-only strategy?"
- Expected: Doesn't leverage cloud benefits, may be more expensive than on-prem, technical debt remains, missed optimization opportunities

If candidate mentions "refactor everything" → "When is refactoring not the right choice?"
- Expected: Time-sensitive migrations, stable legacy apps with no planned changes, apps planned for retirement, lack of skills/resources

---

### Migration Tools

**Scenario: Large-Scale Server Migration**

"You need to migrate 500 Windows and Linux servers to AWS. What tools and approach do you use?"

**Expected approach:**

For discovery, use AWS Application Discovery Service (agentless or agent-based) to understand dependencies and utilization.

For migration, use AWS Application Migration Service (MGN) which provides continuous block-level replication, supports Windows and Linux, enables non-disruptive testing, and allows cutover with minimal downtime.

For orchestration, use AWS Migration Hub for centralized tracking across tools.

**Follow-up:** "What's the difference between MGN and the older SMS (Server Migration Service)?"
- Expected: MGN is the successor, supports continuous replication (SMS was snapshot-based), better for large scale, supports more OS versions

**Scenario: Database Migration**

"You're migrating a 5TB Oracle database to AWS. The business can tolerate maximum 4 hours of downtime. What's your approach?"

**Expected approach:**

Target selection involves choosing between RDS Oracle (minimal changes), Aurora PostgreSQL (requires schema conversion but better long-term), or EC2 Oracle (if specific features needed).

Migration approach uses AWS DMS (Database Migration Service) for continuous replication, AWS SCT (Schema Conversion Tool) if changing engines, and performs cutover during maintenance window.

Downtime minimization involves setting up DMS replication while source is live, letting it catch up, then cutting over (stop source, final sync, switch applications).

**Follow-up directions:**

If candidate chooses Aurora PostgreSQL → "What challenges do you expect in Oracle to PostgreSQL migration?"
- Expected: Schema differences, stored procedures need rewriting, Oracle-specific features (PL/SQL), application code changes, testing effort

If candidate mentions "4 hours might not be enough" → "How do you reduce downtime further?"
- Expected: DMS CDC (change data capture) minimizes final sync time, pre-cutover testing, automated cutover scripts, consider blue-green deployment

---

### Data Transfer

**Scenario: Large Data Transfer**

"You need to transfer 100TB of data from on-premises to S3. Your internet connection is 1 Gbps. What are your options?"

**Expected analysis:**

Internet transfer at 1 Gbps theoretical maximum would take approximately 9 days. Realistically with overhead, expect 2-3 weeks.

Options include AWS Snowball Edge (ship physical device, good for 10-80TB per device), AWS Snowmobile (for petabyte scale), Direct Connect (if ongoing transfers justify cost), and AWS DataSync (optimized transfer over internet or Direct Connect).

For 100TB, Snowball Edge is likely the best choice for one-time transfer. Order 2-3 devices, parallel loading, ship to AWS.

**Follow-up:** "What if this is an ongoing daily transfer of 1TB?"
- Expected: DataSync over Direct Connect, or DataSync over internet with compression, or S3 Transfer Acceleration

---

### Migration Waves

**Scenario: Migration Planning**

"You have 6 months to migrate 200 applications. How do you plan the waves?"

**Expected approach:**

Wave 0 (Month 1) establishes the foundation including landing zone, networking, security baseline, and CI/CD pipelines.

Wave 1 (Month 2) involves pilot migration of 5-10 low-risk applications to validate process and build team confidence.

Wave 2-4 (Months 3-5) cover production migrations, grouped by dependency, team, or business unit, with increasing velocity as team gains experience.

Wave 5 (Month 6) handles complex applications, final cutover, and decommissioning.

**Follow-up directions:**

If candidate proposes waves → "How do you handle applications with dependencies on apps not yet migrated?"
- Expected: Map dependencies in discovery, migrate dependent apps together, or use hybrid connectivity during transition

If candidate mentions "big bang" → "What are the risks of migrating everything at once?"
- Expected: Higher risk of failure, harder to troubleshoot, resource constraints, no learning from early migrations

---

## Level-Specific Conversation Starters

### Cloud Architect

"Design the network architecture for a company that's migrating to AWS but will maintain on-premises presence for 2 years during transition."
- Listen for: Hybrid connectivity, DNS strategy, security, phased approach
- Follow up on: How do you handle the transition period? What changes when fully migrated?

"A client's migration is behind schedule. They've migrated 50 of 200 applications in 4 months, with 2 months remaining. What do you recommend?"
- Listen for: Realistic assessment, prioritization, scope adjustment, resource allocation
- Follow up on: How do you communicate this to stakeholders? What can be accelerated?

---

## Red Flags vs Green Flags

### Red Flags
- Proposes VPC peering for large-scale connectivity
- Doesn't consider hybrid period in migration
- "Just lift and shift everything"
- No understanding of Direct Connect vs VPN trade-offs
- Ignores data transfer time in migration planning

### Green Flags
- Understands Transit Gateway and when to use it
- Considers DNS in hybrid architectures
- Knows multiple migration strategies and when to use each
- Calculates realistic migration timelines
- Plans for rollback and failure scenarios
- Considers cost optimization in network design
- Understands PrivateLink for service exposure
