from pydantic import BaseModel
from typing import List


class CandidateProfile(BaseModel):
    skills: List[str]
    education: str = ""
    branch: str = ""
    experience: str = ""
    projects: List[str] = []
    preferredJobRole: str = ""
    preferredDomain: str = ""