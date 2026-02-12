from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date, timedelta
from sqlalchemy.orm import Session

# Database session
from app.services.database import SessionLocal

# Database models
from app.models.topic import Topic
from app.models.schedule import StudySchedule

# AI scheduling logic
from app.services.scheduler_ai import intelligent_schedule
from app.services.rescheduler import reschedule



# =========================================================
# Router Configuration
# =========================================================
router = APIRouter(
    prefix="/scheduler",
    tags=["Scheduler"]
)


# =========================================================
# Request Body Schema
# =========================================================
class ScheduleRequest(BaseModel):
    daily_hours: int     # How many hours user can study per day
    exam_date: date      # Final exam date (must be future)


# =========================================================
# 1️⃣ GENERATE STUDY SCHEDULE
# =========================================================
@router.post("/")
def generate_schedule(payload: ScheduleRequest):
    """
    Generates a smart study schedule using AI logic.

    Flow:
    1. Validate user input
    2. Fetch pending topics
    3. Convert topics into AI-friendly format
    4. Generate schedule using intelligent algorithm
    5. Clear old schedule
    6. Save new schedule
    7. Return flat structure to frontend
    """

    db: Session = SessionLocal()

    try:
        today = date.today()

        # -------------------------
        # STEP 1: Input Validation
        # -------------------------
        if payload.daily_hours <= 0:
            raise HTTPException(
                status_code=400,
                detail="Daily study hours must be greater than 0"
            )

        if payload.exam_date <= today:
            raise HTTPException(
                status_code=400,
                detail="Exam date must be in the future"
            )

        # -------------------------
        # STEP 2: Fetch Pending Topics
        # -------------------------
        topics = db.query(Topic).filter(
            Topic.is_completed == False
        ).all()

        if not topics:
            raise HTTPException(
                status_code=400,
                detail="No pending topics found. Add subjects and topics first."
            )

        # Validate topic hours
        for topic in topics:
            if topic.estimated_hours <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Topic '{topic.name}' has invalid estimated hours."
                )

        # -------------------------
        # STEP 3: Prepare AI Input
        # -------------------------
        topics_data = [
            {
                "title": topic.name,
                "duration": int(topic.estimated_hours * 60)  # Convert to minutes
            }
            for topic in topics
        ]

        # -------------------------
        # STEP 4: Generate Schedule (AI Logic)
        # -------------------------
        schedule = intelligent_schedule(
            topics=topics_data,
            daily_hours=payload.daily_hours,
            exam_date=payload.exam_date
        )

        # If AI returned empty schedule
        if not schedule:
            raise HTTPException(
                status_code=400,
                detail="Not enough days available to complete all topics."
            )

        # -------------------------
        # STEP 5: Clear Old Schedule
        # -------------------------
        db.query(StudySchedule).delete()
        db.commit()

        # -------------------------
        # STEP 6: Save New Schedule
        # -------------------------
        saved_records = []

        for item in schedule:
            real_date = today + timedelta(days=item["day"] - 1)

            hours = round(item["duration"] / 60, 2)

            record = StudySchedule(
                date=real_date,
                topic=item["title"],
                hours=hours
            )

            db.add(record)

            saved_records.append({
                "date": real_date.isoformat(),
                "topic": item["title"],
                "hours": hours
            })

        db.commit()

        # -------------------------
        # STEP 7: Return Flat Structure
        # -------------------------
        # IMPORTANT: Frontend expects flat structure
        # [
        #   { date, topic, hours },
        #   { date, topic, hours }
        # ]
        return saved_records

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        db.close()


# =========================================================
# 2️⃣ FETCH SAVED SCHEDULE
# =========================================================
@router.get("/")
def get_saved_schedule():
    db: Session = SessionLocal()

    try:
        today = date.today()

        # Check for missed tasks
        missed_tasks = db.query(StudySchedule).filter(
            StudySchedule.date < today
        ).all()

        if missed_tasks:
            # ⚠ Temporary values (should be stored in DB ideally)
            exam_date = today + timedelta(days=30)

            reschedule(
                db=db,
                daily_hours=4,
                exam_date=exam_date
            )

        records = (
            db.query(StudySchedule)
            .order_by(StudySchedule.date)
            .all()
        )

        return [
            {
                "date": record.date.isoformat(),
                "topic": record.topic,
                "hours": record.hours,
            }
            for record in records
        ]

    finally:
        db.close()



# =========================================================
# 3️⃣ CLEAR SCHEDULE
# =========================================================
@router.delete("/")
def clear_schedule():
    """
    Deletes all scheduled study tasks.
    Used when user regenerates schedule.
    """

    db: Session = SessionLocal()

    try:
        db.query(StudySchedule).delete()
        db.commit()
        return {"message": "Schedule cleared successfully"}

    finally:
        db.close()
