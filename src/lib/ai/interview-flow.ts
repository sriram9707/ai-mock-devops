
export interface InterviewTopic {
    id: string
    name: string
    description: string
    entryLevelFocus: string[]
    seniorLevelFocus: string[]
    architectLevelFocus: string[]
    estimatedMinutes: number
    generateIncidentPrompt: (candidateTech: string[], jdTech: string[], level: string) => string
}

export const INTERVIEW_TOPICS: InterviewTopic[] = [
    {
        id: 'kubernetes',
        name: 'Kubernetes',
        description: 'Container orchestration, design patterns, and troubleshooting',
        entryLevelFocus: [
            'Pod Lifecycle and States', // KB: K8s/pod_lifecycle
            'Linux Networking Basics',   // KB: linux/linux_networking
            'Deployments vs StatefulSets',
            'Service Types (ClusterIP vs NodePort)',
            'ConfigMaps and Secrets Usage',
            'Basic Troubleshooting (kubectl logs/describe)'
        ],
        seniorLevelFocus: [
            'Debug Ingress 502/504 Errors',
            'Multi Tenant application deployment', // KB: K8s/ingress-debugging
            'EKS API Server Latency/Outage',
            'Linux Networking Basics', // KB: incidents/eks-api-server-outage
            'Affinity and Anti-Affinity Rules',
            'Taints and Tolerations',
            'Network Policies & Isolation',
            'Persistent Volume Lifecycle'
        ],
        architectLevelFocus: [
            'Kubernetes OpenShift Reference Architecture', // KB: K8s/kubernetes_openshift
            'Multi-Tenant Cluster Design',
            'Service Mesh (Istio/Linkerd) Pros/Cons',
            'Operator Pattern vs Helm',
            'Cluster Autoscaling Strategies (Karpenter vs CA)',
            'EKS Upgrade Strategy (Blue/Green Control Plane)'
        ],
        estimatedMinutes: 10,
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            return `A Kubernetes cluster is experiencing wide-scale pod failures and network timeouts. Based on "Pod Lifecycle" or general K8s principles, walk me through your troubleshooting process.`
        }
    },
    {
        id: 'cicd',
        name: 'CI/CD Tools',
        description: 'Pipeline design, automation strategies, and deployment safety',
        entryLevelFocus: [
            'GitHub Actions Basics', // KB: ci-cd/GitHub Actions
            'Jenkins Job Configuration', // KB: ci-cd/Jenkins
            'GitLab CI Stage Definitions',
            'Artifact Management (Nexus/Artifactory)',
            'Docker Build Caching',
            'Triggering Pipelines (Webhooks vs Cron)'
        ],
        seniorLevelFocus: [
            'GitLab CI Pipelines', // KB: ci-cd/GitLab CI
            'GitOps & ArgoCD Integration', // KB: ci-cd/GitOps & ArgoCD
            'Secure Secrets Injection (Vault/AWS Secrets)',
            'Container Scanning (Trivy/Clair)',
            'Parallelizing Build Stages',
            'Pipeline Templates & Shared Libraries'
        ],
        architectLevelFocus: [
            'GitOps & ArgoCD Integration', // Reusing for Architect as it's complex
            'DORA Metrics Implementation',
            'Internal Developer Platform (IDP) Concept',
            'Compliance as Code in Pipelines',
            'Multi-Region Deployment Pipelines',
            'Self-Hosted Runners Scaling'
        ],
        estimatedMinutes: 8,
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            return `Your CI/CD pipeline is broken. Using principles from "GitHub Actions" or generic pipeline logic, explain how you diagnose a stalled worker or failed build step.`
        }
    },
    {
        id: 'deployment',
        name: 'Deployment Strategy',
        description: 'Release patterns, safety mechanisms, and availability',
        entryLevelFocus: [
            'Pipeline Rollback Strategies', // KB: ci-cd/pipeline-rollback-strategies
            'Blue/Green Deployment Basics',
            'Canary Deployment Basics',
            'Rolling Update Configuration',
            'Smoke Testing vs Unit Testing'
        ],
        seniorLevelFocus: [
            'Pipeline Rollback Strategies', // KB: ci-cd/pipeline-rollback-strategies
            'Automated Canary Analysis',
            'Feature Flags (LaunchDarkly/Split)',
            'Database Migration Strategies (Zero Downtime)',
            'Handling Failed Rollbacks'
        ],
        architectLevelFocus: [
            'Pipeline Rollback Strategies', // KB: ci-cd/pipeline-rollback-strategies
            'Global Traffic Management (Geo-DNS)',
            'Multi-Cloud Failover Strategy',
            'Chaos Engineering (Gremlin/Chaos Mesh)',
            'Service Level Objectives (SLOs) in Release Engineering'
        ],
        estimatedMinutes: 6,
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            return `A deployment failed in production. According to "Pipeline Rollback Strategies" or general best practices, how do you safely revert to the last known good state?`
        }
    },
    {
        id: 'helm',
        name: 'Helm Charts',
        description: 'Package management for Kubernetes',
        entryLevelFocus: [
            'Kubernetes OpenShift Reference Architecture', // Using general k8s doc which likely covers Helm
            'Helm Directory Structure',
            'Helm Install/Upgrade/Rollback',
            'Values.yaml Overrides',
            'Helm Templates Syntax'
        ],
        seniorLevelFocus: [
            'Kubernetes OpenShift Reference Architecture',
            'Library Charts',
            'Helm Hooks (pre-install, post-install)',
            'Managing Chart Dependencies (requirements.yaml)',
            'Debugging Helm Template Rendering'
        ],
        architectLevelFocus: [
            'Kubernetes OpenShift Reference Architecture',
            'Helm Registry Management',
            'Versioning Strategy for Artifacts',
            'GitOps with Helm (Flux/ArgoCD)',
            'Securing Helm Charts (Provenance/Signing)'
        ],
        estimatedMinutes: 5,
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            return `Discuss Helm chart management strategies within a Kubernetes environment.`
        }
    },
    {
        id: 'terraform',
        name: 'Terraform',
        description: 'Infrastructure as Code principles and state management',
        entryLevelFocus: [
            'Terraform Principles', // KB: Iac/terraform/Terraform_ Interviewer Reference
            'Terraform Init/Plan/Apply Workflow',
            'Resource vs Data Source',
            'Output Values',
            'Basic State Management'
        ],
        seniorLevelFocus: [
            'Terraform State Drift Recovery', // KB: terraform/state-drift-recovery
            'Remote Backends (S3 + DynamoDB)',
            'Terraform Modules Refactoring',
            'State Locking Issues',
            'Importing Existing Resources'
        ],
        architectLevelFocus: [
            'Terraform Principles', // KB: Iac/terraform (High level patterns)
            'Terragrunt vs Terraform Cloud',
            'Multi-Account InfoSec Policy',
            'Policy as Code (Sentinel/OPA)',
            'Module Versioning Strategy'
        ],
        estimatedMinutes: 8,
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            return `Your infrastructure state is out of sync. Using "State Drift Recovery" guidelines or general best practices, how do you reconcile discrepancy?`
        }
    },
    {
        id: 'cloud',
        name: 'Cloud Provider Services',
        description: 'AWS/Azure/GCP core services and architecture',
        entryLevelFocus: [
            'AWS Core Services', // KB: cloud/aws/AWS Core Services
            'Azure & GCP Services', // KB: cloud/azure_gcp/Azure & GCP Services
            'AWS EC2 Instance Types',
            'S3 Storage Classes',
            'IAM Roles vs Users',
            'VPC, Subnets, and Route Tables'
        ],
        seniorLevelFocus: [
            'AWS Security & Landing Zone', // KB: cloud/aws/AWS Security & Landing Zone
            'Transit Gateway vs VPC Peering',
            'KMS Key Management',
            'Disaster Recovery Deployment',
            'AWS CloudFormation',
            'Multi account Iam Access Management',
            'Setting up VPN Tunnel',
            'Connecting AWS services using PrivateLink',
            'Cross-Account Access Delegation',
            'Cost Optimization (Savings Plans)'
        ],
        architectLevelFocus: [
            'AWS Advanced Networking & Cloud Migration', // KB: cloud/aws/AWS Advanced Networking...
            'AWS Well-Architected Framework', // KB: cloud/aws/AWS Well-Architected...
            'Serverless Architecture Patterns',
            'Data Lake Architecture',
            'Hybrid Cloud Connectivity (Direct Connect)',
            'Disaster Recovery Tiers (Pilot Light to Active-Active)'
        ],
        estimatedMinutes: 12,
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            return `Design a cloud landing zone. Referencing "AWS Security" docs or general principles, how do you handle multi-account access?`
        }
    },
    {
        id: 'linux',
        name: 'Linux System Internals',
        description: 'Kernel, networking, filesystems, and troubleshooting',
        entryLevelFocus: [
            'Linux Permissions (chmod/chown)',
            'Standard Streams (stdin/stdout/stderr)',
            'Process Management (ps, top, kill)',
            'File System Hierarchy',
            'Basic Networking (curl, ping, netstat)'
        ],
        seniorLevelFocus: [
            'Linux Networking Basics', // KB: linux/linux_networking
            'Kernel Namespaces & Cgroups',
            'TCP/IP Stack Tuning',
            'Troubleshooting High Load (Load Average vs CPU)',
            'Memory Management (OOM Killer, Swap)',
            'Systemd Unit Files'
        ],
        architectLevelFocus: [
            'eBPF Tracing & Observability',
            'Kernel Tuning for High Performance',
            'Container Runtime Internals (runc/containerd)',
            'Storage Subsystems (ZFS/Btrfs)',
            'Security Modules (SELinux/AppArmor)'
        ],
        estimatedMinutes: 8,
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            return `A server is unresponsive with high load. Using "Linux Networking" concepts or general system tools, how do you diagnose the bottleneck?`
        }
    },
    {
        id: 'sre',
        name: 'SRE',
        description: 'Site Reliability Engineering principles',
        entryLevelFocus: [
            'Observability & SRE Principles', // KB: SRE/Observability...
            'The 4 Golden Signals',
            'Logging vs Tracing vs Metrics',
            'Alert Fatigue'
        ],
        seniorLevelFocus: [
            'Incident Command Checklist', // KB: SRE/incident-command-checklist
            'Runbook creation',
            'Error Budgets Calculation',
            'Root Cause Analysis (5 Whys)'
        ],
        architectLevelFocus: [
            'Observability & SRE Principles', // KB: SRE/Observability...
            'Designing for 99.99% Availability',
            'Chaos Engineering Strategy',
            'Cultural Transformation to SRE'
        ],
        estimatedMinutes: 8,
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            return `You are the Incident Commander. Using the "Incident Command Checklist" or standard SRE protocols, walk me through a major outage response.`
        }
    }
]
