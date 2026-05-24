import { useState, useEffect } from 'react';

const DEFAULTS = {
  provider: 'anthropic',
  anthropicApiKey: '',
  anthropicModel: 'claude-sonnet-4-6',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
};

export default function SettingsModal({ onClose }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.electronAPI?.settings.get().then(s => {
      if (s) setSettings(prev => ({ ...prev, ...s }));
    });
  }, []);

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const save = async () => {
    await window.electronAPI?.settings.set(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">AI Settings</span>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <label className="field-label">Provider</label>
          <div className="provider-tabs">
            {[['anthropic', 'Anthropic (Claude)'], ['ollama', 'Ollama (Local)']].map(([val, label]) => (
              <button
                key={val}
                className={`provider-tab${settings.provider === val ? ' active' : ''}`}
                onClick={() => set('provider', val)}
              >{label}</button>
            ))}
          </div>

          {settings.provider === 'anthropic' && (<>
            <label className="field-label">API Key</label>
            <input
              type="password"
              className="field-input"
              placeholder="sk-ant-api03-…"
              value={settings.anthropicApiKey}
              onChange={e => set('anthropicApiKey', e.target.value)}
            />
            <label className="field-label">Model</label>
            <select
              className="field-input"
              value={settings.anthropicModel}
              onChange={e => set('anthropicModel', e.target.value)}
            >
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (Recommended)</option>
              <option value="claude-opus-4-7">Claude Opus 4.7</option>
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
            </select>
          </>)}

          {settings.provider === 'ollama' && (<>
            <label className="field-label">Ollama URL</label>
            <input
              type="text"
              className="field-input"
              value={settings.ollamaUrl}
              onChange={e => set('ollamaUrl', e.target.value)}
            />
            <label className="field-label">Model</label>
            <input
              type="text"
              className="field-input"
              placeholder="llama3.2"
              value={settings.ollamaModel}
              onChange={e => set('ollamaModel', e.target.value)}
            />
            <p className="field-hint">
              Make sure Ollama is running locally with the model pulled.<br />
              e.g. <code style={{color:'var(--text-dim)'}}>ollama pull llama3.2</code>
            </p>
          </>)}
        </div>

        <div className="modal-footer">
          <button className="btn-save" onClick={save}>
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
