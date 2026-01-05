import { useState, useEffect } from "react";
import axios from "axios";

export default function Scheduler() {
  const [dailyHours, setDailyHours] = useState("");
  const [examDate, setExamDate] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);

  // =========================
  // Load saved schedule on page load
  // =========================
  useEffect(() => {
    loadSavedSchedule();
  }, []);

  const loadSavedSchedule = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/scheduler");

      if (res.data.length > 0) {
        const formatted = res.data.map(day => ({
          ...day,
          tasks: day.tasks.map(task => ({
            ...task,
            completed: false
          }))
        }));

        setSchedule(formatted);
        updateProgress(formatted);
      }
    } catch (err) {
      console.error("Failed to load saved schedule");
    }
  };

  // =========================
  // Generate schedule
  // =========================
  const generateSchedule = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/scheduler", {
        daily_hours: Number(dailyHours),
        exam_date: examDate
      });

      const formatted = res.data.map(day => ({
        ...day,
        tasks: day.tasks.map(task => ({
          ...task,
          completed: false
        }))
      }));

      setSchedule(formatted);
      updateProgress(formatted);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        "Failed to generate schedule";
      alert(msg);
    }
  };

  // =========================
  // Toggle task completion
  // =========================
  const toggleTask = (dayIndex, taskIndex) => {
    const updated = [...schedule];

    updated[dayIndex].tasks[taskIndex].completed =
      !updated[dayIndex].tasks[taskIndex].completed;

    setSchedule(updated);
    updateProgress(updated);
  };

  // =========================
  // Update progress bar
  // =========================
  const updateProgress = (data) => {
    let total = 0;
    let completed = 0;

    data.forEach(day => {
      day.tasks.forEach(task => {
        total++;
        if (task.completed) completed++;
      });
    });

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    setProgressPercent(percent);
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: "20px" }}>
      <h2>Study Scheduler</h2>

      <label>
        Daily Study Hours:
        <input
          type="number"
          value={dailyHours}
          onChange={(e) => setDailyHours(e.target.value)}
          style={{ marginLeft: "10px" }}
        />
      </label>

      <br /><br />

      <label>
        Exam Date:
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          style={{ marginLeft: "10px" }}
        />
      </label>

      <button
        onClick={generateSchedule}
        style={{ marginLeft: "20px" }}
      >
        Generate
      </button>

      <hr />

      <h3>Progress</h3>

      <div
        style={{
          width: "100%",
          background: "#ddd",
          height: "20px",
          borderRadius: "10px"
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            background: "green",
            height: "100%",
            borderRadius: "10px"
          }}
        />
      </div>

      <p>{progressPercent}% completed</p>

      <hr />

      {schedule.length === 0 ? (
        <p>No schedule generated yet.</p>
      ) : (
        schedule.map((day, dayIndex) => (
          <div key={dayIndex}>
            <h4>{day.date}</h4>

            {day.tasks.map((task, taskIndex) => (
              <div key={taskIndex}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(dayIndex, taskIndex)}
                />
                <span style={{ marginLeft: "8px" }}>
                  {task.topic} ({task.hours} hrs)
                </span>
              </div>
            ))}

            <br />
          </div>
        ))
      )}
    </div>
  );
}
