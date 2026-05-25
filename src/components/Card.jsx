import { useState } from 'react';
import SubCardModal from './SubCardModal';

export default function Card({ card, isFirst, isLast, onMoveLeft, onMoveRight, onDelete, onUpdate }) {
  const [working, setWorking] = useState(null);
  const [openSubcard, setOpenSubcard] = useState(null);
  const subcards = card.subcards || [];

  const aiAction = async (action) => {
    setWorking(action);
    const prompts = {
      expand: {
        system: 'You are a project management assistant. Expand a brief task card into 2-3 sentences with more detail. Return only the expanded text, no preamble or quotes.',
        user: `Expand this task card: "${card.text}"`,
      },
      summarize: {
        system: 'You are a project management assistant. Condense a task description into one concise sentence under 10 words. Return only the summary, no preamble or quotes.',
        user: `Summarize this task card: "${card.text}"`,
      },
    };
    const p = prompts[action];
    const result = await window.electronAPI?.ai.complete({
      systemPrompt: p.system,
      messages: [{ role: 'user', content: p.user }],
    });
    setWorking(null);
    if (!result?.ok) { alert(`AI error: ${result?.error}`); return; }
    onUpdate({ text: result.text.trim() });
  };

  const addSubcard = () => {
    const sub = { id: `sc-${Date.now()}`, title: 'New note', content: '' };
    onUpdate({ subcards: [...subcards, sub] });
    setOpenSubcard(sub);
  };

  const saveSubcard = (updated) => {
    onUpdate({ subcards: subcards.map(s => s.id === updated.id ? updated : s) });
    setOpenSubcard(updated);
  };

  const deleteSubcard = (id) => {
    onUpdate({ subcards: subcards.filter(s => s.id !== id) });
  };

  return (
    <>
      <div className="card">
        {working && <div className="card-loading">✦ {working}ing…</div>}
        <div className="card-text">{card.text}</div>

        {subcards.length > 0 && (
          <div className="subcard-chips">
            {subcards.map(s => (
              <button
                key={s.id}
                className="subcard-chip"
                onClick={() => setOpenSubcard(s)}
                title={s.content || 'Empty note'}
              >
                ◉ {s.title}
              </button>
            ))}
          </div>
        )}

        <div className="card-actions">
          {!isFirst && <button className="btn-move" onClick={onMoveLeft}>← Left</button>}
          {!isLast  && <button className="btn-move" onClick={onMoveRight}>Right →</button>}
          <button className="btn-ai-action" onClick={() => aiAction('expand')}    disabled={!!working} title="AI: Expand card">✦+</button>
          <button className="btn-ai-action" onClick={() => aiAction('summarize')} disabled={!!working} title="AI: Summarize card">✦−</button>
          <button className="btn-ai-action" onClick={addSubcard} title="Add note">+ Note</button>
          <button className="btn-delete" onClick={onDelete} title="Delete card">✕</button>
        </div>
      </div>

      {openSubcard && (
        <SubCardModal
          subcard={openSubcard}
          onSave={saveSubcard}
          onDelete={deleteSubcard}
          onClose={() => setOpenSubcard(null)}
        />
      )}
    </>
  );
}
