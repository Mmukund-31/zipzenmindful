"""Small creative-generation chains that don't need RAG grounding: meme
copywriting and memory-gallery titling."""
from langchain_core.prompts import ChatPromptTemplate

from ..llm import get_chat_model
from ..utils import extract_json_object

_MEME_TEXT_FALLBACKS = {
    "family": {"top_text": "FAMILY TIME HITS", "bottom_text": "DIFFERENT WHEN HAPPY"},
    "friends": {"top_text": "SQUAD MAKING MEMORIES", "bottom_text": "INSTANT SEROTONIN BOOST"},
    "pets": {"top_text": "LOOKING AT PET PHOTOS", "bottom_text": "DEPRESSION WHO?"},
    "other": {"top_text": "GOOD MEMORIES BE LIKE", "bottom_text": "FREE THERAPY SESSION"},
}


async def generate_meme_text(memory_title: str, memory_category: str, style: str) -> dict:
    try:
        prompt = ChatPromptTemplate.from_template(
            """You are a funny meme text generator for a wellness app. Create hilarious, positive, \
and uplifting meme text based on the memory details.

Guidelines:
- Keep it funny but wholesome and supportive
- Use popular meme formats and internet humor
- Make it relate to mental wellness, happiness, or memories
- Keep text short and punchy (max 6 words per line)
- Use ALL CAPS for classic meme style

Respond with JSON in this format: {{"topText": "TOP LINE", "bottomText": "BOTTOM LINE"}}

Memory: "{memory_title}" in category "{memory_category}". Style: {style}"""
        )
        chain = prompt | get_chat_model(temperature=0.8)
        result = await chain.ainvoke(
            {"memory_title": memory_title, "memory_category": memory_category, "style": style}
        )
        parsed = extract_json_object(result.text)
        return {
            "top_text": parsed.get("topText", "WHEN YOU SEE"),
            "bottom_text": parsed.get("bottomText", "THIS HAPPY MEMORY"),
        }
    except Exception as error:  # noqa: BLE001
        print(f"Meme text generation error: {error}")
        return dict(_MEME_TEXT_FALLBACKS.get(memory_category, _MEME_TEXT_FALLBACKS["other"]))


async def generate_memory_gallery_title(memories: list[dict]) -> str:
    try:
        titles = ", ".join(m.get("title", "") for m in memories)
        categories = ", ".join(sorted({m.get("category", "") for m in memories}))

        prompt = ChatPromptTemplate.from_template(
            """Based on these memory titles and categories, create a beautiful, inspiring gallery \
title that captures the essence of these memories:

Memory titles: {titles}
Categories: {categories}

Create a title that:
- Is 2-6 words long
- Feels warm and nostalgic
- Could be used for a photo gallery
- Relates to mental wellness and positive emotions

Examples: "Moments of Joy", "Family Adventures", "Peaceful Times", "Happy Memories"

Return just the title, no quotes or extra text."""
        )
        chain = prompt | get_chat_model(temperature=0.7)
        result = await chain.ainvoke({"titles": titles, "categories": categories})
        return result.text.strip() or "Beautiful Memories"
    except Exception as error:  # noqa: BLE001
        print(f"Gallery title generation error: {error}")
        return "Beautiful Memories"
