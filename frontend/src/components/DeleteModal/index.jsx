import { useState } from "react";
import { api } from "../../libs/api";
import { AlertTriangle, Loader2 } from "lucide-react";

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

export default DeleteModal;
