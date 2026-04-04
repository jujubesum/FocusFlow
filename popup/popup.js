const profileBtns = document.querySelectorAll('.profile-btn');
const apiInput = document.getElementById('api-key');
const saveBtn = document.getElementById('save-btn');
const status = document.getElementById('status');

chrome.storage.sync.get(['profile', 'apiKey'], ({ profile = 'none', apiKey = '' }) => {
  setActiveProfile(profile);
  if (apiKey) apiInput.value = apiKey;
});

profileBtns.forEach(btn => {
  btn.addEventListener('click', () => setActiveProfile(btn.dataset.profile));
});

function setActiveProfile(profile) {
  profileBtns.forEach(b => b.classList.toggle('active', b.dataset.profile === profile));
}

function getActiveProfile() {
  return document.querySelector('.profile-btn.active')?.dataset.profile ?? 'none';
}

saveBtn.addEventListener('click', async () => {
  const profile = getActiveProfile();
  const apiKey = apiInput.value.trim();
  if (profile !== 'none' && !apiKey) {
    showStatus('Add your API key to use AI features.', true);
    return;
  }
  await chrome.storage.sync.set({ profile, apiKey });
  showStatus('Saved! Reload the tab to apply.');
});

function showStatus(msg, isError = false) {
  status.textContent = msg;
  status.className = 'status' + (isError ? ' error' : '');
  setTimeout(() => { status.textContent = ''; }, 3000);
}