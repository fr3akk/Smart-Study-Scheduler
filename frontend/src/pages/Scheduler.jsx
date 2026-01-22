import React, { useEffect, useState } from "react";
import "./scheduler.css";
import axios from "axios";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Scheduler = () => {
  const [schedule, setSchedule] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("list"); // list | calendar

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
        duration: (task.hours || 0) * 60, // convert hours → mins
        date: task.date,
        completed: savedCompletion[
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
      setLoading(true);

      const payload = {
        daily_hours: 4,
        exam_date: "2026-12-31",
      };

      await axios.post(
        "http://127.0.0.1:8000/scheduler/",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      // After generation, re-fetch from DB
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
    fetchSchedule(); // ✅ THIS WAS MISSING
  }, []);

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
  const calendarData = DAYS.map((day, dayIndex) => ({
    day,
    tasks: schedule.filter((task) => {
      const d = new Date(task.date);
      return d.getDay() === (dayIndex + 1) % 7;
    }),
  }));

  /* ---------------- UI ---------------- */
  return (
    <div className="scheduler-page">
      <header className="scheduler-header">
        <h1>Smart Study Scheduler</h1>
        <p>AI-powered personalized study planning</p>

        <button
          className="generate-btn"
          onClick={generateSchedule}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Schedule"}
        </button>

        {/* VIEW TOGGLE */}
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
            <p className="empty-text">No tasks generated yet.</p>
          ) : (
            <div className="tasks-grid">
              {schedule.map((task, index) => (
                <div
                  key={task.id}
                  className={`task-card ${task.completed ? "done" : ""}`}
                >
                  <div className="task-row">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(index)}
                    />
                    <span className="task-title">{task.title}</span>
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
