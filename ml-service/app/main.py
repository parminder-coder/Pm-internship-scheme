from fastapi import FastAPI

from app.routes.recommendation import router as recommendation_router
from app.routes.resume import router as resume_router


app = FastAPI(
    title="Internship Recommendation ML Service"
)


app.include_router(
    recommendation_router,
    prefix="/api"
)

app.include_router(
    resume_router,
    prefix="/api"
)

@app.get("/")
def root():
    return {
        "message": "ML service is running"
    }