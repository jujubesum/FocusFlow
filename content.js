(async () => {
  const { profiles = [], ruler = false, summarizeDemand = false, hideImages = false } =
    await chrome.runtime.sendMessage({ type: 'GET_PROFILE' });

  const anyActive = profiles.length > 0 || ruler || summarizeDemand || hideImages;
  if (!anyActive) return;

  markFocusableElements();
  if (profiles.includes('adhd') || profiles.includes('dyslexia')) blurDistractions();
  if (profiles.includes('dyslexia')) applyDyslexicTypography();
  if (profiles.includes('adhd')) await summarizeWalls();
  if (profiles.includes('visual')) applyHighContrast();
  if (profiles.includes('sensory')) applySensoryMode();
  if (profiles.includes('focus')) applyFocusMode();
  if (profiles.includes('motor')) applyMotorMode();
  if (ruler) applyReadingRuler();
  if (hideImages) applyHideImages();
  if (summarizeDemand) applySummarizeOnDemand();

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

      const { profiles = [], ruler = false, summarizeDemand = false, hideImages = false } =
        await chrome.runtime.sendMessage({ type: 'GET_PROFILE' });

      const anyActive = profiles.length > 0 || ruler || summarizeDemand || hideImages;
      if (!anyActive) { isProcessing = false; return; }

      markFocusableElements();
      if (profiles.includes('adhd') || profiles.includes('dyslexia')) blurDistractions();
      if (profiles.includes('dyslexia')) applyDyslexicTypography();
      if (profiles.includes('adhd')) await summarizeWalls();
      if (profiles.includes('visual')) applyHighContrast();
      if (profiles.includes('sensory')) applySensoryMode();
      if (profiles.includes('focus')) applyFocusMode();
      if (profiles.includes('motor')) applyMotorMode();
      if (ruler) applyReadingRuler();
      if (hideImages) applyHideImages();
      if (summarizeDemand) applySummarizeOnDemand();
      startFocusMode();
      isProcessing = false;
    }
  }, 500);
})();

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type !== 'APPLY_SETTINGS') return;

  const { profiles = [], ruler = false, summarizeDemand = false, hideImages = false } = msg;

  ['clo-dyslexic-style', 'clo-contrast-style', 'clo-sensory-style',
   'clo-focus-style', 'clo-motor-style', 'clo-hide-images-style'].forEach(id => {
    document.getElementById(id)?.remove();
  });
  document.getElementById('clo-ruler')?.remove();
  document.getElementById('clo-page-summary')?.remove();
  document.querySelectorAll('.clo-blurred').forEach(el => el.classList.remove('clo-blurred'));
  document.querySelectorAll('.clo-demand-btn').forEach(el => el.remove());
  document.querySelectorAll('[data-clo-has-btn]').forEach(el => delete el.dataset.cloHasBtn);
  document.querySelectorAll('.clo-focus-dimmed').forEach(el => {
    el.classList.remove('clo-focus-dimmed');
    el.style.removeProperty('opacity');
    el.style.removeProperty('pointer-events');
    el.style.removeProperty('transition');
  });
  document.body.style.removeProperty('filter');

  markFocusableElements();
  if (profiles.includes('adhd') || profiles.includes('dyslexia')) blurDistractions();
  if (profiles.includes('dyslexia')) applyDyslexicTypography();
  if (profiles.includes('adhd')) await summarizeWalls();
  if (profiles.includes('visual')) applyHighContrast();
  if (profiles.includes('sensory')) applySensoryMode();
  if (profiles.includes('focus')) applyFocusMode();
  if (profiles.includes('motor')) applyMotorMode();
  if (ruler) applyReadingRuler();
  if (hideImages) applyHideImages();
  if (summarizeDemand) {
    await new Promise(resolve => setTimeout(resolve, 300));
    applySummarizeOnDemand();
  }
});

async function summarizeWalls() {
  const candidates = Array.from(
    document.querySelectorAll('p, article, section')
  ).filter(el => {
    const words = el.innerText.trim().split(/\s+/).length;
    return words >= 50 && !el.dataset.cloProcessed && !el.closest('[data-clo-processed]');
  });

  if (candidates.length === 0) return;

  const texts = candidates.map(el => el.innerText.trim()).join('\n\n').slice(0, 50000);
  candidates.slice(0, 3).forEach(el => { el.dataset.cloProcessed = '1'; });

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

  banner.querySelector('.clo-restore-banner').addEventListener('click', () => banner.remove());
}

function applySummarizeOnDemand() {
  document.querySelectorAll('p').forEach(el => {
    const words = el.innerText.trim().split(/\s+/).length;
    if (words < 50 || el.dataset.cloHasBtn) return;
    el.dataset.cloHasBtn = '1';

    const btn = document.createElement('button');
    btn.className = 'clo-demand-btn';
    btn.textContent = '✦ Summarize';
    el.appendChild(btn);

    btn.addEventListener('click', async () => {
      btn.textContent = '⏳ Summarizing…';
      btn.disabled = true;
      const response = await chrome.runtime.sendMessage({ type: 'SUMMARIZE', text: el.innerText });
      const bullets = response?.bullets ?? ['Could not summarize.'];

      const box = document.createElement('div');
      box.className = 'clo-demand-result';
      box.innerHTML = `
        <ul class="clo-bullets">${bullets.map(b => `<li>${b}</li>`).join('')}</ul>
        <button class="clo-demand-close">✕ Close</button>
      `;
      el.appendChild(box);
      box.querySelector('.clo-demand-close').addEventListener('click', () => {
        box.remove();
        btn.textContent = '✦ Summarize';
        btn.disabled = false;
      });
    });
  });
}

function applyHideImages() {
  if (document.getElementById('clo-hide-images-style')) return;
  const style = document.createElement('style');
  style.id = 'clo-hide-images-style';
  style.textContent = `
    img, picture, figure, video, canvas {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function applyFocusMode() {
  if (document.getElementById('clo-focus-style')) return;
  const style = document.createElement('style');
  style.id = 'clo-focus-style';
  style.textContent = `
    .clo-focus-dimmed {
      opacity: 0.6 !important;
      pointer-events: none !important;
    }
    .clo-focus-dimmed:hover {
      opacity: 1 !important;
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(style);

  document.querySelectorAll(
    'header, footer, nav, aside, [class*="sidebar"], [id*="sidebar"], [class*="related"], [id*="related"], [class*="recommended"], [class*="comment"], [class*="newsletter"], [class*="subscribe"], [id*="comments"], [id*="footer"]'
  ).forEach(el => {
    el.classList.add('clo-focus-dimmed');
    el.dataset.cloWasDimmed = '1';
  });
}

function applyMotorMode() {
  if (document.getElementById('clo-motor-style')) return;
  const style = document.createElement('style');
  style.id = 'clo-motor-style';
  style.textContent = `
    button, input[type="button"], input[type="submit"] {
      min-height: 44px !important;
      min-width: 44px !important;
      font-size: 1.05em !important;
      cursor: pointer !important;
    }
    input[type="checkbox"], input[type="radio"] {
      width: 20px !important;
      height: 20px !important;
      cursor: pointer !important;
    }
    select {
      min-height: 40px !important;
      font-size: 1.05em !important;
    }
    a {
      padding: 2px 4px !important;
      line-height: 1.8 !important;
    }
  `;
  document.head.appendChild(style);
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
      src: url('${chrome.runtime.getURL('fonts/OpenDyslexic-Regular.otf')}') format('opentype');
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
    html, body {
      background: #111 !important;
      color: #fff !important;
    }
    body * {
      background-color: #111 !important;
      color: #fff !important;
    }
    img, video, canvas, svg, picture {
      background-color: transparent !important;
      filter: contrast(1.1) brightness(0.85);
    }
    [style*="background-image"] {
      background-color: transparent !important;
    }
    a, a:visited {
      color: #7ab8ff !important;
      font-size: 1.15em !important;
    }
    a:hover { color: #ffdd57 !important; }
    p, li, td, th, span, h1, h2, h3, h4, h5, h6, label, caption {
      font-size: 1.15em !important;
      line-height: 1.8 !important;
    }
    #clo-ruler { background: rgba(122, 184, 255, 0.25) !important; border-color: rgba(122, 184, 255, 0.6) !important; }
  `;
  document.head.appendChild(style);
}

function applySensoryMode() {
  if (document.getElementById('clo-sensory-style')) return;
  const style = document.createElement('style');
  style.id = 'clo-sensory-style';
  style.textContent = `
    *, *::before, *::after {
      animation: none !important;
      animation-duration: 0s !important;
      transition: none !important;
      transition-duration: 0s !important;
    }
    body { filter: saturate(0.4) !important; }
    p, li, td, div { line-height: 1.9 !important; margin-bottom: 0.6em !important; }
    img[src$=".gif"] { visibility: hidden !important; }
    [class*="flash"], [class*="blink"], [class*="marquee"] { display: none !important; }
  `;
  document.head.appendChild(style);

  document.querySelectorAll('video').forEach(v => { v.pause(); v.autoplay = false; v.muted = true; });
  document.querySelectorAll('audio').forEach(a => { a.pause(); a.muted = true; });

  new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeName === 'VIDEO') { node.pause(); node.muted = true; }
        if (node.nodeName === 'AUDIO') { node.pause(); node.muted = true; }
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
}

function applyReadingRuler() {
  if (document.getElementById('clo-ruler')) return;
  const ruler = document.createElement('div');
  ruler.id = 'clo-ruler';
  ruler.style.cssText = `
    position: fixed;
    left: 0;
    width: 100%;
    height: 2.2em;
    background: rgba(127, 119, 221, 0.15);
    border-top: 2px solid rgba(127, 119, 221, 0.4);
    border-bottom: 2px solid rgba(127, 119, 221, 0.4);
    pointer-events: none;
    z-index: 999999;
    transition: top 0.05s linear;
  `;
  document.body.appendChild(ruler);
  document.addEventListener('mousemove', e => {
    ruler.style.top = (e.clientY - 16) + 'px';
  });
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
    const worker = new Worker(URL.createObjectURL(blob));

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
    window.addEventListener('scroll', () => highlightActiveParagraph(window.scrollY));
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