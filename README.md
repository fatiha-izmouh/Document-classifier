# 📄 Document Extraction & Classification App

This application allows users to upload PDF or image documents, extract text using OCR, and classify the document type using a pre-trained NLP model. It is built with a modern stack using React, FastAPI, EasyOCR, and Hugging Face Transformers.

---

## 🧰 Tech Stack

- **Frontend:** React.js
- **Backend:** FastAPI (Python)
- **OCR Engine:** EasyOCR + PyMuPDF (fallback to image-based OCR)
- **Classification Model:** DistilBERT (Hugging Face Transformers)
- **Containerization:** Docker + Docker Compose
- **Model Management (optional):** MLflow

---

## 🚀 Features

- Drag & drop PDF/image upload
- Intelligent OCR extraction (text-based fallback to image-based)
- Document classification (e.g., CV, Invoice, Report)
- Real-time results displayed with download options

---

## 🛠️ Setup Instructions

### ✅ Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/install/)
- (Alternative) Python 3.9+ and Node.js 18+ if installing manually

---

### 📦 Using Docker (Recommended)

```bash
git clone https://github.com/yourusername/doc-processing-app.git
cd doc-processing-app
docker-compose up --build


