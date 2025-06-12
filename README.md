# 📄 Document Extraction & Classification App

## ✅ Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download)
- **PostgreSQL** (e.g., version 15+)
- Python 3.9+
- Node.js 18+

---

## 🧪 Steps to Run

### 0. Install & Set Up PostgreSQL
```bash
# Download PostgreSQL from: https://www.postgresql.org/download/
# Create a database ( doc_classifier)
# Create a user and grant access to the database

```

➡️ Update the connection string in:
```
backend/appsettings.json
```

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=doc_classifier;Username=myuser;Password=mypassword"
}
```

---

### 1. Clone the project
```bash
git clone https://github.com/fatiha-izmouh/Document-classifier.git
cd Document-classifier
```

---

### 2. Setup and run the frontend
```bash
npm install
npm run dev
```

---

### 3. Setup and run the Python backend
```bash
cd python-script
python -m venv venv
.\venv\Scripts\activate         # On Windows
# Or: source venv/bin/activate  (Linux/macOS)
pip install -r requirements.txt
uvicorn app:app --reload
```

---

### 4. Setup and run the .NET backend
```bash
cd ../backend
dotnet restore
dotnet ef database update
dotnet run
```

---

## 📁 Important Notes

Some files are too large for GitHub and are therefore not included in this repo.

➡️ Please download them from this Google Drive link:  
🔗 https://drive.google.com/drive/folders/12UQmevYM5LQwMAZADbEFc59fUO5xqu_w?usp=sharing

📂 Then place the downloaded folder inside the following directory:

```
.\src\
```

Make sure the folder `roberta_base_classifier` is correctly placed under `src/` as expected by the application.
