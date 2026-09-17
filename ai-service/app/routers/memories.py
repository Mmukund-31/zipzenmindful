from fastapi import APIRouter

from ..chains.content_chain import generate_memory_gallery_title
from ..chains.vision_chain import analyze_image_for_memory
from ..schemas import (
    GalleryTitleRequest,
    GalleryTitleResponse,
    ImageAnalyzeRequest,
    ImageAnalyzeResponse,
)

router = APIRouter(prefix="/ai/memories", tags=["memories"])


@router.post("/analyze-image", response_model=ImageAnalyzeResponse)
async def analyze_image(payload: ImageAnalyzeRequest) -> ImageAnalyzeResponse:
    result = await analyze_image_for_memory(payload.base64_image)
    return ImageAnalyzeResponse(**result)


@router.post("/gallery-title", response_model=GalleryTitleResponse)
async def gallery_title(payload: GalleryTitleRequest) -> GalleryTitleResponse:
    title = await generate_memory_gallery_title(payload.memories)
    return GalleryTitleResponse(title=title)
