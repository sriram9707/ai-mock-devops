/**
 * Question Bank - Example scenarios and questions for each role
 * 
 * ⚠️ IMPORTANT: These are TEMPLATES and EXAMPLES only - DO NOT use verbatim in interviews!
 * 
 * The AI interviewer should:
 * 1. Use these as inspiration for question structure and format
 * 2. Adapt scenarios to candidate's specific tech stack (e.g., EKS vs GKE, Terraform vs CloudFormation)
 * 3. Create unique questions based on candidate's intro, JD requirements, and previous answers
 * 4. Never read these questions word-for-word to candidates
 * 
 * Example:
 * - Template: "Terraform state lock conflict"
 * - If candidate uses CloudFormation → Ask about CloudFormation stack conflicts instead
 * - If candidate mentioned specific tools → Incorporate those tools into the scenario
 */

export interface QuestionScenario {
    scenario: string
    questionTemplate: string
    followUpQuestions?: string[]
    competencies: string[]
    difficulty: 'entry' | 'mid' | 'senior' | 'principal'
}

export const QUESTION_BANK: Record<string, QuestionScenario[]> = {
    'DevOps Entry': [
        {
            scenario: 'Pod stuck in Pending state',
            questionTemplate: 'You notice that your Kubernetes pods are stuck in Pending state. Walk me through how you would debug this issue.',
            followUpQuestions: [
                'What would be your first command to check?',
                'What are common reasons for pods to be stuck in Pending?',
                'How would you check if there are enough resources available?'
            ],
            competencies: ['kubernetes', 'troubleshooting', 'debugging'],
            difficulty: 'entry'
        },
        {
            scenario: 'CI/CD pipeline failure',
            questionTemplate: 'Your CI/CD pipeline failed during deployment. How would you investigate what went wrong?',
            followUpQuestions: [
                'Where would you look first for error logs?',
                'What are common causes of pipeline failures?',
                'How would you prevent this from happening again?'
            ],
            competencies: ['ci_cd', 'debugging', 'automation'],
            difficulty: 'entry'
        },
        {
            scenario: 'High CPU usage',
            questionTemplate: 'You receive an alert that a server\'s CPU usage is at 95%. What steps would you take to investigate?',
            followUpQuestions: [
                'What commands would you run first?',
                'How would you identify which process is consuming CPU?',
                'What would you do if it\'s a production service?'
            ],
            competencies: ['linux', 'monitoring', 'troubleshooting'],
            difficulty: 'entry'
        },
        {
            scenario: 'Database connection issues',
            questionTemplate: 'An application is unable to connect to the database. How would you troubleshoot this?',
            followUpQuestions: [
                'What would you check first?',
                'How would you verify network connectivity?',
                'What are common causes of database connection failures?'
            ],
            competencies: ['networking', 'databases', 'troubleshooting'],
            difficulty: 'entry'
        },
        {
            scenario: 'Docker container not starting',
            questionTemplate: 'A Docker container fails to start. Walk me through your debugging process.',
            followUpQuestions: [
                'What command would you use to check container logs?',
                'How would you verify the container image is correct?',
                'What are common reasons containers fail to start?'
            ],
            competencies: ['docker', 'containers', 'debugging'],
            difficulty: 'entry'
        }
    ],

    'DevOps Senior': [
        {
            scenario: 'Pod stuck in Pending state',
            questionTemplate: 'Your EKS cluster has multiple pods stuck in Pending state across different namespaces. Walk me through your systematic approach to debug and resolve this.',
            followUpQuestions: [
                'How would you check node capacity and resource allocation?',
                'What would you look for in node conditions and events?',
                'How would you handle this if it\'s affecting production traffic?',
                'What preventive measures would you implement?'
            ],
            competencies: ['kubernetes', 'aws', 'incident_response', 'capacity_planning'],
            difficulty: 'senior'
        },
        {
            scenario: 'Multi-region deployment failure',
            questionTemplate: 'A deployment succeeded in us-east-1 but failed in eu-west-1. How would you investigate and resolve this?',
            followUpQuestions: [
                'What differences would you check between regions?',
                'How would you handle partial deployments?',
                'What rollback strategy would you use?',
                'How would you prevent this in future deployments?'
            ],
            competencies: ['multi_region', 'deployment_strategies', 'disaster_recovery'],
            difficulty: 'senior'
        },
        {
            scenario: 'Terraform state conflict',
            questionTemplate: 'You encounter a Terraform state lock conflict. Multiple engineers are trying to apply changes simultaneously. How do you resolve this?',
            followUpQuestions: [
                'What are the risks of force-unlocking the state?',
                'How would you prevent this from happening again?',
                'What state management strategy would you recommend?'
            ],
            competencies: ['terraform', 'iac', 'collaboration', 'state_management'],
            difficulty: 'senior'
        },
        {
            scenario: 'Cost optimization',
            questionTemplate: 'Your AWS bill has increased by 40% this month. How would you identify and optimize costs without impacting performance?',
            followUpQuestions: [
                'What AWS services would you audit first?',
                'How would you identify unused resources?',
                'What cost optimization strategies would you implement?',
                'How would you balance cost vs performance?'
            ],
            competencies: ['cost_optimization', 'aws', 'resource_management'],
            difficulty: 'senior'
        },
        {
            scenario: 'Security incident',
            questionTemplate: 'You discover that an S3 bucket containing sensitive data is publicly accessible. Walk me through your incident response process.',
            followUpQuestions: [
                'What immediate actions would you take?',
                'How would you assess the scope of exposure?',
                'What remediation steps would you implement?',
                'How would you prevent this in the future?'
            ],
            competencies: ['security', 'incident_response', 'aws', 'compliance'],
            difficulty: 'senior'
        },
        {
            scenario: 'GitOps workflow failure',
            questionTemplate: 'Your GitOps workflow using ArgoCD is not syncing changes from Git to Kubernetes. How would you debug this?',
            followUpQuestions: [
                'What would you check in ArgoCD first?',
                'How would you verify Git repository connectivity?',
                'What are common causes of sync failures?',
                'How would you implement monitoring for this?'
            ],
            competencies: ['gitops', 'argocd', 'kubernetes', 'automation'],
            difficulty: 'senior'
        }
    ],

    'SRE Entry': [
        {
            scenario: 'Service returning 500 errors',
            questionTemplate: 'Your service is returning 500 errors to users. Walk me through how you would investigate this incident.',
            followUpQuestions: [
                'Where would you look first for error logs?',
                'How would you check if it\'s affecting all users or a subset?',
                'What metrics would you check?',
                'How would you communicate this to stakeholders?'
            ],
            competencies: ['incident_response', 'debugging', 'observability'],
            difficulty: 'entry'
        },
        {
            scenario: 'High latency',
            questionTemplate: 'Users are reporting slow response times. How would you investigate and identify the bottleneck?',
            followUpQuestions: [
                'What metrics would you check first?',
                'How would you trace a request through your system?',
                'What tools would you use for profiling?'
            ],
            competencies: ['performance', 'observability', 'troubleshooting'],
            difficulty: 'entry'
        },
        {
            scenario: 'Alert fatigue',
            questionTemplate: 'Your team is receiving too many alerts, and important ones are being missed. How would you address this?',
            followUpQuestions: [
                'How would you prioritize alerts?',
                'What criteria would you use to reduce noise?',
                'How would you ensure critical alerts aren\'t missed?'
            ],
            competencies: ['monitoring', 'alerting', 'oncall'],
            difficulty: 'entry'
        }
    ],

    'SRE Mid-Senior': [
        {
            scenario: 'Pod stuck in Pending state',
            questionTemplate: 'Production pods are stuck in Pending state during peak traffic. This is causing user-facing errors. Walk me through your incident response.',
            followUpQuestions: [
                'How would you prioritize this incident?',
                'What immediate actions would you take to restore service?',
                'How would you investigate root cause while maintaining service?',
                'What would you check in node conditions, resource quotas, and pod specs?',
                'How would you prevent this from happening again?'
            ],
            competencies: ['incident_command', 'kubernetes', 'reliability', 'post_mortem'],
            difficulty: 'senior'
        },
        {
            scenario: 'Cascading failure',
            questionTemplate: 'A database slowdown is causing cascading failures across multiple services. Walk me through how you would handle this incident.',
            followUpQuestions: [
                'How would you stop the cascade?',
                'What circuit breaker patterns would you implement?',
                'How would you coordinate with multiple teams?',
                'What would you include in the post-mortem?'
            ],
            competencies: ['incident_command', 'distributed_systems', 'reliability_patterns'],
            difficulty: 'senior'
        },
        {
            scenario: 'SLO violation',
            questionTemplate: 'Your service is violating its SLO. Error budget is running out. How would you address this?',
            followUpQuestions: [
                'How would you communicate this to product teams?',
                'What immediate actions would you take?',
                'How would you negotiate error budgets?',
                'What trade-offs would you consider?'
            ],
            competencies: ['slo_sli', 'error_budgets', 'stakeholder_management'],
            difficulty: 'senior'
        },
        {
            scenario: 'Multi-region failover',
            questionTemplate: 'You need to failover traffic from us-east-1 to eu-west-1 due to a regional outage. Walk me through the process.',
            followUpQuestions: [
                'How would you verify eu-west-1 is healthy?',
                'What would you check before routing traffic?',
                'How would you minimize data loss?',
                'What would you monitor during failover?'
            ],
            competencies: ['disaster_recovery', 'multi_region', 'incident_command'],
            difficulty: 'senior'
        },
        {
            scenario: 'Capacity planning',
            questionTemplate: 'Your service needs to handle 10x traffic increase in 3 months. How would you plan for this?',
            followUpQuestions: [
                'How would you estimate resource requirements?',
                'What bottlenecks would you identify?',
                'How would you test your capacity?',
                'What would you monitor?'
            ],
            competencies: ['capacity_planning', 'scalability', 'performance'],
            difficulty: 'senior'
        }
    ],

    'SRE Principal': [
        {
            scenario: 'Organizational reliability',
            questionTemplate: 'Your organization has 1000+ microservices with inconsistent reliability practices. How would you establish a reliability culture?',
            followUpQuestions: [
                'How would you get buy-in from engineering teams?',
                'What policies and standards would you establish?',
                'How would you measure success?',
                'What cultural changes would you drive?'
            ],
            competencies: ['organizational_strategy', 'culture', 'leadership'],
            difficulty: 'principal'
        },
        {
            scenario: 'Error budget policy',
            questionTemplate: 'You need to establish error budget policies across multiple product teams. How would you approach this?',
            followUpQuestions: [
                'How would you negotiate error budgets with product teams?',
                'What happens when error budgets are exhausted?',
                'How would you balance feature velocity vs reliability?',
                'How would you handle exceptions?'
            ],
            competencies: ['error_budgets', 'policy', 'stakeholder_management'],
            difficulty: 'principal'
        },
        {
            scenario: 'Global architecture',
            questionTemplate: 'Design a system architecture that achieves 99.99% availability across multiple regions.',
            followUpQuestions: [
                'What architectural patterns would you use?',
                'How would you handle data consistency?',
                'What trade-offs would you make?',
                'How would you test this architecture?'
            ],
            competencies: ['architecture', 'multi_region', 'reliability'],
            difficulty: 'principal'
        }
    ],

    'Cloud Architect': [
        {
            scenario: 'System design at scale',
            questionTemplate: 'Design a system to handle 1 million concurrent users. Walk me through your architecture.',
            followUpQuestions: [
                'How would you handle database scaling?',
                'What caching strategy would you use?',
                'How would you ensure high availability?',
                'What trade-offs would you make?'
            ],
            competencies: ['system_design', 'scalability', 'architecture'],
            difficulty: 'senior'
        },
        {
            scenario: 'Serverless vs containers',
            questionTemplate: 'You need to choose between AWS Lambda and ECS for a new service. Walk me through your decision-making process.',
            followUpQuestions: [
                'What factors would influence your decision?',
                'What are the trade-offs?',
                'How would you estimate costs?',
                'When would you choose one over the other?'
            ],
            competencies: ['architecture', 'trade_offs', 'cost_optimization'],
            difficulty: 'senior'
        },
        {
            scenario: 'Cloud migration',
            questionTemplate: 'You need to migrate a monolith to microservices on AWS. Walk me through your migration strategy.',
            followUpQuestions: [
                'What migration approach would you use?',
                'How would you minimize downtime?',
                'What challenges would you anticipate?',
                'How would you measure success?'
            ],
            competencies: ['migration', 'architecture', 'strategy'],
            difficulty: 'senior'
        }
    ],

    'Chaos Engineer': [
        {
            scenario: 'Chaos experiment design',
            questionTemplate: 'Design a chaos experiment to test database failover. Walk me through your approach.',
            followUpQuestions: [
                'What hypothesis would you test?',
                'How would you define steady state?',
                'What safety measures would you implement?',
                'How would you measure blast radius?'
            ],
            competencies: ['chaos_engineering', 'experimentation', 'safety'],
            difficulty: 'senior'
        },
        {
            scenario: 'Blast radius containment',
            questionTemplate: 'You want to test a region failover but need to ensure minimal user impact. How would you design this experiment?',
            followUpQuestions: [
                'How would you limit blast radius?',
                'What safeguards would you put in place?',
                'How would you monitor the experiment?',
                'What abort conditions would you define?'
            ],
            competencies: ['chaos_engineering', 'safety', 'monitoring'],
            difficulty: 'senior'
        },
        {
            scenario: 'Automated chaos',
            questionTemplate: 'How would you automate chaos experiments to run continuously?',
            followUpQuestions: [
                'What infrastructure would you need?',
                'How would you ensure safety?',
                'How would you handle failures?',
                'What would you monitor?'
            ],
            competencies: ['automation', 'chaos_engineering', 'reliability'],
            difficulty: 'senior'
        }
    ]
}

/**
 * Get question scenarios for a specific role and level
 */
export function getQuestionScenarios(role: string, level: string): QuestionScenario[] {
    const key = `${role} ${level}`
    
    // Try exact match
    if (QUESTION_BANK[key]) {
        return QUESTION_BANK[key]
    }
    
    // Try fuzzy matching
    const normalizedKey = key.toLowerCase()
    for (const [bankKey, scenarios] of Object.entries(QUESTION_BANK)) {
        if (normalizedKey.includes(bankKey.toLowerCase().split(' ')[0])) {
            // Filter by difficulty level
            return scenarios.filter(s => {
                if (level.toLowerCase().includes('entry')) return s.difficulty === 'entry'
                if (level.toLowerCase().includes('principal')) return s.difficulty === 'principal'
                return ['mid', 'senior'].includes(s.difficulty)
            })
        }
    }
    
    // Default fallback
    return QUESTION_BANK['SRE Mid-Senior'] || []
}

