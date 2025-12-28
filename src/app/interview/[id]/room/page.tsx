import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import styles from './page.module.css'
import InterviewRoom from '@/components/InterviewRoom'

/**
 * Get interviewer persona based on pack level
 */
function getInterviewerPersona(packLevel: string): { introLine: string } {
    const levelLower = packLevel.toLowerCase()
    
    if (levelLower.includes('entry') || levelLower.includes('junior')) {
        return {
            introLine: "I'm a Senior Engineer here,"
        }
    } else if (levelLower.includes('architect')) {
        return {
            introLine: "I'm a Lead Architect here,"
        }
    } else {
        // Senior level - default
        return {
            introLine: "I'm a Cloud Architect here,"
        }
    }
}

export default async function InterviewRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await getSession()

    if (!user) {
        redirect('/login')
    }

    // Fetch session to get pack level
    const session = await prisma.interviewSession.findUnique({
        where: { id },
        include: {
            pack: true
        }
    })

    if (!session || session.userId !== user.id) {
        redirect('/dashboard')
    }

    // Generate dynamic first message based on pack level
    const persona = getInterviewerPersona(session.pack.level)
    const initialMessage = `Hi, I'm Alex. ${persona.introLine} and I'll be conducting your technical interview today. We'll cover various topics over the next hour, and I'm looking forward to learning about your experience. To get started, could you give me a brief overview of your background? I'd like to hear about your years of experience, your current role, and the key technologies and tools you've worked with.`

    return (
        <main className={styles.container}>
            <InterviewRoom 
                sessionId={id} 
                initialMessage={initialMessage}
                isPractice={session.isPractice}
            />
        </main>
    )
}
