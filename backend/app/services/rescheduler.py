from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.schedule import StudySchedule
from app.models.topic import Topic
from app.models.progress import StudyProgress


def reschedule(db: Session, daily_hours: int, exam_date: date):
    """
    Smart rebalancing algorithm.

    Steps:
    1. Delete future scheduled tasks
    2. Calculate remaining hours per topic
    3. Redistribute across remaining days
    """

    today = date.today()

    # 1️⃣ Delete ONLY future schedule
    db.query(StudySchedule)\
        .filter(StudySchedule.date > today)\
        .delete()

    # 2️⃣ Fetch all incomplete topics
    topics = db.query(Topic).filter(
        Topic.is_completed == False
    ).all()

    if not topics:
        db.commit()
        return

    # 3️⃣ Calculate remaining hours per topic
    queue = []

    for topic in topics:

        # Total completed hours from progress table
        completed_hours = db.query(
            func.coalesce(func.sum(StudyProgress.hours), 0)
        ).filter(
            StudyProgress.topic == topic.name,
            StudyProgress.completed == True
        ).scalar()

        remaining_hours = topic.estimated_hours - completed_hours

        if remaining_hours > 0:
            queue.append({
                "name": topic.name,
                "hours": remaining_hours
            })

    if not queue:
        db.commit()
        return

    # 4️⃣ Rebuild forward
    current_day = today + timedelta(days=1)
    days_left = (exam_date - current_day).days

    if days_left <= 0:
        raise ValueError("Not enough days left to reschedule tasks")

    for _ in range(days_left):
        remaining = daily_hours

        if not queue:
            break

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
