import React, { useEffect, useState } from "react";
import "./scheduler.css";
import axios from "axios";

const Scheduler = () => {
  const [schedule, setSchedule] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH SCHEDULE ---------------- */
  const fetchSchedule = async () => {
    try {
      const res = await axios.get("http://localhost:5000/scheduler/");

      const formatted = res.data.map((task) => ({
        title: task.title || task.topic || task.subject || "Study Task",
        duration: task.duration || task.time || 0,
        completed: task.completed ?? false,
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
        "http://localhost:5000/scheduler/",
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

  /* ---------------- TOGGLE TASK ---------------- */
  const toggleTask = (index) => {
    setSchedule((prev) =>
      prev.map((task, i) =>
        i === index ? { ...task, completed: !task.completed } : task
      )
    );
  };

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    fetchSchedule();
  }, []);

  useEffect(() => {
    if (schedule.length === 0) {
      setProgress(0);
      return;
    }
    const completed = schedule.filter((t) => t.completed).length;
    setProgress(Math.round((completed / schedule.length) * 100));
  }, [schedule]);

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

      <section className="tasks-section">
        <h2>Today’s Tasks</h2>

        {schedule.length === 0 ? (
          <p className="empty-text">No tasks generated yet.</p>
        ) : (
          <div className="tasks-grid">
            {schedule.map((task, index) => (
              <div
                key={`task-${index}`}
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
                <span className="task-meta">{task.duration} mins</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Scheduler;
