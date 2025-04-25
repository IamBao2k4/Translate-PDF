import pdfplumber
from pathlib import Path

def extract_text_from_pdf(pdf_path: Path) -> str:
    """
    Extract text from a PDF file
    """
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n\n"
        return text
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")