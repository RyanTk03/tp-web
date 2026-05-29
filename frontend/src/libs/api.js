const API_BASE = "http://localhost:3001/api";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

export const api = {
  getUsers:    (q)      => apiFetch(`/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createUser:  (body)   => apiFetch("/users",     { method: "POST",   body: JSON.stringify(body) }),
  updateUser:  (id, body) => apiFetch(`/users/${id}`, { method: "PUT",    body: JSON.stringify(body) }),
  deleteUser:  (id)     => apiFetch(`/users/${id}`, { method: "DELETE" }),
};