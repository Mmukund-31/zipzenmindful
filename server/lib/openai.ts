import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generateAIResponse(userMessage: string, currentMood?: string): Promise<string> {
  try {
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm here to support you. Could you tell me more about how you're feeling?";
  } catch (error) {
    console.error("OpenAI API error:", error);
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze the emotional tone of the text and determine the primary mood. 
          Respond with JSON in this exact format: 
          { 
            "mood": "one of: happy, sad, anxious, calm, excited", 
            "emoji": "appropriate emoji for the mood",
            "rating": "number from 1-5 representing mood intensity",
            "confidence": "confidence score between 0 and 1"
          }`
        },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      mood: result.mood || "calm",
      emoji: result.emoji || "😌",
      rating: Math.max(1, Math.min(5, Math.round(result.rating || 3))),
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
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
    const moodData = moodEntries.map(entry => ({
      mood: entry.mood,
      rating: entry.rating,
      date: entry.timestamp
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze the mood data and provide 2-3 supportive insights about patterns and recommendations. 
          Respond with JSON in this format: { "insights": ["insight1", "insight2", "insight3"] }
          Keep insights positive, actionable, and encouraging.`
        },
        { 
          role: "user", 
          content: `Mood data: ${JSON.stringify(moodData)}` 
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.insights || [
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
