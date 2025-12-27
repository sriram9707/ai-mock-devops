
export async function mockSTT(audioBlob: Blob | Buffer): Promise<string> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return "I am ready to solve this problem. I would start by checking the logs.";
}

export async function mockLLM(
    history: { role: string; content: string }[],
    systemContext: string
): Promise<string> {
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const responses = [
        "That's a good start. How would you check the logs in a distributed system?",
        "Interesting. What tools would you use for that?",
        "Can you explain the trade-offs of that approach?",
        "Let's move on to the next section. How do you handle database migrations?",
        "What would you do if the system was totally unresponsive?"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}

export async function mockTTS(text: string): Promise<string> {
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Return a base64 string or URL. For simplicity in MVP, maybe just return null 
    // and let frontend handle "text-only" mode or use browser TTS if needed.
    // Here we'll return a data URI for a silent MP3 or similar if we really wanted, 
    // but for now let's just return a placeholder string to signal "audio generated"
    return "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==";
}
