"""Personalized insights use the same tool-calling agent as chat (so it can
optionally pull relevant long-term memory from the vector store) but is
driven by a structured summary of the user's activity rather than a free-form
message — this is the "context-aware workflow" reasoning over app data.
"""
import json as _json

from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate

from ..agent import build_agent
from ..llm import get_chat_model
from ..utils import extract_json_array, extract_json_object

_INSIGHTS_FALLBACK = [
    "Keep exploring the wellness features to track your mental health journey.",
    "Regular mood tracking helps identify patterns and triggers.",
    "Capturing positive memories can boost your overall well-being.",
    "Gratitude practice has been shown to improve mental health.",
    "AI chat support is available whenever you need guidance.",
]


def _parse_goals(user_profile: dict) -> list[str]:
    goals = user_profile.get("wellnessGoals") or []
    if isinstance(goals, str):
        try:
            return _json.loads(goals)
        except Exception:
            return [goals] if goals else []
    return goals


async def generate_personalized_insights(
    mood_entries: list[dict],
    memories: list[dict],
    chat_messages: list[dict],
    gratitude_entries: list[dict],
    user_profile: dict,
) -> list[str]:
    try:
        mood_pattern = (
            f"{len(mood_entries)} mood entries, recent moods: "
            f"{', '.join(e.get('mood', '') for e in mood_entries[-5:])}"
            if mood_entries
            else "No mood tracking yet"
        )
        memory_pattern = (
            f"{len(memories)} memories captured, categories: "
            f"{', '.join(sorted({m.get('category', '') for m in memories}))}"
            if memories
            else "No memories captured yet"
        )
        chat_pattern = f"{len(chat_messages)} chat interactions, active engagement" if chat_messages else "No chat interactions yet"
        gratitude_pattern = (
            f"{len(gratitude_entries)} gratitude entries, practicing thankfulness"
            if gratitude_entries
            else "No gratitude practice yet"
        )
        goals = _parse_goals(user_profile)

        agent_input = f"""Analyze this user's wellness app activity and provide 5 personalized \
insights based on their goals and patterns. Use your recall_user_memory tool if it would help \
ground the insights in things this user has actually said or felt before.

User Profile:
- Wellness Goals: {', '.join(goals) or 'Not set'}
- Motivation: {user_profile.get('motivation') or 'Not provided'}
- Preferred Time: {user_profile.get('preferredTime') or 'Not provided'}
- Age: {user_profile.get('age') or 'Not provided'}

Activity Patterns:
- Mood tracking: {mood_pattern}
- Memory capture: {memory_pattern}
- Chat engagement: {chat_pattern}
- Gratitude practice: {gratitude_pattern}

Connect their activity patterns to their stated wellness goals, acknowledge progress, and provide \
specific actionable recommendations.

Respond with ONLY JSON in this exact format, nothing else: \
{{"insights": ["insight1", "insight2", "insight3", "insight4", "insight5"]}}"""

        user_id = user_profile.get("id") or "anonymous"
        agent = build_agent(user_id, temperature=0.5)
        result = await agent.ainvoke({"messages": [HumanMessage(content=agent_input)]})
        output = result["messages"][-1].text or ""
        parsed = extract_json_object(output)
        return parsed.get("insights") or list(_INSIGHTS_FALLBACK)
    except Exception as error:  # noqa: BLE001
        print(f"Error generating personalized insights: {error}")
        return list(_INSIGHTS_FALLBACK)


async def generate_personalized_challenges(user_profile: dict, completed_challenges: list[str]) -> list[dict]:
    try:
        goals = _parse_goals(user_profile)
        motivation = user_profile.get("motivation") or ""

        prompt = ChatPromptTemplate.from_template(
            """Create 3 personalized wellness challenges based on:
- Wellness goals: {goals}
- Personal motivation: {motivation}
- Already completed: {completed}

Each challenge should be:
- 7 days long with daily activities
- Tailored to their specific goals
- Progressive difficulty
- Include mindfulness, physical activity, or emotional wellness
- Have a catchy title and clear description

Return as a JSON array with format:
[{{"id": "unique-id", "title": "Challenge Title", "description": "Brief description", "duration": 7, \
"category": "mindfulness|physical|emotional", "dailyTasks": ["Task 1", "Task 2"]}}]"""
        )
        chain = prompt | get_chat_model(temperature=0.7)
        result = await chain.ainvoke(
            {
                "goals": ", ".join(goals),
                "motivation": motivation,
                "completed": ", ".join(completed_challenges),
            }
        )
        return extract_json_array(result.text)
    except Exception as error:  # noqa: BLE001
        print(f"Error generating personalized challenges: {error}")
        return []
