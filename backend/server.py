from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

# Import AI model functions
from ai_model import load_rubric, evaluate_transcript

# ---------------------------------------
# LOAD RUBRIC ONCE
# ---------------------------------------
RUBRIC_PATH = "Case study for interns.xlsx"

if not os.path.exists(RUBRIC_PATH):
    raise FileNotFoundError(f"Rubric file not found at: {RUBRIC_PATH}")

rubric_struct, overall_weights = load_rubric(RUBRIC_PATH)

# ---------------------------------------
# FASTAPI APP
# ---------------------------------------
app = FastAPI()

# Enable CORS for frontend (React/Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # allow all for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------
# ROUTES
# ---------------------------------------

@app.get("/")
def home():
    return {"message": "Speech Evaluation Backend Running ✔"}

@app.post("/evaluate")
def evaluate_api(
    transcript: str = Form(...),
    duration: str = Form(None),
):
    # Convert duration to float safely
    try:
        dur = float(duration) if duration else None
    except:
        dur = None

    # Run evaluation
    score, details, meta = evaluate_transcript(
        transcript,
        dur,
        rubric_struct,
        overall_weights
    )

    return {
        "overall_score": score,
        "details": details,
        "meta": meta
    }

# ---------------------------------------
# RUN LOCAL SERVER
# ---------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )

