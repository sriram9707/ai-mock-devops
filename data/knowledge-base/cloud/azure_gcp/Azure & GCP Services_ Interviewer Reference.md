---
id: multi-cloud-dr-deployment-strategy
tags: [auto-tagged]
---

# Azure & GCP Services: Interviewer Reference

This document provides deep knowledge for conducting scenario-based interviews on Azure and GCP services. Use when candidates mention experience with these cloud providers.

---

## How to Use This Document

When a candidate mentions Azure or GCP experience, drill down on the specific services they've used. Focus on scenarios, not definitions.

---

## Azure Core Services

### Azure Virtual Machines

**If candidate mentions Azure VMs, drill down on:**

**Scenario: VM Availability**
"Your Azure VM-based application needs 99.99% SLA. How do you achieve this?"

**Expected approach:**
- Availability Zones (different physical locations)
- Availability Sets (fault domains + update domains)
- VM Scale Sets for auto-scaling
- Load Balancer or Application Gateway

**Follow-up directions:**
- "What's the difference between Availability Sets and Availability Zones?" → Sets = same datacenter, different racks. Zones = different datacenters.
- "What SLA do you get with a single VM?" → 99.9% with Premium SSD, no SLA with Standard HDD

### Azure Storage

**Scenario: Cross-Region Data Access**
"You need to serve static content globally with low latency. How do you set this up?"

**Expected approach:**
- Azure Blob Storage with CDN
- Geo-redundant storage (GRS) for durability
- Consider: Azure Front Door for global load balancing

**Follow-up:** "What's the difference between LRS, ZRS, GRS, and GZRS?"
- LRS: 3 copies in one datacenter
- ZRS: 3 copies across availability zones
- GRS: 6 copies (3 local + 3 in paired region)
- GZRS: ZRS + GRS combined

**Scenario: Secure Access to Storage**
"A third-party application needs temporary access to upload files to your storage account. How do you provide this?"

**Expected approach:**
- Shared Access Signatures (SAS) with limited permissions and expiry
- Stored Access Policies for revocable SAS
- Azure AD authentication for Azure services

### Azure Networking (VNet)

**Scenario: Hybrid Connectivity**
"Your on-premises datacenter needs secure connectivity to Azure. What are your options?"

**Expected approaches:**
1. **VPN Gateway:** Encrypted over internet, up to 10 Gbps
2. **ExpressRoute:** Private connection, up to 100 Gbps, more reliable
3. **ExpressRoute with VPN failover:** Best of both

**Follow-up:** "When would you choose ExpressRoute over VPN?"
- Consistent latency requirements
- High bandwidth needs
- Compliance requirements for private connectivity

**Scenario: Network Security**
"How do you control traffic between subnets in Azure?"

**Expected understanding:**
- Network Security Groups (NSGs) - stateful, like AWS Security Groups
- Application Security Groups (ASGs) - group VMs logically
- Azure Firewall - managed firewall service
- User Defined Routes (UDRs) - custom routing

### Azure Kubernetes Service (AKS)

**Scenario: AKS Networking**
"You're setting up AKS. What networking model do you choose and why?"

**Expected understanding:**
- **Kubenet:** Simple, pods get IPs from separate range, NAT for external
- **Azure CNI:** Pods get VNet IPs, better integration, more IP consumption

**Follow-up:** "When would you use Kubenet vs Azure CNI?"
- Kubenet: IP address conservation, simpler setup
- Azure CNI: Direct pod connectivity, Azure services integration, Windows containers

### Azure Identity (Azure AD)

**Scenario: Service Authentication**
"Your application running in AKS needs to access Azure Key Vault. How do you authenticate?"

**Expected approach:**
- Managed Identity (system-assigned or user-assigned)
- Workload Identity for Kubernetes (AAD Pod Identity successor)
- Avoid: storing credentials in code or config

**Follow-up:** "What's the difference between system-assigned and user-assigned managed identities?"
- System-assigned: tied to resource lifecycle, one-to-one
- User-assigned: independent lifecycle, can be shared across resources

---

## GCP Core Services

### Compute Engine

**If candidate mentions GCP Compute, drill down on:**

**Scenario: Cost Optimization**
"Your batch processing workloads run for 6 hours daily. How do you optimize costs?"

**Expected approaches:**
- Preemptible VMs (up to 80% discount, can be terminated)
- Spot VMs (newer, similar to preemptible)
- Committed Use Discounts for baseline
- Custom machine types (right-size CPU/memory)

**Follow-up:** "What's the difference between Preemptible and Spot VMs?"
- Spot: More features, can set max price, better for production
- Preemptible: Legacy, 24-hour max, simpler

### Cloud Storage

**Scenario: Storage Class Selection**
"You're storing 100TB of log files. Access patterns: frequently accessed for 30 days, then rarely. How do you optimize?"

**Expected approach:**
- Object Lifecycle Management
- Start with Standard, transition to Nearline (30 days), then Coldline (90 days)
- Consider Archive for long-term retention

**Storage classes:**
- Standard: Frequent access
- Nearline: Once per month
- Coldline: Once per quarter
- Archive: Once per year

**Follow-up:** "What are the retrieval costs for each class?"

### GCP Networking (VPC)

**Scenario: Multi-Region Architecture**
"Your application needs to serve users globally with low latency. How do you design the network?"

**Expected approach:**
- Global VPC (spans all regions automatically)
- Cloud Load Balancing (global, anycast IP)
- Cloud CDN for static content
- Premium Tier networking for Google's backbone

**Follow-up:** "What's the difference between Premium and Standard network tiers?"
- Premium: Uses Google's global network, lower latency
- Standard: Uses public internet, cheaper, higher latency

**Scenario: Private Google Access**
"Your VMs in a private subnet need to access Cloud Storage without public IPs. How?"

**Expected approach:**
- Enable Private Google Access on subnet
- Use Cloud NAT for other internet access
- Consider Private Service Connect for more control

### Google Kubernetes Engine (GKE)

**Scenario: GKE Cluster Design**
"You're setting up a production GKE cluster. What configuration decisions do you make?"

**Expected considerations:**
- Regional vs Zonal cluster (HA)
- Node pool design (different machine types for different workloads)
- Private cluster (no public IPs on nodes)
- Workload Identity for service authentication
- Network policy for pod-to-pod security

**Follow-up:** "What's the difference between Autopilot and Standard GKE?"
- Autopilot: Fully managed, pay per pod, less control
- Standard: More control, manage node pools, pay per node

### IAM in GCP

**Scenario: Cross-Project Access**
"A service account in Project A needs to access BigQuery in Project B. How do you set this up?"

**Expected approach:**
1. Grant BigQuery role to service account at Project B level
2. Or: Use VPC Service Controls for more security
3. Consider: Shared VPC for network resources

**Follow-up:** "What's the difference between primitive roles and predefined roles?"
- Primitive: Owner, Editor, Viewer (broad, legacy)
- Predefined: Service-specific, granular (recommended)
- Custom: Create your own

---

## Cloud Comparison Scenarios

### Scenario: Multi-Cloud Strategy
"Your company wants to avoid vendor lock-in. How do you design for multi-cloud?"

**Expected considerations:**
- Use Kubernetes for portability
- Abstract cloud-specific services (use Terraform)
- Consider: data gravity, egress costs, feature parity
- Be realistic: true multi-cloud is complex and expensive

**Follow-up:** "What services are hardest to make portable?"
- Managed databases (different features, APIs)
- Serverless (Lambda vs Cloud Functions vs Azure Functions)
- Identity (IAM models differ significantly)

### Scenario: Migration Between Clouds
"You're migrating from AWS to GCP. What's your approach for a stateful application?"

**Expected approach:**
1. Assess dependencies and data
2. Set up networking (VPN/interconnect)
3. Migrate data first (minimize downtime)
4. Migrate compute
5. Update DNS/routing
6. Decommission old infrastructure

**Follow-up:** "What are the biggest challenges in cloud-to-cloud migration?"
- Data transfer costs and time
- Service mapping (not 1:1)
- Retraining teams
- Compliance and security recertification

---

## Level-Specific Conversation Starters

### Entry Level
"Tell me about your experience with Azure/GCP. What services have you used?"
- Listen for: Basic understanding of core services
- Follow up on: How did you deploy? What challenges did you face?

### Senior Level
"Compare how you would design a high-availability web application on AWS vs Azure vs GCP."
- Listen for: Understanding of equivalent services, trade-offs
- Follow up on: What would make you choose one over another?

### SRE Level
"Your company uses AWS primarily but is acquiring a company that uses GCP. How do you approach integration?"
- Listen for: Networking, identity federation, data strategy, team skills
- Follow up on: What's your long-term strategy? Consolidate or multi-cloud?

---

## Red Flags vs Green Flags

### Red Flags
- Only knows one cloud, dismisses others
- Can't explain service equivalents across clouds
- No understanding of cloud-specific strengths
- "Just lift and shift"

### Green Flags
- Understands trade-offs between clouds
- Knows when cloud-specific services are worth the lock-in
- Can design for portability where it matters
- Considers cost, compliance, and team skills in cloud decisions
