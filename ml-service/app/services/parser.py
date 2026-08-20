import re
from typing import List

from pyresume.parser import ResumeParser


SECTION_NAMES = {
    "PROFESSIONAL SUMMARY",
    "TECHNICAL SKILLS",
    "EXPERIENCE",
    "PROJECTS",
    "EDUCATION",
    "CERTIFICATIONS",
    "ACHIEVEMENTS",
    "LANGUAGES",
}


def _clean_name(raw_text: str, parsed_name: str | None) -> str:
    """
    Prefer the first meaningful line of the resume over the parser's
    sometimes incorrect name prediction.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    if lines:
        first_line = lines[0]

        # Avoid treating a section header or obvious title as the person's name.
        if (
            first_line.upper() not in SECTION_NAMES
            and not any(sep in first_line for sep in ["|", "@"])
            and not re.search(r"https?://|www\.", first_line, re.IGNORECASE)
        ):
            return first_line

    return parsed_name or ""


def _clean_skills(skills: List[str]) -> List[str]:
    """
    Remove obvious parser artefacts and duplicates.
    """
    garbage = {
        "learn",
        "web",
        "solidity frontend",
        "sql blockchain",
    }

    cleaned = []
    seen = set()

    for skill in skills:
        skill = skill.strip()

        if not skill:
            continue

        if skill.lower() in garbage:
            continue

        key = skill.lower()
        if key not in seen:
            seen.add(key)
            cleaned.append(skill)

    return cleaned


def _clean_education(resume) -> tuple[str, str]:
    """
    Build education and branch from parsed education entries.
    Prefer the actual degree/institution information.
    """
    education_parts = []
    branch_parts = []

    for edu in resume.education:
        if edu.degree:
            education_parts.append(edu.degree.strip())

            degree_lower = edu.degree.lower()

            if "computer science" in degree_lower:
                branch_parts.append("Computer Science & Engineering")

        if edu.major:
            branch_parts.append(edu.major.strip())

    return " ".join(education_parts), " ".join(dict.fromkeys(branch_parts))


def _clean_experience(resume) -> str:
    """
    Convert parsed experience objects into a clean text representation.
    """
    experiences = []

    for exp in resume.experience:
        parts = []

        if exp.title:
            parts.append(exp.title.strip())

        if exp.company:
            company = exp.company.strip()

            # Remove the parser's accidental bullet/description spillover.
            company = company.split("●")[0].strip()

            if company:
                parts.append(company)

        if exp.description:
            description = exp.description.strip()
            if description:
                parts.append(description)

        if exp.responsibilities:
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
    lines = [line.strip() for line in raw_text.splitlines()]

    try:
        start = next(
            i for i, line in enumerate(lines)
            if line.upper() == "PROJECTS"
        )
    except StopIteration:
        return []

    try:
        end = next(
            i for i in range(start + 1, len(lines))
            if lines[i].upper() == "EDUCATION"
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

        # Project title lines contain "|" in this resume.
        if "|" in line and "http" not in line.lower():
            projects.append(line)

    return projects


def parse_resume(file_path: str):
    parser = ResumeParser()
    resume = parser.parse(file_path)

    education, branch = _clean_education(resume)

    return {
        "name": _clean_name(resume.raw_text or "", resume.contact_info.name),
        "email": resume.contact_info.email,
        "phone": resume.contact_info.phone,
        "skills": _clean_skills(
            [skill.name for skill in resume.skills if skill.name]
        ),
        "education": education,
        "branch": branch,
        "experience": _clean_experience(resume),
        "projects": _extract_projects_from_text(resume.raw_text or ""),
        "preferredJobRole": "",
        "preferredDomain": "",
    }