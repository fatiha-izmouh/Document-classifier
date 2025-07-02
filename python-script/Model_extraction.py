import os
import io
import re
from typing import Dict, List
from PIL import Image
import PyPDF2
import fitz
from pdf2image import convert_from_bytes
import cv2
import numpy as np
import base64
import requests
import json
from dotenv import load_dotenv

# Docling imports
from docling.document_converter import DocumentConverter

# Load API keys
load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Path to Entities.txt
ENTITIES_FILE = os.path.join(os.path.dirname(__file__), "Entities.txt")

# API URLs
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

def load_field_definitions(doc_type: str) -> List[str]:
    """Load field names from Entities.txt for a given document type."""
    fields = []
    try:
        with open(ENTITIES_FILE, "r", encoding="utf-8") as f:
            content = f.read()
            pattern = rf"{doc_type.lower()}\s*:\s*\[(.*?)\]"
            match = re.search(pattern, content, re.DOTALL)
            if match:
                fields = [field.strip() for field in match.group(1).split(",") if field.strip()]
    except Exception as e:
        print(f"Error loading entities for {doc_type}: {str(e)}")
    return fields

def extract_fields_with_openrouter(text: str, field_names: List[str]) -> Dict[str, str]:
    """Extract fields from text using OpenRouter API."""
    if not text or not isinstance(text, str) or not text.strip():
        return {field: "N/A" for field in field_names}
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY.strip()}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-app.com",
        "X-Title": "PDF Field Extractor"
    }
    
    prompt = (
        "You are an intelligent document assistant. Extract the following fields from the content below. "
        "Return only a JSON object where each field has a value or 'N/A' if not found.\n\n"
        f"Fields: {json.dumps(field_names)}\n\n"
        f"Content:\n{text[:1000]}\n\n"
        "Example output: {\"field1\": \"value\", \"field2\": \"N/A\"}"
    )
    
    payload = {
        "model": "deepseek/deepseek-r1:free",
        "messages": [
            {"role": "system", "content": "Return only a valid JSON object."},
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }
    
    try:
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        response_data = response.json()
        content = response_data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        extracted_fields = json.loads(content)
        return {field: extracted_fields.get(field, "N/A") for field in field_names}
    except Exception as e:
        print(f"OpenRouter extraction error: {str(e)}")
        return {field: "N/A" for field in field_names}

def extract_text_with_docling_from_pdf(file_data: bytes) -> str:
    """Extract text from PDF bytes using Docling document converter."""
    try:
        converter = DocumentConverter()
        document = converter.convert(file_data)
        # You can choose export_to_markdown or export_to_text
        text = document.export_to_markdown()  # returns a string with text + structure
        return text
    except Exception as e:
        print(f"Docling PDF extraction error: {str(e)}")
        return ""

def extract_text_with_docling_from_image(image: Image.Image) -> str:
    """Extract text from an image using Docling."""
    try:
        converter = DocumentConverter()
        # Docling expects bytes, so convert image to bytes PNG
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_bytes = buffered.getvalue()
        document = converter.convert(img_bytes)
        text = document.export_to_markdown()
        return text
    except Exception as e:
        print(f"Docling image extraction error: {str(e)}")
        return ""

def detect_text_from_file(file_data, filename, doc_type: str, threshold=0.5, return_images=False):
    """Detect text from a PDF or image file and extract fields using OpenRouter."""
    content_type = "application/pdf" if filename.lower().endswith('.pdf') else "image"
    print(f"\nProcessing file: {filename} (Type: {content_type})")

    detections = []
    total_detections = 0
    total_confidence = 0
    image_base64 = None
    extracted_fields = {}

    field_names = load_field_definitions(doc_type)

    if content_type == "application/pdf":
        # First try to extract selectable text via PyPDF2
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_data))
            pdf_text = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                pdf_text += text if text else ""

            if pdf_text.strip():
                detections.append({
                    "text": pdf_text,
                    "confidence": 1.0,
                    "bounding_box": None,
                    "page_number": None,
                    "is_embedded_image": False
                })
                total_detections += 1
                total_confidence += 1.0
                extracted_fields = extract_fields_with_openrouter(pdf_text, field_names)
            else:
                # No selectable text — use Docling to parse full PDF content
                docling_text = extract_text_with_docling_from_pdf(file_data)
                if docling_text.strip():
                    detections.append({
                        "text": docling_text,
                        "confidence": 1.0,
                        "bounding_box": None,
                        "page_number": None,
                        "is_embedded_image": False
                    })
                    total_detections += 1
                    total_confidence += 1.0
                    extracted_fields = extract_fields_with_openrouter(docling_text, field_names)
                else:
                    print("Docling extracted no text from PDF.")
        except Exception as e:
            print(f"Error processing PDF {filename}: {str(e)}")
            detections.append({
                "text": f"Error processing PDF: {str(e)}",
                "confidence": 0.0,
                "bounding_box": None,
                "page_number": None,
                "is_embedded_image": False
            })

    else:
        # Image file processing
        try:
            image = cv2.imdecode(np.frombuffer(file_data, np.uint8), cv2.IMREAD_COLOR)
            image_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            docling_text = extract_text_with_docling_from_image(image_pil)
            if docling_text.strip():
                detections.append({
                    "text": docling_text,
                    "confidence": 1.0,
                    "bounding_box": None,
                    "page_number": None,
                    "is_embedded_image": False
                })
                total_detections += 1
                total_confidence += 1.0
                extracted_fields = extract_fields_with_openrouter(docling_text, field_names)
            else:
                print("Docling extracted no text from image.")

            if return_images:
                buffered = io.BytesIO()
                image_pil.save(buffered, format="PNG")
                image_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        except Exception as e:
            print(f"Error processing image {filename}: {str(e)}")

    extracted_text = "\n".join([d['text'] for d in detections if d['text']])
    print(f"Final extracted text (first 200 chars): {extracted_text[:200]}...")
    return detections, total_detections, total_confidence, image_base64, extracted_fields
