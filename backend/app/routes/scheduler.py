from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.services.database import SessionLocal
from app.models.topic import Topic
from app.models.schedule import StudySchedule
from app.services.scheduler_ai import intelligent_schedule


router = APIRouter(prefix="/scheduler", tags=["Scheduler"])


class ScheduleRequest(BaseModel):
    daily_hours: int
    exam_date: date


# -------------------------
# Generate Schedule
# -------------------------
@router.post("/")
def generate_schedule(payload: ScheduleRequest):
    db: Session = SessionLocal()

    try:
        # -------------------------
        # Validate inputs
        # -------------------------
        if payload.daily_hours <= 0:
            raise HTTPException(400, "Daily study hours must be > 0")

        days = (payload.exam_date - date.today()).days
        if days <= 0:
            raise HTTPException(400, "Exam date must be in the future")

        topics = db.query(Topic).filter(Topic.is_completed == False).all()
        if not topics:
            raise HTTPException(
                400,
                "No pending topics found. Please add subjects and topics first."
            )

        for t in topics:
            if t.estimated_hours <= 0:
                raise HTTPException(
                    400,
                    f"Topic '{t.name}' has invalid estimated hours."
                )

        # -------------------------
        # AI-powered scheduling
        # -------------------------
        topics_data = [
            {
                "title": t.name,
                "duration": int(t.estimated_hours * 60)
            }
            for t in topics
        ]

        schedule = intelligent_schedule(
            topics=topics_data,
            daily_hours=payload.daily_hours,
            exam_date=payload.exam_date
        )

        # -------------------------
        # Save schedule to DB
        # -------------------------
        # Clear old schedule
        db.query(StudySchedule).delete()
        db.commit()   # ✅ ensure delete is persisted first

        start_date = date.today()

        for item in schedule:
            record = StudySchedule(
                date=start_date + timedelta(days=item["day"]),
                topic=item["title"],
                hours=item["duration"] // 60,
            )
            db.add(record)

        db.commit()   # ✅ persist inserts

        return schedule

    finally:
        db.close()


# -------------------------
# Fetch Saved Schedule
# -------------------------
@router.get("/")
def get_saved_schedule():
    db: Session = SessionLocal()
    try:
        records = (
            db.query(StudySchedule)
            .order_by(StudySchedule.date)
            .all()
        )

        # Return flat structure (frontend friendly)
        return [
            {
                "date": r.date.isoformat(),
                "topic": r.topic,
                "hours": r.hours,
            }
            for r in records
        ]

    finally:
        db.close()
