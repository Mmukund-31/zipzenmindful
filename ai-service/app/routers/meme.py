from fastapi import APIRouter, File, Form, UploadFile

from ..chains.content_chain import generate_meme_text
from ..chains.vision_chain import analyze_image_and_generate_meme
from ..schemas import MemeAnalyzeResponse, MemeTextRequest, MemeTextResponse

router = APIRouter(prefix="/ai/meme", tags=["meme"])


@router.post("/analyze-and-generate", response_model=MemeAnalyzeResponse)
async def analyze_and_generate(style: str = Form("funny"), image: UploadFile = File(...)) -> MemeAnalyzeResponse:
    image_bytes = await image.read()
    result = await analyze_image_and_generate_meme(image_bytes, style)
    return MemeAnalyzeResponse(**result)


@router.post("/generate-text", response_model=MemeTextResponse)
async def generate_text(payload: MemeTextRequest) -> MemeTextResponse:
    result = await generate_meme_text(payload.memory_title, payload.memory_category, payload.style)
    return MemeTextResponse(**result)
