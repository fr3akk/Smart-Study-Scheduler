from datetime import date, timedelta
from typing import List, Dict
from collections import defaultdict


# =========================================================
# PRIORITY ASSIGNMENT (RULE-BASED)
# =========================================================
def assign_priority(topic: Dict, days_left: int) -> str:
    """
    Assign priority based on urgency and workload.
    """
    if days_left <= 7 or topic["duration"] >= 90:
        return "HIGH"
    elif days_left <= 14:
        return "MEDIUM"
    else:
        return "LOW"


# =========================================================
# INTELLIGENT SCHEDULER
# =========================================================
def intelligent_schedule(
    topics: List[Dict],
    daily_hours: int,
    exam_date: date
) -> List[Dict]:
    """
    Generates a study schedule that:
    - Never exceeds daily study limit
    - Splits topics across days if required
    - Respects topic priority
    - Uses 1-based day indexing
    """

    today = date.today()
    days_left = (exam_date - today).days

    if days_left <= 0:
        raise ValueError("Exam date must be in the future")

    # Convert hours → minutes
    DAILY_LIMIT = daily_hours * 60

    # -------------------------
    # STEP 1: Assign priorities
    # -------------------------
    for topic in topics:
        topic["priority"] = assign_priority(topic, days_left)

    # -------------------------
    # STEP 2: Sort topics
    # Priority first, then longer topics
    # -------------------------
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    topics.sort(
        key=lambda t: (priority_order[t["priority"]], -t["duration"])
    )

    # -------------------------
    # STEP 3: Distribute across days (CORRECTLY)
    # -------------------------
    schedule = []

    current_day = 1                 # ✅ 1-based indexing
    minutes_used_today = 0

    for topic in topics:
        remaining_minutes = topic["duration"]

        # Keep assigning until topic is fully scheduled
        while remaining_minutes > 0:

            remaining_capacity = DAILY_LIMIT - minutes_used_today

            # Case 1: Topic fits in current day
            if remaining_minutes <= remaining_capacity:
                schedule.append({
                    "day": current_day,
                    "title": topic["title"],
                    "duration": remaining_minutes,
                    "priority": topic["priority"]
                })

                minutes_used_today += remaining_minutes
                remaining_minutes = 0

            # Case 2: Topic overflows → split
            else:
                schedule.append({
                    "day": current_day,
                    "title": topic["title"],
                    "duration": remaining_capacity,
                    "priority": topic["priority"]
                })

                remaining_minutes -= remaining_capacity
                current_day += 1
                minutes_used_today = 0

    # -------------------------
    # STEP 4: Final validation
    # -------------------------
    if current_day > days_left:
        raise ValueError(
            "Not enough days to schedule all topics before the exam."
        )

    return schedule


# =========================================================
# RESCHEDULE MISSED TASKS
# =========================================================
def reschedule_missed_tasks(tasks, daily_hours):
    """
    Moves tasks scheduled in the past to future dates
    without exceeding daily limits.
    """

    today = date.today()
    DAILY_LIMIT = daily_hours * 60

    # Group tasks by date
    schedule_by_date = defaultdict(list)
    for task in tasks:
        schedule_by_date[task.date].append(task)

    # Collect tasks from past dates
    missed_tasks = []
    for d in list(schedule_by_date.keys()):
        if d < today:
            missed_tasks.extend(schedule_by_date[d])
            del schedule_by_date[d]

    if not missed_tasks:
        return tasks

    # Start rescheduling from today
    current_date = today

    while missed_tasks:
        day_tasks = schedule_by_date[current_date]
        used_minutes = sum(t.hours * 60 for t in day_tasks)

        i = 0
        while i < len(missed_tasks):
            task = missed_tasks[i]
            task_minutes = task.hours * 60

            if used_minutes + task_minutes <= DAILY_LIMIT:
                task.date = current_date
                schedule_by_date[current_date].append(task)
                used_minutes += task_minutes
                missed_tasks.pop(i)
            else:
                i += 1

        current_date += timedelta(days=1)

    # Flatten grouped tasks
    updated_tasks = []
    for d in sorted(schedule_by_date.keys()):
        updated_tasks.extend(schedule_by_date[d])

    return updated_tasks
