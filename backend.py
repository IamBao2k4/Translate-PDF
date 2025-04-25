from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse
from PyPDF2 import PdfReader
from googletrans import Translator

app = FastAPI()

@app.post("/translate-pdf/")
async def translate_pdf(file: UploadFile, target_language: str = Form(...)):
    try:
        # Extract text from PDF
        reader = PdfReader(file.file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()

        # Translate the extracted text
        translator = Translator()
        translated_text = await translator.translate(text, dest=target_language)  # Add 'await' here

        return JSONResponse(content={"translated_text": translated_text.text})  # Access the 'text' attribute

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
