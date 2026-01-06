from datetime import date, timedelta
from typing import List, Dict


def assign_priority(topic: Dict, days_left: int) -> str:
    """
    Rule-based priority assignment.
    """
    if days_left <= 7 or topic["duration"] >= 90:
        return "HIGH"
    elif days_left <= 14:
        return "MEDIUM"
    else:
        return "LOW"


def intelligent_schedule(
    topics: List[Dict],
    daily_hours: int,
    exam_date: date
) -> List[Dict]:
    """
    AI-powered (rule-based) scheduler.
    Returns an optimized study plan.
    """

    today = date.today()
    days_left = (exam_date - today).days

    if days_left <= 0:
        raise ValueError("Exam date must be in the future")

    daily_minutes = daily_hours * 60

    # Step 1: Assign priority to each topic
    for topic in topics:
        topic["priority"] = assign_priority(topic, days_left)

    # Step 2: Sort by priority, then by duration (desc)
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    topics.sort(
        key=lambda t: (priority_order[t["priority"]], -t["duration"])
    )

    # Step 3: Distribute tasks across days
    schedule = []
    current_day = 0
    minutes_used = 0

    for topic in topics:
        if minutes_used + topic["duration"] > daily_minutes:
            current_day += 1
            minutes_used = 0

        schedule.append({
            "title": topic["title"],
            "duration": topic["duration"],
            "day": current_day,
            "priority": topic["priority"],
            "completed": False
        })

        minutes_used += topic["duration"]

    return schedule
