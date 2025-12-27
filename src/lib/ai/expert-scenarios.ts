/**
 * Expert Seed Scenarios - Outcome-Based Question Library
 * 
 * These are "hard problems" based on real-world incidents, post-mortems, and expert knowledge.
 * The AI should use these as seeds and adapt them to the candidate's specific tech stack.
 * 
 * Key Principles:
 * - Focus on TRADE-OFFS and SYMPTOMS, not definitions
 * - Include specific constraints (budget, time, scale)
 * - Require deep technical knowledge to answer correctly
 * - Test real-world problem-solving, not memorization
 */

export interface ExpertScenario {
    id: string
    title: string
    // The core problem/scenario - outcome-based, not definition-based
    scenario: string
    // What makes this expert-level (trade-offs, constraints, symptoms)
    complexity: string
    // Technologies this applies to (AI should adapt to candidate's stack)
    applicableTech: string[]
    // Expected drill-down path (5 levels deep)
    drillDownPath: string[]
    // What a correct answer should demonstrate
    evaluationCriteria: string[]
    // Real-world context (where this problem comes from)
    source?: string
    difficulty: 'entry' | 'mid' | 'senior' | 'principal'
}

export const EXPERT_SCENARIOS: ExpertScenario[] = [
    // ========== KUBERNETES/OPENSHIFT ==========
    {
        id: 'k8s-001',
        title: 'Bursty Workload Cold-Start Problem',
        scenario: 'We have a bursty workload that causes pods to be Pending for 2 minutes before the Cluster Autoscaler kicks in. This happens during traffic spikes. How would you reduce that cold-start time without over-provisioning and wasting budget?',
        complexity: 'Requires understanding of autoscaling trade-offs, pod scheduling, node pool strategies, and cost optimization',
        applicableTech: ['kubernetes', 'eks', 'gke', 'aks', 'openshift'],
        drillDownPath: [
            'What specific autoscaling configuration would you use?',
            'How would you handle node pool warm-up vs cost?',
            'What about pod disruption budgets during scale-down?',
            'How would you monitor and alert on this?',
            'What if autoscaler itself is slow? How do you debug that?'
        ],
        evaluationCriteria: [
            'Mentions node pool pre-warming strategies',
            'Discusses pod priority classes',
            'Considers cost vs latency trade-offs',
            'Addresses autoscaler configuration tuning',
            'Mentions monitoring/alerting for scale events'
        ],
        source: 'Netflix, Uber post-mortems',
        difficulty: 'senior'
    },
    {
        id: 'k8s-002',
        title: 'Terraform State Corruption After Manual Deletion',
        scenario: 'A junior developer manually deleted a resource in the AWS Console that was managed by Terraform. Now `terraform plan` is failing with state errors. Walk me through how you restore the state safely without causing downtime or double-provisioning.',
        complexity: 'Requires deep understanding of Terraform state management, import operations, and safe recovery procedures',
        applicableTech: ['terraform', 'aws', 'iac'],
        drillDownPath: [
            'What exact state error are you seeing?',
            'How do you verify what resources are actually in AWS vs state?',
            'What\'s your process for importing the missing resource?',
            'How do you prevent this from happening again?',
            'What if multiple resources were deleted? How do you batch import?'
        ],
        evaluationCriteria: [
            'Uses terraform import correctly',
            'Mentions state locking during recovery',
            'Discusses state validation before apply',
            'Addresses team processes/guardrails',
            'Considers state backup/restore strategies'
        ],
        source: 'Common production incident',
        difficulty: 'senior'
    },
    {
        id: 'k8s-003',
        title: 'Multi-Region Terraform Apply Race Condition',
        scenario: 'You\'re running `terraform apply` simultaneously in us-east-1 and eu-west-1. Both are trying to create the same S3 bucket (which must be globally unique). How do you handle this race condition?',
        complexity: 'Tests understanding of distributed systems, state management, and idempotency',
        applicableTech: ['terraform', 'multi-region', 'aws'],
        drillDownPath: [
            'What happens when both applies run?',
            'How do you design for idempotency?',
            'What about state locking across regions?',
            'How would you architect this to avoid the race?',
            'What if one region fails mid-apply?'
        ],
        evaluationCriteria: [
            'Understands S3 bucket naming constraints',
            'Mentions workspace/workspace variables',
            'Discusses state backend design',
            'Addresses failure scenarios',
            'Considers CI/CD pipeline coordination'
        ],
        difficulty: 'principal'
    },
    {
        id: 'k8s-004',
        title: 'Service Mesh mTLS Latency Spike',
        scenario: 'After enabling mTLS in your service mesh (Istio/Linkerd), you notice a 200ms latency increase on all inter-service calls. Your SLO requires <50ms p99 latency. Walk me through how you diagnose and fix this without disabling security.',
        complexity: 'Requires understanding of service mesh architecture, mTLS overhead, performance tuning, and security trade-offs',
        applicableTech: ['service-mesh', 'istio', 'linkerd', 'kubernetes'],
        drillDownPath: [
            'How do you measure where the latency is coming from?',
            'What are the specific mTLS overhead sources?',
            'How would you optimize certificate rotation?',
            'What about sidecar resource limits?',
            'How do you balance security vs performance?'
        ],
        evaluationCriteria: [
            'Mentions sidecar overhead',
            'Discusses certificate caching',
            'Addresses connection pooling',
            'Considers sidecar resource allocation',
            'Understands security vs performance trade-offs'
        ],
        source: 'Istio production issues',
        difficulty: 'senior'
    },

    // ========== CI/CD ==========
    {
        id: 'cicd-001',
        title: 'GitHub Actions Secret Rotation Failure',
        scenario: 'Your GitHub Actions workflow is failing because AWS credentials expired. The secrets are managed by AWS Secrets Manager and auto-rotate every 90 days. Your deployment pipeline runs every hour. How do you ensure zero-downtime secret rotation?',
        complexity: 'Tests understanding of secret management, rotation strategies, and CI/CD reliability',
        applicableTech: ['github-actions', 'aws', 'secrets-management', 'ci-cd'],
        drillDownPath: [
            'How do you detect secret expiration before it happens?',
            'What\'s your process for updating GitHub secrets?',
            'How do you handle the rotation window?',
            'What if rotation happens mid-deployment?',
            'How do you test secret rotation safely?'
        ],
        evaluationCriteria: [
            'Mentions proactive secret refresh',
            'Discusses rotation window handling',
            'Addresses deployment coordination',
            'Considers monitoring/alerting',
            'Understands secret versioning'
        ],
        difficulty: 'senior'
    },
    {
        id: 'cicd-002',
        title: 'Jenkins Pipeline State Corruption',
        scenario: 'Your Jenkins pipeline stores build state in a shared NFS volume. After a network partition, the state file got corrupted. Now all builds are failing with "state file locked" errors. How do you recover without losing build history?',
        complexity: 'Requires understanding of distributed systems, file locking, and state recovery',
        applicableTech: ['jenkins', 'ci-cd', 'nfs'],
        drillDownPath: [
            'How do you identify which builds are affected?',
            'What\'s your process for unlocking state?',
            'How do you prevent data loss?',
            'What about concurrent builds during recovery?',
            'How would you redesign this to avoid the problem?'
        ],
        evaluationCriteria: [
            'Understands file locking mechanisms',
            'Mentions backup/restore strategies',
            'Discusses state file validation',
            'Addresses concurrent access issues',
            'Considers alternative state storage'
        ],
        difficulty: 'senior'
    },

    // ========== CLOUD SERVICES ==========
    {
        id: 'cloud-001',
        title: 'S3 Cross-Region Replication Lag',
        scenario: 'Your S3 bucket replicates to 3 regions for DR. During a traffic spike, replication lag increases to 5 minutes. Your application reads from the nearest region, but some users are seeing stale data. How do you ensure consistency without impacting performance?',
        complexity: 'Tests understanding of eventual consistency, replication strategies, and data consistency models',
        applicableTech: ['aws', 's3', 'multi-region'],
        drillDownPath: [
            'What\'s your read strategy during replication lag?',
            'How do you detect and handle stale reads?',
            'What about write consistency guarantees?',
            'How would you optimize replication performance?',
            'What if one region is completely down?'
        ],
        evaluationCriteria: [
            'Understands eventual consistency trade-offs',
            'Mentions read-after-write consistency',
            'Discusses replication optimization',
            'Addresses failure scenarios',
            'Considers application-level consistency'
        ],
        source: 'AWS Well-Architected patterns',
        difficulty: 'senior'
    },
    {
        id: 'cloud-002',
        title: 'RDS Multi-AZ Failover Performance',
        scenario: 'Your RDS Multi-AZ database failed over to the standby, but application queries are now 3x slower. The failover completed successfully, but performance degraded. How do you diagnose and fix this?',
        complexity: 'Requires understanding of database failover, connection pooling, and performance tuning',
        applicableTech: ['aws', 'rds', 'postgresql', 'mysql'],
        drillDownPath: [
            'What changed after failover that could cause slowdown?',
            'How do you check if it\'s a connection pool issue?',
            'What about query plan cache invalidation?',
            'How do you verify the standby was properly warmed?',
            'What monitoring would you add to catch this earlier?'
        ],
        evaluationCriteria: [
            'Mentions connection pool exhaustion',
            'Discusses query plan cache',
            'Addresses standby warm-up',
            'Considers connection string changes',
            'Understands Multi-AZ limitations'
        ],
        difficulty: 'senior'
    },

    // ========== DEPLOYMENT STRATEGIES ==========
    {
        id: 'deploy-001',
        title: 'Canary Deployment Traffic Spike',
        scenario: 'You\'re doing a canary deployment: 10% traffic to new version, 90% to old. Suddenly, the 10% canary traffic spikes to 50% due to a load balancer misconfiguration. The new version has a critical bug. How do you prevent the bug from affecting all users?',
        complexity: 'Tests understanding of deployment strategies, traffic management, and incident response',
        applicableTech: ['kubernetes', 'istio', 'aws-alb', 'deployment'],
        drillDownPath: [
            'How do you detect the traffic misrouting?',
            'What\'s your immediate rollback procedure?',
            'How do you verify traffic distribution?',
            'What safeguards prevent this?',
            'How do you test canary deployments safely?'
        ],
        evaluationCriteria: [
            'Understands traffic splitting mechanisms',
            'Mentions automated rollback triggers',
            'Discusses monitoring/alerting',
            'Addresses configuration validation',
            'Considers gradual rollout strategies'
        ],
        difficulty: 'senior'
    },
    {
        id: 'deploy-002',
        title: 'Blue-Green Database Migration',
        scenario: 'You need to do a blue-green deployment, but your application uses a shared database. The new version requires a schema migration that\'s backward-incompatible. How do you handle this without downtime?',
        complexity: 'Requires deep understanding of database migrations, backward compatibility, and zero-downtime deployments',
        applicableTech: ['database', 'migrations', 'deployment'],
        drillDownPath: [
            'How do you make the schema backward-compatible?',
            'What\'s your migration strategy?',
            'How do you handle data consistency?',
            'What if the migration fails mid-way?',
            'How do you test this safely?'
        ],
        evaluationCriteria: [
            'Mentions expand-contract pattern',
            'Discusses feature flags',
            'Addresses data migration strategies',
            'Considers rollback procedures',
            'Understands backward compatibility'
        ],
        source: 'Martin Fowler patterns',
        difficulty: 'principal'
    },

    // ========== HELM ==========
    {
        id: 'helm-001',
        title: 'Helm Chart Dependency Conflict',
        scenario: 'You\'re deploying a Helm chart that depends on another chart. The dependency chart was updated and now conflicts with your chart\'s values. Your production deployment is failing. How do you resolve this without breaking other services using the same dependency?',
        complexity: 'Tests understanding of Helm dependencies, versioning, and multi-tenant deployments',
        applicableTech: ['helm', 'kubernetes'],
        drillDownPath: [
            'How do you identify the conflict?',
            'What\'s your version pinning strategy?',
            'How do you test dependency updates?',
            'What about shared chart repositories?',
            'How do you coordinate updates across teams?'
        ],
        evaluationCriteria: [
            'Understands Helm dependency management',
            'Mentions version pinning',
            'Discusses chart testing strategies',
            'Addresses multi-tenant concerns',
            'Considers dependency isolation'
        ],
        difficulty: 'senior'
    },

    // ========== OBSERVABILITY ==========
    {
        id: 'obs-001',
        title: 'Distributed Tracing Overhead',
        scenario: 'You enabled distributed tracing (Jaeger/Zipkin) across all services. Now your p99 latency increased by 150ms and your tracing costs are $5000/month. Your SLO requires <100ms p99. How do you reduce overhead without losing observability?',
        complexity: 'Requires understanding of tracing overhead, sampling strategies, and observability trade-offs',
        applicableTech: ['observability', 'tracing', 'jaeger', 'zipkin'],
        drillDownPath: [
            'What\'s causing the latency overhead?',
            'How do you implement intelligent sampling?',
            'What about trace data retention?',
            'How do you prioritize which traces to keep?',
            'What\'s your cost optimization strategy?'
        ],
        evaluationCriteria: [
            'Mentions sampling strategies',
            'Discusses trace data volume',
            'Addresses performance vs observability trade-off',
            'Considers adaptive sampling',
            'Understands cost optimization'
        ],
        difficulty: 'senior'
    },

    // ========== SECURITY ==========
    {
        id: 'sec-001',
        title: 'Public S3 Bucket Incident Response',
        scenario: 'You discover an S3 bucket containing PII is publicly accessible. CloudTrail shows it was made public 3 days ago. You need to: 1) Secure it immediately, 2) Assess exposure, 3) Notify stakeholders, 4) Prevent recurrence. Walk me through your incident response.',
        complexity: 'Tests incident response, security practices, and compliance awareness',
        applicableTech: ['aws', 's3', 'security'],
        drillDownPath: [
            'What\'s your immediate containment action?',
            'How do you assess what data was exposed?',
            'Who do you notify and when?',
            'How do you prevent this from happening again?',
            'What monitoring would catch this earlier?'
        ],
        evaluationCriteria: [
            'Immediate security action',
            'Proper incident response process',
            'Mentions compliance requirements',
            'Discusses prevention mechanisms',
            'Addresses monitoring/alerting'
        ],
        difficulty: 'senior'
    }
]

/**
 * Get expert scenarios filtered by technology and difficulty
 */
export function getExpertScenarios(
    technologies: string[],
    difficulty: 'entry' | 'mid' | 'senior' | 'principal'
): ExpertScenario[] {
    return EXPERT_SCENARIOS.filter(scenario => {
        // Match difficulty with flexible matching
        if (difficulty === 'mid') {
            // Mid-level can see entry and mid scenarios (treat mid as entry for now)
            return scenario.difficulty === 'entry' || scenario.difficulty === 'mid'
        } else if (difficulty === 'senior') {
            // Senior can see mid and senior scenarios
            return scenario.difficulty === 'senior' || scenario.difficulty === 'mid'
        } else if (difficulty === 'principal') {
            // Principal can see all
            return true
        } else {
            // Entry level - exact match
            return scenario.difficulty === difficulty
        }

        // Match technologies (fuzzy match)
        const techLower = technologies.map(t => t.toLowerCase())
        return scenario.applicableTech.some(tech =>
            techLower.some(candidateTech =>
                candidateTech.includes(tech) || tech.includes(candidateTech)
            )
        )
    })
}

/**
 * Get a random expert scenario for a given context
 */
export function getRandomExpertScenario(
    technologies: string[],
    difficulty: 'entry' | 'mid' | 'senior' | 'principal',
    excludeIds: string[] = []
): ExpertScenario | null {
    const scenarios = getExpertScenarios(technologies, difficulty)
        .filter(s => !excludeIds.includes(s.id))
    
    if (scenarios.length === 0) return null
    
    return scenarios[Math.floor(Math.random() * scenarios.length)]
}

