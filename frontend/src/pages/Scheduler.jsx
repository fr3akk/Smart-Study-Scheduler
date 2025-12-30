import { useEffect, useState } from "react";

function Scheduler() {
  const [dailyHours, setDailyHours] = useState("");
  const [examDate, setExamDate] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [progress, setProgress] = useState([]);

  // Normalize date helper
  const normalizeDate = (d) => d.toString().slice(0, 10);

  // Load progress
  useEffect(() => {
    fetch("http://127.0.0.1:8000/progress")
      .then((res) => res.json())
      .then((data) => setProgress(data))
      .catch(() => setProgress([]));
  }, []);

  // Generate schedule
  const handleGenerate = async () => {
    const res = await fetch("http://127.0.0.1:8000/scheduler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        daily_hours: Number(dailyHours),
        exam_date: examDate,
      }),
    });

    const data = await res.json();
    setSchedule(Array.isArray(data) ? data : []);
  };

  // Check completion
  const isCompleted = (date, topic) => {
    return progress.some(
      (p) =>
        normalizeDate(p.date) === date &&
        p.topic === topic &&
        p.completed
    );
  };

  // ✅ OPTIMISTIC TOGGLE (THE REAL FIX)
  const toggleProgress = async (date, topic, hours, completed) => {
    // 1️⃣ Update UI immediately
    setProgress((prev) => {
      const filtered = prev.filter(
        (p) =>
          !(
            normalizeDate(p.date) === date &&
            p.topic === topic
          )
      );

      return [
        ...filtered,
        {
          date,
          topic,
          hours,
          completed,
        },
      ];
    });

    // 2️⃣ Sync backend (no UI blocking)
    await fetch("http://127.0.0.1:8000/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        topic,
        hours,
        completed,
      }),
    });
  };

  // Progress calculation
  const allTaskKeys = schedule.flatMap((day) =>
    day.tasks.map((task) => `${day.date}-${task.topic}`)
  );

  const completedTaskKeys = progress
    .filter((p) => p.completed)
    .map((p) => `${normalizeDate(p.date)}-${p.topic}`);

  const completedTasks = allTaskKeys.filter((key) =>
    completedTaskKeys.includes(key)
  ).length;

  const totalTasks = allTaskKeys.length;
  const completionPercent =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div style={{ padding: "30px" }}>
      <h2>Study Scheduler</h2>

      <div style={{ marginBottom: "15px" }}>
        <input
          type="number"
          placeholder="Daily hours"
          value={dailyHours}
          onChange={(e) => setDailyHours(e.target.value)}
        />
        &nbsp;&nbsp;
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
        />
        &nbsp;&nbsp;
        <button onClick={handleGenerate}>Generate</button>
      </div>

      {schedule.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <strong>Progress: {completionPercent}%</strong>
          <div
            style={{
              height: "10px",
              background: "#ddd",
              borderRadius: "5px",
              marginTop: "5px",
            }}
          >
            <div
              style={{
                width: `${completionPercent}%`,
                height: "100%",
                background: "#4caf50",
                borderRadius: "5px",
              }}
            />
          </div>
        </div>
      )}

      {schedule.map((day, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "6px",
          }}
        >
          <strong>{day.date}</strong>
          <ul>
            {day.tasks.map((task, i) => (
              <li key={`${day.date}-${task.topic}`}>
                <input
                  type="checkbox"
                  checked={isCompleted(day.date, task.topic)}
                  onChange={(e) =>
                    toggleProgress(
                      day.date,
                      task.topic,
                      task.hours,
                      e.target.checked
                    )
                  }
                />
                &nbsp;{task.topic} — {task.hours} hrs
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default Scheduler;
