document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fileInput = document.getElementById('file-input');
    const uploadContainer = document.getElementById('upload-container');
    const fileInfo = document.getElementById('file-info');
    const filename = document.getElementById('filename');
    const extractBtn = document.getElementById('extract-btn');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const uploadProgress = document.getElementById('upload-progress');
    const progressBar = uploadProgress.querySelector('.progress-bar');
    
    const pdfPreviewSection = document.getElementById('pdf-preview-section');
    const pdfPreview = document.getElementById('pdf-preview');
    
    const originalTextSection = document.getElementById('original-text-section');
    const originalText = document.getElementById('original-text');
    const translationPlaceholder = document.getElementById('translation-placeholder');
    const translationActions = document.getElementById('translation-actions');
    const translateBtn = document.getElementById('translate-btn');
    const translationProgress = document.getElementById('translation-progress');
    const translationProgressBar = translationProgress.querySelector('.progress-bar');
    
    const translatedTextSection = document.getElementById('translated-text-section');
    const translatedText = document.getElementById('translated-text');
    const downloadBtn = document.getElementById('download-btn');
    const copyBtn = document.getElementById('copy-btn');
    const shareBtn = document.getElementById('share-btn');
    
    const languageSelect = document.getElementById('language-select');
    const targetLanguageDisplay = document.getElementById('target-language-display');
    const preserveFormatting = document.getElementById('preserve-formatting');
    const includeOriginal = document.getElementById('include-original');
    
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    
    // State
    let currentFile = null;
    let currentJobId = null;
    let bsToast = new bootstrap.Toast(toast);
    
    // Load languages
    fetchLanguages();
    
    // Event Listeners
    fileInput.addEventListener('change', handleFileSelect);
    uploadContainer.addEventListener('dragover', handleDragOver);
    uploadContainer.addEventListener('dragleave', handleDragLeave);
    uploadContainer.addEventListener('drop', handleDrop);
    uploadContainer.addEventListener('click', () => fileInput.click());
    
    extractBtn.addEventListener('click', extractText);
    removeFileBtn.addEventListener('click', removeFile);
    translateBtn.addEventListener('click', translateDocument);
    downloadBtn.addEventListener('click', downloadTranslation);
    copyBtn.addEventListener('click', copyToClipboard);
    shareBtn.addEventListener('click', shareTranslation);
    
    languageSelect.addEventListener('change', updateTargetLanguage);
    
    // Functions
    function fetchLanguages() {
        fetch('/api/languages')
            .then(response => response.json())
            .then(data => {
                languageSelect.innerHTML = '';
                data.languages.forEach(language => {
                    const option = document.createElement('option');
                    option.value = language;
                    option.textContent = language;
                    languageSelect.appendChild(option);
                });
                updateTargetLanguage();
            })
            .catch(error => {
                showToast('Error', 'Failed to load languages');
                console.error('Error fetching languages:', error);
            });
    }
    
    function updateTargetLanguage() {
        const selectedLanguage = languageSelect.value;
        targetLanguageDisplay.textContent = selectedLanguage;
    }
    
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            setCurrentFile(file);
        } else if (file) {
            showToast('Error', 'Please select a PDF file');
        }
    }
    
    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        uploadContainer.classList.add('dragover');
    }
    
    function handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        uploadContainer.classList.remove('dragover');
    }
    
    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        uploadContainer.classList.remove('dragover');
        
        const file = event.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            setCurrentFile(file);
        } else if (file) {
            showToast('Error', 'Please drop a PDF file');
        }
    }
    
    function setCurrentFile(file) {
        currentFile = file;
        filename.textContent = file.name;
        uploadContainer.classList.add('d-none');
        fileInfo.classList.remove('d-none');
        
        // Create object URL for PDF preview
        const objectUrl = URL.createObjectURL(file);
        pdfPreview.innerHTML = `<iframe src="${objectUrl}"></iframe>`;
        pdfPreviewSection.classList.remove('d-none');
        
        // Reset translation sections
        originalTextSection.classList.add('d-none');
        translationPlaceholder.classList.remove('d-none');
        translationActions.classList.add('d-none');
        translatedTextSection.classList.add('d-none');
    }
    
    function removeFile() {
        currentFile = null;
        currentJobId = null;
        fileInput.value = '';
        uploadContainer.classList.remove('d-none');
        fileInfo.classList.add('d-none');
        pdfPreviewSection.classList.add('d-none');
        originalTextSection.classList.add('d-none');
        translationPlaceholder.classList.remove('d-none');
        translationActions.classList.add('d-none');
        translatedTextSection.classList.add('d-none');
    }
    
    function extractText() {
        if (!currentFile) return;
        
        // Show progress
        uploadProgress.classList.remove('d-none');
        progressBar.style.width = '0%';
        
        // Create form data
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('target_language', languageSelect.value);
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progress > 90) clearInterval(progressInterval);
            progressBar.style.width = `${progress}%`;
        }, 100);
        
        // Upload file
        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            
            // Update UI with extracted text
            currentJobId = data.job_id;
            originalText.textContent = data.text_preview;
            originalTextSection.classList.remove('d-none');
            translationPlaceholder.classList.add('d-none');
            translationActions.classList.remove('d-none');
            
            // Hide progress after a delay
            setTimeout(() => {
                uploadProgress.classList.add('d-none');
            }, 1000);
            
            showToast('Success', 'Text extracted successfully');
        })
        .catch(error => {
            clearInterval(progressInterval);
            uploadProgress.classList.add('d-none');
            showToast('Error', 'Failed to extract text');
            console.error('Error uploading file:', error);
        });
    }
    
    function translateDocument() {
        if (!currentJobId) return;
        
        // Show progress
        translationProgress.classList.remove('d-none');
        translationProgressBar.style.width = '0%';
        
        // Prepare request data
        const requestData = {
            target_language: languageSelect.value,
            preserve_formatting: preserveFormatting.checked,
            include_original: includeOriginal.checked
        };
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 3;
            if (progress > 90) clearInterval(progressInterval);
            translationProgressBar.style.width = `${progress}%`;
        }, 100);
        
        // Send translation request
        fetch(`/api/translate/${currentJobId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            clearInterval(progressInterval);
            translationProgressBar.style.width = '100%';
            
            // Update UI with translated text
            translatedText.textContent = data.text_preview;
            translatedTextSection.classList.remove('d-none');
            
            // Hide progress after a delay
            setTimeout(() => {
                translationProgress.classList.add('d-none');
            }, 1000);
            
            showToast('Success', 'Translation completed');
        })
        .catch(error => {
            clearInterval(progressInterval);
            translationProgress.classList.add('d-none');
            showToast('Error', 'Failed to translate document');
            console.error('Error translating document:', error);
        });
    }
    
    function downloadTranslation() {
        if (!currentJobId) return;
        
        const language = languageSelect.value;
        window.location.href = `/api/download/${currentJobId}?language=${encodeURIComponent(language)}`;
    }
    
    function copyToClipboard() {
        if (!translatedText.textContent) return;
        
        navigator.clipboard.writeText(translatedText.textContent)
            .then(() => {
                showToast('Success', 'Copied to clipboard');
            })
            .catch(error => {
                showToast('Error', 'Failed to copy text');
                console.error('Error copying to clipboard:', error);
            });
    }
    
    function shareTranslation() {
        // This is a placeholder for sharing functionality
        // In a real app, you might implement email sharing, social media, etc.
        showToast('Info', 'Sharing functionality coming soon');
    }
    
    function showToast(title, message) {
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        bsToast.show();
    }
});