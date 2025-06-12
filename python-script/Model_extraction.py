import os
import io
import re
from typing import Dict, List, Tuple, Optional
from PIL import Image
import PyPDF2
import fitz
from pdf2image import convert_from_bytes
import cv2
import numpy as np
import base64
import requests
from dotenv import load_dotenv

# Load API key
load_dotenv()
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

# Path to Entities.txt
ENTITIES_FILE = os.path.join(os.path.dirname(__file__), "Entities.txt")

def load_field_definitions(doc_type: str) -> List[str]:
    """Load field names from Entities.txt for a given document type."""
    fields = []
    try:
        with open(ENTITIES_FILE, "r", encoding="utf-8") as f:
            content = f.read()
            # Find the section for the document type
            pattern = rf"{doc_type.lower()}\s*:\s*\[(.*?)\]"
            match = re.search(pattern, content, re.DOTALL)
            if match:
                # Split fields and clean them
                fields = [field.strip() for field in match.group(1).split(",") if field.strip()]
    except Exception as e:
        print(f"Error loading entities for {doc_type}: {str(e)}")
    return fields

def extract_fields(text: str, field_names: List[str]) -> Dict[str, str]:
    """Extract fields from text using regex patterns."""
    extracted_fields = {}
    for field_name in field_names:
        # Create a regex pattern to match the field name followed by a value
        pattern = rf"{re.escape(field_name)}\s*[:=]\s*(.*?)(?:\n|$)"
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        extracted_fields[field_name] = match.group(1).strip() if match else "N/A"
    return extracted_fields

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

def detect_text_from_file(file_data, filename, doc_type: str, threshold=0.5, return_images=False):
    content_type = "application/pdf" if filename.lower().endswith('.pdf') else "image"
    print(f"\nProcessing file: {filename} (Type: {content_type})")

    detections = []
    total_detections = 0
    total_confidence = 0
    image_base64 = None
    extracted_fields = {}

    # Load field definitions for the document type
    field_names = load_field_definitions(doc_type)

    if content_type == "application/pdf":
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_data))
            pdf_text = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                if text:
                    pdf_text += text

            print(f"Extracted text from PDF: {pdf_text[:100]}...")

            if pdf_text.strip():
                detections = [{
                    "text": pdf_text,
                    "confidence": 1.0,
                    "bounding_box": None,
                    "page_number": None,
                    "is_embedded_image": False
                }]
                total_detections += 1
                total_confidence += 1.0
                # Extract fields from the text
                extracted_fields = extract_fields(pdf_text, field_names)
            else:
                print("No selectable text found. Converting PDF to images for OCR...")
                images = convert_from_bytes(file_data)
                print(f"Converted PDF to {len(images)} image(s).")

                pdf_document = fitz.open(stream=file_data, filetype="pdf")
                embedded_images = []
                for page_num in range(len(pdf_document)):
                    page = pdf_document[page_num]
                    image_list = page.get_images(full=True)
                    for img_index, img in enumerate(image_list):
                        xref = img[0]
                        base_image = pdf_document.extract_image(xref)
                        image_bytes = base_image["image"]
                        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                        embedded_images.append((image, page_num + 1))
                        print(f"Extracted embedded image {img_index + 1} from page {page_num + 1}")

                images_to_process = [(img, i+1, False) for i, img in enumerate(images)] + \
                                    [(img, page_num, True) for img, page_num in embedded_images]

                for image, page_num, is_embedded in images_to_process:
                    ocr_text, confidence = call_mistralocr_api(image)
                    if confidence >= threshold and ocr_text.strip():
                        detections.append({
                            "text": ocr_text,
                            "confidence": confidence,
                            "bounding_box": None,
                            "page_number": page_num,
                            "is_embedded_image": is_embedded
                        })
                        total_detections += 1
                        total_confidence += confidence
                        # Extract fields from OCR text
                        if ocr_text.strip():
                            fields = extract_fields(ocr_text, field_names)
                            extracted_fields.update({k: v for k, v in fields.items() if v != "N/A"})

                pdf_document.close()
        except Exception as e:
            print(f"Error processing PDF {filename}: {str(e)}")
            detections = [{
                "text": f"Error processing PDF: {str(e)}",
                "confidence": 0.0,
                "bounding_box": None,
                "page_number": None,
                "is_embedded_image": False
            }]
    else:
        image = cv2.imdecode(np.frombuffer(file_data, np.uint8), cv2.IMREAD_COLOR)
        image_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        ocr_text, confidence = call_mistralocr_api(image_pil)

        if confidence >= threshold and ocr_text.strip():
            detections.append({
                "text": ocr_text,
                "confidence": confidence,
                "bounding_box": None,
                "page_number": None,
                "is_embedded_image": False
            })
            total_detections += 1
            total_confidence += confidence
            # Extract fields from OCR text
            extracted_fields = extract_fields(ocr_text, field_names)

        if return_images:
            buffered = io.BytesIO()
            image_pil.save(buffered, format="PNG")
            image_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    extracted_text = "\n".join([d['text'] for d in detections if d['text'].strip()])
    return detections, total_detections, total_confidence, image_base64, extracted_fields