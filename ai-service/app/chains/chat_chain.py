"""The flagship RAG + agent + memory pipeline behind POST /ai/chat and
POST /ai/chat/stream. This is deliberately async end-to-end so the FastAPI
event loop stays free to serve other requests while the LLM (and any tool
calls it makes) are in flight.
"""
from collections.abc import AsyncIterator

from langchain_core.messages import HumanMessage

from ..agent import build_agent
from ..memory import get_session_history, remember_long_term

FALLBACK_REPLY = "I'm here to support you. Could you tell me more about how you're feeling?"


def _build_input(message: str, current_mood: str | None, preferred_language: str | None) -> str:
    notes = []
    if current_mood:
        notes.append(f"The user's current mood is: {current_mood}. Tailor your response accordingly.")
    if preferred_language:
        notes.append(f"CRITICAL: respond ENTIRELY in {preferred_language}.")
    if not notes:
        return message
    return f"{' '.join(notes)}\n\nUser message: {message}"


async def generate_chat_response(
    message: str,
    user_id: str,
    current_mood: str | None = None,
    preferred_language: str | None = None,
) -> str:
    try:
        agent = build_agent(user_id)
        history = get_session_history(user_id)
        full_input = _build_input(message, current_mood, preferred_language)
        messages = list(history.messages[-10:]) + [HumanMessage(content=full_input)]

        result = await agent.ainvoke({"messages": messages})
        reply = (result["messages"][-1].text or "").strip() or FALLBACK_REPLY

        history.add_user_message(message)
        history.add_ai_message(reply)
        remember_long_term(user_id, f"User said: {message}\nAssistant replied: {reply}", kind="chat")

        return reply
    except Exception as error:  # noqa: BLE001 - mirrors the original graceful-degradation behavior
        print(f"Chat agent error: {error}")
        return "I'm having trouble connecting right now, but I'm here for you. How can I help support your wellness today?"


async def stream_chat_response(
    message: str,
    user_id: str,
    current_mood: str | None = None,
    preferred_language: str | None = None,
) -> AsyncIterator[str]:
    agent = build_agent(user_id)
    history = get_session_history(user_id)
    full_input = _build_input(message, current_mood, preferred_language)
    messages = list(history.messages[-10:]) + [HumanMessage(content=full_input)]

    collected: list[str] = []
    try:
        async for event in agent.astream_events({"messages": messages}, version="v2"):
            if event["event"] == "on_chat_model_stream":
                chunk = event["data"]["chunk"].text
                if chunk:
                    collected.append(chunk)
                    yield chunk
    except Exception as error:  # noqa: BLE001
        print(f"Chat stream error: {error}")
        if not collected:
            yield FALLBACK_REPLY
            collected.append(FALLBACK_REPLY)

    reply = "".join(collected).strip() or FALLBACK_REPLY
    history.add_user_message(message)
    history.add_ai_message(reply)
    remember_long_term(user_id, f"User said: {message}\nAssistant replied: {reply}", kind="chat")
