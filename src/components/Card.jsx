import { useState } from 'react';

export default function Card({ card, isFirst, isLast, onMoveLeft, onMoveRight, onDelete, onUpdate }) {
  const [working, setWorking] = useState(null);
  const [attachHover, setAttachHover] = useState(false);
  const attachments = card.attachments || [];

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

  const attachFiles = async () => {
    const paths = await window.electronAPI?.files.openDialog();
    if (!paths?.length) return;
    const newAttachments = [
      ...attachments,
      ...paths.map(p => ({
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: p.split(/[\\/]/).pop(),
        path: p,
      })),
    ];
    onUpdate({ attachments: newAttachments });
  };

  const removeAttachment = (id) => {
    onUpdate({ attachments: attachments.filter(a => a.id !== id) });
  };

  return (
    <div className="card">
      {working && <div className="card-loading">✦ {working}ing…</div>}
      <div className="card-text">{card.text}</div>

      {attachments.length > 0 && (
        <div
          className="attach-badge"
          onMouseEnter={() => setAttachHover(true)}
          onMouseLeave={() => setAttachHover(false)}
        >
          📎 {attachments.length}
          {attachHover && (
            <div className="attach-popup">
              {attachments.map(a => (
                <div key={a.id} className="attach-item">
                  <span
                    className="attach-name"
                    onClick={() => window.electronAPI?.files.open(a.path)}
                    title={a.path}
                  >{a.name}</span>
                  <button
                    className="attach-remove"
                    onClick={(e) => { e.stopPropagation(); removeAttachment(a.id); }}
                    title="Remove attachment"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card-actions">
        {!isFirst && <button className="btn-move" onClick={onMoveLeft}>← Left</button>}
        {!isLast  && <button className="btn-move" onClick={onMoveRight}>Right →</button>}
        <button className="btn-ai-action" onClick={() => aiAction('expand')}    disabled={!!working} title="AI: Expand card">✦+</button>
        <button className="btn-ai-action" onClick={() => aiAction('summarize')} disabled={!!working} title="AI: Summarize card">✦−</button>
        <button className="btn-ai-action" onClick={attachFiles} title="Attach file">📎</button>
        <button className="btn-delete" onClick={onDelete} title="Delete card">✕</button>
      </div>
    </div>
  );
}
