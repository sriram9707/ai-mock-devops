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
    /**
     * Generate dynamic incident prompt based on candidate context
     * @param candidateTech - Technologies mentioned by candidate (e.g., ['AWS', 'EKS', 'Jenkins'])
     * @param jdTech - Technologies from JD (if provided)
     * @param level - Experience level ('entry' | 'mid' | 'senior' | 'architect')
     * @returns Dynamic incident scenario prompt
     */
    generateIncidentPrompt: (candidateTech: string[], jdTech: string[], level: string) => string
}

export const INTERVIEW_TOPICS: InterviewTopic[] = [
    {
        id: 'kubernetes',
        name: 'Kubernetes',
        description: 'Container orchestration, pod management, networking, storage',
        entryLevelFocus: [
            'Troubleshooting stuck pods',
            'Debugging pod failures',
            'docker networking',
            'Resource limit issues',
            'Volume mount issues',
            'taints and toleration',
            'Basic kubectl debugging'
        ],
        seniorLevelFocus: [
            'Pod stuck in Pending during production incident',
            'Cluster hardening principles',
            'Pod disruption budget',
            'HPA vs VPA',
            'Node failures and pod eviction',
            'Maintain minimum availability of pod during node failure',
            'Network connectivity issues between pods',
            'https traffic and ssl offloading for application',
            'handle cluster with 100 worker nodes',
            'handle api server failure and debugging',
            'StatefulSet data corruption scenarios',
            'Security incidents (unauthorized pod access)',
            'Cluster-wide performance degradation'
        ],
        architectLevelFocus: [
            'Multi-cluster failure scenarios',
            'Kubernetes at scale during traffic spikes',
            'Cost optimization under incident pressure',
            'Security at depth approach',
            'Disaster recovery across regions',
            'Migration incidents during platform switch'
        ],
        estimatedMinutes: 10,
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            const k8sPlatform = candidateTech.find(t => ['eks', 'gke', 'aks', 'openshift'].some(p => t.toLowerCase().includes(p))) ||
                jdTech.find(t => ['eks', 'gke', 'aks', 'openshift'].some(p => t.toLowerCase().includes(p))) ||
                'Kubernetes'
            const platformName = k8sPlatform.toUpperCase()

            if (level === 'entry') {
                return `You're working with a ${platformName} cluster and notice some pods are stuck in Pending state. Users are starting to report errors. Walk me through how you would debug this issue step by step.`
            }
            return `Your ${platformName} cluster's pods are stuck in Pending state during peak traffic, and users are reporting errors. Multiple services are affected. Walk me through your debugging and resolution process.`
        }
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
        estimatedMinutes: 8,
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            const cicdTool = candidateTech.find(t => ['jenkins', 'gitlab', 'github actions', 'circleci', 'argo', 'flux'].some(p => t.toLowerCase().includes(p))) ||
                jdTech.find(t => ['jenkins', 'gitlab', 'github actions', 'circleci', 'argo', 'flux'].some(p => t.toLowerCase().includes(p))) ||
                'CI/CD pipeline'

            if (level === 'entry') {
                return `Your ${cicdTool} deployment failed halfway through. The rollback isn't working. How would you troubleshoot and resolve this?`
            }
            return `A production deployment failed halfway through rollout using ${cicdTool}, and the rollback mechanism is also failing. Users are experiencing errors across multiple services. How do you handle this incident?`
        }
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
        estimatedMinutes: 6,
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            const strategy = candidateTech.find(t => ['blue-green', 'canary', 'rolling'].some(s => t.toLowerCase().includes(s))) ||
                jdTech.find(t => ['blue-green', 'canary', 'rolling'].some(s => t.toLowerCase().includes(s))) ||
                'deployment'

            if (level === 'entry') {
                return `A ${strategy} deployment is causing errors in production, and the rollback isn't working. Walk me through how you would resolve this.`
            }
            return `Your ${strategy} deployment strategy is causing errors in production during peak traffic. The rollback mechanism has failed, and multiple services are affected. How do you resolve this incident?`
        }
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
        estimatedMinutes: 6,
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            const hasHelm = candidateTech.some(t => t.toLowerCase().includes('helm')) ||
                jdTech.some(t => t.toLowerCase().includes('helm'))

            if (!hasHelm) {
                return `A package manager upgrade failed and broke multiple services. The previous version won't install. How do you resolve this incident?`
            }

            if (level === 'entry') {
                return `A Helm chart upgrade failed and broke multiple services. The previous version won't install. Walk me through your troubleshooting steps.`
            }
            return `A Helm chart upgrade failed in production and broke multiple services. The previous version won't install, and you're seeing inconsistent state across environments. How do you resolve this incident?`
        }
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
        estimatedMinutes: 8,
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            const iacTool = candidateTech.find(t => ['terraform', 'cloudformation', 'pulumi', 'cdk'].some(p => t.toLowerCase().includes(p))) ||
                jdTech.find(t => ['terraform', 'cloudformation', 'pulumi', 'cdk'].some(p => t.toLowerCase().includes(p))) ||
                'Infrastructure as Code'

            if (level === 'entry') {
                return `A ${iacTool} apply failed halfway through, leaving your infrastructure in a broken state. The state file shows inconsistencies. How would you troubleshoot and fix this?`
            }
            return `A ${iacTool} apply failed halfway through in production, leaving critical infrastructure in a broken state. The state file shows inconsistencies, and services are down. How do you resolve this incident?`
        }
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
            'Well Architected Framework',
            'Cost optimization under incident pressure',
            'Multi-cloud failure scenarios',
            'Migration incident causing extended downtime',
            'Stakeholder management during critical incidents',
            'Disaster recovery failure scenarios'
        ],
        estimatedMinutes: 12, // Keeping Cloud as 12 since it's broad
        generateIncidentPrompt: (candidateTech, jdTech, level) => {
            // Comprehensive cloud services list for detection
            const awsServices = [
                // Compute
                'ec2', 'lambda', 'ecs', 'eks', 'fargate', 'batch', 'lightsail',
                // Storage
                's3', 'ebs', 'efs', 'fsx', 'glacier', 'storage gateway',
                // Database
                'rds', 'aurora', 'dynamodb', 'redshift', 'elasticache', 'documentdb', 'neptune', 'timestream',
                // Networking
                'vpc', 'alb', 'nlb', 'clb', 'cloudfront', 'route53', 'api gateway', 'direct connect', 'vpn', 'transit gateway',
                // Security
                'iam', 'cognito', 'secrets manager', 'kms', 'waf', 'shield', 'guardduty', 'security hub',
                // Monitoring & Management
                'cloudwatch', 'cloudtrail', 'config', 'systems manager', 'opsworks', 'cloudformation',
                // Application Integration
                'sns', 'sqs', 'eventbridge', 'step functions', 'appsync', 'mq',
                // Analytics
                'kinesis', 'emr', 'athena', 'quicksight', 'glue', 'data pipeline',
                // Developer Tools
                'codecommit', 'codebuild', 'codedeploy', 'codepipeline', 'x-ray',
                // Containers
                'ecr', 'ecs', 'eks'
            ]

            const gcpServices = [
                // Compute
                'compute engine', 'gce', 'gke', 'cloud run', 'cloud functions', 'app engine', 'cloud batch',
                // Storage
                'cloud storage', 'gcs', 'persistent disk', 'filestore', 'cloud storage for firebase',
                // Database
                'cloud sql', 'spanner', 'firestore', 'bigtable', 'bigquery', 'memorystore',
                // Networking
                'vpc', 'cloud load balancing', 'cloud cdn', 'cloud dns', 'cloud interconnect', 'cloud vpn', 'cloud armor',
                // Security
                'cloud iam', 'cloud identity', 'secret manager', 'cloud kms', 'cloud security command center',
                // Monitoring & Management
                'cloud monitoring', 'cloud logging', 'cloud trace', 'cloud debugger', 'cloud profiler', 'cloud deployment manager',
                // Application Integration
                'pub/sub', 'cloud tasks', 'cloud scheduler', 'cloud endpoints', 'apigee',
                // Analytics
                'dataflow', 'dataproc', 'dataprep', 'data fusion', 'bigquery', 'cloud composer',
                // Developer Tools
                'cloud build', 'cloud source repositories', 'artifact registry', 'cloud code'
            ]

            const azureServices = [
                // Compute
                'virtual machines', 'vm', 'aks', 'container instances', 'app service', 'azure functions', 'batch', 'service fabric',
                // Storage
                'blob storage', 'file storage', 'queue storage', 'table storage', 'disk storage', 'azure files', 'azure netapp files',
                // Database
                'sql database', 'cosmos db', 'database for mysql', 'database for postgresql', 'database for mariadb', 'sql data warehouse', 'azure cache for redis',
                // Networking
                'virtual network', 'vnet', 'load balancer', 'application gateway', 'front door', 'cdn', 'dns', 'expressroute', 'vpn gateway', 'traffic manager',
                // Security
                'active directory', 'key vault', 'security center', 'sentinel', 'ddos protection', 'waf', 'firewall',
                // Monitoring & Management
                'monitor', 'log analytics', 'application insights', 'azure policy', 'blueprints', 'resource manager',
                // Application Integration
                'service bus', 'event grid', 'event hubs', 'notification hubs', 'api management',
                // Analytics
                'data factory', 'databricks', 'hdinsight', 'stream analytics', 'synapse analytics',
                // Developer Tools
                'devops', 'pipelines', 'repositories', 'artifacts', 'container registry'
            ]

            // Detect cloud provider
            const cloudProvider = candidateTech.find(t => ['aws', 'azure', 'gcp', 'gce', 'google cloud'].some(p => t.toLowerCase().includes(p))) ||
                jdTech.find(t => ['aws', 'azure', 'gcp', 'gce', 'google cloud'].some(p => t.toLowerCase().includes(p))) ||
                'cloud'

            const providerName = cloudProvider.toUpperCase()

            // Detect specific services based on provider
            let services: string[] = []
            if (cloudProvider.toLowerCase().includes('aws')) {
                services = candidateTech.concat(jdTech).filter(t =>
                    awsServices.some(s => t.toLowerCase().includes(s))
                )
            } else if (cloudProvider.toLowerCase().includes('gcp') || cloudProvider.toLowerCase().includes('google')) {
                services = candidateTech.concat(jdTech).filter(t =>
                    gcpServices.some(s => t.toLowerCase().includes(s))
                )
            } else if (cloudProvider.toLowerCase().includes('azure')) {
                services = candidateTech.concat(jdTech).filter(t =>
                    azureServices.some(s => t.toLowerCase().includes(s))
                )
            } else {
                // Generic - check all
                services = candidateTech.concat(jdTech).filter(t =>
                    [...awsServices, ...gcpServices, ...azureServices].some(s => t.toLowerCase().includes(s))
                )
            }

            // Get top 2-3 services mentioned
            const topServices = [...new Set(services)].slice(0, 3)
            const serviceContext = topServices.length > 0
                ? ` (affecting ${topServices.join(', ')})`
                : ''

            if (level === 'entry') {
                return `A critical ${providerName} service${serviceContext} is experiencing an outage, and your application is failing. How would you handle this incident?`
            }
            return `A critical ${providerName} service${serviceContext} is experiencing an outage during peak traffic, and your application is failing. Multiple services are affected, and users are reporting errors. How do you handle this incident?`
        }
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

