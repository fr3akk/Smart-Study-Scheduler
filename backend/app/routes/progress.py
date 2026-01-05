from fastapi import APIRouter
from pydantic import BaseModel
from datetime import date
from sqlalchemy.orm import Session

from app.services.database import SessionLocal
from app.models.progress import StudyProgress

router = APIRouter(prefix="/progress", tags=["Progress"])


# =========================
# Schemas
# =========================
class ProgressItem(BaseModel):
    date: date
    topic: str
    hours: int
    completed: bool


# =========================
# SAVE PROGRESS
# =========================
@router.post("/")
def save_progress(items: list[ProgressItem]):
    db: Session = SessionLocal()

    db.query(StudyProgress).delete()

    for item in items:
        db.add(
            StudyProgress(
                date=item.date,
                topic=item.topic,
                hours=item.hours,
                completed=item.completed
            )
        )

    db.commit()
    db.close()

    return {"message": "Progress saved successfully"}


# =========================
# LOAD PROGRESS
# =========================
@router.get("/")
def get_progress():
    db: Session = SessionLocal()
    records = db.query(StudyProgress).all()
    db.close()

    return [
        {
            "date": r.date.isoformat(),
            "topic": r.topic,
            "hours": r.hours,
            "completed": r.completed
        }
        for r in records
    ]
