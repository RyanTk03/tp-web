import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const db = new Database(join(__dirname, "..", "db", "users.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    email     TEXT    NOT NULL UNIQUE,
    role      TEXT    NOT NULL CHECK(role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
    status    TEXT    NOT NULL CHECK(status IN ('active', 'inactive'))      DEFAULT 'active',
    joined    TEXT    NOT NULL DEFAULT (date('now'))
  );
`);

const stmts = {
  getAll: db.prepare("SELECT * FROM users ORDER BY id ASC"),
  getOne: db.prepare("SELECT * FROM users WHERE id = ?"),
  getByEmail: db.prepare("SELECT * FROM users WHERE email = ? AND id != ?"),
  create: db.prepare(
    "INSERT INTO users (name, email, role, status, joined) VALUES (@name, @email, @role, @status, @joined)",
  ),
  update: db.prepare(
    "UPDATE users SET name = @name, email = @email, role = @role, status = @status WHERE id = @id",
  ),
  delete: db.prepare("DELETE FROM users WHERE id = ?"),
};

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/users", (req, res) => {
  const { q } = req.query;
  let users = stmts.getAll.all();

  if (q) {
    const lower = q.toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower),
    );
  }

  res.json({ data: users, total: users.length });
});

app.get("/api/users/:id", (req, res) => {
  const user = stmts.getOne.get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
  res.json({ data: user });
});

app.post("/api/users", (req, res) => {
  const { name, email, role = "viewer", status = "active" } = req.body;

  const joined = new Date().toISOString().slice(0, 10);
  const result = stmts.create.run({
    name: name.trim(),
    email: email.trim(),
    role,
    status,
    joined,
  });

  const created = stmts.getOne.get(result.lastInsertRowid);
  res.status(201).json({ data: created });
});

app.put("/api/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = stmts.getOne.get(id);
  if (!existing)
    return res.status(404).json({ error: "Utilisateur introuvable" });

  const { name, email, role, status } = req.body;

  stmts.update.run({
    id,
    name: name.trim(),
    email: email.trim(),
    role,
    status,
  });
  const updated = stmts.getOne.get(id);
  res.json({ data: updated });
});

app.patch("/api/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = stmts.getOne.get(id);
  if (!existing)
    return res.status(404).json({ error: "Utilisateur introuvable" });

  const merged = {
    name: req.body.name ?? existing.name,
    email: req.body.email ?? existing.email,
    role: req.body.role ?? existing.role,
    status: req.body.status ?? existing.status,
  };

  stmts.update.run({
    id,
    name: merged.name.trim(),
    email: merged.email.trim(),
    role: merged.role,
    status: merged.status,
  });

  const updated = stmts.getOne.get(id);
  res.json({ data: updated });
});

app.delete("/api/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = stmts.getOne.get(id);
  if (!existing)
    return res.status(404).json({ error: "Utilisateur introuvable" });

  stmts.delete.run(id);
  res.status(204).send();
});

app.use((_req, res) => res.status(404).json({ error: "Route introuvable" }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
