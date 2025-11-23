# ai_model.py
# Clean, production-ready version of your evaluation logic
# - Lazy loads heavy models to avoid Windows multiprocessing import issues
# - Robust rubric parsing with fallbacks for misspellings / merged headers

import multiprocessing
multiprocessing.freeze_support()

import pandas as pd
import numpy as np
import re
import math
import json
import nltk
from collections import Counter

# Lazy imports for heavy packages (will import inside init_models)
model = None
sentiment_analyzer = None
tool = None

# -------------------------
# DOWNLOAD NLTK TOKENIZERS
# -------------------------
# Quiet download; safe to call multiple times
nltk.download('punkt', quiet=True)

# -------------------------
# Deferred model loader
# -------------------------
def init_models(device: str = "cpu"):
    """
    Initialize heavy NLP models. Call this once before evaluation or it will be automatically
    called during first evaluation.
    """
    global model, sentiment_analyzer, tool

    if model is not None and sentiment_analyzer is not None and tool is not None:
        return

    # Import heavy modules here (lazy)
    from sentence_transformers import SentenceTransformer, util as _util
    from transformers import pipeline as _pipeline
    import language_tool_python as _ltp

    # Load models
    # SentenceTransformer (fast MiniLM)
    model = SentenceTransformer("all-MiniLM-L6-v2")
    # sentiment pipeline (uses default distilbert SST model)
    sentiment_analyzer = _pipeline("sentiment-analysis", truncation=True)
    # language tool
    tool = _ltp.LanguageTool('en-US')

    # attach util for internal use
    globals()['_st_util'] = _util


# -------------------------
# TEXT HELPERS
# -------------------------

FILLER_WORDS = set([
    "um", "uh", "like", "you know", "so", "actually",
    "basically", "right", "i mean", "hmm", "huh"
])

def clean_text(text):
    if not isinstance(text, str):
        return ""
    return re.sub(r"\s+", " ", text.strip())

def word_count(text):
    tokens = nltk.word_tokenize(text)
    return len(tokens), tokens

def distinct_word_ratio(text):
    tokens = [t.lower() for t in nltk.word_tokenize(text) if re.search(r"\w", t)]
    return len(set(tokens)) / len(tokens) if tokens else 0

def filler_word_rate(text):
    tokens = nltk.word_tokenize(text.lower())
    total = len(tokens)
    if total == 0:
        return 0.0, 0, 0

    joined = " " + " ".join(tokens) + " "
    count = 0
    for fw in FILLER_WORDS:
        # count occurrences of multi-word fillers too
        count += joined.count(" " + fw + " ")

    rate_per_100 = (count / total) * 100
    return rate_per_100, count, total

def compute_wpm(text, duration_sec):
    wc, _ = word_count(text)
    if not duration_sec or duration_sec <= 0:
        return None
    return wc / (duration_sec / 60.0)

def grammar_error_score(text):
    # ensure models are ready; grammar uses language_tool
    if not text or not text.strip():
        return 0.0, 0
    # lazy init models if needed (tool used)
    if tool is None:
        init_models()

    matches = tool.check(text)
    wc, _ = word_count(text)
    if wc == 0:
        return 0.0, len(matches)
    errors_per_100 = (len(matches) / wc) * 100.0
    score = 1.0 - min(errors_per_100 / 10.0, 1.0)
    return score, len(matches)

# -------------------------
# RUBRIC PARSING (robust)
# -------------------------

def normalize_columns(cols):
    return [re.sub(r"\s+", "_", str(c).strip().lower()) for c in cols]

def _find_header_row_for_keyword(raw_df, keywords):
    """
    Return the last row index where any of the keywords appear (prefer later header).
    """
    found = None
    for i, row in raw_df.iterrows():
        row_text = " ".join([str(x).strip().lower() for x in row.values if pd.notna(x)])
        for kw in keywords:
            if kw in row_text:
                found = i
                break
    return found

def load_rubric(excel_path):
    """
    READS EXCEL AND RETURNS:
    rubric_struct = {criteria: [entries]}
    overall_weights = {criteria: weight}

    This function is fault-tolerant: handles misspellings like 'creteria', merged headers,
    and falls back to default weights when needed.
    """
    raw = pd.read_excel(excel_path, header=None)

    # 1) Locate detailed rubric header (robust)
    header_row = _find_header_row_for_keyword(raw, ["criteria", "creteria", "criter"])
    if header_row is None:
        # try heuristic: look for 'metric' + 'scoring' row
        header_row = _find_header_row_for_keyword(raw, ["metric", "scoring", "weightage"])
    if header_row is None:
        raise ValueError("Could NOT find detailed rubric table header in Excel. Please ensure your sheet has a header row containing 'Criteria' or similar.")

    df = pd.read_excel(excel_path, header=header_row).dropna(how='all')
    df.columns = normalize_columns(df.columns)
    df = df.reset_index(drop=True)

    # helper to find columns flexibly
    def find_col_in_df(df_cols, patterns):
        for c in df_cols:
            for p in patterns:
                if p in c:
                    return c
        return None

    criteria_col = find_col_in_df(df.columns, ["criteria", "creteria", "criter", "crite"])
    metric_col = find_col_in_df(df.columns, ["metric"])
    scoring_col = find_col_in_df(df.columns, ["scoring"])
    keywords_col = find_col_in_df(df.columns, ["keyword", "key", "key_word"])
    score_attr_col = find_col_in_df(df.columns, ["score_attributed", "score_attr", "score"])
    total_score_col = find_col_in_df(df.columns, ["total", "max"])
    sample_col = find_col_in_df(df.columns, ["sample"])

    if criteria_col is None:
        raise ValueError("Could not locate criteria column in the detailed rubric table.")

    # forward-fill criteria if they are listed as section headers
    df[criteria_col] = df[criteria_col].ffill()

    parsed = []
    for _, r in df.iterrows():
        parsed.append({
            "criteria": str(r.get(criteria_col, "")).strip(),
            "metric": str(r.get(metric_col, "")).strip() if metric_col else "",
            "scoring_text": str(r.get(scoring_col, "")).strip() if scoring_col else "",
            "keywords": [k.strip() for k in re.split(r"[,\\n]+", str(r.get(keywords_col, ""))) if k.strip()] if keywords_col else [],
            "score_attr": r.get(score_attr_col, np.nan) if score_attr_col else np.nan,
            "total_score": r.get(total_score_col, np.nan) if total_score_col else np.nan,
            "sample_score": r.get(sample_col, np.nan) if sample_col else np.nan
        })

    df_parsed = pd.DataFrame(parsed)
    rubric_struct = {}
    for crit, group in df_parsed.groupby("criteria"):
        rubric_struct[crit] = group.to_dict(orient="records")

    # 2) Find overall weights (flexible)
    overall_row = _find_header_row_for_keyword(raw, ["overall", "overall rubrics", "overall rubric"])
    if overall_row is None:
        # fallback: search near header_row for a small table with 'weight' or 'weightage'
        overall_row = header_row - 3 if header_row - 3 >= 0 else 0

    # try to read a small slice first
    try:
        ov = pd.read_excel(excel_path, header=overall_row)
        ov.columns = normalize_columns(ov.columns)
    except Exception:
        ov = pd.DataFrame()  # fallback

    overall_weights = {}
    if not ov.empty:
        # detect criteria column in overall table using flexible matching
        crit_candidates = [c for c in ov.columns if any(p in c for p in ("criteria","creter","crite","criter"))]
        weight_candidates = [c for c in ov.columns if any(p in c for p in ("weight","wt","weightage"))]
        if crit_candidates and weight_candidates:
            crit_col2 = crit_candidates[0]
            weight_col = weight_candidates[0]
            for _, r in ov.iterrows():
                key = r.get(crit_col2)
                wt = r.get(weight_col)
                if pd.notna(key):
                    try:
                        overall_weights[str(key).strip()] = float(wt)
                    except Exception:
                        # skip rows with non-numeric weights
                        continue

    # If overall_weights empty -> fallback default map
    if not overall_weights:
        overall_weights = {
            "Content & Structure": 40,
            "Speech Rate": 10,
            "Language & Grammar": 20,
            "Clarity": 15,
            "Engagement": 15
        }

    return rubric_struct, overall_weights

# -------------------------
# SCORING MAPPERS
# -------------------------

def map_salutation(text):
    text = text.lower()
    if any(x in text for x in ["i am excited", "pleased to meet", "delighted"]):
        return 1.0
    if any(x in text for x in ["good morning", "good afternoon", "good evening"]):
        return 0.8
    if any(x in text for x in ["hi", "hello"]):
        return 0.4
    return 0.0

def map_keywords(text, entries):
    text = text.lower()
    must = []
    good = []
    for e in entries:
        kws = e.get("keywords", [])
        scoring_text = str(e.get("scoring_text","")).lower()
        if "must" in scoring_text or "must have" in scoring_text:
            must.extend(kws)
        else:
            good.extend(kws)

    found_must = [k for k in must if k and k in text]
    found_good = [k for k in good if k and k in text]

    must_score = (len(found_must) / len(must)) if len(must) > 0 else 1.0
    good_score = (len(found_good) / len(good)) if len(good) > 0 else 1.0

    return 0.7 * must_score + 0.3 * good_score

def map_flow(text):
    text = text.lower()
    # naive order check
    idx_sal = min([text.find(k) for k in ("hi","hello","good morning","good afternoon") if k in text] + [99999])
    idx_name = min([text.find(k) for k in ("my name is","i am ","i'm ") if k in text] + [99999])
    idx_origin = text.find("i am from") if "i am from" in text else (text.find("from") if "from" in text else 99999)
    return 1.0 if (idx_sal < idx_name < idx_origin) else 0.0

def map_speech_rate(wpm):
    if wpm is None:
        return 0.0
    if 111 <= wpm <= 140:
        return 1.0
    if 81 <= wpm <= 110:
        return 0.6
    if wpm > 160 or wpm < 80:
        return 0.2
    return 0.4

def map_grammar(score):
    if score > 0.9:
        return 1.0
    if score >= 0.7:
        return 0.8
    if score >= 0.5:
        return 0.6
    if score >= 0.3:
        return 0.4
    return 0.2

def map_ttr(ttr):
    if ttr >= 0.9:
        return 1.0
    if ttr >= 0.7:
        return 0.8
    if ttr >= 0.5:
        return 0.6
    if ttr >= 0.3:
        return 0.4
    return 0.2

def map_filler(rate):
    if rate <= 3:
        return 1.0
    if rate <= 6:
        return 0.8
    if rate <= 9:
        return 0.6
    if rate <= 12:
        return 0.4
    return 0.2

# -------------------------
# MAIN EVALUATION FUNCTION
# -------------------------

def evaluate_transcript(transcript, duration_sec, rubric_struct, overall_weights):
    """
    Returns a final score (0-100) + detailed breakdown + meta.
    This function will lazy-initialize heavy models if needed.
    """
    # ensure models are available for semantic similarity & sentiment & grammar
    if any(v is None for v in (globals().get('model'), globals().get('sentiment_analyzer'), globals().get('tool'))):
        init_models()

    # get util alias (sentence-transformers util)
    st_util = globals().get('_st_util', None)

    text = clean_text(transcript)
    wc, tokens = word_count(text)
    wpm = compute_wpm(text, duration_sec)
    ttr = distinct_word_ratio(text)
    filler_rate, filler_count, total_tokens = filler_word_rate(text)
    grammar_score_val, grammar_errors = grammar_error_score(text)

    # sentiment
    try:
        sent = sentiment_analyzer(text[:512])[0]
        sent_prob = sent['score'] if sent['label'].upper() == 'POSITIVE' else (1.0 - sent['score'])
    except Exception:
        sent_prob = 0.5

    total = 0.0
    weight_sum = sum(overall_weights.values()) if overall_weights else 1.0
    details = []

    for crit, entries in (rubric_struct.items() if isinstance(rubric_struct, dict) else []):
        weight = overall_weights.get(crit, 1.0)

        metric = ""
        if entries and isinstance(entries, list):
            metric = str(entries[0].get("metric","")).lower()

        if "salutation" in metric or "salutation" in " ".join([e.get('scoring_text','').lower() for e in entries]):
            score = map_salutation(text)
        elif "keyword" in metric or any('keyword' in str(e.get('scoring_text','')).lower() for e in entries):
            score = map_keywords(text, entries)
        elif "flow" in metric or any('flow' in str(e.get('scoring_text','')).lower() for e in entries):
            score = map_flow(text)
        elif "speech" in metric or "rate" in metric:
            score = map_speech_rate(wpm)
        elif "grammar" in metric or "language & grammar" in crit.lower():
            score = map_grammar(grammar_score_val)
        elif "vocabulary" in metric or "ttr" in metric:
            score = map_ttr(ttr)
        elif "filler" in metric or "filler" in " ".join([e.get('scoring_text','').lower() for e in entries]):
            score = map_filler(filler_rate)
        elif "sentiment" in metric or "engagement" in crit.lower():
            score = sent_prob
        else:
            # fallback semantic similarity
            desc = " ".join([e.get("scoring_text","") for e in entries]) if entries else crit
            try:
                sim = float(st_util.cos_sim(model.encode(text), model.encode(desc)).item())
            except Exception:
                sim = 0.0
            score = sim

        details.append({
            "criterion": crit,
            "metric": metric,
            "score_normalized": float(score),
            "weight": float(weight)
        })
        total += float(score) * float(weight)

    final_score = (total / weight_sum) * 100.0 if weight_sum else 0.0

    meta = {
        "word_count": wc,
        "duration_sec": duration_sec,
        "wpm": wpm,
        "ttr": ttr,
        "grammar_score": grammar_score_val,
        "grammar_errors": grammar_errors,
        "filler_rate_per_100": filler_rate,
        "sentiment_prob": sent_prob
    }

    return round(final_score, 2), details, meta

# -------------------------
# IF RUN AS SCRIPT (Optional)
# -------------------------

if __name__ == "__main__":
    # Example usage
    # Note: do not place heavy imports at module import time in production servers on Windows.
    # We initialize models here explicitly for local runs.
    init_models()
    rubric_struct, weights = load_rubric("Case study for interns.xlsx")

    sample_text = "Hi, my name is Nikhitha. I am from Hyderabad."
    score, details, meta = evaluate_transcript(sample_text, 50, rubric_struct, weights)

    print(json.dumps({
        "overall_score": score,
        "details": details,
        "meta": meta
    }, indent=2))
