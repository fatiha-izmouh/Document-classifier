import os
import io
import time
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict
import mlflow
from dotenv import load_dotenv
from Model_extraction import detect_text_from_file
from Model_classification import DocumentClassifier
from PIL import Image
import PyPDF2

# Load environment variables
load_dotenv()

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

# Set MLflow tracking URI and experiment
mlflow.set_tracking_uri("file:///C:/developpement/Document-classifier/python-script/mlruns")
mlflow.set_experiment("Document_Text_Extraction")

# Initialize the classifier
model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "roberta_base_classifier"))
classifier = DocumentClassifier(model_path=model_path)

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class DocumentResponse(BaseModel):
    document_name: str
    content: str
    classification: str
    confidence: str
    fields: Dict[str, str]

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

    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10 MB")

    run = None
    try:
        run = mlflow.start_run(run_name=f"extraction_{filename}_{int(time.time())}")
        mlflow.log_param("filename", filename)
        mlflow.log_param("file_size_mb", len(file_data) / (1024 * 1024))
        mlflow.log_param("file_type", file.content_type)

        start_time = time.time()
        try:
            # First classify to get document type
            extracted_text_temp = ""
            content_type = "application/pdf" if filename.lower().endswith('.pdf') else "image"
            if content_type == "application/pdf":
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_data))
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text = page.extract_text()
                    if text:
                        extracted_text_temp += text
                if not extracted_text_temp.strip():
                    images = convert_from_bytes(file_data)
                    for image in images:
                        ocr_text, _ = call_mistralocr_api(image)
                        extracted_text_temp += ocr_text + "\n"
            else:
                image = cv2.imdecode(np.frombuffer(file_data, np.uint8), cv2.IMREAD_COLOR)
                image_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
                extracted_text_temp, _ = call_mistralocr_api(image_pil)

            classification, confidence = classifier.classify(extracted_text_temp, filename)
            confidence_str = str(round(confidence, 4))

            # Now extract text and fields with the classified document type
            detections, total_detections, total_confidence, image_base64, extracted_fields = detect_text_from_file(
                file_data, filename, doc_type=classification
            )
            extracted_text = "\n".join([d['text'] for d in detections if d['text'].strip()])
        except Exception as e:
            mlflow.log_param("extraction_error", str(e))
            raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

        processing_time = time.time() - start_time

        print(f"Extracted text for {filename}: {extracted_text[:100]}...")
        print(f"Extracted fields: {extracted_fields}")

        if not extracted_text.strip():
            mlflow.log_param("extraction_error", "No text found")
            raise HTTPException(status_code=500, detail="Text extraction failed or no text found")

        mlflow.log_metric("extraction_time_seconds", processing_time)
        mlflow.log_metric("text_length", len(extracted_text))
        mlflow.log_metric("total_detections", total_detections)
        mlflow.log_metric("total_confidence", total_confidence)
        mlflow.log_param("classification", classification)
        mlflow.log_metric("classification_confidence", float(confidence_str))
        mlflow.log_dict(extracted_fields, "extracted_fields.json")

        with open("extracted_text.txt", "w", encoding="utf-8") as f:
            f.write(extracted_text)
        mlflow.log_artifact("extracted_text.txt")
        os.remove("extracted_text.txt")

        return DocumentResponse(
            document_name=filename,
            content=extracted_text,
            classification=classification,
            confidence=confidence_str,
            fields=extracted_fields
        )
    except Exception as e:
        mlflow.log_param("error", str(e))
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        if run:
            mlflow.end_run()

def call_mistralocr_api(image: Image.Image, model="pixtral-12b-2409"):
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    image_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    url = "https://api.mistralocr.com/v1/ocr"
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "image": image_base64,
        "output_format": "text"
    }

    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 200:
        result = response.json()
        return result.get("text", ""), 1.0
    else:
        print(f"API error: {response.status_code} - {response.text}")
        return f"API call failed: {response.status_code}", 0.0