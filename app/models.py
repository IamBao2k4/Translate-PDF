from pydantic import BaseModel
from typing import Optional

class TranslationRequest(BaseModel):
    target_language: str
    preserve_formatting: bool = True
    include_original: bool = False

class TranslationResponse(BaseModel):
    job_id: str
    filename: str
    status: str
    text_preview: str
    target_language: str
    error: Optional[str] = None