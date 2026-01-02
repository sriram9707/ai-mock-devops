import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { getVectorStore } from '../src/lib/vector-store'
import { Document } from '@langchain/core/documents'

const awsPillars = [
    {
        name: 'Operational Excellence',
        content: `
        AWS Operational Excellence Pillar:
        1. Perform operations as code: In the cloud, you can define your entire workload (applications, infrastructure) as code and update it with code.
        2. Make frequent, small, reversible changes: Design workloads to allow components to be updated frequently.
        3. Refine operations procedures frequently: As you use operations procedures, look for opportunities to improve them.
        4. Anticipate failure: Perform "pre-mortem" exercises to identify potential failure sources so that they can be removed or mitigated.
        5. Learn from all operational failures: Drive improvement through post-incident analysis.
        `
    },
    {
        name: 'Security',
        content: `
        AWS Security Pillar:
        1. Implement a strong identity foundation: Implement the principle of least privilege and enforce separation of duties with appropriate authorization for each interaction with your AWS resources.
        2. Enable traceability: Monitor, alert, and audit actions and changes to your environment in real time.
        3. Apply security at all layers: Apply a defense in depth approach with multiple security controls. Apply to all layers (e.g., edge of network, VPC, load balancing, every instance and compute service, operating system, application, and code).
        4. Automate security best practices: Automated software-based security mechanisms improve your ability to securely scale more rapidly and cost-effectively.
        5. Protect data in transit and at rest: Classify your data into sensitivity levels and use mechanisms, such as encryption, tokenization, and access control where appropriate.
        `
    },
    {
        name: 'Reliability',
        content: `
        AWS Reliability Pillar:
        1. Automatically recover from failure: By monitoring a workload for key performance indicators (KPIs), you can trigger automation when a threshold is breached.
        2. Test recovery procedures: In the cloud, you can test how your workload fails, and duplicate the original scenario to validate your recovery procedures.
        3. Scale horizontally to increase aggregate workload availability: Replace one large resource with multiple small resources to reduce the impact of a single failure.
        4. Stop guessing capacity: In the cloud, you can use automation to add or remove capacity resources on demand.
        5. Manage change in automation: Changes to your infrastructure should be made using automation.
        `
    }
]

async function seed() {
    console.log('🌱 Seeding AWS Well-Architected Framework to ChromaDB...')
    try {
        const store = await getVectorStore()

        const documents = awsPillars.map(pillar => new Document({
            pageContent: pillar.content,
            metadata: { 
                category: 'Design Principles', 
                type: 'pillar', 
                title: pillar.name,
                source: 'AWS Well-Architected Framework',
                url: 'https://aws.amazon.com/architecture/well-architected/'
            }
        }))

        await store.addDocuments(documents)
        console.log('✅ Successfully seeded', documents.length, 'documents to ChromaDB!')
    } catch (error) {
        console.error('❌ Failed to seed:', error)
        console.log('💡 Ensure ChromaDB is running:')
        console.log('   - Local: docker run -p 8000:8000 chromadb/chroma')
        console.log('   - Or set CHROMA_URL for remote instance')
    }
}

seed()
