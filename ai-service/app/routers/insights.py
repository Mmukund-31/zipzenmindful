from fastapi import APIRouter

from ..chains.insights_chain import generate_personalized_challenges, generate_personalized_insights
from ..schemas import (
    ChallengesResponse,
    InsightsListResponse,
    PersonalizedChallengesRequest,
    PersonalizedInsightsRequest,
)

router = APIRouter(tags=["insights"])


@router.post("/ai/insights/personalized", response_model=InsightsListResponse)
async def personalized_insights(payload: PersonalizedInsightsRequest) -> InsightsListResponse:
    insights = await generate_personalized_insights(
        mood_entries=payload.mood_entries,
        memories=payload.memories,
        chat_messages=payload.chat_messages,
        gratitude_entries=payload.gratitude_entries,
        user_profile=payload.user_profile,
    )
    return InsightsListResponse(insights=insights)


@router.post("/ai/challenges/personalized", response_model=ChallengesResponse)
async def personalized_challenges(payload: PersonalizedChallengesRequest) -> ChallengesResponse:
    challenges = await generate_personalized_challenges(payload.user_profile, payload.completed_challenges)
    return ChallengesResponse(challenges=challenges)
