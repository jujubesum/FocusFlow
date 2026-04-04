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