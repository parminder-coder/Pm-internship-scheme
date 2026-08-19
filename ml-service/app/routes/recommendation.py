from fastapi import APIRouter

from app.schemas.candidate import CandidateProfile
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