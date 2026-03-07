import "dotenv/config";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const MODEL = process.env.OLLAMA_MODEL || "llama3.2:1b";

async function testOllamaIntegration() {
    console.log("=== Testing Ollama Integration ===");
    console.log("URL:", OLLAMA_URL);
    console.log("Model:", MODEL);
    console.log("");

    try {
        console.log("Sending test message to Ollama...");
        const response = await fetch(OLLAMA_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: MODEL,
                prompt: "<|system|>\nYou are a supportive wellness assistant. Your goal is to provide comfort, advice, and a listening ear.\n\nGuidelines:\n- Be kind and empathetic.\n- Keep responses concise (1-3 sentences).\n- If asked for a joke, tell one immediately.\n- If the user is sad, validate their feelings.</s>\n<|user|>\nI am feeling a bit low today</s>\n<|assistant|>\n",
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                },
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("❌ Ollama API Error:", response.status, response.statusText);
            console.error("Response:", text);
            return;
        }

        const data = await response.json();
        console.log("✅ SUCCESS! Ollama is working!");
        console.log("");
        console.log("Response from AI:");
        console.log(data.response);
        console.log("");
        console.log("Stats:");
        console.log("- Total duration:", data.total_duration ? `${(data.total_duration / 1e9).toFixed(2)}s` : "N/A");
        console.log("- Load duration:", data.load_duration ? `${(data.load_duration / 1e9).toFixed(2)}s` : "N/A");

    } catch (error: any) {
        console.error("❌ FAILURE: Could not connect to Ollama");
        console.error("Error:", error.message);
        console.log("");
        console.log("Troubleshooting:");
        console.log("1. Make sure Ollama is running: ollama serve");
        console.log("2. Check if model is available: ollama list");
        console.log("3. Pull the model if needed: ollama pull " + MODEL);
    }
}

testOllamaIntegration();
