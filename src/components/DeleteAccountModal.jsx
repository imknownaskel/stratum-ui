import { useState } from "react";
import "./DeleteAccountModal.css";

function DeleteAccountModal({ onClose, onConfirmDelete }) {
  const [confirmText, setConfirmText] = useState("");
  const [deleted, setDeleted] = useState(false);
  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  const handleConfirm = () => {
    setDeleted(true);
    setTimeout(() => {
      onConfirmDelete();
    }, 1400);
  };

  if (deleted) {
    return (
      <div className="delete-modal-overlay">
        <div className="delete-modal-card delete-modal-success">
          <div className="delete-modal-success-icon">✓</div>
          <h2 className="delete-modal-title">Account deleted</h2>
          <p className="delete-modal-description">
            Your account and data have been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal-card">
        <h2 className="delete-modal-title">Delete your account?</h2>
        <p className="delete-modal-description">
          This will permanently remove your account, scanned policies, and
          history. This action can't be undone.
        </p>

        <label className="delete-modal-label">
          Type <strong>DELETE</strong> to confirm
        </label>
        <input
          type="text"
          className="delete-modal-input"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
        />

        <div className="delete-modal-actions">
          <button className="delete-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="delete-modal-confirm"
            disabled={!canDelete}
            onClick={handleConfirm}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteAccountModal;