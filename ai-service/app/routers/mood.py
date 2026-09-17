from fastapi import APIRouter

from ..chains.mood_chain import analyze_mood_from_text, generate_mood_insights
from ..schemas import InsightsListResponse, MoodAnalyzeRequest, MoodAnalyzeResponse, MoodInsightsRequest

router = APIRouter(prefix="/ai/mood", tags=["mood"])


@router.post("/analyze", response_model=MoodAnalyzeResponse)
async def analyze(payload: MoodAnalyzeRequest) -> MoodAnalyzeResponse:
    result = await analyze_mood_from_text(payload.text)
    return MoodAnalyzeResponse(**result)


@router.post("/insights", response_model=InsightsListResponse)
async def insights(payload: MoodInsightsRequest) -> InsightsListResponse:
    result = await generate_mood_insights(payload.mood_entries)
    return InsightsListResponse(insights=result)
