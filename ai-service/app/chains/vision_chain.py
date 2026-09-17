"""Multimodal (vision) chains — image analysis for memes and memories.
Uses the same provider-agnostic chat model, passed a multimodal message
(LangChain's standard image_url content block), so this also swaps between
Gemini and OpenAI vision models via LLM_PROVIDER.
"""
import base64

from langchain_core.messages import HumanMessage

from ..llm import get_chat_model
from ..utils import extract_json_object

_STYLE_PROMPTS = {
    "classic": "Create classic internet meme text that's universally funny and relatable",
    "modern": "Generate witty, contemporary humor with current internet culture references",
    "funny": "Make it extremely hilarious with maximum comedic impact and absurd humor",
    "wholesome": "Create positive, uplifting, and heartwarming meme text that spreads joy",
}

_MEME_FALLBACK = {
    "top_text": "AI MEME GENERATOR",
    "bottom_text": "MAKING EVERYTHING FUNNY",
    "description": "Image analysis unavailable",
}

_MEMORY_FALLBACK = {
    "title": "Beautiful Memory",
    "category": "other",
    "description": "A special moment captured in time",
    "emotions": ["joy", "happiness"],
}


def _image_message(prompt: str, base64_image: str) -> HumanMessage:
    return HumanMessage(
        content=[
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
        ]
    )


async def analyze_image_and_generate_meme(image_bytes: bytes, style: str) -> dict:
    try:
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        selected_style = _STYLE_PROMPTS.get(style, _STYLE_PROMPTS["funny"])

        prompt = f"""Analyze this image and create hilarious meme text for it. {selected_style}.

Rules:
1. Generate TWO pieces of text: TOP text and BOTTOM text
2. Text should be SHORT (max 6 words each)
3. Use ALL CAPS format like classic memes
4. Make it funny based on what you see in the image
5. The humor should relate to the image content, facial expressions, situations, or objects
6. Be creative and use popular meme formats when appropriate

Also provide a brief description of what you see in the image.

Return your response in this exact JSON format:
{{"topText": "YOUR TOP TEXT HERE", "bottomText": "YOUR BOTTOM TEXT HERE", "description": "Brief description of the image"}}"""

        llm = get_chat_model(temperature=0.8)
        result = await llm.ainvoke([_image_message(prompt, base64_image)])
        parsed = extract_json_object(result.text)

        return {
            "top_text": parsed.get("topText", "WHEN YOU SEE THIS"),
            "bottom_text": parsed.get("bottomText", "INSTANT MEME MATERIAL"),
            "description": parsed.get("description", "An interesting image"),
        }
    except Exception as error:  # noqa: BLE001
        print(f"Vision meme generation error: {error}")
        return dict(_MEME_FALLBACK)


async def analyze_image_for_memory(base64_image: str) -> dict:
    try:
        prompt = """Analyze this image and extract meaningful information for a mental wellness \
memory app. Look for emotional context, activities, people, locations, and positive elements \
that could be used for wellness support.

Respond with JSON in this exact format:
{"title": "A meaningful, descriptive title for this memory", "category": "one of: family, \
friends, pets, travel, nature, celebration, personal, other", "description": "A warm, positive \
description of what's happening in the image", "emotions": ["array of positive emotions this \
image might evoke like joy, peace, love, etc"]}

Focus on the positive and wellness aspects of the image."""

        llm = get_chat_model(temperature=0.4)
        result = await llm.ainvoke([_image_message(prompt, base64_image)])
        parsed = extract_json_object(result.text)

        return {
            "title": parsed.get("title", "Beautiful Memory"),
            "category": parsed.get("category", "other"),
            "description": parsed.get("description", "A special moment captured in time"),
            "emotions": parsed.get("emotions", ["joy", "happiness"]),
        }
    except Exception as error:  # noqa: BLE001
        print(f"Image analysis error: {error}")
        return dict(_MEMORY_FALLBACK)
