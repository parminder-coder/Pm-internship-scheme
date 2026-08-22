import re
from typing import List, Dict, Any, Optional

try:
    from pyresume.parser import ResumeParser
except ImportError:
    # Fallback placeholder if pyresume is not installed in local environment
    ResumeParser = None


SECTION_NAMES = {
    "PROFESSIONAL SUMMARY",
    "SUMMARY",
    "TECHNICAL SKILLS",
    "SKILLS",
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "PROJECTS",
    "EDUCATION",
    "CERTIFICATIONS",
    "ACHIEVEMENTS",
    "LANGUAGES",
}


def _clean_name(raw_text: str, parsed_name: Optional[str]) -> str:
    """
    Prefer the first meaningful line of the resume over the parser's
    sometimes incorrect name prediction.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    if lines:
        first_line = lines[0]

        # Avoid treating a section header or obvious title/link as the person's name.
        if (
            first_line.upper() not in SECTION_NAMES
            and not any(sep in first_line for sep in ["|", "@"])
            and not re.search(r"https?://|www\.", first_line, re.IGNORECASE)
            and len(first_line.split()) <= 4
        ):
            return first_line

    return parsed_name or ""


def _extract_email_fallback(raw_text: str, parsed_email: Optional[str]) -> str:
    """Regex fallback for email address if parser misses it."""
    if parsed_email and parsed_email.strip():
        return parsed_email.strip()

    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", raw_text or "")
    return match.group(0) if match else ""


def _extract_phone_fallback(raw_text: str, parsed_phone: Optional[str]) -> str:
    """Regex fallback for phone numbers if parser misses it."""
    if parsed_phone and parsed_phone.strip():
        return parsed_phone.strip()

    match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", raw_text or "")
    return match.group(0) if match else ""


def _extract_links(raw_text: str) -> Dict[str, str]:
    """Extract GitHub, LinkedIn, and Portfolio URLs from raw text."""
    links = {"github": "", "linkedin": "", "portfolio": ""}
    if not raw_text:
        return links

    urls = re.findall(r"https?://[^\s<>]+|www\.[^\s<>]+", raw_text, re.IGNORECASE)
    for url in urls:
        url_lower = url.lower()
        if "github.com" in url_lower and not links["github"]:
            links["github"] = url
        elif "linkedin.com" in url_lower and not links["linkedin"]:
            links["linkedin"] = url
        elif not links["portfolio"] and not any(k in url_lower for k in ["github", "linkedin"]):
            links["portfolio"] = url

    return links


def _clean_skills(skills: List[str]) -> List[str]:
    """
    Remove parser artefacts, generic bluff words, section headers, and duplicates.
    """
    garbage = {
        "learn", "web", "work", "solidity frontend", "sql blockchain",
        "page", "curriculum vitae", "resume", "skills", "technical skills",
        "experience", "projects", "education", "summary", "profile", "contact",
        "details", "information", "phone", "email", "address", "languages",
        "certifications", "achievements", "declaration", "date", "place"
    }

    cleaned = []
    seen = set()

    for skill in skills:
        if not skill:
            continue

        skill_str = str(skill).strip()
        # Remove bullet characters and punctuation
        skill_str = re.sub(r"^[●•\-*]\s*", "", skill_str).strip()

        if not skill_str or len(skill_str) < 2:
            continue

        if skill_str.lower() in garbage:
            continue

        # Skip strings that look like email, URLs or page numbers
        if re.search(r"@|https?://|www\.|page\s*\d+", skill_str, re.IGNORECASE):
            continue

        key = skill_str.lower()
        if key not in seen:
            seen.add(key)
            cleaned.append(skill_str)

    return cleaned


def _clean_education(resume) -> tuple[str, str]:
    """
    Build education and branch from parsed education entries.
    Prefer the actual degree/institution information.
    """
    education_parts = []
    branch_parts = []

    if hasattr(resume, "education") and resume.education:
        for edu in resume.education:
            if hasattr(edu, "degree") and edu.degree:
                education_parts.append(edu.degree.strip())

                degree_lower = edu.degree.lower()
                if "computer science" in degree_lower or "c.s.e" in degree_lower or "cse" in degree_lower:
                    branch_parts.append("Computer Science & Engineering")
                elif "information technology" in degree_lower or "i.t" in degree_lower:
                    branch_parts.append("Information Technology")

            if hasattr(edu, "major") and edu.major:
                branch_parts.append(edu.major.strip())

    return " ".join(education_parts), " ".join(dict.fromkeys(branch_parts))


def _clean_experience(resume) -> str:
    """
    Convert parsed experience objects into a clean text representation.
    """
    experiences = []

    if hasattr(resume, "experience") and resume.experience:
        for exp in resume.experience:
            parts = []

            if hasattr(exp, "title") and exp.title:
                parts.append(exp.title.strip())

            if hasattr(exp, "company") and exp.company:
                company = exp.company.strip()

                # Remove the parser's accidental bullet/description spillover.
                company = company.split("●")[0].strip()

                if company:
                    parts.append(company)

            if hasattr(exp, "description") and exp.description:
                description = exp.description.strip()
                if description:
                    parts.append(description)

            if hasattr(exp, "responsibilities") and exp.responsibilities:
                parts.extend(
                    item.strip()
                    for item in exp.responsibilities
                    if item and item.strip()
                )

            if parts:
                experiences.append(" ".join(parts))

    return " ".join(experiences)


def _extract_projects_from_text(raw_text: str) -> List[str]:
    """
    Extract project titles from the PROJECTS section using the resume's
    own text structure instead of relying on the parser's fragmented
    Project objects.
    """
    if not raw_text:
        return []

    lines = [line.strip() for line in raw_text.splitlines()]

    try:
        start = next(
            i for i, line in enumerate(lines)
            if line.upper() in {"PROJECTS", "PERSONAL PROJECTS", "ACADEMIC PROJECTS"}
        )
    except StopIteration:
        return []

    try:
        end = next(
            i for i in range(start + 1, len(lines))
            if lines[i].upper() in {"EDUCATION", "EXPERIENCE", "CERTIFICATIONS", "SKILLS"}
        )
    except StopIteration:
        end = len(lines)

    project_lines = lines[start + 1:end]
    projects = []

    for line in project_lines:
        if not line:
            continue

        # Skip bullet descriptions.
        if line.startswith(("●", "•", "-", "*")):
            continue

        # Project title lines contain "|" or special markers.
        if ("|" in line or ":" in line) and "http" not in line.lower():
            projects.append(line)

    return projects


def _compute_confidence(raw_text: str, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Return a transparent heuristic confidence score for the extracted resume.
    Reflects field completeness and output quality.
    """
    raw = raw_text or ""
    scores = {
        "name": 1.0 if parsed_data.get("name") else 0.0,
        "email": 1.0 if parsed_data.get("email") else 0.0,
        "phone": 1.0 if parsed_data.get("phone") else 0.0,
        "skills": 0.0,
        "education": 1.0 if parsed_data.get("education") else 0.0,
        "experience": 1.0 if parsed_data.get("experience") else 0.0,
        "projects": 1.0 if parsed_data.get("projects") else 0.0,
    }

    skills = parsed_data.get("skills") or []
    if skills:
        if len(skills) >= 5:
            scores["skills"] = 1.0
        elif len(skills) >= 3:
            scores["skills"] = 0.8
        elif len(skills) >= 1:
            scores["skills"] = 0.5

    scores["text_available"] = 1.0 if raw.strip() else 0.0

    total = sum(scores.values()) / len(scores)
    overall = round(max(0.0, min(1.0, total)), 3)
    overall_percent = round(overall * 100, 2)

    return {
        "overall": overall,
        "overallPercent": overall_percent,
        "method": "heuristic-field-completeness",
        "breakdown": {
            "name": round(scores["name"], 3),
            "email": round(scores["email"], 3),
            "phone": round(scores["phone"], 3),
            "skills": round(scores["skills"], 3),
            "education": round(scores["education"], 3),
            "experience": round(scores["experience"], 3),
            "projects": round(scores["projects"], 3),
            "text_available": round(scores["text_available"], 3),
        },
    }


def _generate_match_explanation(parsed_data: Dict[str, Any]) -> str:
    """Generate eligibility and match explanation sentence based on candidate resume features."""
    skills = parsed_data.get("skills", [])
    education = parsed_data.get("education", "") or parsed_data.get("branch", "")
    top_skills = ", ".join(skills[:3]) if skills else "your background"

    if education and skills:
        return f"You are eligible for this internship because your profile in {education} and skills ({top_skills}) match your interest profile and skill development goals."
    elif skills:
        return f"You are eligible for this internship because your skills ({top_skills}) match your interest profile and skill development goals."
    else:
        return "You are eligible for this internship because it matches your interest profile and skill development goals."


def _detect_mismatches_and_warnings(parsed_data: Dict[str, Any], raw_text: str) -> List[str]:
    """Detect potential bluff indicators, missing critical data, or document mismatches."""
    warnings_list = []

    # 1. Missing contact details
    if not parsed_data.get("email"):
        warnings_list.append("Email address could not be detected in resume.")
    if not parsed_data.get("phone"):
        warnings_list.append("Contact phone number missing in resume.")

    # 2. Skill density check
    skills = parsed_data.get("skills") or []
    if len(skills) == 0:
        warnings_list.append("No technical skills detected in uploaded resume.")
    elif len(skills) < 3:
        warnings_list.append("Low skill density: Only 1-2 technical skills identified.")

    # 3. Missing education or experience
    if not parsed_data.get("education") and not parsed_data.get("branch"):
        warnings_list.append("Degree / Educational qualification missing.")

    if not parsed_data.get("experience") and not parsed_data.get("projects"):
        warnings_list.append("No work experience or project details found.")

    # 4. Irregular text layout / OCR check
    if len((raw_text or "").strip()) < 100:
        warnings_list.append("Scanned image or sparse document layout detected.")

    return warnings_list


def _detect_bluff_words(raw_skills: List[str], raw_text: str) -> List[str]:
    """Detect suspicious skill tokens, section spillover artifacts, or unverified buzzwords."""
    suspicious_patterns = [
        "solidity frontend", "sql blockchain", "expert in all", "guru", "ninja",
        "rockstar", "master of everything", "100% proficient", "pro in python java c++ react node",
        "hacker", "know everything"
    ]
    detected_bluffs = []

    # Check raw skills array
    for s in raw_skills:
        s_lower = str(s).strip().lower()
        if any(pat in s_lower for pat in suspicious_patterns):
            detected_bluffs.append(str(s).strip())

    # Check raw text for exaggerated buzzwords
    raw_lower = (raw_text or "").lower()
    for pat in ["rockstar developer", "ninja coder", "master of all languages"]:
        if pat in raw_lower:
            detected_bluffs.append(pat.title())

    return list(dict.fromkeys(detected_bluffs))


def parse_resume(file_path: str) -> Dict[str, Any]:
    """Parse resume PDF/DOCX file and return structured candidate object with confidence metrics."""
    if ResumeParser is None:
        raise RuntimeError("ResumeParser dependencies are not installed.")

    parser = ResumeParser()
    resume = parser.parse(file_path)
    raw_text = getattr(resume, "raw_text", "") or ""

    parsed_name = getattr(resume.contact_info, "name", None) if hasattr(resume, "contact_info") else None
    parsed_email = getattr(resume.contact_info, "email", None) if hasattr(resume, "contact_info") else None
    parsed_phone = getattr(resume.contact_info, "phone", None) if hasattr(resume, "contact_info") else None

    raw_skills = [skill.name for skill in resume.skills if hasattr(skill, "name") and skill.name] if hasattr(resume, "skills") else []
    education, branch = _clean_education(resume)
    links = _extract_links(raw_text)

    parsed_data = {
        "name": _clean_name(raw_text, parsed_name),
        "email": _extract_email_fallback(raw_text, parsed_email),
        "phone": _extract_phone_fallback(raw_text, parsed_phone),
        "skills": _clean_skills(raw_skills),
        "education": education,
        "branch": branch,
        "experience": _clean_experience(resume),
        "projects": _extract_projects_from_text(raw_text),
        "links": links,
        "preferredJobRole": "",
        "preferredDomain": "",
    }

    parsed_data["matchExplanation"] = _generate_match_explanation(parsed_data)
    parsed_data["confidence"] = _compute_confidence(raw_text, parsed_data)
    parsed_data["warnings"] = _detect_mismatches_and_warnings(parsed_data, raw_text)
    parsed_data["bluffWords"] = _detect_bluff_words(raw_skills, raw_text)
    return parsed_data