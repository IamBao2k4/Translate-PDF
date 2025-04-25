import time

from deep_translator import GoogleTranslator

# Map language names to language codes
language_codes = {
    "English": "en",
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Chinese": "zh-CN",
    "Japanese": "ja",
    "Russian": "ru",
    "Arabic": "ar",
    "Portuguese": "pt",
    "Italian": "it",
    "Vietnamese": "vi"
}

def translate_text(text: str, target_language: str) -> str:
    """
    Translate text to the target language using Google Translate
    """
    # Get the language code
    target_code = language_codes.get(target_language, "en")
    
    try:
        # For long texts, we need to split it into chunks
        max_chunk_size = 5000
        chunks = [text[i:i+max_chunk_size] for i in range(0, len(text), max_chunk_size)]
        
        translated_chunks = []
        for chunk in chunks:
            translator = GoogleTranslator(source='auto', target=target_code)
            translated_chunks.append(translator.translate(chunk))
        
        return "".join(translated_chunks)
    except Exception as e:
        # Log the error and return a fallback message
        print(f"Translation error: {str(e)}")
        return f"[Error translating to {target_language}] {text}"
