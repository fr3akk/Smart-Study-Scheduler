import React, { useEffect, useState } from "react";
import "./scheduler.css";
import axios from "axios";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Scheduler = () => {
  const [schedule, setSchedule] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("list"); // list | calendar

  const [dailyHours, setDailyHours] = useState(() => {
    return Number(localStorage.getItem("dailyHours")) || 4;
  });

  const [examDate, setExamDate] = useState(() => {
    return localStorage.getItem("examDate") || "";
  });

  /* ---------------- FETCH SCHEDULE ---------------- */
  const fetchSchedule = async () => {
    try {
      const res = await axios.get("http://localhost:8000/scheduler/");

      // Restore completion state from localStorage
      const savedCompletion =
        JSON.parse(localStorage.getItem("taskCompletion")) || {};

      const formatted = res.data.map((task, index) => ({
        id: `${task.date}-${task.topic}-${index}`,
        title: task.topic || "Study Task",
        duration: (task.hours || 0) * 60,
        date: task.date,
        completed:
          savedCompletion[
            `${task.date}-${task.topic}-${index}`
          ] ?? false,
      }));

      setSchedule(formatted);
    } catch (err) {
      console.error("Failed to fetch schedule", err);
    }
  };

  /* ---------------- GENERATE SCHEDULE ---------------- */
const generateSchedule = async () => {
  try {
    if (!examDate) {
      alert("Please select an exam date.");
      return;
    }

    if (dailyHours <= 0) {
      alert("Daily hours must be greater than 0.");
      return;
    }

    // ✅ Confirm overwrite if schedule exists
    if (schedule.length > 0) {
      const confirmOverwrite = window.confirm(
        "This will overwrite your existing schedule. Do you want to continue?"
      );

      if (!confirmOverwrite) return;
    }

    setLoading(true);

    const payload = {
      daily_hours: dailyHours,
      exam_date: examDate,
    };

    await axios.post(
      "http://127.0.0.1:8000/scheduler/",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    await fetchSchedule();
  } catch (err) {
    console.error(
      "Failed to generate schedule",
      err.response?.data || err.message
    );
  } finally {
    setLoading(false);
  }
};

const clearSchedule = async () => {
  const confirmClear = window.confirm(
    "This will clear your schedule and progress permanently. Are you sure?"
  );

  if (!confirmClear) return;

  try {
    // ✅ Clear backend schedule
    await axios.delete("http://127.0.0.1:8000/scheduler/");

    // ✅ Clear UI state
    setSchedule([]);
    setProgress(0);

    // ✅ Clear stored progress
    localStorage.removeItem("taskCompletion");

    alert("Schedule cleared successfully ✅");
  } catch (err) {
    console.error("Failed to clear schedule", err);
    alert("Failed to clear schedule ❌");
  }
};


  /* ---------------- TOGGLE TASK ---------------- */
  const toggleTask = (index) => {
    setSchedule((prev) => {
      const updated = prev.map((task, i) =>
        i === index ? { ...task, completed: !task.completed } : task
      );

      // Persist checkbox state
      const completionMap = {};
      updated.forEach((t) => {
        completionMap[t.id] = t.completed;
      });
      localStorage.setItem(
        "taskCompletion",
        JSON.stringify(completionMap)
      );

      return updated;
    });
  };

  /* ---------------- LOAD ON PAGE REFRESH ---------------- */
  useEffect(() => {
    fetchSchedule();
  }, []);

  /* ✅ NEW: Persist input values */
  useEffect(() => {
    localStorage.setItem("dailyHours", dailyHours);
  }, [dailyHours]);

  useEffect(() => {
    if (examDate) {
      localStorage.setItem("examDate", examDate);
    }
  }, [examDate]);

  /* ---------------- PROGRESS CALC ---------------- */
  useEffect(() => {
    if (schedule.length === 0) {
      setProgress(0);
      return;
    }
    const completed = schedule.filter((t) => t.completed).length;
    setProgress(Math.round((completed / schedule.length) * 100));
  }, [schedule]);

  /* ---------------- CALENDAR GROUPING ---------------- */
  const calendarData = DAYS.map((day, dayIndex) => {
  const tasks = schedule.filter((task) => {
    const d = new Date(task.date);
    return d.getDay() === (dayIndex + 1) % 7;
  });

  const totalMinutes = tasks.reduce(
    (sum, task) => sum + task.duration,
    0
  );

  return {
    day,
    tasks,
    totalMinutes,
  };
});


  /* ---------------- UI ---------------- */
  return (
    <div className="scheduler-page">
      <header className="scheduler-header">
        <h1>Smart Study Scheduler</h1>
        <p>AI-powered personalized study planning</p>

        <div className="scheduler-inputs">
          <input
            type="number"
            min="1"
            placeholder="Daily study hours"
            value={dailyHours}
            onChange={(e) => setDailyHours(Number(e.target.value))}
          />

          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </div>

        <button
          className="generate-btn"
          onClick={generateSchedule}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Schedule"}
        </button>

        <button
          className="clear-btn"
          onClick={clearSchedule}
          disabled={loading}
        > 
          Clear Schedule
        </button>

        <div className="view-toggle">
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            List View
          </button>
          <button
            className={view === "calendar" ? "active" : ""}
            onClick={() => setView("calendar")}
          >
            Calendar View
          </button>
        </div>
      </header>

      <div className="progress-card">
        <h2>Progress Overview</h2>
        <div className="progress-bar-wrapper">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span>{progress}% completed</span>
      </div>

      {/* ---------------- LIST VIEW ---------------- */}
      {view === "list" && (
        <section className="tasks-section">
          <h2>Scheduled Tasks</h2>

         {schedule.length === 0 ? (
          <div className="empty-state">
           <h3>📘 No Schedule Yet</h3>
             <p>
               Enter your <b>daily study hours</b> and <b>exam date</b>, then click
              <b> Generate Schedule</b> to create your personalized plan.
              </p>
           </div>
           ) : (

            <div className="tasks-grid">
              {schedule.map((task, index) => (
                <div
                  key={task.id}
                  className={`task-card ${
                    task.completed ? "done" : ""
                  }`}
                >
                  <div className="task-row">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(index)}
                    />
                    <span className="task-title">
                      {task.title}
                    </span>
                  </div>
                  <span className="task-meta">
                    {task.duration} mins
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ---------------- CALENDAR VIEW ---------------- */}
      {view === "calendar" && (
        <section className="calendar-section">
          <h2>Weekly Schedule</h2>

          <div className="calendar-grid">
            {calendarData.map((dayBlock) => (
              <div key={dayBlock.day} className="calendar-day">
                <h3>{dayBlock.day}</h3>
                  <small className="day-total">
                    Total: {(dayBlock.totalMinutes / 60).toFixed(1)} hrs
                  </small>


                {dayBlock.tasks.length === 0 ? (
                  <p className="empty-text">No tasks</p>
                ) : (
                  dayBlock.tasks.map((task, idx) => {
                    const globalIndex = schedule.findIndex(
                      (t) => t.id === task.id
                    );

                    return (
                      <div
                        key={`${task.id}-${idx}`}
                        className={`calendar-task ${
                          task.completed ? "done" : ""
                        }`}
                      >
                        <label className="calendar-task-row">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() =>
                              toggleTask(globalIndex)
                            }
                          />
                          <span>{task.title}</span>
                        </label>
                        <small>{task.duration} mins</small>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Scheduler;
