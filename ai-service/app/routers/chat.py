from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from ..chains.chat_chain import generate_chat_response, stream_chat_response
from ..schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/ai/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    reply = await generate_chat_response(
        message=payload.message,
        user_id=payload.user_id or "anonymous",
        current_mood=payload.current_mood,
        preferred_language=payload.preferred_language,
    )
    return ChatResponse(response=reply)


@router.post("/stream")
async def chat_stream(payload: ChatRequest):
    async def event_generator():
        async for chunk in stream_chat_response(
            message=payload.message,
            user_id=payload.user_id or "anonymous",
            current_mood=payload.current_mood,
            preferred_language=payload.preferred_language,
        ):
            yield {"event": "token", "data": chunk}
        yield {"event": "done", "data": ""}

    return EventSourceResponse(event_generator())
