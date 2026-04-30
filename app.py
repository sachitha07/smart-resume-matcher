"""
Smart Resume Matcher - Backend
Uses TF-IDF + Cosine Similarity for matching
Falls back gracefully if sentence-transformers is not installed
"""

from flask import Flask, request, jsonify, render_template
import pdfplumber
import re
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max upload

# ─────────────────────────────────────────────
# Common tech / professional skill keywords
# ─────────────────────────────────────────────
SKILL_KEYWORDS = [
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go",
    "rust", "swift", "kotlin", "php", "scala", "r", "matlab", "perl",
    # Web
    "html", "css", "react", "angular", "vue", "node", "nodejs", "express",
    "django", "flask", "fastapi", "spring", "rails", "jquery", "bootstrap",
    "tailwind", "graphql", "rest", "api", "json", "xml",
    # Data / ML / AI
    "machine learning", "deep learning", "nlp", "natural language processing",
    "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn",
    "pandas", "numpy", "matplotlib", "seaborn", "opencv", "hugging face",
    "transformers", "bert", "gpt", "llm", "data science", "data analysis",
    "data visualization", "statistical analysis", "regression", "classification",
    # Cloud / DevOps
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "ci/cd",
    "jenkins", "github actions", "terraform", "ansible", "linux", "unix",
    "bash", "shell scripting", "devops", "microservices", "serverless",
    # Databases
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
    "cassandra", "sqlite", "oracle", "nosql", "firebase",
    # Tools / Other
    "git", "github", "gitlab", "jira", "agile", "scrum", "excel",
    "tableau", "power bi", "spark", "hadoop", "kafka", "airflow",
    "selenium", "pytest", "junit", "tdd", "oop", "solid", "design patterns",
    # Soft skills
    "communication", "teamwork", "leadership", "problem solving",
    "project management", "critical thinking", "collaboration",
    "time management", "adaptability"
]


def extract_text_from_pdf(file) -> str:
    """Extract all text from an uploaded PDF file."""
    text = ""
    try:
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        raise ValueError(f"Could not read PDF: {str(e)}")
    return text.strip()


def extract_skills(text: str) -> set:
    """Extract skill keywords found in the given text."""
    text_lower = text.lower()
    found = set()
    for skill in SKILL_KEYWORDS:
        # Use word boundary matching for single words, substring for phrases
        if " " in skill:
            if skill in text_lower:
                found.add(skill)
        else:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found.add(skill)
    return found


def compute_similarity(text1: str, text2: str) -> float:
    """Compute TF-IDF cosine similarity between two texts."""
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
    try:
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return round(float(score) * 100, 1)
    except Exception:
        return 0.0


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/match", methods=["POST"])
def match():
    # Validate inputs
    if "resume" not in request.files:
        return jsonify({"error": "No resume file uploaded."}), 400

    resume_file = request.files["resume"]
    job_description = request.form.get("job_description", "").strip()

    if resume_file.filename == "":
        return jsonify({"error": "No file selected."}), 400
    if not resume_file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported."}), 400
    if not job_description:
        return jsonify({"error": "Job description cannot be empty."}), 400

    # Extract resume text
    try:
        resume_text = extract_text_from_pdf(resume_file)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if not resume_text:
        return jsonify({"error": "Could not extract text from PDF. Make sure it's not a scanned image."}), 400

    # Compute similarity score
    score = compute_similarity(resume_text, job_description)

    # Extract skills
    resume_skills = extract_skills(resume_text)
    jd_skills = extract_skills(job_description)

    matched_skills = sorted(resume_skills & jd_skills)
    missing_skills = sorted(jd_skills - resume_skills)

    # Boost score slightly if many skills match (blend TF-IDF with skill overlap)
    if jd_skills:
        skill_overlap = len(matched_skills) / len(jd_skills)
        blended_score = round((score * 0.65 + skill_overlap * 100 * 0.35), 1)
    else:
        blended_score = score

    blended_score = min(blended_score, 99.0)  # cap at 99

    return jsonify({
        "score": blended_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "resume_word_count": len(resume_text.split()),
        "jd_word_count": len(job_description.split()),
    })


if __name__ == "__main__":
    print("\n🚀 Smart Resume Matcher running at http://127.0.0.1:5000\n")
    app.run(debug=True)
