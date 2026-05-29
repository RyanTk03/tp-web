import { useState } from "react";
import { api } from "../../libs/api";
import { Loader2 } from "lucide-react";

const EMPTY_FORM = { name: "", email: "", role: "viewer", status: "active" };

export default function UserModal({ mode, user, onSaved, onClose }) {
  const [form, setForm] = useState(mode === "edit" ? { ...user } : EMPTY_FORM);
  const [errors, setErrors] = useState({});
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
    <div
      className="um-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="um-modal">
        <h3>
          {mode === "edit" ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        </h3>

        {errors._global && (
          <p className="um-field-error um-error-banner">{errors._global}</p>
        )}

        <div className="um-form-group">
          <label>Nom complet</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="John Doe"
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
            placeholder="johndoe@exemple.com"
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
          <button
            className="um-btn um-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <Loader2 size={13} className="um-spin" />}
            {mode === "edit" ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}
