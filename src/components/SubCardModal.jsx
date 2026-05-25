import { useState } from 'react';

export default function SubCardModal({ subcard, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(subcard.title);
  const [content, setContent] = useState(subcard.content);

  const handleClose = () => {
    onSave({ ...subcard, title: title.trim() || 'Note', content });
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} onKeyDown={handleKeyDown}>
      <div className="subcard-modal">
        <div className="subcard-modal-header">
          <input
            className="subcard-title-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Note title"
            autoFocus
          />
          <button className="btn-close" onClick={handleClose} title="Close">✕</button>
        </div>

        <textarea
          className="subcard-content-area"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write notes, paste content, add links…"
        />

        <div className="subcard-footer">
          <button
            className="btn-delete-subcard"
            onClick={() => { onDelete(subcard.id); onClose(); }}
          >
            Delete note
          </button>
        </div>
      </div>
    </div>
  );
}
