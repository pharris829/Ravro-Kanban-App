import { useState, useEffect, useCallback } from 'react';

export default function SubCardModal({ subcard, onSave, onDelete, onClose }) {
  // stack[i] is the full note object at that depth (with its current subcards)
  const [stack, setStack] = useState([subcard]);
  const [title, setTitle] = useState(subcard.title);
  const [content, setContent] = useState(subcard.content);

  const depth   = stack.length;
  const current = stack[depth - 1];
  const subcards = current.subcards || [];

  // Build the saved root note from the current stack + live edits
  const buildRoot = useCallback((t, c) => {
    let node = { ...current, title: t.trim() || 'Note', content: c };
    for (let i = depth - 2; i >= 0; i--) {
      const parent = stack[i];
      node = { ...parent, subcards: (parent.subcards || []).map(s => s.id === node.id ? node : s) };
    }
    return node;
  }, [stack, current, depth]);

  const handleClose = useCallback(() => {
    onSave(buildRoot(title, content));
    onClose();
  }, [onSave, onClose, buildRoot, title, content]);

  // Navigate into a child note (saves current edits into stack first)
  const openChild = (child) => {
    const saved = { ...current, title: title.trim() || 'Note', content };
    setStack(prev => [...prev.slice(0, -1), saved, child]);
    setTitle(child.title);
    setContent(child.content);
  };

  // Navigate back to parent
  const goBack = useCallback(() => {
    const saved = { ...current, title: title.trim() || 'Note', content };
    const parent = stack[depth - 2];
    const updatedParent = {
      ...parent,
      subcards: (parent.subcards || []).map(s => s.id === saved.id ? saved : s),
    };
    setStack(prev => [...prev.slice(0, -2), updatedParent]);
    setTitle(updatedParent.title);
    setContent(updatedParent.content);
  }, [stack, current, depth, title, content]);

  // Create a new child note at the current level
  const addChild = () => {
    const newChild = { id: `sc-${Date.now()}`, title: 'New note', content: '', subcards: [] };
    const saved = { ...current, title: title.trim() || 'Note', content, subcards: [...subcards, newChild] };
    setStack(prev => [...prev.slice(0, -1), saved, newChild]);
    setTitle(newChild.title);
    setContent(newChild.content);
  };

  // Delete current note (or pop back to parent if nested)
  const handleDelete = () => {
    if (depth === 1) {
      onDelete(current.id);
      onClose();
    } else {
      const parent = stack[depth - 2];
      const updatedParent = {
        ...parent,
        subcards: (parent.subcards || []).filter(s => s.id !== current.id),
      };
      setStack(prev => [...prev.slice(0, -2), updatedParent]);
      setTitle(updatedParent.title);
      setContent(updatedParent.content);
    }
  };

  // Escape: go back one level, or close if at root
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (depth > 1) goBack();
        else handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [depth, goBack, handleClose]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="subcard-modal">

        <div className="subcard-modal-header">
          {depth > 1 && (
            <button className="btn-subcard-back" onClick={goBack} title="Back">←</button>
          )}
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

        {subcards.length > 0 && (
          <div className="subcard-children">
            {subcards.map(s => (
              <button
                key={s.id}
                className="subcard-chip"
                onClick={() => openChild(s)}
                title={s.content || 'Empty note'}
              >
                ◉ {s.title}
              </button>
            ))}
          </div>
        )}

        <div className="subcard-footer">
          <button className="btn-delete-subcard" onClick={handleDelete}>
            Delete note
          </button>
          <button className="btn-new-subcard" onClick={addChild}>
            + New card
          </button>
        </div>

      </div>
    </div>
  );
}
