# 📄 Document Extraction & Classification App

## 🛠️ Setup Instructions

### ✅ Prerequisites

- Python 3.9+  
- Node.js 18+  

---

### 🧪 Steps to Run

1. **Clone the project**
```bash
git clone https://github.com/fatiha-izmouh/Document-classifier.git
cd Document-classifier
```

2. **Start the frontend**
```bash
npm install
npm run dev
```

3. **Start the backend**
```bash
cd python-script
python -m venv venv
.\venv\Scripts\activate         # On Windows
# Or use: source venv/bin/activate  (on Linux/macOS)

pip install -r requirements.txt
uvicorn app:app --reload
```

---

### 📁 Important Notes

Some files are too large for GitHub and are therefore not included in this repo.

➡️ Please download them from this Google Drive link:  
🔗 **https://drive.google.com/drive/folders/1Ld8Pn3wgDDDwGU8P09K4vRWrYWS6ep8R?usp=sharing)**

📂 Then place the downloaded folder inside the following directory:

```
.\src\
```

Make sure the folder `roberta_base_classifier` is correctly placed under `src/` as expected by the application.
