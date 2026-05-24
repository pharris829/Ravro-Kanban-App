import { useState } from 'react';
import Card from './Card';
import AddCardForm from './AddCardForm';

export default function Column({ col, colIndex, totalCols, onAddCard, onMoveCard, onDeleteCard, onUpdateCard, onAddCards }) {
  const [adding, setAdding] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleAdd = (text) => {
    onAddCard(col.id, text);
    setAdding(false);
  };

  const generateCards = async () => {
    setGenerating(true);
    const result = await window.electronAPI?.ai.complete({
      systemPrompt: `You are a project management assistant. Suggest new task cards for a Kanban column.
Return ONLY a JSON array of strings — no markdown, no extra text. Example: ["Task one","Task two"]
Keep each title concise (under 10 words). Generate 3 to 5 suggestions that do not duplicate existing cards.`,
      messages: [{
        role: 'user',
        content: `Column: "${col.title}"\nExisting cards: ${col.cards.map(c => `"${c.text}"`).join(', ') || 'none'}\n\nSuggest new task cards for this column.`,
      }],
    });
    setGenerating(false);
    if (!result?.ok) { alert(`AI error: ${result?.error}`); return; }
    try {
      const suggestions = JSON.parse(result.text);
      if (Array.isArray(suggestions) && suggestions.length) {
        onAddCards(col.id, suggestions.map(String));
      }
    } catch {
      alert('Could not parse AI suggestions. Try again.');
    }
  };

  return (
    <div className="column">
      <div className="column-header">
        <span className="column-title">{col.title}</span>
        <span className="column-count">{col.cards.length}</span>
      </div>

      <div className="card-list">
        {col.cards.length === 0 && !adding && (
          <p className="empty-hint">No cards yet</p>
        )}
        {col.cards.map(card => (
          <Card
            key={card.id}
            card={card}
            isFirst={colIndex === 0}
            isLast={colIndex === totalCols - 1}
            onMoveLeft={() => onMoveCard(card.id, col.id, 'left')}
            onMoveRight={() => onMoveCard(card.id, col.id, 'right')}
            onDelete={() => onDeleteCard(col.id, card.id)}
            onUpdate={(text) => onUpdateCard(col.id, card.id, text)}
          />
        ))}
      </div>

      <div className="add-area">
        {adding ? (
          <AddCardForm onAdd={handleAdd} onCancel={() => setAdding(false)} />
        ) : (
          <div className="add-row-btns">
            <button className="btn-new-card" onClick={() => setAdding(true)}>+ New card</button>
            <button
              className="btn-ai-generate"
              onClick={generateCards}
              disabled={generating}
              title="AI: Generate card suggestions"
            >{generating ? '…' : '✦'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
