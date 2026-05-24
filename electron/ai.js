const DEFAULT_SETTINGS = {
  provider: 'anthropic',
  anthropicApiKey: '',
  anthropicModel: 'claude-sonnet-4-6',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
};

async function callAI(settings, messages, systemPrompt) {
  const cfg = { ...DEFAULT_SETTINGS, ...settings };

  if (cfg.provider === 'anthropic') {
    if (!cfg.anthropicApiKey) {
      throw new Error('Anthropic API key not set. Open Settings (⚙) to add your key.');
    }
    // Dynamic import works in CJS Node files
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: cfg.anthropicApiKey });
    const response = await client.messages.create({
      model: cfg.anthropicModel || 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });
    return response.content[0].text;
  }

  if (cfg.provider === 'ollama') {
    const baseUrl = cfg.ollamaUrl || 'http://localhost:11434';
    const model = cfg.ollamaModel || 'llama3.2';
    const allMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: allMessages, stream: false }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Ollama error ${res.status}: ${body}`);
    }
    const data = await res.json();
    return data.message.content;
  }

  throw new Error(`Unknown AI provider: ${cfg.provider}`);
}

module.exports = { callAI };
