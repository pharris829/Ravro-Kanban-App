import { useState, useRef, useEffect } from 'react';

export default function AddCardForm({ onAdd, onCancel }) {
  const [text, setText] = useState('');
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const submit = () => {
    const t = text.trim();
    if (t) { onAdd(t); setText(''); }
  };

  return (
    <div>
      <textarea
        ref={ref}
        className="add-input"
        placeholder="Card title…"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className="add-row">
        <button className="btn-add" onClick={submit} disabled={!text.trim()}>Add Card</button>
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
