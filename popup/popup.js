const profileBtns = document.querySelectorAll('.profile-btn');
const apiInput = document.getElementById('api-key');
const saveBtn = document.getElementById('save-btn');
const status = document.getElementById('status');
const rulerToggle = document.getElementById('toggle-ruler');
const summarizeDemandToggle = document.getElementById('toggle-summarize-demand');
const hideImagesToggle = document.getElementById('toggle-hide-images');

chrome.storage.sync.get(['profiles', 'apiKey', 'ruler', 'summarizeDemand', 'hideImages'], ({
  profiles = [],
  apiKey = '',
  ruler = false,
  summarizeDemand = false,
  hideImages = false
}) => {
  profiles.forEach(p => {
    const btn = document.querySelector(`[data-profile="${p}"]`);
    if (btn) btn.classList.add('active');
  });
  if (apiKey) apiInput.value = apiKey;
  rulerToggle.checked = ruler;
  summarizeDemandToggle.checked = summarizeDemand;
  hideImagesToggle.checked = hideImages;
});

profileBtns.forEach(btn => {
  btn.addEventListener('click', () => btn.classList.toggle('active'));
});

function getActiveProfiles() {
  return Array.from(document.querySelectorAll('.profile-btn.active')).map(b => b.dataset.profile);
}

saveBtn.addEventListener('click', async () => {
  const profiles = getActiveProfiles();
  const apiKey = apiInput.value.trim();
  const ruler = rulerToggle.checked;
  const summarizeDemand = summarizeDemandToggle.checked;
  const hideImages = hideImagesToggle.checked;

  if ((profiles.includes('adhd') || summarizeDemand) && !apiKey) {
    showStatus('Add your Groq API key to use summarization.', true);
    return;
  }

  await chrome.storage.sync.set({ profiles, apiKey, ruler, summarizeDemand, hideImages });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'APPLY_SETTINGS',
      profiles,
      ruler,
      summarizeDemand,
      hideImages
    });
  }

  showStatus('Applied!');
});

function showStatus(msg, isError = false) {
  status.textContent = msg;
  status.className = 'status' + (isError ? ' error' : '');
  setTimeout(() => { status.textContent = ''; }, 3000);
}