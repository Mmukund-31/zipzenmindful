"""RAG chains for the wellness/tip and thought-interruption endpoints:
retrieve relevant technique documents from the "wellness_kb" vector
collection by semantic search, then ground the LLM's generation in them
instead of relying purely on the model's own training data.
"""
import json as _json
from datetime import date

from langchain_core.prompts import ChatPromptTemplate

from ..llm import get_chat_model
from ..utils import extract_json_object
from ..vectorstore import wellness_kb

_DEFAULT_TIP = (
    "Take a moment today to breathe deeply — even three slow breaths can help center "
    "your thoughts and reduce stress."
)

_DEFAULT_TECHNIQUES = [
    "Take 5 deep breaths, counting slowly from 1 to 5 on each inhale and exhale.",
    "Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.",
    "Challenge the thought: 'Is this helpful right now? What would I tell a friend thinking this?'",
    "Do 10 jumping jacks or stretch your arms above your head to shift physical energy.",
    "Visualize placing the worry in a box and setting it aside for later.",
]


def _retrieve_context(query: str, k: int = 4) -> str:
    docs = wellness_kb().similarity_search(query, k=k)
    if not docs:
        return "No knowledge base context available."
    return "\n\n".join(
        f"[{doc.metadata.get('title', doc.metadata.get('source', 'technique'))}] {doc.page_content}"
        for doc in docs
    )


async def generate_daily_wellness_tip(user_context: dict | None = None) -> str:
    try:
        goals = ", ".join((user_context or {}).get("wellnessGoals") or []) or "general wellness"
        recent_moods = (user_context or {}).get("recentMoods") or []
        mood_summary = ", ".join(f"{m.get('mood')} ({m.get('rating')}/5)" for m in recent_moods) or "none available"

        retrieval_query = f"wellness tip for stress and overthinking, goals: {goals}, recent moods: {mood_summary}"
        kb_context = _retrieve_context(retrieval_query, k=3)

        prompt = ChatPromptTemplate.from_template(
            """Using the following excerpts from a wellness knowledge base as grounding, generate a \
personalized daily wellness tip for someone managing stress and overthinking.

Knowledge base context:
{kb_context}

User wellness goals: {goals}
Recent mood patterns: {mood_summary}
Today is day {day_of_year} of the year.

Make it practical, actionable, and supportive, inspired by (but not copied verbatim from) the \
knowledge base context above. Keep it to 1-2 sentences and make it feel personal and encouraging.
Return just the tip text, no extra formatting or quotation marks."""
        )

        chain = prompt | get_chat_model(temperature=0.7)
        result = await chain.ainvoke(
            {
                "kb_context": kb_context,
                "goals": goals,
                "mood_summary": mood_summary,
                "day_of_year": date.today().timetuple().tm_yday,
            }
        )
        return result.text.strip() or _DEFAULT_TIP
    except Exception as error:  # noqa: BLE001
        print(f"Daily tip generation error: {error}")
        return _DEFAULT_TIP


async def generate_thought_interruption_techniques() -> list[str]:
    try:
        kb_context = _retrieve_context(
            "thought interruption techniques for anxiety, stress, and negative thought spirals", k=6
        )

        prompt = ChatPromptTemplate.from_template(
            """Using these knowledge base excerpts as grounding:

{kb_context}

Generate 10 unique, effective thought interruption techniques for mental wellness, inspired by \
the context above. These should be:
- Quick and practical (30 seconds to 2 minutes)
- Evidence-based from CBT and mindfulness practices
- Suitable for anxiety, stress, and negative thought spirals
- Easy to remember and implement anywhere
- Varied in approach (breathing, grounding, cognitive, physical)

Format as a simple list, each technique in 1-2 sentences, one per line."""
        )

        chain = prompt | get_chat_model(temperature=0.6)
        result = await chain.ainvoke({"kb_context": kb_context})
        lines = [line.strip("-• \t") for line in result.text.split("\n") if line.strip()]
        return lines[:10] or list(_DEFAULT_TECHNIQUES)
    except Exception as error:  # noqa: BLE001
        print(f"Error generating thought interruption techniques: {error}")
        return list(_DEFAULT_TECHNIQUES)


async def generate_personalized_thought_interruption(user_profile: dict, recent_moods: list[dict]) -> list[str]:
    try:
        mood_context = (
            ", ".join(f"{m.get('mood')} ({m.get('rating')}/5)" for m in recent_moods[-3:])
            if recent_moods
            else "No recent mood data"
        )
        goals = user_profile.get("wellnessGoals") or []
        if isinstance(goals, str):
            goals = _json.loads(goals) if goals.strip().startswith("[") else [goals]
        motivation = user_profile.get("motivation") or ""

        kb_context = _retrieve_context(f"thought interruption techniques for {', '.join(goals)} {mood_context}", k=5)

        prompt = ChatPromptTemplate.from_template(
            """Using these knowledge base excerpts as grounding:

{kb_context}

Create 5 personalized thought interruption techniques for this user based on their profile and \
recent mood patterns.

User Context:
- Wellness Goals: {goals}
- Personal Motivation: {motivation}
- {mood_context}

Generate techniques that are specifically tailored to their goals and recent emotional state, \
quick and practical (30 seconds to 2 minutes), evidence-based, and personalized to their \
motivation and current needs.

Respond with JSON: {{"techniques": ["technique1", "technique2", "technique3", "technique4", "technique5"]}}"""
        )

        chain = prompt | get_chat_model(temperature=0.6)
        result = await chain.ainvoke(
            {
                "kb_context": kb_context,
                "goals": ", ".join(goals) or "Not specified",
                "motivation": motivation,
                "mood_context": mood_context,
            }
        )
        parsed = extract_json_object(result.text)
        return parsed.get("techniques") or list(_DEFAULT_TECHNIQUES[:5])
    except Exception as error:  # noqa: BLE001
        print(f"Error generating personalized thought interruption: {error}")
        return list(_DEFAULT_TECHNIQUES[:5])
