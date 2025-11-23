# Speech Evaluation AI

Speech Evaluation AI is an automated system that evaluates spoken transcripts using
NLP techniques, FastAPI, and custom rubric scoring.  
The system analyzes speech clarity, grammar, sentiment, filler words, content structure,
speech rate (WPM), and rubric-based scoring.

This project includes:
- 🧠 **FastAPI Backend** (Python)
- ⚛️ **React + Vite Frontend**
- 📊 **Rubric-based scoring from Excel**
- 🔍 **Detailed scoring breakdown**
- 🚀 **Model-based semantic similarity**
- 🎯 **LanguageTool grammar evaluation**
- ❤️ **Transformer sentiment analysis**

---

# 🚀 Features

### ✔ Evaluate transcripts automatically  
### ✔ Supports custom rubric loaded from Excel  
### ✔ Returns  
- Total score  
- Category-wise scores  
- Metrics (WPM, Grammar, TTR, Filler Rate, Sentiment)  
- Detailed breakdown  

### ✔ Fast inference using:
- Sentence Transformer (`all-MiniLM-L6-v2`)  
- HuggingFace sentiment pipeline  
- LanguageTool grammar checker  

---

# 📂 Folder Structure

Speach/
│
├── speaksmart-ai/ # React + Vite Frontend
│
└── backend/ # FastAPI + Model Backend
├── server.py
├── ai_model.py
├── Case study for interns.xlsx
└── requirements.txt

yaml
Copy code

---

# 🧠 Scoring Methodology (Formula)

Each rubric criterion has:

- **Weight (%)**
- **Metric classifier**
- **Score normalized (0–1)**

### **Final Score Calculation**

For each criterion:
weighted_score = normalized_score × weight

Final Score = (sum of all weighted_score) / (sum of all weights) × 100

markdown
Copy code

### **Metrics used**
| Metric | Description |
|--------|-------------|
| **WPM** | Words per minute |
| **TTR** | Type–Token Ratio (Vocabulary richness) |
| **Filler Rate** | Filler words per 100 words |
| **Grammar Score** | Inverse grammar-error rate using LanguageTool |
| **Flow Mapping** | Speech order consistency |
| **Keyword Mapping** | Checking presence of important keywords |
| **Sentiment** | Positive engagement indicator |
| **Semantic Similarity** | MiniLM similarity score for fallback |

---

# 🖥 Running Instructions

## 🔧 Backend (FastAPI)

### 1. Go to backend folder
cd backend

shell
Copy code

### 2. Create virtual environment
python -m venv venv

makefile
Copy code

### 3. Activate environment  
Windows:
venv\Scripts\activate

makefile
Copy code
Mac/Linux:
source venv/bin/activate

shell
Copy code

### 4. Install dependencies
pip install -r requirements.txt

shell
Copy code

### 5. Run server
uvicorn server:app --host=0.0.0.0 --port=8000

arduino
Copy code

Backend will run at:
http://localhost:8000

yaml
Copy code

---

## ⚛️ Frontend (React + Vite)

### 1. Navigate to frontend folder
cd speaksmart-ai

shell
Copy code

### 2. Install dependencies
npm install

shell
Copy code

### 3. Start local dev server
npm run dev

yaml
Copy code

Frontend runs at:
http://localhost:5173

yaml
Copy code

---

# 🔗 Connecting Frontend to Backend

Create `.env` inside `speaksmart-ai/`:

VITE_API_URL="http://localhost:8000"

css
Copy code

Access backend in your React code:

```js
fetch(`${import.meta.env.VITE_API_URL}/evaluate`, {
  method: "POST",
  body: formData
});
📬 API Documentation
POST /evaluate
Evaluates transcript using form-data.

Request (multipart/form-data):
Name	Type	Required
transcript	string	Yes
duration	number	Optional

Response:
json
Copy code
{
  "overall_score": 75.4,
  "details": [...],
  "meta": {...}
}
