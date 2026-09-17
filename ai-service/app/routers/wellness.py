from fastapi import APIRouter

from ..chains.wellness_chain import (
    generate_daily_wellness_tip,
    generate_personalized_thought_interruption,
    generate_thought_interruption_techniques,
)
from ..schemas import (
    DailyTipRequest,
    DailyTipResponse,
    PersonalizedThoughtInterruptionRequest,
    TechniquesResponse,
)

router = APIRouter(prefix="/ai/wellness", tags=["wellness"])


@router.post("/daily-tip", response_model=DailyTipResponse)
async def daily_tip(payload: DailyTipRequest) -> DailyTipResponse:
    tip = await generate_daily_wellness_tip(payload.user_context)
    return DailyTipResponse(tip=tip)


@router.get("/thought-interruption", response_model=TechniquesResponse)
async def thought_interruption() -> TechniquesResponse:
    techniques = await generate_thought_interruption_techniques()
    return TechniquesResponse(techniques=techniques)


@router.post("/thought-interruption/personalized", response_model=TechniquesResponse)
async def thought_interruption_personalized(payload: PersonalizedThoughtInterruptionRequest) -> TechniquesResponse:
    techniques = await generate_personalized_thought_interruption(payload.user_profile, payload.recent_moods)
    return TechniquesResponse(techniques=techniques)
