import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing!");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // There isn't a direct "listModels" on the instance in some versions, 
        // but we can try a simple generation with a known model or just try to catch the error which might list models.
        // Actually, the error message in the user's log "the list of available models..." suggests the API returns them on error.
        // Let's try to use a dummy model to force that error message again, or just try 'gemini-pro' which is standard.

        console.log("Attempting to use 'gemini-2.0-flash'...");
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        await modelFlash.generateContent("Test");
        console.log("✅ 'gemini-2.0-flash' is working.");

    } catch (error: any) {
        console.error("❌ 'gemini-2.0-flash' failed.");
        console.error("Error details:", error.message);

        console.log("\nAttempting to use 'gemini-pro'...");
        try {
            const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
            await modelPro.generateContent("Test");
            console.log("✅ 'gemini-pro' is working.");
        } catch (e: any) {
            console.error("❌ 'gemini-pro' failed.", e.message);
        }
    }
}

listModels();
