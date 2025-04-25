import requests
import streamlit as st

st.title("PDF Translator")

target_language = st.selectbox("Select target language", ["en", "vi", "es", "fr"])
uploaded_file = st.file_uploader("Upload your PDF file", type=["pdf"])

if st.button("Translate") and uploaded_file:
    files = {"file": uploaded_file.getvalue()}
    data = {"target_language": target_language}

    response = requests.post("http://127.0.0.1:8000/translate-pdf/", files=files, data=data)

    if response.status_code == 200:
        st.success(response.json().get("translated_text", ""))
    else:
        st.error("An error occurred during translation.")
