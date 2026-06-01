const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d', { alpha: true });
const nextBtn = document.querySelector('#nextBtn');
const copyBtn = document.querySelector('#copyBtn');
const caption = document.querySelector('#caption');

const phrases = [
  '顾老师\n六月快乐',
  '愿六月的风\n温柔明亮',
  '愿每天都有\n新的欢喜',
  '心中有光\n眼里有笑',
  '一路从容\n万事顺遂'
];
const captions = [
  '点击文字，粒子散开后会组成下一句祝福',
  '滑动时粒子会让开，放开后慢慢回到原位',
  '每一次点击，都是一束新的六月祝福',
  '薰衣草紫粒子会自动重组为下一句话',
  '把这份温柔的六月祝福送给顾老师'
];

const palette = ['#5D4B7A', '#8066A8', '#9277BD', '#B9A5DC', '#D6C7EE', '#FFFFFF'];
let W = 0;
let H = 0;
let DPR = 1;
let particles = [];
let stars = [];
let phraseIndex = 0;
let pointer = { x: -9999, y: -9999, down: false, active: false, lastMove: 0 };
let morphing = false;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  makeStars();
  buildText(phrases[phraseIndex], false);
}

function makeStars() {
  const n = Math.min(90, Math.max(36, Math.floor(W * H / 15000)));
  stars = Array.from({ length: n }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.8 + 0.5,
    a: Math.random() * 0.32 + 0.08,
    vx: (Math.random() - 0.5) * 0.08,
    vy: (Math.random() - 0.5) * 0.08
  }));
}

function measureFont(text) {
  const lines = text.split('\n');
  const longest = lines.reduce((a, b) => (a.length > b.length ? a : b), '');
  let size = Math.min(W / Math.max(longest.length * 0.92, 4), H * 0.15, 112);
  size = Math.max(size, W < 560 ? 44 : 64);
  const lineHeight = size * 1.25;
  return { size, lineHeight, lines };
}

function getTextTargets(text) {
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');
  const { size, lineHeight, lines } = measureFont(text);
  off.width = Math.floor(W * DPR);
  off.height = Math.floor(H * DPR);
  octx.setTransform(DPR, 0, 0, DPR, 0, 0);
  octx.clearRect(0, 0, W, H);
  octx.fillStyle = '#111';
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.font = `800 ${size}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
  const centerY = H * (W < 560 ? 0.53 : 0.55);
  const totalH = (lines.length - 1) * lineHeight;
  lines.forEach((line, i) => {
    octx.fillText(line, W / 2, centerY - totalH / 2 + i * lineHeight);
  });

  const img = octx.getImageData(0, 0, off.width, off.height).data;
  const gap = W < 560 ? 5 : 6;
  const targets = [];
  for (let y = 0; y < off.height; y += gap * DPR) {
    for (let x = 0; x < off.width; x += gap * DPR) {
      const alpha = img[(y * off.width + x) * 4 + 3];
      if (alpha > 80) targets.push({ x: x / DPR, y: y / DPR });
    }
  }
  return targets;
}

function buildText(text, scatter = true) {
  const targets = getTextTargets(text);
  const old = particles;
  const next = [];
  for (let i = 0; i < targets.length; i += 1) {
    const t = targets[i];
    const prev = old[i % Math.max(old.length, 1)];
    const angle = Math.random() * Math.PI * 2;
    const dist = scatter ? 120 + Math.random() * Math.max(W, H) * 0.55 : 0;
    next.push({
      x: prev ? prev.x : t.x + Math.cos(angle) * dist,
      y: prev ? prev.y : t.y + Math.sin(angle) * dist,
      tx: t.x,
      ty: t.y,
      vx: scatter ? Math.cos(angle) * (4 + Math.random() * 8) : (Math.random() - 0.5),
      vy: scatter ? Math.sin(angle) * (4 + Math.random() * 8) : (Math.random() - 0.5),
      r: Math.random() * 1.45 + (W < 560 ? 1.15 : 1.35),
      color: palette[Math.floor(Math.random() * palette.length)],
      a: Math.random() * 0.35 + 0.62
    });
  }
  particles = next;
}

function nextPhrase() {
  if (morphing) return;
  morphing = true;
  scatterAll(1.35);
  setTimeout(() => {
    phraseIndex = (phraseIndex + 1) % phrases.length;
    caption.textContent = captions[phraseIndex];
    buildText(phrases[phraseIndex], true);
    morphing = false;
  }, 430);
}

function scatterAll(power = 1) {
  const cx = pointer.active ? pointer.x : W / 2;
  const cy = pointer.active ? pointer.y : H / 2;
  for (const p of particles) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d = Math.hypot(dx, dy) || 1;
    const force = (7 + Math.random() * 6) * power;
    p.vx += (dx / d) * force + (Math.random() - 0.5) * 4;
    p.vy += (dy / d) * force + (Math.random() - 0.5) * 4;
  }
}

function drawBackground() {
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.55, 20, W * 0.5, H * 0.55, Math.max(W, H) * 0.58);
  glow.addColorStop(0, 'rgba(255,255,255,.55)');
  glow.addColorStop(0.45, 'rgba(214,199,238,.18)');
  glow.addColorStop(1, 'rgba(214,199,238,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  for (const s of stars) {
    s.x += s.vx; s.y += s.vy;
    if (s.x < -10) s.x = W + 10;
    if (s.x > W + 10) s.x = -10;
    if (s.y < -10) s.y = H + 10;
    if (s.y > H + 10) s.y = -10;
    ctx.beginPath();
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#9277BD';
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function updateParticles() {
  const now = performance.now();
  if (pointer.active && now - pointer.lastMove > 900 && !pointer.down) pointer.active = false;

  for (const p of particles) {
    let ax = (p.tx - p.x) * 0.018;
    let ay = (p.ty - p.y) * 0.018;

    if (pointer.active) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const dist = Math.hypot(dx, dy) || 1;
      const radius = pointer.down ? 170 : 135;
      if (dist < radius) {
        const force = (1 - dist / radius) * (pointer.down ? 2.2 : 1.35);
        ax += (dx / dist) * force;
        ay += (dy / dist) * force;
      }
    }

    p.vx = (p.vx + ax) * 0.86;
    p.vy = (p.vy + ay) * 0.86;
    p.x += p.vx;
    p.y += p.vy;

    ctx.beginPath();
    ctx.globalAlpha = p.a;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawLinks() {
  const step = Math.max(1, Math.floor(particles.length / 360));
  for (let i = 0; i < particles.length; i += step) {
    const a = particles[i];
    for (let j = i + step; j < particles.length; j += step) {
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 32) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(146,119,189,${0.08 * (1 - dist / 32)})`;
        ctx.lineWidth = 0.8;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  updateParticles();
  drawLinks();
  requestAnimationFrame(animate);
}

function showToast(message) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1700);
}

window.addEventListener('resize', resize);
window.addEventListener('pointermove', (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
  pointer.lastMove = performance.now();
});
window.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.down = true;
  pointer.active = true;
  pointer.lastMove = performance.now();
  nextPhrase();
});
window.addEventListener('pointerup', () => { pointer.down = false; });
window.addEventListener('pointercancel', () => { pointer.down = false; pointer.active = false; });
window.addEventListener('pointerleave', () => { pointer.down = false; pointer.active = false; });

nextBtn.addEventListener('click', (event) => {
  event.stopPropagation();
  const rect = nextBtn.getBoundingClientRect();
  pointer.x = rect.left + rect.width / 2;
  pointer.y = rect.top + rect.height / 2;
  pointer.active = true;
  pointer.lastMove = performance.now();
  nextPhrase();
});

copyBtn.addEventListener('click', async (event) => {
  event.stopPropagation();
  try {
    await navigator.clipboard.writeText(location.href);
    showToast('链接已复制');
  } catch {
    showToast('请手动复制地址栏链接');
  }
});

resize();
caption.textContent = captions[0];
animate();
setTimeout(() => scatterAll(0.45), 320);
