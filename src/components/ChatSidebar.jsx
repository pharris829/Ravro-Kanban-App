import { useState, useRef, useEffect } from 'react';

export default function ChatSidebar({ columns, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I can see your board. Ask me anything about your tasks, or ask me to help plan, prioritize, or review your work." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const boardContext = columns.map(c => ({
    column: c.title,
    cards: c.cards.map(card => card.text),
  }));

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const history = [...messages, userMsg].map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text,
    }));

    const result = await window.electronAPI?.ai.complete({
      systemPrompt: `You are a helpful project management assistant embedded in Ravro Kanban.
Current board state:
${JSON.stringify(boardContext, null, 2)}

Help the user with tasks, priorities, blockers, and planning. Be concise and practical.`,
      messages: history,
    });

    setLoading(false);
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        text: result?.ok ? result.text : `Error: ${result?.error ?? 'Unknown error'}`,
      },
    ]);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">✦ AI Chat</span>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <div className="sidebar-messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg msg-${m.role}`}>
            <span className="msg-label">{m.role === 'assistant' ? '✦ AI' : 'You'}</span>
            <p className="msg-text">{m.text}</p>
          </div>
        ))}
        {loading && (
          <div className="msg msg-assistant">
            <span className="msg-label">✦ AI</span>
            <p className="msg-text msg-loading">Thinking…</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sidebar-input-area">
        <textarea
          className="sidebar-input"
          placeholder="Ask about your board… (Enter to send)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          rows={3}
        />
        <button className="btn-send" onClick={send} disabled={!input.trim() || loading}>
          Send
        </button>
      </div>
    </aside>
  );
}
