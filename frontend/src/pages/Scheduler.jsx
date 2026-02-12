import React, { useEffect, useState } from "react";
import "./scheduler.css";
import axios from "axios";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Scheduler = () => {
  const [schedule, setSchedule] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("list");

  const [dailyHours, setDailyHours] = useState(4);
  const [examDate, setExamDate] = useState("");

  /* ==============================
     LOAD SCHEDULE + PROGRESS
  ============================== */
  const fetchAllData = async () => {
    try {
      const scheduleRes = await axios.get(
        "http://127.0.0.1:8000/scheduler/"
      );

      const progressRes = await axios.get(
        "http://127.0.0.1:8000/progress/"
      );

      const progressMap = {};
      progressRes.data.forEach((item) => {
        const id = `${item.date}-${item.topic}`;
        progressMap[id] = item.completed;
      });

      const merged = scheduleRes.data.map((task) => {
        const id = `${task.date}-${task.topic}`;

        return {
          id,
          title: task.topic,
          date: task.date,
          hours: task.hours,
          completed: progressMap[id] ?? false,
        };
      });

      setSchedule(merged);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  /* ==============================
     GENERATE SCHEDULE
  ============================== */
  const generateSchedule = async () => {
    if (!examDate) {
      alert("Please select an exam date.");
      return;
    }

    try {
      setLoading(true);

      await axios.post("http://127.0.0.1:8000/scheduler/", {
        daily_hours: dailyHours,
        exam_date: examDate,
      });

      await fetchAllData();
    } catch (err) {
      alert(err.response?.data?.detail || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  /* ==============================
     CLEAR SCHEDULE
  ============================== */
  const clearSchedule = async () => {
    try {
      await axios.delete("http://127.0.0.1:8000/scheduler/");
      await axios.post("http://127.0.0.1:8000/progress/", []);
      setSchedule([]);
      setProgress(0);
    } catch (err) {
      console.error("Clear failed", err);
    }
  };

  /* ==============================
     TOGGLE TASK
  ============================== */
  const toggleTask = async (id) => {
    const updated = schedule.map((task) =>
      task.id === id
        ? { ...task, completed: !task.completed }
        : task
    );

    setSchedule(updated);

    try {
      await axios.post(
        "http://127.0.0.1:8000/progress/",
        updated.map((t) => ({
          date: t.date,
          topic: t.title,
          hours: t.hours,
          completed: t.completed,
        }))
      );
    } catch (err) {
      console.error("Failed saving progress", err);
    }
  };

  /* ==============================
     LOAD ON START
  ============================== */
  useEffect(() => {
    fetchAllData();
  }, []);

  /* ==============================
     PROGRESS CALCULATION
  ============================== */
  useEffect(() => {
    if (schedule.length === 0) {
      setProgress(0);
      return;
    }

    const completed = schedule.filter((t) => t.completed).length;

    setProgress(
      Math.round((completed / schedule.length) * 100)
    );
  }, [schedule]);

  /* ==============================
     CALENDAR DATA
  ============================== */
  const calendarData = DAYS.map((day, index) => {
    const tasks = schedule.filter((task) => {
      const d = new Date(task.date);
      return d.getDay() === index;
    });

    const totalHours = tasks.reduce(
      (sum, task) => sum + task.hours,
      0
    );

    return { day, tasks, totalHours };
  });

  /* ==============================
     UI
  ============================== */
  return (
    <div className="scheduler-page">
      <header className="scheduler-header">
        <h1>Smart Study Scheduler</h1>
        <p>AI-powered personalized study planning</p>

        <div className="scheduler-inputs">
          <input
            type="number"
            min="1"
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

      {view === "list" && (
        <section className="tasks-section">
          <h2>Scheduled Tasks</h2>

          {schedule.length === 0 ? (
            <p>No schedule yet</p>
          ) : (
            <div className="tasks-grid">
              {schedule.map((task) => (
                <div
                  key={task.id}
                  className={`task-card ${
                    task.completed ? "done" : ""
                  }`}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                    />
                    {task.title}
                  </label>
                  <small>{task.hours} hrs</small>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {view === "calendar" && (
        <section className="calendar-section">
          <h2>Weekly Schedule</h2>

          <div className="calendar-grid">
            {calendarData.map((dayBlock) => (
              <div key={dayBlock.day} className="calendar-day">
                <h3>{dayBlock.day}</h3>
                <small>
                  Total: {dayBlock.totalHours.toFixed(1)} hrs
                </small>

                {dayBlock.tasks.length === 0 ? (
                  <p>No tasks</p>
                ) : (
                  dayBlock.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`calendar-task ${
                        task.completed ? "done" : ""
                      }`}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                        />
                        {task.title}
                      </label>
                      <small>{task.hours} hrs</small>
                    </div>
                  ))
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
