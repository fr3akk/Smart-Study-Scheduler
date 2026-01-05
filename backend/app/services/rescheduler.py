from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.models.schedule import StudySchedule
from app.models.topic import Topic


def reschedule(db: Session, daily_hours: int, exam_date: date):
    today = date.today()

    # 1️⃣ Delete ONLY future schedule
    db.query(StudySchedule)\
        .filter(StudySchedule.date > today)\
        .delete()

    # 2️⃣ Get unfinished topics
    topics = db.query(Topic).filter(Topic.is_completed == False).all()

    if not topics:
        db.commit()
        return

    # 3️⃣ Build work queue
    queue = [
        {"name": t.name, "hours": t.estimated_hours}
        for t in topics
    ]

    # 4️⃣ Rebuild forward
    current_day = today + timedelta(days=1)
    days_left = (exam_date - current_day).days

    for _ in range(days_left):
        remaining = daily_hours
        daily_tasks = []

        while remaining > 0 and queue:
            topic = queue[0]

            if topic["hours"] <= remaining:
                daily_tasks.append((topic["name"], topic["hours"]))
                remaining -= topic["hours"]
                queue.pop(0)
            else:
                daily_tasks.append((topic["name"], remaining))
                topic["hours"] -= remaining
                remaining = 0

        for name, hrs in daily_tasks:
            db.add(
                StudySchedule(
                    date=current_day,
                    topic=name,
                    hours=hrs
                )
            )

        current_day += timedelta(days=1)

    db.commit()
