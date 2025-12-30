import { useEffect, useState } from "react";
import {
  getSubjects,
  getTopicsBySubject,
  createTopic,
} from "../services/api";

function Topics() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topics, setTopics] = useState([]);

  const [topicName, setTopicName] = useState("");
  const [hours, setHours] = useState("");

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const data = await getSubjects();
    setSubjects(data);
  }

  async function handleSubjectChange(e) {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);

    if (subjectId) {
      const data = await getTopicsBySubject(subjectId);
      setTopics(data);
    } else {
      setTopics([]);
    }
  }

  async function handleAddTopic(e) {
    e.preventDefault();
    if (!topicName || !hours || !selectedSubject) return;

    await createTopic({
      name: topicName,
      estimated_hours: Number(hours),
      subject_id: Number(selectedSubject),
    });

    setTopicName("");
    setHours("");

    const updated = await getTopicsBySubject(selectedSubject);
    setTopics(updated);
  }

  return (
    <div>
      <h2>Topics</h2>

      {/* Subject Selector */}
      <select value={selectedSubject} onChange={handleSubjectChange}>
        <option value="">Select Subject</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* Add Topic Form */}
      {selectedSubject && (
        <form onSubmit={handleAddTopic} style={{ marginTop: "20px" }}>
          <input
            type="text"
            placeholder="Topic name"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            style={{ marginLeft: "10px" }}
          />
          <button type="submit" style={{ marginLeft: "10px" }}>
            Add Topic
          </button>
        </form>
      )}

      {/* Topics List */}
      <ul style={{ marginTop: "20px" }}>
        {topics.map((t) => (
          <li key={t.id}>
            {t.name} — {t.estimated_hours} hrs
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Topics;
