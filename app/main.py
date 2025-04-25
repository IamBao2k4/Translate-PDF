from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional

from app.services.pdf import extract_text_from_pdf
from app.services.translate import translate_text
from app.models import TranslationResponse, TranslationRequest

# Create upload directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

RESULT_DIR = Path("results")
RESULT_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="PDF Translator API",
    description="API for translating PDF documents",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/")
async def read_root():
    return FileResponse("app/static/index.html")

@app.post("/api/upload", response_model=TranslationResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    target_language: str = Form("English")
):
    """
    Upload a PDF file for translation
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Generate unique ID for this translation job
    job_id = str(uuid.uuid4())
    
    # Save the uploaded file
    file_path = UPLOAD_DIR / f"{job_id}.pdf"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Extract text from PDF
    try:
        extracted_text = extract_text_from_pdf(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting text: {str(e)}")
    
    # Save extracted text
    text_path = UPLOAD_DIR / f"{job_id}.txt"
    with open(text_path, "w", encoding="utf-8") as f:
        f.write(extracted_text)
    
    return TranslationResponse(
        job_id=job_id,
        filename=file.filename,
        status="uploaded",
        text_preview=extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
        target_language=target_language
    )

@app.post("/api/translate/{job_id}", response_model=TranslationResponse)
async def translate_pdf(
    job_id: str,
    request: TranslationRequest
):
    """
    Translate the previously uploaded PDF
    """
    # Check if job exists
    text_path = UPLOAD_DIR / f"{job_id}.txt"
    if not text_path.exists():
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Read the extracted text
    with open(text_path, "r", encoding="utf-8") as f:
        extracted_text = f.read()
    
    # Translate the text
    try:
        translated_text = translate_text(extracted_text, request.target_language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error translating text: {str(e)}")
    
    # Save translated text
    result_path = RESULT_DIR / f"{job_id}_{request.target_language}.txt"
    with open(result_path, "w", encoding="utf-8") as f:
        f.write(translated_text)
    
    return TranslationResponse(
        job_id=job_id,
        filename=f"translation_{request.target_language}.txt",
        status="translated",
        text_preview=translated_text[:500] + "..." if len(translated_text) > 500 else translated_text,
        target_language=request.target_language
    )

@app.get("/api/download/{job_id}")
async def download_translation(job_id: str, language: str):
    """
    Download the translated file
    """
    result_path = RESULT_DIR / f"{job_id}_{language}.txt"
    if not result_path.exists():
        raise HTTPException(status_code=404, detail="Translation not found")
    
    return FileResponse(
        path=result_path,
        filename=f"translation_{language}.txt",
        media_type="text/plain"
    )

@app.get("/api/languages")
async def get_languages():
    """
    Get list of supported languages
    """
    return {
        "languages": [
            "English", "Spanish", "French", "German", "Chinese", 
            "Japanese", "Russian", "Arabic", "Portuguese", "Italian", "Vietnamese"
        ]
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="localhost", port=8000, reload=True)