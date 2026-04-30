# 🎯 Smart Resume Matcher

A modern web application that matches your resume against a job description using NLP (TF-IDF + Cosine Similarity). Runs 100% locally — no API keys or internet connection required after setup.

---

## 📸 Features

- Upload a PDF resume
- Paste any job description
- See a **match score** (0–100%)
- See **matched skills** (skills in both your resume and the job)
- See **missing skills** (skills required by the job but absent from your resume)
- Actionable next steps based on your score

---

## 🗂️ Project Structure

```
smart-resume-matcher/
│
├── app.py                  # Flask backend (NLP logic)
├── requirements.txt        # Python dependencies
├── README.md               # This file
│
├── templates/
│   └── index.html          # Frontend HTML
│
└── static/
    ├── style.css           # Styling
    └── app.js              # Frontend JavaScript
```

---

## ⚙️ Setup Instructions (Step-by-Step)

### Step 1 — Prerequisites

Make sure you have **Python 3.8 or higher** installed.

```bash
python --version   # Should print Python 3.8+
```

### Step 2 — Navigate to the project folder

```bash
cd smart-resume-matcher
```

### Step 3 — Create a virtual environment (recommended)

```bash
# Create
python -m venv venv

# Activate (Mac/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

### Step 4 — Install dependencies

```bash
pip install -r requirements.txt
```

This installs:
| Package | Purpose |
|---|---|
| `flask` | Web framework (backend server) |
| `pdfplumber` | Extract text from PDF files |
| `scikit-learn` | TF-IDF vectorizer + cosine similarity |

### Step 5 — Run the app

```bash
python app.py
```

You should see:
```
🚀 Smart Resume Matcher running at http://127.0.0.1:5000
```

### Step 6 — Open in browser

Go to: **http://127.0.0.1:5000**

---

## 🧠 How the Matching Works

1. **Text Extraction** — `pdfplumber` extracts raw text from the uploaded PDF resume.

2. **Skill Extraction** — Both the resume and job description are scanned for ~100 known technical and professional keywords (programming languages, frameworks, tools, soft skills, etc.).

3. **TF-IDF Similarity** — The full text of the resume and job description are vectorized using `TfidfVectorizer` with bigrams (`ngram_range=(1,2)`), then compared using **cosine similarity**.

4. **Blended Score** — Final score = 65% TF-IDF similarity + 35% skill keyword overlap ratio. This gives a more balanced result.

5. **Results** — Matched skills (in both), missing skills (in JD but not resume), and a verdict with tips.

---

## 💡 Tips for Best Results

- Use a **text-based PDF** (not a scanned image). If your PDF was created from a Word doc, it will work great.
- Paste the **complete job description** including requirements and qualifications.
- A score of **60%+** is generally a good match for applying.

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` again |
| "Could not extract text from PDF" | Your PDF may be a scanned image; try a different PDF |
| Port already in use | Change `app.run(port=5001)` in `app.py` |
| Blank results | Make sure the job description is at least 50 characters |

---

```bash
pip install sentence-transformers
```

Then in `app.py`, replace the `compute_similarity` function with:

```python
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')  # downloads ~80MB on first run

def compute_similarity(text1: str, text2: str) -> float:
    emb1 = model.encode(text1, convert_to_tensor=True)
    emb2 = model.encode(text2, convert_to_tensor=True)
    score = util.cos_sim(emb1, emb2).item()
    return round(score * 100, 1)
```

This uses a local neural model (no API calls) and provides better semantic understanding.

---

## 📝 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Python 3 + Flask
- **NLP**: scikit-learn (TF-IDF + Cosine Similarity)
- **PDF Parsing**: pdfplumber

---

## Author

Sachitha Ravichandran

---
