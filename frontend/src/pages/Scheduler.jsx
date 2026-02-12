import React, { useEffect, useState } from "react";
import "./scheduler.css";
import axios from "axios";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Scheduler = () => {
  const [schedule, setSchedule] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("list");

  const [dailyHours, setDailyHours] = useState(
    Number(localStorage.getItem("dailyHours")) || 4
  );

  const [examDate, setExamDate] = useState(
    localStorage.getItem("examDate") || ""
  );

  /* ---------------- FETCH SCHEDULE ---------------- */
  const fetchSchedule = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/scheduler/");

      const savedCompletion =
        JSON.parse(localStorage.getItem("taskCompletion")) || {};

      const formatted = res.data.map((task) => {
        const id = `${task.date}-${task.topic}`;

        return {
          id,
          title: task.topic,
          date: task.date,
          hours: task.hours,                 // ✅ single source of truth
          completed: savedCompletion[id] ?? false,
        };
      });

      setSchedule(formatted);
    } catch (err) {
      console.error("Failed to fetch schedule", err);
    }
  };

  /* ---------------- GENERATE SCHEDULE ---------------- */
  const generateSchedule = async () => {
    if (!examDate) {
      alert("Please select an exam date.");
      return;
    }

    if (dailyHours <= 0) {
      alert("Daily hours must be greater than 0.");
      return;
    }

    if (schedule.length > 0) {
      const confirmOverwrite = window.confirm(
        "This will overwrite your existing schedule. Continue?"
      );
      if (!confirmOverwrite) return;
    }

    try {
      setLoading(true);

      await axios.post("http://127.0.0.1:8000/scheduler/", {
        daily_hours: dailyHours,
        exam_date: examDate,
      });

      await fetchSchedule();
    } catch (err) {
      console.error("Failed to generate schedule", err);
      alert(err.response?.data?.detail || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CLEAR SCHEDULE ---------------- */
  const clearSchedule = async () => {
    const confirmClear = window.confirm(
      "This will clear your schedule permanently. Continue?"
    );
    if (!confirmClear) return;

    await axios.delete("http://127.0.0.1:8000/scheduler/");
    setSchedule([]);
    setProgress(0);
    localStorage.removeItem("taskCompletion");
  };

  /* ---------------- TOGGLE TASK ---------------- */
  const toggleTask = (id) => {
    setSchedule((prev) => {
      const updated = prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      );

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

  /* ---------------- LOAD ON START ---------------- */
  useEffect(() => {
    fetchSchedule();
  }, []);

  useEffect(() => {
    localStorage.setItem("dailyHours", dailyHours);
  }, [dailyHours]);

  useEffect(() => {
    if (examDate) localStorage.setItem("examDate", examDate);
  }, [examDate]);

  /* ---------------- PROGRESS ---------------- */
  useEffect(() => {
    if (schedule.length === 0) {
      setProgress(0);
      return;
    }

    const completed = schedule.filter((t) => t.completed).length;
    setProgress(Math.round((completed / schedule.length) * 100));
  }, [schedule]);

  /* ---------------- CALENDAR ---------------- */
  const calendarData = DAYS.map((day, dayIndex) => {
    const tasks = schedule.filter((task) => {
      const d = new Date(task.date);
      return d.getDay() === dayIndex;
    });

    const totalHours = tasks.reduce(
      (sum, task) => sum + task.hours,
      0
    );

    return { day, tasks, totalHours };
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
            value={dailyHours}
            onChange={(e) => setDailyHours(Number(e.target.value))}
            placeholder="Daily study hours"
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
