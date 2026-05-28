import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import "./index.css";

const API_BASE = "http://localhost:3001/api";

const ROLE_LABELS  = { admin: "Admin", editor: "Éditeur", viewer: "Lecteur" };
const ROLE_CLASSES = {
  admin:  "um-badge um-badge-admin",
  editor: "um-badge um-badge-editor",
  viewer: "um-badge um-badge-viewer",
};

function getInitials(name) {
  return name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarClass(name) {
  const i = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % 6;
  return `um-avatar um-avatar-${i}`;
}

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

const api = {
  getUsers:    (q)      => apiFetch(`/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createUser:  (body)   => apiFetch("/users",     { method: "POST",   body: JSON.stringify(body) }),
  updateUser:  (id, body) => apiFetch(`/users/${id}`, { method: "PUT",    body: JSON.stringify(body) }),
  deleteUser:  (id)     => apiFetch(`/users/${id}`, { method: "DELETE" }),
};

const EMPTY_FORM = { name: "", email: "", role: "viewer", status: "active" };

function UserModal({ mode, user, onSaved, onClose }) {
  const [form,    setForm]    = useState(mode === "edit" ? { ...user } : EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: "" }));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const result =
        mode === "edit"
          ? await api.updateUser(user.id, form)
          : await api.createUser(form);
      onSaved(result.data);
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setErrors({ _global: err.error || "Une erreur est survenue" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="um-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="um-modal">
        <h3>{mode === "edit" ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h3>

        {errors._global && <p className="um-field-error um-error-banner">{errors._global}</p>}

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
          <button className="um-btn" onClick={onClose} disabled={loading}>
            Annuler
          </button>
          <button className="um-btn um-btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 size={13} className="um-spin" />}
            {mode === "edit" ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ user, onDeleted, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function handleConfirm() {
    setLoading(true);
    try {
      await api.deleteUser(user.id);
      onDeleted(user.id);
    } catch (err) {
      setError(err.error || "Une erreur est survenue");
      setLoading(false);
    }
  }

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
        {error && <p className="um-field-error um-error-banner">{error}</p>}
        <div className="um-modal-footer">
          <button className="um-btn" onClick={onClose} disabled={loading}>
            Annuler
          </button>
          <button className="um-btn um-btn-confirm-delete" onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 size={13} className="um-spin" />}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users,   setUsers]   = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [modal,   setModal]   = useState(null);

  const fetchUsers = useCallback(async (q = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getUsers(q);
      setUsers(res.data);
    } catch {
      setError("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchUsers]);

  function handleSaved(user) {
    setUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      return exists
        ? prev.map((u) => (u.id === user.id ? user : u))
        : [...prev, user];
    });
    setModal(null);
  }

  function handleDeleted(id) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setModal(null);
  }

  return (
    <div className="um-page">
      <div className="um-container">

        {/* Header */}
        <div className="um-header">
          <h1>Utilisateurs</h1>
          <p>Gérez les comptes et les permissions.</p>
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
              {loading ? "…" : `${users.length} utilisateur${users.length !== 1 ? "s" : ""}`}
            </span>
          </div>
          <button
            className="um-btn um-btn-primary"
            onClick={() => setModal({ type: "create" })}
          >
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
              {/* Loading state */}
              {loading && (
                <tr>
                  <td colSpan={5}>
                    <div className="um-empty">
                      <Loader2 size={24} className="um-spin um-empty-icon" />
                      Chargement…
                    </div>
                  </td>
                </tr>
              )}

              {/* Error state */}
              {!loading && error && (
                <tr>
                  <td colSpan={5}>
                    <div className="um-empty um-error-state">
                      <AlertTriangle size={24} className="um-empty-icon" />
                      {error}
                      <button className="um-btn um-btn-retry" onClick={() => fetchUsers(search)}>
                        Réessayer
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {!loading && !error && users.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="um-empty">
                      <div className="um-empty-icon"><Users size={32} /></div>
                      Aucun utilisateur trouvé
                    </div>
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!loading && !error && users.map((user) => (
                <tr key={user.id}>
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
                  <td>
                    <span className={ROLE_CLASSES[user.role]}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td>
                    <span className={`um-badge ${user.status === "active" ? "um-badge-active" : "um-badge-inactive"}`}>
                      <span className={`um-status-dot ${user.status === "active" ? "um-dot-active" : "um-dot-inactive"}`} />
                      {user.status === "active" ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="um-date">
                    {new Date(user.joined).toLocaleDateString("fr-FR", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {(modal?.type === "create" || modal?.type === "edit") && (
        <UserModal
          mode={modal.type}
          user={modal.user}
          onSaved={handleSaved}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          user={modal.user}
          onDeleted={handleDeleted}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
