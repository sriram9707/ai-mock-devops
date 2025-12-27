
import { useEffect, useState, useCallback, useRef } from 'react'
import Vapi from '@vapi-ai/web'

// Types for Vapi events (simplified)
interface VapiEvent {
    type: string
    [key: string]: any
}

export function useVapi() {
    const [isThinking, setIsThinking] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [transcript, setTranscript] = useState<{ role: 'user' | 'ai', text: string }[]>([])
    const [callEndReason, setCallEndReason] = useState<string | null>(null)

    // We use a ref to keep the Vapi instance singleton
    const vapiRef = useRef<any>(null)

    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || 'demo-public-key'
        
        // Warn if using demo key
        if (key === 'demo-public-key') {
            console.warn("⚠️ Using demo Vapi key. Set NEXT_PUBLIC_VAPI_PUBLIC_KEY in your environment variables.")
        } else {
            console.log("Initializing Vapi with key:", key.substring(0, 8) + "...")
        }

        try {
            // Initialize Vapi with Public Key (User will need to provide this via env)
            const vapiIndex = new Vapi(key)
            vapiRef.current = vapiIndex

            // Event Listeners
            vapiIndex.on('call-start', () => {
                console.log('✅ Vapi Call Started')
                setIsConnected(true)
            })

            // Use type assertion for call-end since it may accept data parameter
            const vapiAny = vapiIndex as any
            vapiAny.on('call-end', (data: any) => {
                const reason = data?.reason || data?.message?.errorMsg || data?.message || 
                    (data?.error?.message?.errorMsg) || 'Call ended'
                console.log('🔴 Vapi Call Ended:', reason)
                console.log('Call end data:', JSON.stringify(data, null, 2))
                setCallEndReason(reason)
                setIsConnected(false)
                setIsListening(false)
                setIsSpeaking(false)
                setIsThinking(false)
            })

            vapiIndex.on('speech-start', () => {
                setIsSpeaking(true)
            })

            vapiIndex.on('speech-end', () => {
                setIsSpeaking(false)
            })

            vapiIndex.on('message', (message: any) => {
                // Handle transcripts
                if (message.type === 'transcript' && message.transcriptType === 'final') {
                    setTranscript(prev => [...prev, {
                        role: message.role === 'assistant' ? 'ai' : 'user',
                        text: message.transcript
                    }])
                }

                // Handle function calls or status updates
                if (message.type === 'function-call') {
                    setIsThinking(true)
                }
            })

            // Listen to additional events for debugging (using type assertion)
            try {
                vapiAny.on('status-update', (data: any) => {
                    console.log('📡 Vapi Event [status-update]:', data)
                })
            } catch (e) {
                // Event might not be available
            }
            
            try {
                vapiAny.on('hang', (data: any) => {
                    console.log('📡 Vapi Event [hang]:', data)
                })
            } catch (e) {
                // Event might not be available
            }

            vapiIndex.on('error', (e: any) => {
                // Extract nested error messages (Daily.co errors are nested)
                let errorMessage = 'Unknown error'
                
                if (e?.error?.message?.errorMsg) {
                    // Daily.co error structure: error.error.message.errorMsg
                    errorMessage = e.error.message.errorMsg
                } else if (e?.error?.message?.message?.errorMsg) {
                    // Even more nested
                    errorMessage = e.error.message.message.errorMsg
                } else if (e?.message?.errorMsg) {
                    errorMessage = e.message.errorMsg
                } else if (e?.message?.message?.errorMsg) {
                    errorMessage = e.message.message.errorMsg
                } else if (e?.error?.message) {
                    errorMessage = typeof e.error.message === 'string' ? e.error.message : JSON.stringify(e.error.message)
                } else if (e?.message) {
                    errorMessage = typeof e.message === 'string' ? e.message : JSON.stringify(e.message)
                } else if (e?.error) {
                    errorMessage = typeof e.error === 'string' ? e.error : JSON.stringify(e.error)
                } else if (typeof e === 'string') {
                    errorMessage = e
                } else {
                    errorMessage = JSON.stringify(e)
                }
                
                const errorDetails = {
                    message: errorMessage,
                    error: e,
                    errorType: typeof e,
                    errorKeys: e ? Object.keys(e) : [],
                    errorString: String(e),
                    timestamp: new Date().toISOString(),
                    vapiKeyPresent: !!key && key !== 'demo-public-key',
                    isConnected: vapiRef.current?.isConnected || false,
                    fullError: e // Include full error for debugging
                }
                
                console.error("❌ Vapi SDK Internal Error:", errorDetails)
                
                // Check if it's a call ejection/ending error
                const errorStr = String(errorMessage).toLowerCase()
                if (errorStr.includes('ejection') || errorStr.includes('meeting has ended') || 
                    errorStr.includes('call ended') || errorStr.includes('hang') ||
                    errorStr.includes('daily-error')) {
                    setCallEndReason(errorMessage)
                    console.warn("⚠️ Call was ended unexpectedly:", errorMessage)
                    console.warn("Full error structure:", JSON.stringify(e, null, 2))
                }
                
                setIsConnected(false)
                setIsListening(false)
                setIsSpeaking(false)
                setIsThinking(false)
            })

            return () => {
                try {
                    vapiIndex.stop()
                } catch (cleanupError) {
                    console.warn("Error during Vapi cleanup:", cleanupError)
                }
            }
        } catch (initError: any) {
            console.error("❌ Failed to initialize Vapi SDK:", initError)
            console.error("Error details:", {
                message: initError?.message,
                stack: initError?.stack,
                keyPresent: !!key && key !== 'demo-public-key'
            })
            setIsConnected(false)
        }
    }, [])

    const startInterview = useCallback(async (sessionId: string, systemPrompt: string, firstMessage: string) => {
        if (!vapiRef.current) {
            console.error("❌ Vapi instance not initialized. Cannot start interview.")
            return
        }

        // Clear any previous call end reason
        setCallEndReason(null)
        setIsConnected(true) // Optimistic UI

        try {
            console.log("📞 Requesting Server to create Vapi Assistant...")
            console.log("Session ID:", sessionId)

            // 1. Ask our server to create the assistant (using Private Key)
            const response = await fetch('/api/vapi/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    systemPrompt,
                    firstMessage
                })
            })

            if (!response.ok) {
                let errorMessage = "Failed to create assistant"
                try {
                    const err = await response.json()
                    errorMessage = err.error || err.message || errorMessage
                    console.error("❌ Server failed to create assistant:", err)
                } catch (parseError) {
                    const errorText = await response.text()
                    console.error("❌ Server error (non-JSON):", errorText)
                    errorMessage = errorText || errorMessage
                }
                throw new Error(errorMessage)
            }

            const assistant = await response.json()
            console.log("✅ Assistant Created:", assistant.id)

            if (!assistant.id) {
                throw new Error("Assistant created but no ID returned")
            }

            // 2. Start the call using the validated Assistant ID
            // This bypasses the "Transient Assistant" restriction on Public Keys
            console.log("🎙️ Starting Vapi call with assistant:", assistant.id)
            console.log("Vapi instance state:", {
                hasInstance: !!vapiRef.current,
                instanceType: typeof vapiRef.current
            })
            
            try {
                // Add a timeout to detect if the call doesn't start
                const startPromise = vapiRef.current.start(assistant.id)
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Call start timeout after 10 seconds')), 10000)
                )
                
                await Promise.race([startPromise, timeoutPromise])
                console.log("✅ Vapi call started successfully")
            } catch (startError: any) {
                console.error("❌ Failed to start Vapi call:", {
                    error: startError,
                    message: startError?.message,
                    stack: startError?.stack,
                    assistantId: assistant.id,
                    errorType: typeof startError,
                    errorString: String(startError)
                })
                setIsConnected(false)
                
                // Check if it's an ejection error
                const errorMsg = String(startError?.message || startError || '').toLowerCase()
                if (errorMsg.includes('ejection') || errorMsg.includes('meeting has ended')) {
                    setCallEndReason(startError?.message || 'Call was ejected')
                }
                
                throw startError
            }

        } catch (e: any) {
            console.error("❌ Failed to start interview:", {
                error: e,
                message: e?.message,
                stack: e?.stack,
                sessionId
            })
            setIsConnected(false)
            
            // Re-throw to allow UI to handle the error
            throw e
        }
    }, [])

    const stopInterview = useCallback(() => {
        try {
            vapiRef.current?.stop()
        } catch (error) {
            console.warn("Error stopping interview:", error)
        }
        setIsConnected(false)
        setIsListening(false)
        setIsSpeaking(false)
        setIsThinking(false)
        setCallEndReason(null)
    }, [])

    const toggleMute = useCallback((mute: boolean) => {
        vapiRef.current?.setMuted(mute)
        setIsListening(!mute)
    }, [])

    return {
        isConnected,
        isThinking,
        isSpeaking,
        isListening,
        transcript,
        callEndReason,
        startInterview,
        stopInterview,
        toggleMute
    }
}
