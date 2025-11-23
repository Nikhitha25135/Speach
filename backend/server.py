from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import AI model functions
from ai_model import load_rubric, evaluate_transcript

# ---------------------------------------
# LOAD RUBRIC ONCE WHEN SERVER STARTS
# ---------------------------------------
rubric_struct, overall_weights = load_rubric("Case study for interns.xlsx")

app = FastAPI()

# Enable CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/evaluate")
def evaluate_api(
    transcript: str = Form(...),
    duration: str = Form(None)
):
    # Convert duration to float
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


# Run server only when executed directly (fix for Windows)
if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
