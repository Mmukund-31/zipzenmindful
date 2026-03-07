
import "dotenv/config";

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "tinyllama";

async function testPrompt(name: string, prompt: string, stops: string[]) {
    console.log(`\n--- Testing ${name} ---`);
    console.log("Prompt:", JSON.stringify(prompt));

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

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
                    stop: stops
                },
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        console.log("RESPONSE:", data.response);
    } catch (e: any) {
        console.error("ERROR:", e.message);
    }
}

async function run() {
    // Case 1: Current Zero-shot
    const zeroShot =
        `<|system|>
You are a calm, supportive wellness companion. Keep responses short and helpful.</s>
<|user|>
tell me a joke</s>
<|assistant|>
`;

    // Case 2: One-shot (Teaching it how to respond)
    const oneShot =
        `<|system|>
You are a calm, supportive wellness companion. Keep responses short and helpful.

Example:
User: I feel sad.
Assistant: I'm sorry to hear that. I'm here for you. Would you like to talk about it?</s>
<|user|>
tell me a joke</s>
<|assistant|>
`;

    // Case 3: Direct Instruction (Stronger system prompt)
    const directShot =
        `<|system|>
Role: Wellness Assistant.
Rules:
1. Be kind and short.
2. If asked for a joke, tell a simple one immediately.
3. Do not ramble.</s>
<|user|>
tell me a joke</s>
<|assistant|>
`;

    const stops = ["</s>", "<|user|>", "<|system|>"];

    await testPrompt("Zero-Shot (Current)", zeroShot, stops);
    await testPrompt("One-Shot (Example)", oneShot, stops);
    await testPrompt("Direct Instruction", directShot, stops);
}

run();
