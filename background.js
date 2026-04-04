const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq(text) {
  const { apiKey } = await chrome.storage.sync.get('apiKey');
  if (!apiKey) return null;

  const res = await fetch(GROQ_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: 'You are a summarization assistant. Summarize the user\'s text into 3-5 bullet points. Start each bullet with "- ". Return ONLY the bullets, nothing else.'
        },
        {
          role: 'user',
          content: text
        }
      ]
    })
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

function parseBullets(text) {
  return text
    .split('\n')
    .map(l => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SUMMARIZE') {
    callGroq(msg.text)
      .then(responseText => {
        const bullets = responseText ? parseBullets(responseText) : ['Could not summarize — check your API key.'];
        sendResponse({ bullets });
      })
      .catch(() => sendResponse({ bullets: ['Summarization failed.'] }));
    return true;
  }

  if (msg.type === 'GET_PROFILE') {
    chrome.storage.sync.get(['profiles', 'apiKey', 'ruler', 'summarizeDemand', 'hideImages'], data => sendResponse(data));
    return true;
  }

  if (msg.type === 'SET_PROFILE') {
    chrome.storage.sync.set({ profiles: msg.profiles }, () => sendResponse({ ok: true }));
    return true;
  }
});