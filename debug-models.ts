import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

async function checkAndLog() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey || "");
    let logOutput = "";

    logOutput += "Testing gemini-2.0-flash...\n";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        await model.generateContent("Test");
        logOutput += "✅ gemini-2.0-flash worked\n";
    } catch (error: any) {
        logOutput += `❌ gemini-2.0-flash failed: ${error.message}\n`;
        logOutput += `Full error: ${JSON.stringify(error, null, 2)}\n`;
    }

    logOutput += "\nTesting gemini-pro...\n";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        await model.generateContent("Test");
        logOutput += "✅ gemini-pro worked\n";
    } catch (error: any) {
        logOutput += `❌ gemini-pro failed: ${error.message}\n`;
    }

    fs.writeFileSync("error-log.txt", logOutput);
    console.log("Done. Check error-log.txt");
}

checkAndLog();
