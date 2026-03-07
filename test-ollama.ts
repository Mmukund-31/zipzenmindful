
import { generateAIResponse } from "./server/lib/ollama";

async function testOllama() {
    console.log("Testing Ollama connection...");
    try {
        const response = await generateAIResponse("Hello, how are you today?", "calm");
        console.log("Response received:");
        console.log(response);
        console.log("SUCCESS: Ollama is working!");
    } catch (error) {
        console.error("FAILURE: Could not connect to Ollama.", error);
    }
}

testOllama();
