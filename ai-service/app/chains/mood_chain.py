from langchain_core.prompts import ChatPromptTemplate

from ..llm import get_chat_model
from ..utils import extract_json_object

_MOOD_PROMPT = ChatPromptTemplate.from_template(
    """Analyze the emotional tone of the text and determine the primary mood.
Respond with JSON in this exact format:
{{"mood": "one of: happy, sad, anxious, calm, excited", "emoji": "appropriate emoji for the mood", \
"rating": "number from 1-5 representing mood intensity", "confidence": "confidence score between 0 and 1"}}

Text to analyze: {text}"""
)

_DEFAULT_MOOD = {"mood": "calm", "emoji": "😌", "rating": 3, "confidence": 0.5}


async def analyze_mood_from_text(text: str) -> dict:
    try:
        chain = _MOOD_PROMPT | get_chat_model(temperature=0.2)
        result = await chain.ainvoke({"text": text})
        parsed = extract_json_object(result.text)
        return {
            "mood": parsed.get("mood", "calm"),
            "emoji": parsed.get("emoji", "😌"),
            "rating": max(1, min(5, round(float(parsed.get("rating", 3))))),
            "confidence": max(0.0, min(1.0, float(parsed.get("confidence", 0.5)))),
        }
    except Exception as error:  # noqa: BLE001
        print(f"Mood analysis error: {error}")
        return dict(_DEFAULT_MOOD)


_INSIGHTS_FALLBACK = [
    "Keep tracking your mood to understand patterns better",
    "Multiple daily entries show excellent self-awareness",
    "Consider what activities help improve your mood",
]

_EMPTY_ENTRIES_INSIGHTS = [
    "Start tracking your mood daily to identify patterns and triggers",
    "Regular mood monitoring helps build emotional awareness",
    "Consider setting a daily reminder to check in with yourself",
]


async def generate_mood_insights(mood_entries: list[dict]) -> list[str]:
    if not mood_entries:
        return list(_EMPTY_ENTRIES_INSIGHTS)

    try:
        mood_data = [
            {
                "mood": e.get("mood"),
                "rating": e.get("rating"),
                "timestamp": e.get("timestamp"),
            }
            for e in mood_entries
        ]

        prompt = ChatPromptTemplate.from_template(
            """Analyze this comprehensive mood tracking data and provide 3-4 supportive insights \
about patterns, trends, and recommendations.

Total mood entries: {count}

Complete mood data chronologically:
{data}

Focus on:
- Mood fluctuation patterns
- Overall trends and improvement opportunities
- Recognition of self-awareness from consistent tracking
- Actionable, specific recommendations
- Positive reinforcement for consistent tracking

Respond with JSON in this format: {{"insights": ["insight1", "insight2", "insight3", "insight4"]}}
Keep insights supportive, specific to the data, and encouraging."""
        )

        import json as _json

        chain = prompt | get_chat_model(temperature=0.5)
        result = await chain.ainvoke({"count": len(mood_entries), "data": _json.dumps(mood_data, default=str)})
        parsed = extract_json_object(result.text)
        return parsed.get("insights") or list(_INSIGHTS_FALLBACK)
    except Exception as error:  # noqa: BLE001
        print(f"Insights generation error: {error}")
        return list(_INSIGHTS_FALLBACK)
