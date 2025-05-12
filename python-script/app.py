import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from Model_extraction import detect_text_from_file
import mlflow
import time
from Model_classification import DocumentClassifier

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

# Set MLflow tracking URI and experiment for text extraction
mlflow.set_tracking_uri("file:///C:/developpement/document_classifier/python-script/mlruns")
mlflow.set_experiment("Document_Text_Extraction")

# Initialize the classifier
classifier = DocumentClassifier(model_path="distilbert-base-multilingual-cased")

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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

    # Start MLflow run for text extraction
    with mlflow.start_run(run_name=f"extraction_{filename}_{int(time.time())}"):
        # Log parameters
        mlflow.log_param("filename", filename)
        mlflow.log_param("file_size_mb", len(file_data) / (1024 * 1024))
        mlflow.log_param("file_type", file.content_type)

        # Call detect_text_from_file
        start_time = time.time()
        try:
            detections, total_detections, total_confidence, _ = detect_text_from_file(file_data, filename)
            extracted_text = "\n".join([det["text"] for det in detections])
        except Exception as e:
            mlflow.log_param("extraction_error", str(e))
            raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")
        processing_time = time.time() - start_time

        print(f"Extracted text for {filename}: {extracted_text[:100]}...")

        if not extracted_text.strip():
            mlflow.log_param("extraction_error", "No text found")
            raise HTTPException(status_code=500, detail="Text extraction failed or no text found")

        # Log metrics
        mlflow.log_metric("extraction_time_seconds", processing_time)
        mlflow.log_metric("text_length", len(extracted_text))
        mlflow.log_metric("total_detections", total_detections)
        mlflow.log_metric("average_confidence", total_confidence / total_detections if total_detections > 0 else 0)

        # Log extracted text as artifact
        with open("extracted_text.txt", "w", encoding="utf-8") as f:
            f.write(extracted_text)
        mlflow.log_artifact("extracted_text.txt")
        os.remove("extracted_text.txt")

        # Classify the text using DistilBERT
        classification, confidence = classifier.classify(extracted_text, filename)
        confidence_str = str(round(confidence, 4))

        # Log combined results (optional, for reference)
        mlflow.log_param("classification", classification)
        mlflow.log_metric("classification_confidence", float(confidence_str))

        return DocumentResponse(
            document_name=filename,
            content=extracted_text,
            classification=classification,
            confidence=confidence_str
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

    with mlflow.start_run(run_name=f"multi_extraction_{int(time.time())}"):
        # Log parameters
        mlflow.log_param("file_count", len(files))
        mlflow.log_param("threshold", threshold)
        mlflow.log_param("return_images", return_images)

        for file in files:
            if not allowed_file(file.filename):
                print(f"Skipping invalid file: {file.filename}")
                mlflow.log_param(f"skipped_file_{file.filename}", "Invalid format")
                continue

            filename = file.filename.replace(" ", "_")
            file_data = await file.read()

            # Validate file size
            if len(file_data) > MAX_FILE_SIZE:
                print(f"Skipping file {filename}: File size exceeds 10 MB")
                mlflow.log_param(f"skipped_file_{filename}", "File size exceeds 10 MB")
                continue

            # Call detect_text_from_file
            start_time = time.time()
            try:
                detections, file_detections, file_confidence, image_base64 = detect_text_from_file(
                    file_data, filename, threshold=threshold, return_images=return_images
                )
                extracted_text = "\n".join([det["text"] for det in detections])
            except Exception as e:
                mlflow.log_param(f"extraction_error_{filename}", str(e))
                continue
            processing_time = time.time() - start_time

            total_detections += file_detections
            total_confidence += file_confidence

            # Log metrics for this file
            mlflow.log_metric(f"extraction_time_{filename}", processing_time)
            mlflow.log_metric(f"text_length_{filename}", len(extracted_text))
            mlflow.log_metric(f"detections_{filename}", file_detections)

            # Log extracted text as artifact
            with open(f"extracted_text_{filename}.txt", "w", encoding="utf-8") as f:
                f.write(extracted_text)
            mlflow.log_artifact(f"extracted_text_{filename}.txt")
            os.remove(f"extracted_text_{filename}.txt")

            # Classify the text
            classification, confidence = classifier.classify(extracted_text, filename) if extracted_text.strip() else ("N/A", 0.0)
            confidence_str = str(round(confidence, 4))

            result = {
                "filename": filename,
                "detections": detections,
                "classification": classification,
                "confidence": confidence_str,
                "image_base64": image_base64 if return_images else None
            }
            results.append(result)

        # Log aggregate metrics
        mlflow.log_metric("total_detections", total_detections)
        mlflow.log_metric("average_confidence", total_confidence / total_detections if total_detections > 0 else 0)
        mlflow.log_metric("total_extraction_time_seconds", processing_time)

        # Log results summary as artifact
        with open("multi_extraction_results.txt", "w", encoding="utf-8") as f:
            for result in results:
                f.write(f"Filename: {result['filename']}\nClassification: {result['classification']}\nConfidence: {result['confidence']}\n\n")
        mlflow.log_artifact("multi_extraction_results.txt")
        os.remove("multi_extraction_results.txt")

        average_confidence = total_confidence / total_detections if total_detections > 0 else 0

        return {
            "status": "success",
            "average_confidence": round(average_confidence, 4),
            "total_detections": total_detections,
            "results": results
        }