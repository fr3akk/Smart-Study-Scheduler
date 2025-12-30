import { useEffect, useState } from "react";
import { getSubjects, createSubject } from "../services/api";

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const data = await getSubjects();
    setSubjects(data);
  }

  async function handleAddSubject(e) {
    e.preventDefault();
    if (!newSubject.trim()) return;

    await createSubject(newSubject);
    setNewSubject("");
    loadSubjects();
  }

  return (
    <div>
      <h2>Subjects</h2>

      {/* Add Subject Form */}
      <form onSubmit={handleAddSubject} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter subject name"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
        />
        <button type="submit" style={{ marginLeft: "10px" }}>
          Add
        </button>
      </form>

      {/* Subjects List */}
      <ul>
        {subjects.map((subject) => (
          <li key={subject.id}>{subject.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Subjects;
