import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

// Mock fetch to intercept the request if needed, but the SDK has a method.
// Actually, the SDK doesn't expose listModels on the main class in all versions.
// But let's try to use the `makeRequest` or just use `fetch` directly to the API endpoint.

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        fs.writeFileSync("models-list.json", JSON.stringify(data, null, 2));
        console.log("Models listed to models-list.json");
    } catch (error) {
        console.error("Failed to list models:", error);
    }
}

listModels();
