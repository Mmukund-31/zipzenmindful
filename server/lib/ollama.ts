const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const MODEL = process.env.OLLAMA_MODEL || "tinyllama"; // Using tiny model for memory-constrained systems

/* -------------------------------------------------
   Core helper to call Ollama safely
------------------------------------------------- */
async function callOllama(prompt: string, stop: string[] = []): Promise<string> {
    try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        // Default stop sequences to prevent role hallucination
        const stopSequences = [...stop, "User:", "Assistant:", "System:"];

        const res = await fetch(OLLAMA_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: MODEL,
                prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    stop: stopSequences // CRITICAL: Force stop generation at these tokens
                },
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const text = await res.text();
            console.error(`Ollama API Error (${res.status}):`, text);
            return `System Error (${res.status}): ${text}. (Model: ${MODEL})`;
        }

        const data = await res.json();
        console.log("DEBUG: Ollama Prompt:", JSON.stringify(prompt));
        console.log("DEBUG: Ollama Response:", JSON.stringify(data.response));

        return data.response?.trim() || "I'm here with you. Tell me more.";

    } catch (error: any) {
        console.error("Ollama connection error:", error.message);

        // Provide user-friendly fallback messages
        if (error.name === 'AbortError') {
            return "I'm taking a bit longer to respond than usual. Please try again in a moment.";
        } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
            return "I'm having trouble connecting right now. Please make sure Ollama is running (ollama serve) and try again.";
        }

        return "I'm here with you, though I'm having a brief technical moment. How can I support you?";
    }
}


/* -------------------------------------------------
   MAIN CHAT / TALK RESPONSE
------------------------------------------------- */
export async function generateAIResponse(message: string, mood?: string, language?: string) {
    // Optimized prompt using TinyLlama's native ChatML template
    // Format: <|system|>system message</s><|user|>user message</s><|assistant|>

    // GENERAL WELLNESS PROMPT
    let prompt = "<|system|>\nYou are a supportive wellness assistant. Your goal is to provide comfort, advice, and a listening ear.\n\nGuidelines:\n- Be kind and empathetic.\n- Keep responses concise (1-3 sentences).\n- If asked for a joke, tell one immediately.\n- If the user is sad, validate their feelings.";

    // Add mood context if available
    if (mood) {
        prompt += `\nContext: The user is currently feeling ${mood}.`;
    }

    // Add language instruction if specified
    if (language && language !== 'en') {
        prompt += `\nInstruction: Respond in ${language}.`;
    }

    prompt += "</s>\n";
    prompt += `<|user|>\n${message}</s>\n`;
    prompt += "<|assistant|>\n";

    // Pass explicit stop sequences for ChatML
    return callOllama(prompt, ["</s>", "<|user|>", "<|system|>"]);
}


/* -------------------------------------------------
   MOOD & WELLNESS FEATURES
------------------------------------------------- */
export async function analyzeMoodFromText(text: string) {
    const prompt = `
Task: Analyze the emotional tone of the text.
Output: Return strictly ONE word (e.g., happy, anxious, calm, sad).
Text: "${text}"
Mood:`;
    return callOllama(prompt);
}

export async function generateMoodInsights(mood: string) {
    const prompt = `
Task: The user is feeling "${mood}". Provide a short, supportive insight.
Constraint: Respond with ONE sentence only. Be gentle.
Insight:`;
    return callOllama(prompt);
}

export async function generateDailyWellnessTip() {
    const prompt = `
Task: Provide one simple, actionable mental wellness tip for today.
Constraint: Keep it short (max 2 sentences). Be encouraging.
Tip:`;
    return callOllama(prompt);
}

/* -------------------------------------------------
   CHALLENGES & PERSONALIZATION
------------------------------------------------- */
export async function generatePersonalizedChallenges(context?: string) {
    const prompt = `
Task: Suggest 3 small, achievable mental wellness challenges.
Constraint: Return ONLY a numbered list. No intro or outro text.
Challenges:`;
    return callOllama(prompt);
}

export async function generatePersonalizedInsights(context?: string) {
    const prompt = `
Task: Provide a short personalized mental wellness insight.
Constraint: Respond with ONE sentence only.
Insight:`;
    return callOllama(prompt);
}

export async function generatePersonalizedThoughtInterruption(thought?: string) {
    const prompt = `
Task: The user is having a negative thought. Provide a gentle thought-interruption technique.
Constraint: Respond with ONE sentence only.
Technique:`;
    return callOllama(prompt);
}

export async function generateThoughtInterruptionTechniques() {
    const prompt = `
Task: List 3 simple thought interruption techniques to reduce overthinking.
Constraint: Return ONLY a numbered list. No intro or outro text.
Techniques:`;
    return callOllama(prompt);
}

/* -------------------------------------------------
   IMAGE / MEME / GALLERY (SAFE OFFLINE STUBS)
   These keep the app stable without vision models
------------------------------------------------- */
export async function analyzeImageForMemory() {
    return "This feature is not available in offline mode yet 🙂";
}

export async function generateMemoryGalleryTitle() {
    return "A meaningful moment 💫";
}

export async function generateMemeText() {
    return "When your mind finally decides to be kind to itself 🌈";
}

export async function analyzeImageAndGenerateMeme() {
    return "Offline mode: meme generation is currently unavailable 🙂";
}
