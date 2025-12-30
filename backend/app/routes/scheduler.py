from fastapi import APIRouter
from pydantic import BaseModel
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.services.database import SessionLocal
from app.models.topic import Topic
from app.models.schedule import StudySchedule

router = APIRouter(prefix="/scheduler", tags=["Scheduler"])


# =========================
# Request Body Schema
# =========================
class ScheduleRequest(BaseModel):
    daily_hours: int
    exam_date: date


# =========================
# POST: Generate + Save Schedule
# =========================
@router.post("/")
def generate_schedule(payload: ScheduleRequest):
    db: Session = SessionLocal()

    # Get unfinished topics
    topics = db.query(Topic).filter(Topic.is_completed == False).all()

    if not topics:
        db.close()
        return []

    days = (payload.exam_date - date.today()).days
    if days <= 0:
        db.close()
        return []

    schedule = []
    current_day = date.today()

    # Create a working queue (DO NOT mutate DB objects)
    topic_queue = [
        {"name": t.name, "hours": t.estimated_hours}
        for t in topics
    ]

    # Generate schedule
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
                "date": current_day.isoformat(),
                "tasks": daily_tasks
            })

        current_day += timedelta(days=1)

    # =========================
    # SAVE SCHEDULE TO DB
    # =========================
    db.query(StudySchedule).delete()  # clear old schedule

    for day in schedule:
        for task in day["tasks"]:
            db.add(
                StudySchedule(
                    date=day["date"],
                    topic=task["topic"],
                    hours=task["hours"]
                )
            )

    db.commit()
    db.close()

    return schedule


# =========================
# GET: Load Saved Schedule
# =========================
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

    return [
        {"date": k, "tasks": v}
        for k, v in grouped.items()
    ]
