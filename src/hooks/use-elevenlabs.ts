/**
 * ElevenLabs Voice Agent Hook
 * Integrates with ElevenLabs Conversational AI agent
 */

import { useCallback, useState } from 'react'
import { useConversation } from '@11labs/react'

export function useElevenLabs() {
    const [agentId, setAgentId] = useState<string | null>(null)
    const [connectionError, setConnectionError] = useState<string | null>(null)

    const conversation = useConversation({
        onConnect: () => console.log("Connected to ElevenLabs"),
        onDisconnect: () => console.log("Disconnected from ElevenLabs"),
        onMessage: (message: any) => console.log("Message:", message),
        onError: (error: string) => {
            console.error("ElevenLabs Error:", error)
            setConnectionError(error)
        }
    })

    const startInterview = useCallback(async (sessionId: string, systemPrompt: string, firstMessage: string) => {
        setConnectionError(null)

        try {
            // 1. Get Agent Config from our backend
            console.log("Fetching ElevenLabs config for session:", sessionId)
            const response = await fetch('/api/elevenlabs/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, systemPrompt })
            })

            if (!response.ok) {
                throw new Error('Failed to initialize interview session')
            }

            const config = await response.json()
            setAgentId(config.agentId)

            // 2. Request Mic Permission
            await navigator.mediaDevices.getUserMedia({ audio: true })

            // 3. Connect to ElevenLabs (Client-side WebSocket)
            console.log("Connecting to Agent:", config.agentId)
            await conversation.startSession({
                agentId: config.agentId,
                // If using a signed URL or other auth, add it here. 
                // For public agents, just ID is needed. 
                // For custom RAG, the agent must be configured in 11Labs dashboard to call our webhook.
            })

        } catch (error: any) {
            console.error("Failed to start ElevenLabs:", error)
            setConnectionError(error.message || "Failed to connect")
            throw error
        }
    }, [conversation])

    const stopInterview = useCallback(async () => {
        await conversation.endSession()
    }, [conversation])

    const toggleMute = useCallback(async (mute: boolean) => {
        // @11labs/react doesn't always expose direct mute, 
        // usually we handle this by stopping audio capture or 
        // using conversation.setVolume logic if available.
        // For now, we stub it or use internal methods if exposed.
        console.warn("Mute toggle not fully supported in simple SDK wrapper yet")
    }, [conversation])

    return {
        isConnected: conversation.status === 'connected',
        isSpeaking: conversation.isSpeaking,
        isListening: conversation.status === 'connected' && !conversation.isSpeaking, // Approximate
        isThinking: false, // SDK doesn't always expose thinking state explicitly
        transcript: [], // SDK handles audio, we'd need to parse events for text
        callEndReason: connectionError,
        startInterview,
        stopInterview,
        toggleMute
    }
}
