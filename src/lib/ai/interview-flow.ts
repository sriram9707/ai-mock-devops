/**
 * Interview Flow Controller
 * Manages the structured interview format and topic progression
 */

export interface InterviewTopic {
    id: string
    name: string
    description: string
    entryLevelFocus: string[]
    seniorLevelFocus: string[]
    architectLevelFocus: string[]
    estimatedMinutes: number
    incidentPrompt: string // Canonical incident scenario to start from
}

export const INTERVIEW_TOPICS: InterviewTopic[] = [
    {
        id: 'kubernetes',
        name: 'Kubernetes/OpenShift',
        description: 'Container orchestration, pod management, networking, storage',
        entryLevelFocus: [
            'Troubleshooting stuck pods',
            'Debugging pod failures',
            'Resource limit issues',
            'Basic kubectl debugging'
        ],
        seniorLevelFocus: [
            'Pod stuck in Pending during production incident',
            'Node failures and pod eviction',
            'Network connectivity issues between pods',
            'StatefulSet data corruption scenarios',
            'Security incidents (unauthorized pod access)',
            'Cluster-wide performance degradation'
        ],
        architectLevelFocus: [
            'Multi-cluster failure scenarios',
            'Kubernetes at scale during traffic spikes',
            'Cost optimization under incident pressure',
            'Disaster recovery across regions',
            'Migration incidents during platform switch'
        ],
        estimatedMinutes: 12,
        incidentPrompt: 'Production pods are stuck in Pending state and users are reporting errors. Walk me through how you would debug and resolve this incident.'
    },
    {
        id: 'cicd',
        name: 'CI/CD Tools',
        description: 'Continuous Integration and Continuous Deployment',
        entryLevelFocus: [
            'Pipeline failure during deployment',
            'Build failures blocking releases',
            'Basic troubleshooting steps'
        ],
        seniorLevelFocus: [
            'Production deployment failure mid-rollout',
            'GitOps sync failures causing drift',
            'Security scan blocking critical hotfix',
            'Pipeline performance degradation',
            'Failed rollback scenarios',
            'Multi-stage deployment incidents'
        ],
        architectLevelFocus: [
            'CI/CD system outage affecting all deployments',
            'Multi-region deployment failures',
            'DevSecOps pipeline security breach',
            'Cost explosion from pipeline inefficiencies',
            'Migration incident during tool switch'
        ],
        estimatedMinutes: 10,
        incidentPrompt: 'A production deployment failed halfway through rollout, and the rollback is also failing. Users are experiencing errors. How do you handle this incident?'
    },
    {
        id: 'deployment',
        name: 'Deployment Strategy',
        description: 'Deployment patterns and strategies',
        entryLevelFocus: [
            'Rolling update causing service degradation',
            'Failed rollback scenario',
            'Basic incident response'
        ],
        seniorLevelFocus: [
            'Blue-green deployment failure during switch',
            'Canary deployment showing errors but metrics unclear',
            'Feature flag causing cascading failures',
            'A/B test traffic routing incorrectly',
            'Multi-region deployment partial failure',
            'Disaster recovery deployment scenarios'
        ],
        architectLevelFocus: [
            'Zero-downtime deployment failure during peak traffic',
            'Multi-cloud deployment inconsistency',
            'Cost vs reliability incident trade-offs',
            'Disaster recovery deployment planning under pressure'
        ],
        estimatedMinutes: 8,
        incidentPrompt: 'A deployment is causing errors in production. The rollback mechanism isn\'t working. How do you resolve this incident?'
    },
    {
        id: 'helm',
        name: 'Helm Charts',
        description: 'Kubernetes package management',
        entryLevelFocus: [
            'Helm upgrade failure breaking services',
            'Chart installation errors',
            'Basic troubleshooting'
        ],
        seniorLevelFocus: [
            'Helm upgrade causing pod failures',
            'Helm hook failures blocking deployments',
            'Chart dependency conflicts in production',
            'Chart templating errors causing misconfiguration',
            'Helm rollback failures',
            'Chart version conflicts across environments'
        ],
        architectLevelFocus: [
            'Helm chart failure in CI/CD blocking all deployments',
            'Chart repository corruption incident',
            'Multi-environment Helm inconsistency causing outages',
            'Security vulnerability in Helm charts',
            'Migration incident during Helm version upgrade'
        ],
        estimatedMinutes: 8,
        incidentPrompt: 'A Helm chart upgrade failed and broke multiple services. The previous version won\'t install. How do you resolve this incident?'
    },
    {
        id: 'terraform',
        name: 'Terraform',
        description: 'Infrastructure as Code',
        entryLevelFocus: [
            'Terraform apply failure breaking infrastructure',
            'State file corruption',
            'Basic troubleshooting'
        ],
        seniorLevelFocus: [
            'State lock conflict blocking critical infrastructure changes',
            'Terraform destroy accidentally deleting production resources',
            'State file corruption causing apply failures',
            'Module dependency failures',
            'Workspace state drift causing inconsistencies',
            'Terraform Cloud outage blocking deployments'
        ],
        architectLevelFocus: [
            'Terraform state corruption at scale affecting multiple teams',
            'Multi-team state conflicts causing production outages',
            'Cost explosion from Terraform misconfiguration',
            'Migration incident during IaC tool switch',
            'Policy as Code blocking critical incident response'
        ],
        estimatedMinutes: 10,
        incidentPrompt: 'A Terraform apply failed halfway through, leaving infrastructure in a broken state. The state file shows inconsistencies. How do you resolve this incident?'
    },
    {
        id: 'cloud',
        name: 'Cloud Provider Services',
        description: 'Cloud platform services and use cases',
        entryLevelFocus: [
            'Service outage affecting application',
            'Basic incident response',
            'Common service failures'
        ],
        seniorLevelFocus: [
            'Multi-service failure cascade',
            'Cost explosion from misconfigured services',
            'Security breach through misconfigured service',
            'Service integration failures',
            'Monitoring blind spots during incidents',
            'Disaster recovery service failures'
        ],
        architectLevelFocus: [
            'System design failure during traffic spike',
            'Scalability architecture breaking under load',
            'Security architecture breach',
            'Cost optimization under incident pressure',
            'Multi-cloud failure scenarios',
            'Migration incident causing extended downtime',
            'Stakeholder management during critical incidents',
            'Disaster recovery failure scenarios'
        ],
        estimatedMinutes: 12,
        incidentPrompt: 'A critical cloud service is experiencing an outage, and your application is failing. Multiple services are affected. How do you handle this incident?'
    }
]

export interface InterviewPhase {
    phase: 'introduction' | 'topics' | 'wrapup'
    currentTopic?: string
    topicsCovered: string[]
    startTime: Date
    estimatedDuration: number // minutes
}

/**
 * Get interview structure based on role level
 */
export function getInterviewStructure(level: string): {
    topics: InterviewTopic[]
    totalMinutes: number
    introductionMinutes: number
    wrapupMinutes: number
} {
    const allTopics = [...INTERVIEW_TOPICS]
    const introductionMinutes = 5
    const wrapupMinutes = 5
    
    // Adjust topic depth based on level
    const topics = allTopics.map(topic => ({
        ...topic,
        estimatedMinutes: level.toLowerCase().includes('entry') 
            ? Math.max(6, topic.estimatedMinutes - 2)
            : level.toLowerCase().includes('architect')
            ? topic.estimatedMinutes + 2
            : topic.estimatedMinutes
    }))
    
    const totalMinutes = introductionMinutes + 
        topics.reduce((sum, t) => sum + t.estimatedMinutes, 0) + 
        wrapupMinutes
    
    return {
        topics,
        totalMinutes,
        introductionMinutes,
        wrapupMinutes
    }
}

