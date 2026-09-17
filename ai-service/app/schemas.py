from typing import Any, Optional

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    current_mood: Optional[str] = None
    preferred_language: Optional[str] = None


class ChatResponse(BaseModel):
    response: str


class MoodAnalyzeRequest(BaseModel):
    text: str


class MoodAnalyzeResponse(BaseModel):
    mood: str
    emoji: str
    rating: int
    confidence: float


class MoodInsightsRequest(BaseModel):
    mood_entries: list[dict[str, Any]] = []


class InsightsListResponse(BaseModel):
    insights: list[str]


class MemeAnalyzeRequest(BaseModel):
    style: str = "funny"


class MemeAnalyzeResponse(BaseModel):
    top_text: str
    bottom_text: str
    description: str


class MemeTextRequest(BaseModel):
    memory_title: str
    memory_category: str
    style: str = "funny"


class MemeTextResponse(BaseModel):
    top_text: str
    bottom_text: str


class DailyTipRequest(BaseModel):
    user_context: Optional[dict[str, Any]] = None


class DailyTipResponse(BaseModel):
    tip: str


class ImageAnalyzeRequest(BaseModel):
    base64_image: str


class ImageAnalyzeResponse(BaseModel):
    title: str
    category: str
    description: str
    emotions: list[str]


class GalleryTitleRequest(BaseModel):
    memories: list[dict[str, Any]] = []


class GalleryTitleResponse(BaseModel):
    title: str


class TechniquesResponse(BaseModel):
    techniques: list[str]


class PersonalizedChallengesRequest(BaseModel):
    user_profile: dict[str, Any] = {}
    completed_challenges: list[str] = []


class ChallengesResponse(BaseModel):
    challenges: list[dict[str, Any]]


class PersonalizedInsightsRequest(BaseModel):
    mood_entries: list[dict[str, Any]] = []
    memories: list[dict[str, Any]] = []
    chat_messages: list[dict[str, Any]] = []
    gratitude_entries: list[dict[str, Any]] = []
    user_profile: dict[str, Any] = {}


class PersonalizedThoughtInterruptionRequest(BaseModel):
    user_profile: dict[str, Any] = {}
    recent_moods: list[dict[str, Any]] = []
