"""The LangChain tool-calling agent that powers /ai/chat.

Rather than a single prompt->LLM call, the agent reasons about which tools
(if any) it needs before answering: searching the RAG knowledge base,
recalling the user's own long-term memory, or suggesting a concrete
breathing exercise. This is the "reasoning, tool execution, and
context-aware workflows" piece of the RAG/agent story.

Built on LangChain's `create_agent` (the LangGraph-backed agent runtime),
which replaced the older `AgentExecutor`/`create_tool_calling_agent` API.
"""
from langchain.agents import create_agent
from langchain_core.tools import tool

from .llm import get_chat_model
from .memory import recall_long_term
from .vectorstore import wellness_kb

SYSTEM_PROMPT = """You are MindEase Assistant, a compassionate AI companion focused on mental \
wellness and emotional support. You can communicate fluently in ALL Indian languages (Hindi, \
Punjabi, Urdu, Kashmiri, Bengali, Assamese, Odia, Gujarati, Marathi, Kannada, Telugu, Tamil, \
Malayalam) and global languages (English, Spanish, French, German, Italian, Portuguese, Chinese, \
Japanese, Korean, Arabic).

CRITICAL LANGUAGE INSTRUCTIONS:
- Default to English. If the user's message is written in English, you MUST reply in English —
do not switch to Hindi or any other language unless the user actually wrote in that language or
explicitly asked for it.
- You MUST respond ENTIRELY in the SAME language the user's message is actually written in, using \
the correct native script (e.g. Telugu in తెలుగు script, Hindi in Devanagari, Tamil in Tamil \
script, Bengali in Bengali script). Never mix languages or fall back to English words within that \
response, unless that language IS English.
- If the user's message or the conversation context specifies a preferred language, respond \
entirely in that language instead.
- Use respectful forms appropriate to the language (आप in Hindi, நீங்கள் in Tamil, మీరు in Telugu, \
আপনি in Bengali, etc.) and culturally appropriate expressions.

You have tools available:
- search_wellness_knowledge: look up evidence-based coping techniques from MindEase's knowledge base
- recall_user_memory: recall this user's own relevant past conversations, moods, or memories
- suggest_breathing_exercise: get a ready-to-use breathing exercise

Use a tool when it would make your answer more grounded, personalized, or practically useful — \
for example when the user is stressed, anxious, overwhelmed, or asking for a technique, or when \
recalling something they've mentioned before would make your response feel more personal. Don't \
force tool use for simple greetings or small talk. Never mention the tools by name in your reply — \
just respond naturally, as yourself.

Guidelines:
- Be empathetic, warm, and supportive.
- Provide practical, culturally appropriate wellness advice.
- Ask thoughtful follow-up questions to encourage reflection.
- Keep responses conversational, not clinical.
- If the user seems distressed or mentions self-harm, respond with care and gently encourage \
reaching out to a trusted person or a crisis resource — never attempt to handle a crisis alone.
"""


def _build_tools(user_id: str):
    @tool("search_wellness_knowledge")
    def search_wellness_knowledge(query: str) -> str:
        """Search MindEase's wellness knowledge base for evidence-based coping techniques,
        breathing exercises, grounding techniques, and mental wellness practices relevant
        to the given query."""
        docs = wellness_kb().similarity_search(query, k=3)
        if not docs:
            return "No relevant knowledge base entries found."
        return "\n\n".join(
            f"[{doc.metadata.get('title', doc.metadata.get('source', 'technique'))}] {doc.page_content}"
            for doc in docs
        )

    @tool("recall_user_memory")
    def recall_user_memory(query: str) -> str:
        """Recall this specific user's own past conversations, moods, or memories that are
        relevant to the current query, for long-term personalized context."""
        memories = recall_long_term(user_id, query)
        if not memories:
            return "No relevant past context found for this user yet."
        return "\n---\n".join(memories)

    @tool("suggest_breathing_exercise")
    def suggest_breathing_exercise() -> str:
        """Return a short, ready-to-use breathing exercise the user can do right now."""
        return (
            "Box breathing: inhale through your nose for 4 counts, hold for 4, exhale through "
            "your mouth for 4, hold for 4. Repeat the cycle 4 times."
        )

    return [search_wellness_knowledge, recall_user_memory, suggest_breathing_exercise]


def build_agent(user_id: str, temperature: float = 0.6):
    """Returns a compiled LangGraph agent (a Runnable): invoke with
    `{"messages": [...]}` and read the reply from `result["messages"][-1]`."""
    llm = get_chat_model(temperature=temperature)
    tools = _build_tools(user_id)
    return create_agent(model=llm, tools=tools, system_prompt=SYSTEM_PROMPT)
