from fastapi import FastAPI

from app.routes.recommendation import router as recommendation_router


app = FastAPI(
    title="Internship Recommendation ML Service"
)


app.include_router(
    recommendation_router,
    prefix="/api"
)


@app.get("/")
def root():
    return {
        "message": "ML service is running"
    }