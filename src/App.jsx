import { useState, useEffect, useCallback } from 'react';
import Board from './components/Board';
import ChatSidebar from './components/ChatSidebar';
import SettingsModal from './components/SettingsModal';

const DEFAULT_COLUMNS = [
  { id: 'backlog',      title: 'Backlog',      cards: [] },
  { id: 'in-progress',  title: 'In Progress',  cards: [] },
  { id: 'review',       title: 'Review',       cards: [] },
  { id: 'done',         title: 'Done',         cards: [] },
];

let _id = Date.now();
const uid = () => `c-${++_id}`;

export default function App() {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [suggestingMoves, setSuggestingMoves] = useState(false);

  useEffect(() => {
    window.electronAPI?.board.load().then(data => {
      if (data?.columns) setColumns(data.columns);
    });
  }, []);

  const persist = useCallback((cols) => {
    window.electronAPI?.board.save({ columns: cols });
  }, []);

  const addCard = useCallback((colId, text) => {
    setColumns(prev => {
      const next = prev.map(c =>
        c.id === colId ? { ...c, cards: [...c.cards, { id: uid(), text }] } : c
      );
      persist(next);
      return next;
    });
  }, [persist]);

  const moveCard = useCallback((cardId, fromColId, direction) => {
    setColumns(prev => {
      const fromIdx = prev.findIndex(c => c.id === fromColId);
      const toIdx = direction === 'left' ? fromIdx - 1 : fromIdx + 1;
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const card = prev[fromIdx].cards.find(c => c.id === cardId);
      if (!card) return prev;
      const next = prev.map((col, i) => {
        if (i === fromIdx) return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
        if (i === toIdx)   return { ...col, cards: [...col.cards, card] };
        return col;
      });
      persist(next);
      return next;
    });
  }, [persist]);

  const deleteCard = useCallback((colId, cardId) => {
    setColumns(prev => {
      const next = prev.map(c =>
        c.id === colId ? { ...c, cards: c.cards.filter(card => card.id !== cardId) } : c
      );
      persist(next);
      return next;
    });
  }, [persist]);

  const updateCard = useCallback((colId, cardId, text) => {
    setColumns(prev => {
      const next = prev.map(c =>
        c.id === colId
          ? { ...c, cards: c.cards.map(card => card.id === cardId ? { ...card, text } : card) }
          : c
      );
      persist(next);
      return next;
    });
  }, [persist]);

  const addCards = useCallback((colId, texts) => {
    setColumns(prev => {
      const next = prev.map(c =>
        c.id === colId
          ? { ...c, cards: [...c.cards, ...texts.map(text => ({ id: uid(), text }))] }
          : c
      );
      persist(next);
      return next;
    });
  }, [persist]);

  const suggestMoves = useCallback(async () => {
    setSuggestingMoves(true);
    const boardState = columns.map(c => ({
      column: c.title,
      cards: c.cards.map(card => card.text),
    }));

    const result = await window.electronAPI?.ai.complete({
      systemPrompt: `You are a project management assistant. Analyze this Kanban board and suggest card moves.
Return ONLY a JSON array — no markdown fences, no extra text. Format:
[{"cardText":"...","fromColumn":"...","toColumn":"...","reason":"..."}]
Only suggest moves that clearly make sense. If no moves are needed, return [].`,
      messages: [{
        role: 'user',
        content: `Board state:\n${JSON.stringify(boardState, null, 2)}\n\nSuggest cards that should move to a different column.`,
      }],
    });

    setSuggestingMoves(false);

    if (!result?.ok) { alert(`AI error: ${result?.error}`); return; }

    let suggestions;
    try {
      suggestions = JSON.parse(result.text);
    } catch {
      alert('Could not parse AI response. Try again.'); return;
    }

    if (!suggestions.length) { alert('No moves suggested — board looks great!'); return; }

    const msg = suggestions
      .map(s => `• "${s.cardText}"\n  ${s.fromColumn} → ${s.toColumn}: ${s.reason}`)
      .join('\n\n');

    if (!confirm(`AI suggested moves:\n\n${msg}\n\nApply all?`)) return;

    setColumns(prev => {
      let next = prev.map(c => ({ ...c, cards: [...c.cards] }));
      for (const s of suggestions) {
        const fromCol = next.find(c => c.title === s.fromColumn);
        const toCol   = next.find(c => c.title === s.toColumn);
        if (!fromCol || !toCol) continue;
        const card = fromCol.cards.find(c => c.text === s.cardText);
        if (!card) continue;
        next = next.map(c => {
          if (c.id === fromCol.id) return { ...c, cards: c.cards.filter(x => x.id !== card.id) };
          if (c.id === toCol.id)   return { ...c, cards: [...c.cards, card] };
          return c;
        });
      }
      persist(next);
      return next;
    });
  }, [columns, persist]);

  const totalCards = columns.reduce((s, c) => s + c.cards.length, 0);

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">RK</div>
        <span className="header-title">Ravro Kanban</span>
        <div className="header-actions">
          <span className="header-count">{totalCards} card{totalCards !== 1 ? 's' : ''}</span>
          <button
            className="btn-header"
            onClick={suggestMoves}
            disabled={suggestingMoves}
            title="AI: Suggest card moves across columns"
          >
            {suggestingMoves ? '✦ Thinking…' : '✦ Suggest Moves'}
          </button>
          <button
            className="btn-header btn-icon"
            onClick={() => setSettingsOpen(true)}
            title="AI Settings"
          >⚙</button>
          <button
            className={`btn-header btn-icon${sidebarOpen ? ' active' : ''}`}
            onClick={() => setSidebarOpen(v => !v)}
            title="Toggle AI chat"
          >◧</button>
        </div>
      </header>

      <div className="workspace">
        <Board
          columns={columns}
          onAddCard={addCard}
          onMoveCard={moveCard}
          onDeleteCard={deleteCard}
          onUpdateCard={updateCard}
          onAddCards={addCards}
        />
        {sidebarOpen && (
          <ChatSidebar columns={columns} onClose={() => setSidebarOpen(false)} />
        )}
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
