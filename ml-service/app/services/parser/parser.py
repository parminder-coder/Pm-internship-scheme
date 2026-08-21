"""
=============================================================================
RESUME PARSER
=============================================================================

INPUT PRIORITY:

1. JSON candidate data
        ↓
2. Uploaded PDF file
        ↓
3. MongoDB latest candidate (optional)
        ↓
4. Fallback PDF

The parser NEVER saves parsed results to MongoDB.

OUTPUT:
JSON ONLY

=============================================================================
"""

import json
import re
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set


# =============================================================================
# PATHS
# =============================================================================

CURRENT_DIR = Path(
    __file__
).resolve().parent

PROJECT_ROOT = (
    CURRENT_DIR.parents[2]
    if len(CURRENT_DIR.parents) >= 3
    else CURRENT_DIR
)

for path in [
    str(CURRENT_DIR),
    str(PROJECT_ROOT)
]:

    if path not in sys.path:

        sys.path.insert(
            0,
            path
        )


# =============================================================================
# MONGODB IMPORT
# =============================================================================

try:

    from db import mongo_service

except ModuleNotFoundError:

    try:

        from app.services.parser.db import mongo_service

    except ModuleNotFoundError:

        mongo_service = None


# =============================================================================
# FALLBACK PDF
# =============================================================================

FALLBACK_PDF_PATH = (
    CURRENT_DIR
    / "Sydney-Resume-Template-Modern.pdf"
)


# =============================================================================
# DEFAULT PREFERENCES
# =============================================================================

DEFAULT_PREFERENCES = {

    "preferredJobRole":
        "backend developer",

    "preferredDomain":
        "backend",

    "preferredLocation":
        "Gurugram, Haryana"
}


# =============================================================================
# SKILL TAXONOMY
# =============================================================================

SKILL_TAXONOMY = {

    "Programming Languages": {

        "c",
        "r",
        "python",
        "javascript",
        "typescript",
        "c++",
        "c#",
        "java",
        "golang",
        "ruby",
        "rust",
        "php",
        "swift",
        "kotlin",
        "dart",
        "sql",
        "html",
        "css"
    },

    "Frameworks & Libraries": {

        "react",
        "node.js",
        "express.js",
        "fastapi",
        "django",
        "flask",
        "spring boot",
        "next.js",
        "vue.js",
        "angular",
        "tailwindcss",
        "bootstrap",
        "graphql",
        "rest api",
        "socket.io",
        "jwt"
    },

    "Databases & Cloud": {

        "mysql",
        "postgresql",
        "mongodb",
        "redis",
        "elasticsearch",
        "sqlite",
        "docker",
        "kubernetes",
        "aws",
        "gcp",
        "azure",
        "ci/cd",
        "git",
        "github",
        "linux",
        "nginx",
        "firebase",
        "postman"
    },

    "AI, ML & Data Science": {

        "machine learning",
        "deep learning",
        "nlp",
        "computer vision",
        "tensorflow",
        "pytorch",
        "scikit-learn",
        "pandas",
        "numpy",
        "yolov8",
        "opencv",
        "data analysis",
        "tableau",
        "power bi",
        "eda",
        "regression"
    },

    "Vocational & Business Skills": {

        "accounting",
        "tally",
        "gst",
        "bookkeeping",
        "data entry",
        "ms excel",
        "ms word",
        "computer basics",
        "inventory management",
        "logistics",
        "customer support",
        "sales",
        "field operations",
        "ui/ux",
        "figma"
    }
}


ALL_VALID_SKILLS = {
    skill
    for category in SKILL_TAXONOMY.values()
    for skill in category
}


# =============================================================================
# SYNONYMS
# =============================================================================

SYNONYM_MAP = {

    "py": "python",
    "python3": "python",

    "js": "javascript",
    "ts": "typescript",

    "cpp": "c++",
    "cs": "c#",

    "react.js": "react",
    "reactjs": "react",

    "node": "node.js",
    "nodejs": "node.js",

    "fast-api": "fastapi",

    "postgres": "postgresql",
    "psql": "postgresql",

    "mongo": "mongodb",

    "k8s": "kubernetes",

    "excel": "ms excel",

    "tally prime": "tally",

    "ml": "machine learning",
    "ai": "machine learning",

    "socketio": "socket.io",

    "tailwind": "tailwindcss",

    "yolo": "yolov8",

    "html5": "html",
    "css3": "css",

    "rest": "rest api"
}


# =============================================================================
# FLUFF
# =============================================================================

FLUFF_BUZZWORDS = {

    "hardworking",
    "hard worker",
    "go getter",
    "detail oriented",
    "think outside the box",
    "team player",
    "synergy",
    "dynamic",
    "self motivated",
    "passionate",
    "enthusiastic",
    "results driven",
    "strategic thinker",
    "fast learner",
    "people person",
    "punctual",
    "honest",
    "sincere",
    "dedicated",
    "proactive"
}


# =============================================================================
# IGNORE HEADERS
# =============================================================================

IGNORE_HEADERS = {

    "RESUME",
    "CURRICULUM VITAE",
    "CV",
    "PROFILE",
    "SUMMARY",
    "CONTACT",
    "EDUCATION",
    "EXPERIENCE",
    "SKILLS",
    "PROJECTS",
    "PERSONAL DETAILS"
}


# =============================================================================
# PDF EXTRACTION
# =============================================================================

def extract_pdf_raw_text(
    pdf_path: Path
) -> str:

    if not pdf_path.exists():
        return ""

    # -------------------------------------------------------------------------
    # PyMuPDF
    # -------------------------------------------------------------------------

    try:

        import fitz

        doc = fitz.open(
            str(pdf_path)
        )

        text = "\n".join(
            page.get_text()
            for page in doc
        )

        doc.close()

        if text.strip():
            return text

    except Exception:
        pass

    # -------------------------------------------------------------------------
    # pypdf
    # -------------------------------------------------------------------------

    try:

        import pypdf

        reader = pypdf.PdfReader(
            str(pdf_path)
        )

        return "\n".join(
            page.extract_text() or ""
            for page in reader.pages
        )

    except Exception:
        pass

    return ""


# =============================================================================
# TOKEN CLEANER
# =============================================================================

def clean_token(
    text: str
) -> str:

    if not isinstance(
        text,
        str
    ):
        return ""

    text = text.lower().strip()

    text = re.sub(
        r"^[^\w\+#\.]+|[^\w\+#\.]+$",
        "",
        text
    )

    text = re.sub(
        r"[/|_\-]+",
        " ",
        text
    )

    return " ".join(
        text.split()
    )


# =============================================================================
# NAME EXTRACTION
# =============================================================================

def extract_candidate_name(
    pdf_path: Path,
    raw_text: str
) -> str:

    try:

        import fitz

        doc = fitz.open(
            str(pdf_path)
        )

        if len(doc) > 0:

            page = doc[0]

            page_height = (
                page.rect.height
            )

            page_dict = page.get_text(
                "dict"
            )

            candidates = []

            for block in page_dict.get(
                "blocks",
                []
            ):

                if block.get(
                    "type"
                ) != 0:

                    continue

                for line in block.get(
                    "lines",
                    []
                ):

                    for span in line.get(
                        "spans",
                        []
                    ):

                        text = span.get(
                            "text",
                            ""
                        ).strip()

                        size = span.get(
                            "size",
                            0
                        )

                        bbox = span.get(
                            "bbox",
                            [0, 0, 0, 0]
                        )

                        y_position = bbox[1]

                        if (
                            y_position
                            <= page_height * 0.35
                            and len(text) > 1
                        ):

                            if (
                                text.upper()
                                not in IGNORE_HEADERS
                                and not re.search(
                                    r"[@\+0-9]",
                                    text
                                )
                            ):

                                candidates.append(
                                    (
                                        size,
                                        y_position,
                                        text
                                    )
                                )

            doc.close()

            if candidates:

                candidates.sort(
                    key=lambda item: (
                        -item[0],
                        item[1]
                    )
                )

                name = candidates[0][2]

                name = re.sub(
                    r"[^A-Za-z\s\.\-]",
                    " ",
                    name
                )

                return " ".join(
                    name.split()
                ).title()

    except Exception:
        pass

    # -------------------------------------------------------------------------
    # Text fallback
    # -------------------------------------------------------------------------

    lines = [
        line.strip()
        for line in raw_text.split("\n")
        if line.strip()
    ]

    for line in lines[:10]:

        cleaned = re.sub(
            r"[^A-Za-z\s\.\-]",
            " ",
            line
        )

        cleaned = " ".join(
            cleaned.split()
        ).title()

        words = [
            word
            for word in cleaned.split()
            if (
                word.upper()
                not in IGNORE_HEADERS
                and len(word) > 1
            )
        ]

        if 1 <= len(words) <= 4:

            return " ".join(
                words
            )

    return "Candidate"


# =============================================================================
# SKILLS
# =============================================================================

def extract_skills_robust(
    raw_text: str,
    parser_skills: List[str]
) -> List[str]:

    found: Set[str] = set()

    # Parser skills
    for skill in parser_skills:

        cleaned = clean_token(
            str(skill)
        )

        canonical = SYNONYM_MAP.get(
            cleaned,
            cleaned
        )

        if canonical in ALL_VALID_SKILLS:

            found.add(
                canonical
            )

    # Text skills
    sanitized = re.sub(
        r"[/|,\(\)\[\];•▪–]",
        " ",
        raw_text.lower()
    )

    sanitized = (
        " "
        + " ".join(
            sanitized.split()
        )
        + " "
    )

    for skill in sorted(
        ALL_VALID_SKILLS,
        key=len,
        reverse=True
    ):

        escaped = re.escape(
            skill.lower()
        )

        pattern = (
            r"(?:^|[\s,;/\(\)])"
            + escaped
            + r"(?:$|[\s,;/\(\)])"
        )

        if re.search(
            pattern,
            sanitized
        ):

            found.add(
                SYNONYM_MAP.get(
                    skill,
                    skill
                )
            )

    return sorted(
        found
    ) if found else ["backend"]


# =============================================================================
# PROJECTS
# =============================================================================

def extract_projects_from_resume(
    raw_text: str,
    parser_projects: List[Any]
) -> List[str]:

    if parser_projects:

        projects = [
            str(project).strip()
            for project in parser_projects
            if str(project).strip()
        ]

        if projects:
            return projects

    match = re.search(

        r"(?:projects|academic\s+projects|"
        r"key\s+projects)"
        r"[\s\:\-\_]+"
        r"(.*?)"
        r"(?=\n\s*(?:education|experience|"
        r"skills|certifications|"
        r"achievements|\Z))",

        raw_text,

        re.IGNORECASE |
        re.DOTALL
    )

    corpus = (
        match.group(1)
        if match
        else raw_text
    )

    lines = []

    for line in corpus.split("\n"):

        if not line.strip():
            continue

        line = re.sub(
            r"^[•▪–\-\*\d\.]+\s*",
            "",
            line
        ).strip()

        if line:
            lines.append(
                line
            )

    extracted = []

    for line in lines:

        if "|" in line:

            title = (
                line
                .split("|")[0]
                .strip()
            )

            if (
                3 < len(title) < 60
                and not any(
                    h in title.upper()
                    for h in IGNORE_HEADERS
                )
            ):

                extracted.append(
                    title
                )

    if extracted:
        return extracted

    return [
        "Academic and Practical Technical Projects"
    ]


# =============================================================================
# ML FEATURES
# =============================================================================

def extract_ml_features(
    raw_text: str,
    extracted_skills: List[str],
    education_raw: List[Any],
    experience_raw: List[Any],
    projects_raw: List[Any],
    preferred_job_role: Optional[str],
    preferred_domain: Optional[str],
    preferred_location: Optional[str]
) -> Dict[str, Any]:

    edu_text = (
        " ".join(
            str(item)
            for item in education_raw
        )
        + " "
        + raw_text
    ).lower()

    # Education
    if any(
        x in edu_text
        for x in [
            "b.tech",
            "btech",
            "b.e",
            "bachelor of technology"
        ]
    ):

        education = "BTech"

    elif any(
        x in edu_text
        for x in [
            "m.tech",
            "mtech"
        ]
    ):

        education = "MTech"

    elif any(
        x in edu_text
        for x in [
            "bca",
            "mca"
        ]
    ):

        education = "BCA/MCA"

    elif any(
        x in edu_text
        for x in [
            "diploma",
            "polytechnic"
        ]
    ):

        education = "Diploma"

    else:

        education = "BTech"

    # Branch
    if any(
        x in edu_text
        for x in [
            "computer science",
            "cse",
            "software"
        ]
    ):

        branch = "CSE"

    elif any(
        x in edu_text
        for x in [
            "information technology",
            " it "
        ]
    ):

        branch = "IT"

    elif any(
        x in edu_text
        for x in [
            "electronics",
            "ece",
            "electrical"
        ]
    ):

        branch = "ECE/EE"

    else:

        branch = "CSE"

    # Experience
    if experience_raw:

        experience = str(
            len(experience_raw)
        )

    else:

        match = re.search(
            r"(\d+)\+?\s*"
            r"(?:years?|yrs?)"
            r"\s*(?:of\s*)?"
            r"experience",
            raw_text,
            re.IGNORECASE
        )

        experience = (
            match.group(1)
            if match
            else "2"
        )

    projects = (
        extract_projects_from_resume(
            raw_text,
            projects_raw
        )
    )

    role = (
        preferred_job_role
        or DEFAULT_PREFERENCES[
            "preferredJobRole"
        ]
    ).lower().strip()

    domain = (
        preferred_domain
        or DEFAULT_PREFERENCES[
            "preferredDomain"
        ]
    ).lower().strip()

    location = (
        preferred_location
        or DEFAULT_PREFERENCES[
            "preferredLocation"
        ]
    )

    return {

        "skills":
            extracted_skills
            or ["backend"],

        "education":
            education,

        "branch":
            branch,

        "experience":
            experience,

        "projects":
            projects,

        "preferredJobRole":
            role,

        "preferredDomain":
            domain,

        "preferredLocation":
            location
    }


# =============================================================================
# RECOMMENDATIONS
# =============================================================================

def build_candidate_recommendations(
    full_text: str,
    email: Optional[str],
    phone: Optional[str],
    extracted_skills_count: int,
    candidate_name: str
) -> Dict[str, Any]:

    score = 100

    fixes = []

    text_lower = full_text.lower()

    # Email
    if (
        not email
        or "@"
        not in str(email)
    ):

        score -= 20

        fixes.append({

            "section":
                "Contact Details",

            "issue":
                "No email address found.",

            "recommendation":
                "Add a clear email address at the top so employers can reach you."
        })

    # Phone
    if (
        not phone
        or len(
            re.sub(
                r"\D",
                "",
                str(phone)
            )
        ) < 10
    ):

        score -= 20

        fixes.append({

            "section":
                "Contact Details",

            "issue":
                "No mobile number found.",

            "recommendation":
                "Add an active 10-digit mobile number at the top."
        })

    # Skills
    if extracted_skills_count == 0:

        score -= 25

        fixes.append({

            "section":
                "Skills",

            "issue":
                "No technical or vocational skills could be detected.",

            "recommendation":
                "Add a dedicated Skills section."
        })

    # Fluff
    found_fluff = [

        word

        for word in FLUFF_BUZZWORDS

        if re.search(
            r"\b"
            + re.escape(word)
            + r"\b",
            text_lower
        )
    ]

    if found_fluff:

        score -= min(
            len(found_fluff) * 5,
            15
        )

        fixes.append({

            "section":
                "Clarity & Tone",

            "issue":
                "Filler buzzwords found: "
                + ", ".join(found_fluff),

            "recommendation":
                "Replace filler words with concrete achievements."
        })

    # Metrics
    metrics = re.findall(

        r"\b(?:"
        r"\d+[\%kK\+]?|"
        r"\$\d+|"
        r"\d+\s*users|"
        r"\d+\s*students|"
        r"\d+\s*records|"
        r"\d+\s*years|"
        r"\d+\s*months"
        r")\b",

        full_text
    )

    if len(metrics) < 2:

        score -= 10

        fixes.append({

            "section":
                "Work Impact",

            "issue":
                "Very few measurable results found.",

            "recommendation":
                "Add measurable achievements and project metrics."
        })

    score = max(
        min(score, 100),
        10
    )

    readiness = (
        "Strong foundation — ready for job matching!"
        if score >= 80
        else
        "Decent — minor fixes recommended."
    )

    return {

        "candidate_name":
            candidate_name,

        "resume_score_out_of_100":
            score,

        "readiness_verdict":
            readiness,

        "fluff_words_to_remove": {

            "count":
                len(found_fluff),

            "words":
                found_fluff
        },

        "actionable_fixes_needed":
            fixes,

        "timestamp":
            datetime.utcnow().isoformat()
    }


# =============================================================================
# RESOLVE RESUME PATH
# =============================================================================

def resolve_resume_path(
    resume_path: str
) -> Path:

    if not resume_path:

        raise FileNotFoundError(
            "Resume path is empty."
        )

    path = Path(
        str(resume_path)
    )

    # Absolute path
    if path.is_absolute():

        return path

    # Project root
    project_path = (
        PROJECT_ROOT
        / path
    )

    if project_path.exists():

        return project_path

    # Current directory
    current_path = (
        CURRENT_DIR
        / path
    )

    if current_path.exists():

        return current_path

    return project_path


# =============================================================================
# NORMALIZE INPUT
# =============================================================================

def normalize_input(
    candidate_json: Optional[Dict[str, Any]] = None,
    uploaded_file_path: Optional[str] = None,
    use_mongodb: bool = False
) -> Dict[str, Any]:
    """
    Input priority:

    1. candidate_json
    2. uploaded_file_path
    3. MongoDB latest candidate if use_mongodb=True
    4. fallback PDF
    """

    # -------------------------------------------------------------------------
    # OPTION 1: JSON
    # -------------------------------------------------------------------------

    if candidate_json is not None:

        if not isinstance(
            candidate_json,
            dict
        ):

            raise ValueError(
                "candidate_json must be a JSON object."
            )

        return candidate_json

    # -------------------------------------------------------------------------
    # OPTION 2: UPLOADED FILE
    # -------------------------------------------------------------------------

    if uploaded_file_path:

        return {

            "candidate_name":
                None,

            "email":
                None,

            "phone":
                None,

            "resume_path":
                uploaded_file_path,

            "target_preferences":
                DEFAULT_PREFERENCES.copy()
        }

    # -------------------------------------------------------------------------
    # OPTION 3: MONGODB
    # -------------------------------------------------------------------------

    if use_mongodb:

        if mongo_service is None:

            raise RuntimeError(
                "MongoDB service is not available."
            )

        candidate = (
            mongo_service.get_latest_candidate()
        )

        if candidate is not None:

            return candidate

    # -------------------------------------------------------------------------
    # OPTION 4: FALLBACK PDF
    # -------------------------------------------------------------------------

    return {

        "candidate_name":
            None,

        "email":
            None,

        "phone":
            None,

        "resume_path":
            str(FALLBACK_PDF_PATH),

        "target_preferences":
            DEFAULT_PREFERENCES.copy()
    }


# =============================================================================
# MAIN PARSER
# =============================================================================

def run_pipeline(
    candidate_json: Optional[Dict[str, Any]] = None,
    uploaded_file_path: Optional[str] = None,
    use_mongodb: bool = False
) -> Dict[str, Any]:

    # -------------------------------------------------------------------------
    # SELECT INPUT
    # -------------------------------------------------------------------------

    candidate_doc = normalize_input(

        candidate_json=
            candidate_json,

        uploaded_file_path=
            uploaded_file_path,

        use_mongodb=
            use_mongodb
    )

    # -------------------------------------------------------------------------
    # RESUME PATH
    # -------------------------------------------------------------------------

    resume_path = candidate_doc.get(
        "resume_path"
    )

    if not resume_path:

        resume_path = str(
            FALLBACK_PDF_PATH
        )

    pdf_path = resolve_resume_path(
        resume_path
    )

    # -------------------------------------------------------------------------
    # FINAL FALLBACK
    #
    # If a supplied JSON/file path does not exist,
    # use fallback PDF.
    # -------------------------------------------------------------------------

    if not pdf_path.exists():

        pdf_path = (
            FALLBACK_PDF_PATH
        )

    if not pdf_path.exists():

        raise FileNotFoundError(
            "Neither the supplied resume nor the fallback PDF exists."
        )

    # -------------------------------------------------------------------------
    # EXTRACT TEXT
    # -------------------------------------------------------------------------

    raw_text = extract_pdf_raw_text(
        pdf_path
    )

    if not raw_text.strip():

        raise ValueError(
            "Could not extract text from resume PDF."
        )

    # -------------------------------------------------------------------------
    # CONTACT
    # -------------------------------------------------------------------------

    candidate_email = (
        candidate_doc.get(
            "email"
        )
    )

    candidate_phone = (
        candidate_doc.get(
            "phone"
        )
    )

    education_raw = []

    experience_raw = []

    projects_raw = []

    parser_skills = []

    # -------------------------------------------------------------------------
    # OPTIONAL PYRESUME
    # -------------------------------------------------------------------------

    try:

        from pyresume import ResumeParser

        parser = ResumeParser()

        resume_obj = parser.parse(
            str(pdf_path)
        )

        contact_info = getattr(
            resume_obj,
            "contact_info",
            None
        )

        if contact_info:

            candidate_email = (
                candidate_email
                or getattr(
                    contact_info,
                    "email",
                    None
                )
            )

            candidate_phone = (
                candidate_phone
                or getattr(
                    contact_info,
                    "phone",
                    None
                )
            )

        education_raw = (
            getattr(
                resume_obj,
                "education",
                []
            )
            or []
        )

        experience_raw = (
            getattr(
                resume_obj,
                "experience",
                []
            )
            or []
        )

        projects_raw = (
            getattr(
                resume_obj,
                "projects",
                []
            )
            or []
        )

        parser_skills = [

            skill
            if isinstance(
                skill,
                str
            )
            else getattr(
                skill,
                "name",
                str(skill)
            )

            for skill in (
                getattr(
                    resume_obj,
                    "skills",
                    []
                )
                or []
            )
        ]

    except Exception:
        pass

    # -------------------------------------------------------------------------
    # EMAIL FALLBACK
    # -------------------------------------------------------------------------

    if not candidate_email:

        match = re.search(

            r"[a-zA-Z0-9_.+-]+"
            r"@"
            r"[a-zA-Z0-9-]+\."
            r"[a-zA-Z0-9-.]+",

            raw_text
        )

        candidate_email = (
            match.group(0)
            if match
            else None
        )

    # -------------------------------------------------------------------------
    # PHONE FALLBACK
    # -------------------------------------------------------------------------

    if not candidate_phone:

        match = re.search(

            r"(?:\+91[\-\s]?)?"
            r"[6-9]\d{9}",

            raw_text
        )

        candidate_phone = (
            match.group(0)
            if match
            else None
        )

    # -------------------------------------------------------------------------
    # NAME
    # -------------------------------------------------------------------------

    candidate_name = (

        candidate_doc.get(
            "candidate_name"
        )

        or extract_candidate_name(
            pdf_path,
            raw_text
        )
    )

    # -------------------------------------------------------------------------
    # SKILLS
    # -------------------------------------------------------------------------

    flat_skills = extract_skills_robust(

        raw_text,

        parser_skills
    )

    # -------------------------------------------------------------------------
    # PREFERENCES
    # -------------------------------------------------------------------------

    preferences = (
        candidate_doc.get(
            "target_preferences"
        )
        or {}
    )

    # -------------------------------------------------------------------------
    # ML FEATURES
    # -------------------------------------------------------------------------

    ml_features = extract_ml_features(

        raw_text=
            raw_text,

        extracted_skills=
            flat_skills,

        education_raw=
            education_raw,

        experience_raw=
            experience_raw,

        projects_raw=
            projects_raw,

        preferred_job_role=
            preferences.get(
                "preferredJobRole"
            ),

        preferred_domain=
            preferences.get(
                "preferredDomain"
            ),

        preferred_location=
            preferences.get(
                "preferredLocation"
            )
    )

    # -------------------------------------------------------------------------
    # RECOMMENDATIONS
    # -------------------------------------------------------------------------

    recommendations = (
        build_candidate_recommendations(

            full_text=
                raw_text,

            email=
                candidate_email,

            phone=
                candidate_phone,

            extracted_skills_count=
                len(flat_skills),

            candidate_name=
                candidate_name
        )
    )

    # -------------------------------------------------------------------------
    # RESULT
    # -------------------------------------------------------------------------

    return {

        "success":
            True,

        "candidate_id":
            candidate_doc.get(
                "_id"
            ),

        "candidate_name":
            candidate_name,

        "resume_file":
            str(pdf_path),

        "ml_features":
            ml_features,

        "recommendations":
            recommendations
    }


# =============================================================================
# JSON SAFE
# =============================================================================

def make_json_safe(
    value: Any
) -> Any:

    if isinstance(
        value,
        (datetime, date)
    ):

        return value.isoformat()

    if isinstance(
        value,
        dict
    ):

        return {
            str(key):
                make_json_safe(item)

            for key, item
            in value.items()
        }

    if isinstance(
        value,
        (list, tuple, set)
    ):

        return [
            make_json_safe(item)
            for item in value
        ]

    return value


# =============================================================================
# STANDALONE RUNNER
# =============================================================================

if __name__ == "__main__":

    try:

        # =====================================================================
        # DEFAULT:
        #
        # No JSON
        # No uploaded file
        # No MongoDB
        #
        # => FALLBACK PDF
        # =====================================================================

        result = run_pipeline()

        print(
            json.dumps(
                make_json_safe(result),
                indent=2,
                ensure_ascii=False
            )
        )

    except Exception as exc:

        print(
            json.dumps(
                {
                    "success":
                        False,

                    "error":
                        str(exc)
                },
                indent=2,
                ensure_ascii=False
            )
        )
