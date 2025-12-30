const BASE_URL = "http://127.0.0.1:8000";

export async function getSubjects() {
  const response = await fetch(`${BASE_URL}/subjects`);
  return response.json();
}

export async function createSubject(name) {
  const response = await fetch(`${BASE_URL}/subjects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  return response.json();
}

export async function getTopicsBySubject(subjectId) {
  const response = await fetch(
    `${BASE_URL}/topics/subject/${subjectId}`
  );
  return response.json();
}

export async function createTopic(topic) {
  const response = await fetch(`${BASE_URL}/topics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(topic),
  });
  return response.json();
}

export async function generateSchedule(data) {
  const response = await fetch("http://127.0.0.1:8000/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
}
