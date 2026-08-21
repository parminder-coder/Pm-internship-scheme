import os
import tempfile

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.parser.parser import run_pipeline


router = APIRouter()


@router.post("/parse-resume")
async def parse_uploaded_resume(
    file: UploadFile = File(...)
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided"
        )

    allowed_extensions = {".pdf", ".docx"}

    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported"
        )

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp_file:

            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        try:
            resume_data = run_pipeline(uploaded_file_path=temp_path)

            return {
                "success": True,
                "filename": file.filename,
                "candidate": resume_data
            }

        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume parsing failed: {str(e)}"
        )