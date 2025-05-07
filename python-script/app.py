import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from Model import detect_text_from_file

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def classify_text(text: str) -> str:
    """
    Simple rule-based classification based on keywords in the text.
    Returns 'Invoice', 'Contract', 'Letter', or 'Other'.
    """
    text = text.lower()
    if any(keyword in text for keyword in ['invoice', 'bill', 'receipt', 'payment']):
        return "Invoice"
    elif any(keyword in text for keyword in ['contract', 'agreement', 'terms']):
        return "Contract"
    elif any(keyword in text for keyword in ['dear', 'sincerely', 'regards']):
        return "Letter"
    return "Other"

class DocumentResponse(BaseModel):
    document_name: str
    content: str
    classification: str
    confidence: str

@app.get("/")
async def home():
    return {"message": "Welcome to the Document Classifier!"}

@app.post("/upload", response_model=DocumentResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file part in the request")
    if not file.filename:
        raise HTTPException(status_code=400, detail="No selected file")
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Invalid file format. Allowed: pdf, png, jpg, jpeg")

    filename = file.filename.replace(" ", "_")
    file_data = await file.read()

    # Validate file size
    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10 MB")

    # Call detect_text_from_file
    detections, total_detections, total_confidence, _ = detect_text_from_file(file_data, filename)
    extracted_text = "\n".join([det["text"] for det in detections])

    print(f"Extracted text for {filename}: {extracted_text[:100]}...")

    if not extracted_text.strip():
        raise HTTPException(status_code=500, detail="Text extraction failed or no text found")

    # Classify the text
    classification = classify_text(extracted_text)
    average_confidence = str(round(total_confidence / total_detections, 4)) if total_detections > 0 else "0"

    return DocumentResponse(
        document_name=filename,
        content=extracted_text,
        classification=classification,
        confidence=average_confidence
    )

@app.post("/detect-text-multiple/")
async def detect_text_multiple(
    files: List[UploadFile] = File(...),
    threshold: float = 0.5,
    return_images: bool = False
):
    results = []
    total_detections = 0
    total_confidence = 0

    for file in files:
        if not allowed_file(file.filename):
            print(f"Skipping invalid file: {file.filename}")
            continue

        filename = file.filename.replace(" ", "_")
        file_data = await file.read()

        # Validate file size
        if len(file_data) > MAX_FILE_SIZE:
            print(f"Skipping file {filename}: File size exceeds 10 MB")
            continue

        # Call detect_text_from_file
        detections, file_detections, file_confidence, image_base64 = detect_text_from_file(
            file_data, filename, threshold=threshold, return_images=return_images
        )

        total_detections += file_detections
        total_confidence += file_confidence

        result = {
            "filename": filename,
            "detections": detections,
            "image_base64": image_base64 if return_images else None
        }
        results.append(result)

    average_confidence = total_confidence / total_detections if total_detections > 0 else 0

    return {
        "status": "success",
        "average_confidence": round(average_confidence, 4),
        "total_detections": total_detections,
        "results": results
    }