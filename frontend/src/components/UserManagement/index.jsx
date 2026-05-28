import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  AlertTriangle,
} from "lucide-react";
import "./index.css";

const INITIAL_USERS = [
  { id: 1, name: "Test t1",  email: "t1@example.com", role: "admin",  status: "active",   joined: "2026-01-15" },
  { id: 2, name: "Test t2",    email: "t2@example.com",   role: "editor", status: "active",   joined: "2026-02-02" },
  { id: 3, name: "Test t3",   email: "t3@example.com", role: "viewer", status: "inactive", joined: "2026-03-18" },
  { id: 4, name: "Test t4",    email: "t4@example.com", role: "editor", status: "active",   joined: "2026-04-30" },
  { id: 5, name: "Test t5",   email: "t5@example.com",   role: "viewer", status: "active",   joined: "2026-05-11" },
];

const ROLE_LABELS  = { admin: "Admin", editor: "Éditeur", viewer: "Lecteur" };
const ROLE_CLASSES = { admin: "um-badge um-badge-admin", editor: "um-badge um-badge-editor", viewer: "um-badge um-badge-viewer" };

function getInitials(name) {
  return name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarClass(name) {
  const i = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % 6;
  return `um-avatar um-avatar-${i}`;
}

const EMPTY_FORM = { name: "", email: "", role: "viewer", status: "active" };

function UserModal({ mode, user, onSave, onClose }) {
  const [form, setForm]     = useState(mode === "edit" ? { ...user } : EMPTY_FORM);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: "" }));
  }

  function handleSubmit() {
    const errs = {};
    if (!form.name.trim())  errs.name  = "Le nom est requis";
    if (!form.email.trim()) errs.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Email invalide";
    if (Object.keys(errs).length > 0) return setErrors(errs);
    onSave(form);
  }

  return (
    <div className="um-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="um-modal">
        <h3>{mode === "edit" ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h3>

        <div className="um-form-group">
          <label>Nom complet</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Jean Dupont"
            className={errors.name ? "error" : ""}
          />
          {errors.name && <p className="um-field-error">{errors.name}</p>}
        </div>

        <div className="um-form-group">
          <label>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="jean@exemple.com"
            className={errors.email ? "error" : ""}
          />
          {errors.email && <p className="um-field-error">{errors.email}</p>}
        </div>

        <div className="um-form-row">
          <div className="um-form-group">
            <label>Rôle</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="admin">Admin</option>
              <option value="editor">Éditeur</option>
              <option value="viewer">Lecteur</option>
            </select>
          </div>
          <div className="um-form-group">
            <label>Statut</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>

        <div className="um-modal-footer">
          <button className="um-btn" onClick={onClose}>Annuler</button>
          <button className="um-btn um-btn-primary" onClick={handleSubmit}>
            {mode === "edit" ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ user, onConfirm, onClose }) {
  return (
    <div className="um-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="um-modal">
        <h3>
          <AlertTriangle size={17} className="um-danger-icon" />
          Supprimer l'utilisateur
        </h3>
        <p className="um-delete-text">
          Êtes-vous sûr de vouloir supprimer <strong>{user.name}</strong> ?
          Cette action est irréversible.
        </p>
        <div className="um-modal-footer">
          <button className="um-btn" onClick={onClose}>Annuler</button>
          <button className="um-btn um-btn-confirm-delete" onClick={onConfirm}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users,  setUsers]  = useState(INITIAL_USERS);
  const [nextId, setNextId] = useState(6);
  const [search, setSearch] = useState("");
  const [modal,  setModal]  = useState(null);

  const filtered = useMemo(
    () => users.filter((u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    ),
    [users, search]
  );

  function handleSave(form) {
    if (modal.type === "create") {
      setUsers((prev) => [
        ...prev,
        { ...form, id: nextId, joined: new Date().toISOString().slice(0, 10) },
      ]);
      setNextId((n) => n + 1);
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === modal.user.id ? { ...u, ...form } : u))
      );
    }
    setModal(null);
  }

  function handleDelete() {
    setUsers((prev) => prev.filter((u) => u.id !== modal.user.id));
    setModal(null);
  }

  return (
    <div className="um-page">
      <div className="um-container">

        {/* Header */}
        <div className="um-header">
          <h1>Utilisateurs</h1>
          <p>Gestion des utilisateurs.</p>
        </div>

        {/* Toolbar */}
        <div className="um-toolbar">
          <div className="um-toolbar-left">
            <div className="um-search-wrap">
              <span className="um-search-icon">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="um-count">
              {filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button className="um-btn um-btn-primary" onClick={() => setModal({ type: "create" })}>
            <Plus size={15} />
            Nouvel utilisateur
          </button>
        </div>

        {/* Table */}
        <div className="um-table-card">
          <table className="um-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Inscrit le</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="um-empty">
                      <div className="um-empty-icon"><Users size={32} /></div>
                      Aucun utilisateur trouvé
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id}>
                    {/* Utilisateur */}
                    <td>
                      <div className="um-user-cell">
                        <div className={getAvatarClass(user.name)}>
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <div className="um-user-name">{user.name}</div>
                          <div className="um-user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Rôle */}
                    <td>
                      <span className={ROLE_CLASSES[user.role]}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>

                    {/* Statut */}
                    <td>
                      <span className={`um-badge ${user.status === "active" ? "um-badge-active" : "um-badge-inactive"}`}>
                        <span className={`um-status-dot ${user.status === "active" ? "um-dot-active" : "um-dot-inactive"}`} />
                        {user.status === "active" ? "Actif" : "Inactif"}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="um-date">
                      {new Date(user.joined).toLocaleDateString("fr-FR", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="um-actions">
                        <button
                          className="um-btn um-btn-edit-ghost"
                          onClick={() => setModal({ type: "edit", user })}
                        >
                          <Pencil size={13} />
                          Modifier
                        </button>
                        <button
                          className="um-btn um-btn-danger-ghost"
                          onClick={() => setModal({ type: "delete", user })}
                        >
                          <Trash2 size={13} />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {(modal?.type === "create" || modal?.type === "edit") && (
        <UserModal
          mode={modal.type}
          user={modal.user}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          user={modal.user}
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
