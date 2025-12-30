from fastapi import APIRouter
from sqlalchemy.orm import Session
from datetime import date

from app.services.database import SessionLocal
from app.models.progress import StudyProgress

router = APIRouter(prefix="/progress", tags=["Progress"])

@router.post("/")
def save_progress(progress: dict):
    db: Session = SessionLocal()

    record = StudyProgress(
        date=progress["date"],
        topic=progress["topic"],
        hours=progress["hours"],
        completed=progress["completed"]
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    db.close()

    return {"status": "saved"}

@router.get("/")
def get_progress():
    db: Session = SessionLocal()
    records = db.query(StudyProgress).all()
    db.close()
    return records
