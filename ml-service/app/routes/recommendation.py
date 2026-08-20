import os
import tempfile

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.schemas.candidate import CandidateProfile
from app.services.parser import parse_resume
from app.services.recommendation_service import RecommendationService


router = APIRouter()

recommendation_service = RecommendationService()


@router.post("/recommend")
def recommend(candidate: CandidateProfile):

    results = recommendation_service.recommend(
        candidate
    )

    return {
        "recommendations": results[
            [
                "Company_Name",
                "JobTitles",
                "Skills",
                "Description",
                "Stipend",
                "Links",
                "similarity_score"
            ]
        ].to_dict(orient="records")
    }

@router.post("/recommend-from-resume")
async def recommend_from_resume(
    file: UploadFile = File(...)
):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided"
        )

    allowed_extensions = {".pdf", ".docx"}

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported"
        )

    temp_path = None

    try:
        # Save uploaded resume temporarily
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp_file:

            content = await file.read()
            temp_file.write(content)

            temp_path = temp_file.name

        # Parse resume
        resume_data = parse_resume(temp_path)

        # Convert parsed data to CandidateProfile
        candidate = CandidateProfile(
            skills=resume_data["skills"],
            education=resume_data["education"],
            branch=resume_data["branch"],
            experience=resume_data["experience"],
            projects=resume_data["projects"],
            preferredJobRole=resume_data["preferredJobRole"],
            preferredDomain=resume_data["preferredDomain"]
        )

        # Generate recommendations
        results = recommendation_service.recommend(
            candidate
        )

        recommendations = results[
            [
                "Company_Name",
                "JobTitles",
                "Skills",
                "Description",
                "Stipend",
                "Links",
                "similarity_score"
            ]
        ].to_dict(orient="records")

        return {
            "success": True,
            "filename": file.filename,
            "candidate": resume_data,
            "recommendations": recommendations
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Resume recommendation failed: {str(e)}"
        )

    finally:

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)