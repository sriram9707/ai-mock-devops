
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const packs = [
        {
            title: 'DevOps Engineer - Entry Level',
            role: 'DevOps Engineer',
            level: 'Entry',
            durationMinutes: 45,
            price: 0,
            description: 'Perfect for junior candidates. Covers basic DevOps concepts, CI/CD fundamentals, and cloud basics.',
            sections: JSON.stringify([
                {
                    title: 'Warmup & Concepts',
                    duration: 5,
                    competencies: ['communication', 'basic_definitions'],
                    questions: ['Tell me about yourself', 'What does DevOps mean to you?']
                },
                {
                    title: 'Linux & Scripting',
                    duration: 10,
                    competencies: ['bash', 'python', 'linux_internals'],
                    questions: ['How do you check running processes?', 'Basic bash scripting scenario']
                },
                {
                    title: 'CI/CD Basics',
                    duration: 15,
                    competencies: ['ci_cd_pipelines', 'git_flow'],
                    questions: ['Explain a simple CI/CD pipeline', 'How do you handle merge conflicts?']
                },
                {
                    title: 'Cloud & Containers',
                    duration: 10,
                    competencies: ['docker', 'aws_basics'],
                    questions: ['What is a Docker container?', 'EC2 vs S3 basics']
                }
            ])
        },
        {
            title: 'DevOps Engineer - Senior',
            role: 'DevOps Engineer',
            level: 'Senior',
            durationMinutes: 60,
            price: 0,
            description: 'Advanced role simulation. Focuses on scalability, incident management, and complex infrastructure.',
            sections: JSON.stringify([
                {
                    title: 'Warmup & Experience',
                    duration: 5,
                    competencies: ['leadership', 'project_impact'],
                    questions: []
                },
                {
                    title: 'Incident Scenario',
                    duration: 20,
                    competencies: ['troubleshooting', 'observability', 'pressure_handling'],
                    questions: ['System is down, 502 errors, what do you do?']
                },
                {
                    title: 'CI/CD & Automation',
                    duration: 15,
                    competencies: ['advanced_pipelines', 'security', 'optimization'],
                    questions: ['Design a secure pipeline for financial data']
                },
                {
                    title: 'Kubernetes & Infrastructure',
                    duration: 15,
                    competencies: ['kubernetes_architecture', 'terraform', 'ha_design'],
                    questions: ['Architect a multi-region HA cluster']
                }
            ])
        },
        {
            title: 'SRE Engineer',
            role: 'SRE',
            level: 'Mid-Senior',
            durationMinutes: 45,
            price: 0,
            description: 'Focused drill on handling production outages, root cause analysis, and postmortems.',
            sections: JSON.stringify([
                {
                    title: 'On-Call Simulation',
                    duration: 25,
                    competencies: ['alert_triage', 'mitigation', 'communication'],
                    questions: ['PagerDuty fires at 3AM. Database CPU 100%. Go.']
                },
                {
                    title: 'Root Cause Analysis',
                    duration: 15,
                    competencies: ['rca', 'system_understanding'],
                    questions: ['How do you prevent this from happening again?']
                },
                {
                    title: 'Postmortem & Behavioral',
                    duration: 5,
                    competencies: ['learning_culture', 'collaboration'],
                    questions: ['Describe a time you failed in prod']
                }
            ])
        },
        {
            title: 'AWS Cloud Architect',
            role: 'Cloud Architect',
            level: 'Principal',
            durationMinutes: 60,
            price: 0,
            description: 'High-level system design interview. Focuses on requirements gathering, trade-offs, and cost optimization on AWS.',
            sections: JSON.stringify([
                {
                    title: 'Requirements Gathering',
                    duration: 10,
                    competencies: ['requirements_analysis', 'stakeholder_management'],
                    questions: ['Clarify the problem statement']
                },
                {
                    title: 'Architecture Design',
                    duration: 30,
                    competencies: ['system_design', 'aws_services', 'scalability'],
                    questions: ['Design a Netflix-like video streaming architecture']
                },
                {
                    title: 'Trade-offs & Cost',
                    duration: 20,
                    competencies: ['cost_optimization', 'operational_excellence'],
                    questions: ['Serverless vs Containers? Cost vs Latency?']
                }
            ])
        },
        {
            title: 'GCP Architect',
            role: 'Cloud Architect',
            level: 'Principal',
            durationMinutes: 60,
            price: 0,
            description: 'High-level system design interview. Focuses on requirements gathering, trade-offs, and cost optimization on Google Cloud.',
            sections: JSON.stringify([
                {
                    title: 'Requirements Gathering',
                    duration: 10,
                    competencies: ['requirements_analysis', 'stakeholder_management'],
                    questions: ['Clarify the problem statement']
                },
                {
                    title: 'Architecture Design',
                    duration: 30,
                    competencies: ['system_design', 'gcp_services', 'scalability'],
                    questions: ['Design a Global Spanner-based architecture']
                },
                {
                    title: 'Trade-offs & Cost',
                    duration: 20,
                    competencies: ['cost_optimization', 'operational_excellence'],
                    questions: ['Cloud Run vs GKE? Cost vs Latency?']
                }
            ])
        },
        {
            title: 'Azure Architect',
            role: 'Cloud Architect',
            level: 'Principal',
            durationMinutes: 60,
            price: 0,
            description: 'High-level system design interview. Focuses on requirements gathering, trade-offs, and cost optimization on Azure.',
            sections: JSON.stringify([
                {
                    title: 'Requirements Gathering',
                    duration: 10,
                    competencies: ['requirements_analysis', 'stakeholder_management'],
                    questions: ['Clarify the problem statement']
                },
                {
                    title: 'Architecture Design',
                    duration: 30,
                    competencies: ['system_design', 'azure_services', 'scalability'],
                    questions: ['Design a multi-region architecture using AKS and CosmosDB']
                },
                {
                    title: 'Trade-offs & Cost',
                    duration: 20,
                    competencies: ['cost_optimization', 'operational_excellence'],
                    questions: ['App Service vs AKS? Cost vs Latency?']
                }
            ])
        },
        // Company Specific Packs (The Moat)
        {
            title: 'Chaos Engineering',
            role: 'Chaos Engineer',
            level: 'Senior',
            durationMinutes: 45,
            price: 15,
            description: 'Dive deep into resilience testing. "What happens if this service fails?" is the only question that matters here.',
            sections: JSON.stringify([
                {
                    title: 'Hypothesis Definition',
                    duration: 15,
                    competencies: ['scientific_method', 'chaos_principles'],
                    questions: ['Define steady state for the recommendations service']
                },
                {
                    title: 'Blast Radius',
                    duration: 15,
                    competencies: ['safety', 'monitoring'],
                    questions: ['How do you minimize user impact during a region failover test?']
                },
                {
                    title: 'Automation',
                    duration: 15,
                    competencies: ['continuous_verification', 'tooling'],
                    questions: ['Design a system to automatically inject latency']
                }
            ])
        }
    ]

    console.log('Seeding Interview Packs...')

    // Optional: clear existing packs if needed, or just upsert
    // For MVP dev, deleting all is easiest to avoid duplicates if ID isn't fixed
    // Cleaning up all tables to ensure fresh state with new models
    try {
        await prisma.certificate.deleteMany({})
    } catch (e) { } // Table might not exist yet

    try {
        await prisma.userCredit.deleteMany({})
    } catch (e) { }

    await prisma.interviewTurn.deleteMany({})
    await prisma.interviewResult.deleteMany({})
    await prisma.interviewSession.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.interviewPack.deleteMany({})

    // Note: We are keeping Users and UserProfiles to not annoy the dev user

    for (const pack of packs) {
        await prisma.interviewPack.create({
            data: pack
        })
    }

    console.log('Seed data inserted')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
