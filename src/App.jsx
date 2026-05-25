import { useState, useEffect, useCallback, useRef } from 'react';
import Board from './components/Board';
import ChatSidebar from './components/ChatSidebar';
import SettingsModal from './components/SettingsModal';
import SplashScreen from './components/SplashScreen';
import TitleCard from './components/TitleCard';
import FlowView from './components/FlowView';

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
  const [splash, setSplash] = useState(true);
  const [splashFade, setSplashFade] = useState(false);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'board' | 'flow'
  const [projectData, setProjectData] = useState({ title: '', toc: '' });
  const [flowData, setFlowData] = useState({ positions: {}, edges: [] });
  const [saved, setSaved] = useState(false);

  // Refs to avoid stale closures in persist callbacks
  const columnsRef = useRef(DEFAULT_COLUMNS);
  const projectRef = useRef({ title: '', toc: '' });
  const flowRef    = useRef({ positions: {}, edges: [] });
  useEffect(() => { columnsRef.current = columns; }, [columns]);
  useEffect(() => { projectRef.current = projectData; }, [projectData]);
  useEffect(() => { flowRef.current = flowData; }, [flowData]);

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFade(true), 1800);
    const t2 = setTimeout(() => setSplash(false),    2400);
    return () => [t1, t2].forEach(clearTimeout);
  }, []);

  useEffect(() => {
    window.electronAPI?.board.load().then(data => {
      if (data?.columns) { setColumns(data.columns); columnsRef.current = data.columns; }
      if (data?.project) { setProjectData(data.project); projectRef.current = data.project; }
      if (data?.flow)    { setFlowData(data.flow);    flowRef.current = data.flow; }
    });
  }, []);

  const saveAll = useCallback((cols, proj, flow) => {
    window.electronAPI?.board.save({ columns: cols, project: proj, flow });
  }, []);

  const persist = useCallback((cols) => {
    saveAll(cols, projectRef.current, flowRef.current);
  }, [saveAll]);

  const updateProject = useCallback((updates) => {
    setProjectData(prev => {
      const next = { ...prev, ...updates };
      projectRef.current = next;
      saveAll(columnsRef.current, next, flowRef.current);
      return next;
    });
  }, [saveAll]);

  const saveFlow = useCallback((flow) => {
    setFlowData(flow);
    flowRef.current = flow;
    saveAll(columnsRef.current, projectRef.current, flow);
  }, [saveAll]);

  const manualSave = useCallback(() => {
    saveAll(columnsRef.current, projectRef.current, flowRef.current);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [saveAll]);

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

  const updateCard = useCallback((colId, cardId, updates) => {
    setColumns(prev => {
      const next = prev.map(c =>
        c.id === colId
          ? { ...c, cards: c.cards.map(card => card.id === cardId ? { ...card, ...updates } : card) }
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
    try { suggestions = JSON.parse(result.text); }
    catch { alert('Could not parse AI response. Try again.'); return; }

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
    <>
      {splash && <SplashScreen fadeOut={splashFade} />}

      {!splash && view === 'dashboard' && (
        <TitleCard
          columns={columns}
          projectData={projectData}
          onUpdateProject={updateProject}
          onOpenProject={() => setView('board')}
        />
      )}

      {view === 'flow' && (
        <FlowView
          columns={columns}
          flowData={flowData}
          onSaveFlow={saveFlow}
          onBack={() => setView('board')}
          onUpdateCard={updateCard}
        />
      )}

      {view === 'board' && (
        <div className="app">
          <header className="header">
            <div className="header-logo" onClick={() => setView('dashboard')} title="Back to dashboard">RK</div>
            <span className="header-title">Ravro Kanban</span>
            <div className="header-actions">
              <span className="header-count">{totalCards} card{totalCards !== 1 ? 's' : ''}</span>
              <button
                className={`btn-header${saved ? ' btn-saved-flash' : ''}`}
                onClick={manualSave}
                title="Save board"
              >{saved ? '✓ Saved' : '↓ Save'}</button>
              <button
                className="btn-header"
                onClick={() => setView('flow')}
                title="Switch to flow view"
              >Flow ↗</button>
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
      )}
    </>
  );
}
