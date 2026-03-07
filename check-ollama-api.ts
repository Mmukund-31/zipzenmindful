
import fetch from 'node-fetch'; // Just in case, or use global if available.
// Actually, with type: module, global fetch might be there, but let's be safe if we can.
// But wait, node-fetch is not in package.json.
// Node 18 has global fetch.

const OLLAMA_URL = "http://localhost:11434/api/tags";

async function checkOllama() {
    console.log("Checking Ollama at", OLLAMA_URL);
    try {
        const res = await fetch(OLLAMA_URL);
        if (!res.ok) {
            console.error("Ollama API Error:", res.status, res.statusText);
            const text = await res.text();
            console.error("Body:", text);
            return;
        }
        const data = await res.json();
        console.log("Ollama tags:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Ollama check failed:", e);
    }
}

checkOllama();
