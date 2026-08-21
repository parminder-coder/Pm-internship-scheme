"""
=============================================================================
INTEGRATED RESUME PIPELINE: MONGODB INPUT -> PARSER -> JSON TO ML MODEL & CONSOLE
=============================================================================
Workflow:
1. Simulates/Ingests candidate data records from MongoDB (with dynamic overrides).
2. Runs the multi-tier font, contact, skill, and project extraction pipeline.
3. Produces a standardized JSON payload transmitted directly to the ML Model.
4. Outputs the final structured result to the console as valid JSON.
=============================================================================
"""

import os
import re
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

# ---------------------------------------------------------------------------
# Zero-Dependency JSON Formatter (Crash-proof serialization)
# ---------------------------------------------------------------------------
def custom_json_dumps(obj: Any, indent: int = 2, level: int = 0) -> str:
    spaces = " " * (indent * level)
    next_spaces = " " * (indent * (level + 1))
    
    if obj is None:
        return "null"
    elif isinstance(obj, bool):
        return "true" if obj else "false"
    elif isinstance(obj, (int, float)):
        return str(obj)
    elif isinstance(obj, (datetime, date)):
        return f'"{obj.isoformat()}"'
    elif isinstance(obj, str):
        escaped = obj.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
        return f'"{escaped}"'
    elif isinstance(obj, (list, tuple, set)):
        items = list(obj)
        if not items:
            return "[]"
        formatted_items = [f"{next_spaces}{custom_json_dumps(item, indent, level + 1)}" for item in items]
        return "[\n" + ",\n".join(formatted_items) + f"\n{spaces}]"
    elif isinstance(obj, dict):
        if not obj:
            return "{}"
        formatted_pairs = []
        for k, v in obj.items():
            key_str = f'"{str(k)}"'
            val_str = custom_json_dumps(v, indent, level + 1)
            formatted_pairs.append(f"{next_spaces}{key_str}: {val_str}")
        return "{\n" + ",\n".join(formatted_pairs) + f"\n{spaces}" + "}"
    else:
        escaped = str(obj).replace('\\', '\\\\').replace('"', '\\"')
        return f'"{escaped}"'


# ---------------------------------------------------------------------------
# Configuration & Defaults
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
DEFAULT_FILE_PATH = BASE_DIR / "Sydney-Resume-Template-Modern.pdf"

DEFAULT_PREFERENCES = {
    "preferredJobRole": "backend developer",
    "preferredDomain": "backend",
    "preferredLocation": "Gurugram, Haryana"
}

# ---------------------------------------------------------------------------
# 1. Skill Taxonomy & Synonyms
# ---------------------------------------------------------------------------
SKILL_TAXONOMY = {
    "Programming Languages": {
        "c", "r", "python", "javascript", "typescript", "c++", "c#", "java", 
        "golang", "ruby", "rust", "php", "swift", "kotlin", "dart", "sql", "html", "css"
    },
    "Frameworks & Libraries": {
        "react", "node.js", "express.js", "fastapi", "django", "flask", 
        "spring boot", "next.js", "vue.js", "angular", "tailwindcss", "bootstrap", 
        "graphql", "rest api", "socket.io", "jwt"
    },
    "Databases & Cloud": {
        "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "sqlite", 
        "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "git", "github", 
        "linux", "nginx", "firebase", "postman"
    },
    "AI, ML & Data Science": {
        "machine learning", "deep learning", "nlp", "computer vision", 
        "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "yolov8", 
        "opencv", "data analysis", "tableau", "power bi", "eda", "regression"
    },
    "Vocational & Business Skills": {
        "accounting", "tally", "gst", "bookkeeping", "data entry", "ms excel", 
        "ms word", "computer basics", "inventory management", "logistics", 
        "customer support", "sales", "field operations", "ui/ux", "figma"
    }
}

ALL_VALID_SKILLS = {skill for cat in SKILL_TAXONOMY.values() for skill in cat}

SYNONYM_MAP = {
    "py": "python", "python3": "python", "js": "javascript", "ts": "typescript",
    "cpp": "c++", "cs": "c#", "react.js": "react", "reactjs": "react",
    "node": "node.js", "nodejs": "node.js", "fast-api": "fastapi",
    "postgres": "postgresql", "psql": "postgresql", "mongo": "mongodb",
    "k8s": "kubernetes", "excel": "ms excel", "tally prime": "tally",
    "ml": "machine learning", "ai": "machine learning", "socketio": "socket.io",
    "tailwind": "tailwindcss", "yolo": "yolov8", "html5": "html", "css3": "css",
    "rest": "rest api"
}

FLUFF_BUZZWORDS = {
    "hardworking", "hard worker", "go getter", "detail oriented", "think outside the box",
    "team player", "synergy", "dynamic", "self motivated", "passionate", "enthusiastic",
    "results driven", "strategic thinker", "fast learner", "people person", "punctual",
    "honest", "sincere", "dedicated", "proactive"
}

IGNORE_HEADERS = {
    "RESUME", "CURRICULUM VITAE", "CV", "PROFILE", "SUMMARY", "CONTACT", 
    "EDUCATION", "EXPERIENCE", "SKILLS", "PROJECTS", "PERSONAL DETAILS"
}


# ---------------------------------------------------------------------------
# 2. Text & Content Extraction Helpers
# ---------------------------------------------------------------------------
def extract_pdf_raw_text(pdf_path: Path) -> str:
    if not pdf_path.exists():
        return ""
    try:
        import fitz
        doc = fitz.open(str(pdf_path))
        return "\n".join([page.get_text() for page in doc])
    except Exception:
        pass
    try:
        import pypdf
        reader = pypdf.PdfReader(str(pdf_path))
        return "\n".join([p.extract_text() or "" for p in reader.pages])
    except Exception:
        pass
    return ""


def clean_token(text: str) -> str:
    if not isinstance(text, str):
        return ""
    lowered = text.lower().strip()
    cleaned = re.sub(r"^[^\w\+#\.]+|[^\w\+#\.]+$", "", lowered)
    cleaned = re.sub(r"[/|_\-]+", " ", cleaned)
    return " ".join(cleaned.split())


def extract_candidate_name(pdf_path: Path, raw_text: str = "") -> str:
    try:
        import fitz
        doc = fitz.open(str(pdf_path))
        if len(doc) > 0:
            first_page = doc[0]
            page_height = first_page.rect.height
            page_dict = first_page.get_text("dict")
            candidates = []
            for block in page_dict.get("blocks", []):
                if block.get("type") == 0:
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            text = span.get("text", "").strip()
                            size = span.get("size", 0.0)
                            y_pos = span.get("bbox", [0, 0, 0, 0])[1]
                            if y_pos <= (page_height * 0.35) and len(text) > 1:
                                if text.upper() not in IGNORE_HEADERS and not re.search(r'[@\+0-9]', text):
                                    candidates.append((size, y_pos, text))
            if candidates:
                candidates.sort(key=lambda x: (-x[0], x[1]))
                top_text = candidates[0][2]
                top_text = re.sub(r'(?<=\b[A-Za-z])\s+(?=[A-Za-z]\b)', '', top_text)
                return " ".join(re.sub(r'[^A-Za-z\s\.\-]', ' ', top_text).split()).title()
    except Exception:
        pass
    return "Candidate"


def extract_location(raw_text: str) -> str:
    try:
        lines = [line.strip() for line in raw_text.split("\n")[:15] if line.strip()]
        for line in lines:
            match = re.search(r'\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?),\s*([A-Z][a-zA-Z]+)\b', line)
            if match:
                city, state = match.group(1), match.group(2)
                if not any(h in city.upper() for h in IGNORE_HEADERS):
                    return f"{city}, {state}"
    except Exception:
        pass
    return DEFAULT_PREFERENCES["preferredLocation"]


def extract_skills_robust(raw_text: str, parser_skills: List[str]) -> List[str]:
    found: Set[str] = set()
    try:
        for p in parser_skills:
            canonical = SYNONYM_MAP.get(clean_token(str(p)), clean_token(str(p)))
            if canonical in ALL_VALID_SKILLS:
                found.add(canonical)

        sanitized = re.sub(r'[/|,\(\)\[\];•▪–]', ' ', raw_text.lower())
        sanitized = " " + " ".join(sanitized.split()) + " "
        for skill in sorted(ALL_VALID_SKILLS, key=len, reverse=True):
            canonical = SYNONYM_MAP.get(skill, skill)
            escaped = re.escape(skill.lower())
            if re.search(r'(?:^|[\s,;/\(\)])' + escaped + r'(?:$|[\s,;/\(\)])', sanitized):
                found.add(canonical)
    except Exception:
        pass
    return sorted(list(found)) if found else ["backend"]


def extract_projects_from_resume(raw_text: str, parser_projects: List[Any]) -> List[str]:
    try:
        if parser_projects:
            clean = [str(p).strip() for p in parser_projects if str(p).strip()]
            if clean:
                return clean

        proj_match = re.search(
            r"(?:projects|academic\s+projects|key\s+projects)[\s\:\-\_]+(.*?)(?=\n\s*(?:education|experience|skills|certifications|achievements|\Z))",
            raw_text,
            re.IGNORECASE | re.DOTALL
        )
        corpus = proj_match.group(1) if proj_match else raw_text
        lines = [re.sub(r'^[•▪–\-\*\d\.]+\s*', '', l).strip() for l in corpus.split("\n") if l.strip()]

        extracted = []
        for line in lines:
            if "|" in line:
                title = line.split("|")[0].strip()
                if 3 < len(title) < 60 and not any(h in title.upper() for h in IGNORE_HEADERS):
                    extracted.append(title)
            elif 5 < len(line) < 50 and any(line.lower().startswith(kw) for kw in ["multi-agent", "drishti", "real-time", "smart", "ai-powered", "system"]):
                extracted.append(line)

        if extracted:
            return extracted
    except Exception:
        pass
    return ["Academic and Practical Technical Projects"]


# ---------------------------------------------------------------------------
# 3. Feature Extraction
# ---------------------------------------------------------------------------
def extract_ml_features(
    raw_text: str,
    extracted_skills: List[str],
    education_raw: List[Any],
    experience_raw: List[Any],
    projects_raw: List[Any],
    preferred_job_role: Optional[str] = None,
    preferred_domain: Optional[str] = None,
    preferred_location: Optional[str] = None
) -> Dict[str, Any]:
    skills = extracted_skills if extracted_skills else ["backend"]

    edu_text = " ".join([str(e) for e in education_raw]).lower() + " " + raw_text.lower()
    if any(k in edu_text for k in ["b.tech", "btech", "b.e", "bachelor of technology"]):
        education = "BTech"
    elif any(k in edu_text for k in ["m.tech", "mtech"]):
        education = "MTech"
    elif any(k in edu_text for k in ["bca", "mca"]):
        education = "BCA/MCA"
    elif any(k in edu_text for k in ["diploma", "polytechnic"]):
        education = "Diploma"
    else:
        education = "BTech"

    if any(k in edu_text for k in ["computer science", "cse", "cs", "software"]):
        branch = "CSE"
    elif any(k in edu_text for k in ["information technology", "it"]):
        branch = "IT"
    elif any(k in edu_text for k in ["electronics", "ece", "electrical"]):
        branch = "ECE/EE"
    else:
        branch = "CSE"

    if experience_raw:
        experience = str(len(experience_raw))
    else:
        match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?experience', raw_text, re.IGNORECASE)
        experience = match.group(1) if match else "2"

    projects = extract_projects_from_resume(raw_text, projects_raw)
    role = (preferred_job_role or DEFAULT_PREFERENCES["preferredJobRole"]).lower().strip()
    domain = (preferred_domain or DEFAULT_PREFERENCES["preferredDomain"]).lower().strip()
    location = preferred_location or extract_location(raw_text)

    return {
        "skills": skills,
        "education": education,
        "branch": branch,
        "experience": experience,
        "projects": projects,
        "preferredJobRole": role,
        "preferredDomain": domain,
        "preferredLocation": location
    }


# ---------------------------------------------------------------------------
# 4. Resume Health & Actionable Recommendation Builder
# ---------------------------------------------------------------------------
def build_candidate_recommendations(
    full_text: str,
    email: Optional[str],
    phone: Optional[str],
    extracted_skills_count: int,
    candidate_name: str
) -> Dict[str, Any]:
    health_score = 100
    actionable_fixes: List[Dict[str, str]] = []
    text_lower = full_text.lower()

    if not email or "@" not in str(email):
        health_score -= 20
        actionable_fixes.append({
            "section": "Contact Details",
            "issue": "No email address found.",
            "recommendation": "Add a clear email address at the top so employers can reach you."
        })

    if not phone or len(re.sub(r"\D", "", str(phone))) < 10:
        health_score -= 20
        actionable_fixes.append({
            "section": "Contact Details",
            "issue": "No mobile number found.",
            "recommendation": "Add an active 10-digit mobile number at the top."
        })

    if extracted_skills_count == 0:
        health_score -= 25
        actionable_fixes.append({
            "section": "Skills",
            "issue": "No technical or vocational skills could be detected.",
            "recommendation": "Add a dedicated 'Skills' section listing tools, software, or languages you know."
        })

    found_fluff = [word for word in FLUFF_BUZZWORDS if re.search(r'\b' + re.escape(word) + r'\b', text_lower)]
    if found_fluff:
        health_score -= min(len(found_fluff) * 5, 15)
        actionable_fixes.append({
            "section": "Clarity & Tone",
            "issue": f"Found {len(found_fluff)} filler buzzwords: {', '.join(found_fluff)}",
            "recommendation": "Replace self-praise buzzwords with concrete examples of past work or tools."
        })

    metrics = re.findall(r'\b(?:\d+[\%kK\+]?|\$\d+|\d+\s*users|\d+\s*students|\d+\s*records|\d+\s*years|\d+\s*months)\b', full_text)
    if len(metrics) < 2:
        health_score -= 10
        actionable_fixes.append({
            "section": "Work Impact",
            "issue": "Very few measurable numbers or results found.",
            "recommendation": "Include real numbers (e.g., 'Built 3 projects', 'Handled 50+ records daily')."
        })

    final_score = max(min(health_score, 100), 10)
    readiness = "Strong foundation — ready for job matching!" if final_score >= 80 else "Decent — minor fixes recommended."

    return {
        "candidate_name": candidate_name,
        "resume_score_out_of_100": final_score,
        "readiness_verdict": readiness,
        "fluff_words_to_remove": {
            "count": len(found_fluff),
            "words": found_fluff
        },
        "actionable_fixes_needed": actionable_fixes,
        "timestamp": datetime.utcnow().isoformat()
    }


# ---------------------------------------------------------------------------
# 5. Core Pipeline Execution
# ---------------------------------------------------------------------------
def run_pipeline(
    pdf_path: Path,
    preferred_job_role: Optional[str] = None,
    preferred_domain: Optional[str] = None,
    preferred_location: Optional[str] = None
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    raw_text = extract_pdf_raw_text(pdf_path)

    candidate_email = None
    candidate_phone = None
    education_raw = []
    experience_raw = []
    projects_raw = []
    parser_skills = []

    try:
        from pyresume import ResumeParser
        parser = ResumeParser()
        resume_obj = parser.parse(str(pdf_path))
        if hasattr(resume_obj, "contact_info") and resume_obj.contact_info:
            candidate_email = getattr(resume_obj.contact_info, "email", None)
            candidate_phone = getattr(resume_obj.contact_info, "phone", None)
        education_raw = getattr(resume_obj, "education", [])
        experience_raw = getattr(resume_obj, "experience", [])
        projects_raw = getattr(resume_obj, "projects", [])
        parser_skills = [s if isinstance(s, str) else getattr(s, "name", str(s)) for s in getattr(resume_obj, "skills", [])]
    except Exception:
        pass

    if not candidate_email:
        m = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', raw_text)
        candidate_email = m.group(0) if m else None

    if not candidate_phone:
        m = re.search(r'(?:\+91[\-\s]?)?[6-9]\d{9}', raw_text)
        candidate_phone = m.group(0) if m else None

    candidate_name = extract_candidate_name(pdf_path, raw_text)
    flat_skills = extract_skills_robust(raw_text, parser_skills)

    ml_features = extract_ml_features(
        raw_text=raw_text,
        extracted_skills=flat_skills,
        education_raw=education_raw,
        experience_raw=experience_raw,
        projects_raw=projects_raw,
        preferred_job_role=preferred_job_role,
        preferred_domain=preferred_domain,
        preferred_location=preferred_location
    )

    recommendations = build_candidate_recommendations(
        full_text=raw_text,
        email=candidate_email,
        phone=candidate_phone,
        extracted_skills_count=len(flat_skills),
        candidate_name=candidate_name
    )

    return ml_features, recommendations


# ---------------------------------------------------------------------------
# 6. MongoDB Ingestion & ML Model Transmitter Functions
# ---------------------------------------------------------------------------
def fetch_user_document_from_mongodb(user_id: str) -> Dict[str, Any]:
    """
    Simulates fetching candidate metadata from MongoDB collection 'users'.
    Replace with actual pymongo query:
        db.users.find_one({"_id": ObjectId(user_id)})
    """
    return {
        "_id": user_id,
        "candidate_name": "Khushi Bhardwaj",
        "resume_path": str(DEFAULT_FILE_PATH),
        "target_preferences": {
            "preferredJobRole": "backend developer",
            "preferredDomain": "backend",
            "preferredLocation": "Gurugram, Haryana"
        },
        "created_at": datetime.utcnow().isoformat()
    }




# ---------------------------------------------------------------------------
# Execution
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Step 1: Input as JSON / document from MongoDB
    mongodb_user_record = fetch_user_document_from_mongodb("usr_65f8a9bc12e4")
    
    file_path = Path(mongodb_user_record.get("resume_path", str(DEFAULT_FILE_PATH)))
    user_prefs = mongodb_user_record.get("target_preferences", {})

    # Step 2: Run Parsing Engine with MongoDB attributes
    ml_features, recommendations = run_pipeline(
        pdf_path=file_path,
        preferred_job_role=user_prefs.get("preferredJobRole"),
        preferred_domain=user_prefs.get("preferredDomain"),
        preferred_location=user_prefs.get("preferredLocation")
    )

    # Step 3: Format extracted features to JSON string for ML model input
    ml_payload_json = custom_json_dumps(ml_features, indent=2)


    # Step 5: Construct complete unified output JSON
    final_output_payload = {
        "mongodb_source_input": mongodb_user_record,
        "ml_model_input_payload": ml_features,
        "candidate_recommendations": recommendations,
        
    }

    # Step 6: Print entire pipeline result to console in strictly formatted JSON
    print(custom_json_dumps(final_output_payload, indent=2))