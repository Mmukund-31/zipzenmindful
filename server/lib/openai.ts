import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateAIResponse(userMessage: string, currentMood?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const systemPrompt = `You are MindEase Assistant, a compassionate AI companion focused on mental wellness and emotional support. 
    ${currentMood ? `The user's current mood is: ${currentMood}. Tailor your response to be supportive and appropriate for their emotional state.` : ''}
    
    Guidelines:
    - Be empathetic, warm, and supportive
    - Provide practical wellness advice when appropriate
    - Ask thoughtful follow-up questions to encourage reflection
    - Suggest healthy coping strategies
    - Keep responses conversational and not overly clinical
    - If the user seems distressed, gently suggest professional help
    - Encourage positive activities like connecting with loved ones or viewing happy memories`;

    const prompt = `${systemPrompt}\n\nUser message: ${userMessage}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text() || "I'm here to support you. Could you tell me more about how you're feeling?";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "I'm having trouble connecting right now, but I'm here for you. How can I help support your wellness today?";
  }
}

export async function analyzeMoodFromText(text: string): Promise<{
  mood: string;
  emoji: string;
  rating: number;
  confidence: number;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Analyze the emotional tone of the text and determine the primary mood. 
    Respond with JSON in this exact format: 
    { 
      "mood": "one of: happy, sad, anxious, calm, excited", 
      "emoji": "appropriate emoji for the mood",
      "rating": "number from 1-5 representing mood intensity",
      "confidence": "confidence score between 0 and 1"
    }
    
    Text to analyze: ${text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text();
    
    // Parse JSON from response
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      mood: parsed.mood || "calm",
      emoji: parsed.emoji || "😌",
      rating: Math.max(1, Math.min(5, Math.round(parsed.rating || 3))),
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
    };
  } catch (error) {
    console.error("Mood analysis error:", error);
    return {
      mood: "calm",
      emoji: "😌",
      rating: 3,
      confidence: 0.5,
    };
  }
}

export async function generateMoodInsights(moodEntries: any[]): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const moodData = moodEntries.map(entry => ({
      mood: entry.mood,
      rating: entry.rating,
      date: entry.timestamp
    }));

    const prompt = `Analyze the mood data and provide 2-3 supportive insights about patterns and recommendations. 
    Respond with JSON in this format: { "insights": ["insight1", "insight2", "insight3"] }
    Keep insights positive, actionable, and encouraging.
    
    Mood data: ${JSON.stringify(moodData)}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text();
    
    // Parse JSON from response
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.insights || [
      "Keep tracking your mood to understand patterns better",
      "Remember that it's normal for moods to fluctuate",
      "Consider what activities help improve your mood"
    ];
  } catch (error) {
    console.error("Insights generation error:", error);
    return [
      "Keep tracking your mood to understand patterns better",
      "Remember that it's normal for moods to fluctuate",
      "Consider what activities help improve your mood"
    ];
  }
}

export async function generateMemeText(memoryTitle: string, memoryCategory: string, style: string): Promise<{
  topText: string;
  bottomText: string;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are a funny meme text generator for a wellness app. Create hilarious, positive, and uplifting meme text based on the memory details.
    
    Guidelines:
    - Keep it funny but wholesome and supportive
    - Use popular meme formats and internet humor
    - Make it relate to mental wellness, happiness, or memories
    - Keep text short and punchy (max 6 words per line)
    - Use ALL CAPS for classic meme style
    
    Respond with JSON in this format: { "topText": "TOP LINE", "bottomText": "BOTTOM LINE" }
    
    Memory: "${memoryTitle}" in category "${memoryCategory}". Style: ${style}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text();
    
    // Parse JSON from response
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      topText: parsed.topText || "WHEN YOU SEE",
      bottomText: parsed.bottomText || "THIS HAPPY MEMORY"
    };
  } catch (error) {
    console.error("Meme text generation error:", error);
    // Return fallback based on category
    const fallbacks = {
      family: { topText: "FAMILY TIME HITS", bottomText: "DIFFERENT WHEN HAPPY" },
      friends: { topText: "SQUAD MAKING MEMORIES", bottomText: "INSTANT SEROTONIN BOOST" },
      pets: { topText: "LOOKING AT PET PHOTOS", bottomText: "DEPRESSION WHO?" },
      other: { topText: "GOOD MEMORIES BE LIKE", bottomText: "FREE THERAPY SESSION" }
    };
    return fallbacks[memoryCategory as keyof typeof fallbacks] || fallbacks.other;
  }
}

export async function generateDailyWellnessTip(): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    const prompt = `Generate a personalized daily wellness tip for someone managing stress and overthinking. 
    
    Make it practical, actionable, and supportive. Focus on techniques like mindfulness, breathing, grounding, self-compassion, or gentle movement. 
    Keep it to 1-2 sentences and make it feel personal and encouraging. Today is day ${dayOfYear} of the year.
    
    Return just the tip text, no extra formatting or quotation marks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text().trim() || "Take a moment today to practice deep breathing. Even three mindful breaths can help center your thoughts and reduce stress.";
  } catch (error) {
    console.error("Daily tip generation error:", error);
    throw error;
  }
}