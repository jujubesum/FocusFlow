(async () => {
  const { profile } = await chrome.runtime.sendMessage({ type: 'GET_PROFILE' });
  if (!profile || profile === 'none') return;

  markFocusableElements();

  if (profile === 'adhd' || profile === 'dyslexia') blurDistractions();
  if (profile === 'dyslexia') applyDyslexicTypography();
  if (profile === 'adhd') await summarizeWalls();
  if (profile === 'visual') applyHighContrast();

  startFocusMode();

  document.addEventListener('click', e => {
    if (e.target.classList.contains('clo-restore')) {
      const container = e.target.closest('[data-original-content]');
      if (container) {
        container.innerHTML = container.dataset.originalContent;
        delete container.dataset.originalContent;
      }
    }
  });

  let lastUrl = location.href;
  let isProcessing = false;

  setInterval(async () => {
    if (location.href !== lastUrl && !isProcessing) {
      lastUrl = location.href;
      isProcessing = true;

      let attempts = 0;
      while (attempts < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        document.querySelectorAll('[data-clo-processed]').forEach(el => {
          delete el.dataset.cloProcessed;
        });

        const old = document.getElementById('clo-page-summary');
        if (old) old.remove();

        const candidates = Array.from(
          document.querySelectorAll('p, article, section')
        ).filter(el => el.innerText.trim().split(/\s+/).length >= 50);

        if (candidates.length > 0) break;
        attempts++;
      }

      const { profile } = await chrome.runtime.sendMessage({ type: 'GET_PROFILE' });
      if (!profile || profile === 'none') { isProcessing = false; return; }
      markFocusableElements();
      if (profile === 'adhd' || profile === 'dyslexia') blurDistractions();
      if (profile === 'dyslexia') applyDyslexicTypography();
      if (profile === 'adhd') await summarizeWalls();
      if (profile === 'visual') applyHighContrast();
      startFocusMode();
      isProcessing = false;
    }
  }, 500);
})();

async function summarizeWalls() {
  const candidates = Array.from(
    document.querySelectorAll('p, article, section')
  ).filter(el => {
    const words = el.innerText.trim().split(/\s+/).length;
    return words >= 50 && !el.dataset.cloProcessed && !el.closest('[data-clo-processed]');
  });

  if (candidates.length === 0) return;

    const texts = candidates.map(el => el.innerText.trim()).join('\n\n').slice(0, 50000);
    candidates.slice(0, 3).forEach(el => {
    el.dataset.cloProcessed = '1';
  });

  const target =
    document.querySelector('#mw-content-text') ||
    document.querySelector('main') ||
    document.querySelector('article') ||
    document.querySelector('.content') ||
    document.body;

  const banner = document.createElement('div');
  banner.id = 'clo-page-summary';
  banner.innerHTML = `<div class="clo-loading">⏳ Generating page summary…</div>`;
  target.insertBefore(banner, target.firstChild);

  const response = await chrome.runtime.sendMessage({ type: 'SUMMARIZE', text: texts });
  const bullets = response?.bullets ?? ['Summarization unavailable.'];

  banner.innerHTML = `
    <div class="clo-summary-box">
      <div class="clo-summary-header">
        <span class="clo-badge">ADHD Summary</span>
        <span class="clo-word-count">Page overview</span>
      </div>
      <ul class="clo-bullets">
        ${bullets.map(b => `<li>${b}</li>`).join('\n')}
      </ul>
      <button class="clo-restore-banner">✕ Dismiss</button>
    </div>`;

  banner.querySelector('.clo-restore-banner').addEventListener('click', () => {
    banner.remove();
  });
}

function blurDistractions() {
  const SELECTORS = [
    'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
    '[class*="advertisement"]', '[class*=" ad-"]', '[id*="-ad-"]',
    '[class*="banner-ad"]', '[class*="sponsored"]',
    '[aria-label*="advertisement" i]', '[data-ad-slot]',
    'img[src$=".gif"]', '[class*="share-widget"]', '[class*="social-bar"]'
  ];
  document.querySelectorAll(SELECTORS.join(',')).forEach(el => {
    el.classList.add('clo-blurred');
  });
}

function applyDyslexicTypography() {
  if (document.getElementById('clo-dyslexic-style')) return;
  const style = document.createElement('style');
  style.id = 'clo-dyslexic-style';
  style.textContent = `
    @font-face {
      font-family: 'OpenDyslexic';
      src: url('${chrome.runtime.getURL('fonts/OpenDyslexic.otf')}') format('opentype');
    }
    body, p, li, td, span, div, article, section, h1, h2, h3, h4, h5, h6 {
      font-family: 'OpenDyslexic', sans-serif !important;
      line-height: 1.9 !important;
      letter-spacing: 0.13em !important;
      word-spacing: 0.28em !important;
    }
    p, li { max-width: 70ch !important; }
  `;
  document.head.appendChild(style);
}

function applyHighContrast() {
  if (document.getElementById('clo-contrast-style')) return;
  const style = document.createElement('style');
  style.id = 'clo-contrast-style';
  style.textContent = `
    html, body, div, section, article, main, header, footer, aside, nav {
      background: #000 !important;
      background-color: #000 !important;
    }
    p, li, td, th, span, div, article, section, h1, h2, h3, h4, h5, h6, label, caption {
      color: #fff !important;
      font-size: 1.05em !important;
      line-height: 1.8 !important;
    }
    a, a:visited { color: #7ab8ff !important; }
    a:hover { color: #ffdd57 !important; }
    img { filter: contrast(1.1) brightness(0.85); }
    table, tr, td, th {
      background: #111 !important;
      border-color: #444 !important;
    }
    input, textarea, select {
      background: #222 !important;
      color: #fff !important;
      border-color: #555 !important;
    }
    * { border-color: #333 !important; }
  `;
  document.head.appendChild(style);
}

function markFocusableElements() {
  document.querySelectorAll('p, li, h1, h2, h3, blockquote').forEach(el => {
    if (el.innerText.trim().length > 30) el.classList.add('clo-focusable');
  });
}

function startFocusMode() {
  try {
    const workerCode = `
      let lastScrollY = 0;
      let lastTime = Date.now();
      self.onmessage = ({ data }) => {
        if (data.type !== 'SCROLL') return;
        const now = Date.now();
        const speed = Math.abs(data.scrollY - lastScrollY) / (now - lastTime || 1);
        lastScrollY = data.scrollY;
        lastTime = now;
        self.postMessage({ type: 'FOCUS_UPDATE', scrollY: data.scrollY, speed });
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerURL = URL.createObjectURL(blob);
    const worker = new Worker(workerURL);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          worker.postMessage({ type: 'SCROLL', scrollY: window.scrollY });
          ticking = false;
        });
        ticking = true;
      }
    });

    worker.onmessage = ({ data }) => {
      if (data.type === 'FOCUS_UPDATE') highlightActiveParagraph(data.scrollY);
    };

    highlightActiveParagraph(window.scrollY);
  } catch (e) {
    // fallback — just use scroll event directly without worker
    window.addEventListener('scroll', () => {
      highlightActiveParagraph(window.scrollY);
    });
    highlightActiveParagraph(window.scrollY);
  }
}

function highlightActiveParagraph(scrollY) {
  const viewportMid = scrollY + window.innerHeight * 0.42;
  let closest = null, closestDist = Infinity;

  document.querySelectorAll('.clo-focusable').forEach(el => {
    const rect = el.getBoundingClientRect();
    const absMid = (rect.top + scrollY) + rect.height / 2;
    const dist = Math.abs(absMid - viewportMid);
    if (dist < closestDist) { closestDist = dist; closest = el; }
    el.classList.remove('clo-active-para');
  });

  if (closest) closest.classList.add('clo-active-para');
}