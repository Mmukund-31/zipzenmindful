import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function checkPro() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey || "");

    console.log("Testing gemini-pro...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("✅ gemini-pro response:", result.response.text());
    } catch (error: any) {
        console.error("❌ gemini-pro failed:", error.message);
    }

    console.log("Testing gemini-1.5-pro...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent("Hello");
        console.log("✅ gemini-1.5-pro response:", result.response.text());
    } catch (error: any) {
        console.error("❌ gemini-1.5-pro failed:", error.message);
    }
}

checkPro();
