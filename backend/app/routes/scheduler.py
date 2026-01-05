from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.services.database import SessionLocal
from app.models.topic import Topic
from app.models.schedule import StudySchedule

router = APIRouter(prefix="/scheduler", tags=["Scheduler"])


class ScheduleRequest(BaseModel):
    daily_hours: int
    exam_date: date


@router.post("/")
def generate_schedule(payload: ScheduleRequest):
    db: Session = SessionLocal()

    # -------------------------
    # Validate inputs
    # -------------------------
    if payload.daily_hours <= 0:
        db.close()
        raise HTTPException(400, "Daily study hours must be > 0")

    days = (payload.exam_date - date.today()).days
    if days <= 0:
        db.close()
        raise HTTPException(400, "Exam date must be in the future")

    topics = db.query(Topic).filter(Topic.is_completed == False).all()
    if not topics:
        db.close()
        raise HTTPException(
            400,
            "No pending topics found. Please add subjects and topics first."
        )

    for t in topics:
        if t.estimated_hours <= 0:
            db.close()
            raise HTTPException(
                400,
                f"Topic '{t.name}' has invalid estimated hours."
            )

    # -------------------------
    # Prepare queue
    # -------------------------
    topic_queue = [
        {"name": t.name, "hours": t.estimated_hours}
        for t in topics
    ]

    schedule = []
    current_day = date.today()

    # -------------------------
    # Generate schedule
    # -------------------------
    for _ in range(days):
        remaining = payload.daily_hours
        daily_tasks = []

        while remaining > 0 and topic_queue:
            topic = topic_queue[0]

            if topic["hours"] <= remaining:
                daily_tasks.append({
                    "topic": topic["name"],
                    "hours": topic["hours"]
                })
                remaining -= topic["hours"]
                topic_queue.pop(0)
            else:
                daily_tasks.append({
                    "topic": topic["name"],
                    "hours": remaining
                })
                topic["hours"] -= remaining
                remaining = 0

        if daily_tasks:
            schedule.append({
                "date": current_day,   # ✅ KEEP AS DATE OBJECT
                "tasks": daily_tasks
            })

        current_day += timedelta(days=1)

        if not topic_queue:
            break

    # -------------------------
    # Save schedule to DB
    # -------------------------
    db.query(StudySchedule).delete()

    for day in schedule:
        for task in day["tasks"]:
            db.add(
                StudySchedule(
                    date=day["date"],   # ✅ DATE OBJECT
                    topic=task["topic"],
                    hours=task["hours"]
                )
            )

    db.commit()
    db.close()

    # -------------------------
    # Convert dates to string for response
    # -------------------------
    return [
        {
            "date": d["date"].isoformat(),
            "tasks": d["tasks"]
        }
        for d in schedule
    ]


@router.get("/")
def get_saved_schedule():
    db: Session = SessionLocal()
    records = db.query(StudySchedule).all()
    db.close()

    grouped = {}

    for r in records:
        key = r.date.isoformat()
        grouped.setdefault(key, []).append({
            "topic": r.topic,
            "hours": r.hours
        })

    return [{"date": k, "tasks": v} for k, v in grouped.items()]
