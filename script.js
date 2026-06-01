const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d', { alpha: true });
const nextBtn = document.querySelector('#nextBtn');
const copyBtn = document.querySelector('#copyBtn');
const caption = document.querySelector('#caption');

const phrases = [
  '顾老师\n六月快乐',
  '打理好自己的世界\n做好自己应做的部分',
  '只要是越来越好的趋势\n慢一点也没关系',
  '放下过去，放下执念\n因为痛苦过才更珍惜美好',
  '人生只有一次\n要为自己拼命奔跑',
  '没有人可以定义\n风的形状',
  '值得或不值得\n行至终点之前\n没有人可以下定论',
  '别追逐风\n你就在风中',
  '不管是现在还是未来\n最大的对手都是我自己',
  '与其说贩卖梦想\n不如说，我们在让更多人相信梦想',
  '只要是自己认为值得的\n就是值得的',
  '因为相遇了\n所以才会重逢',
  '抬头看见星星很亮\n希望你也可以永远做你自己',
  '未来我们会更努力\n展现更闪耀的自己',
  '懂你的人自然就会懂你\n不理解的人强求也不来',
  '希望我们可以一直勇敢\n坚持地走下去',
  '因为喜欢啊\n喜欢的东西哪有那么容易忘记',
  '不许不相信自己\n也不用质疑自己\n你就是最好的',
  '青春就是什么都想尝试的样子\n放下过去，放下执念',
  '努力没用\n要刻苦',
  '每个人来到这个世界上\n都是有意义的',
  '拥有面对自己的勇气\n各种力量也挺迷人的',
  '不要抗拒改变\n这个世界唯一不变的事情\n就是所有的事情都在变',
  '希望我们都能保持好奇心\n保持乐趣，保有勇气',
  '对于想做的事情\n立刻投入一切去做\n为自己仅有一次的人生负责',
  '不想让个人特色\n变成个人定义'
];

const captions = [
  '拖动/滑动粒子会像水波一样散开，松手后慢慢回归',
  '点击一次，粒子会散开，然后组成下一句祝福',
  '慢一点也没关系，粒子也会慢慢回到自己的位置',
  '轻轻划过屏幕，感受柔和的薰衣草紫回弹',
  '每一句话都会被重新绘制成粒子文字'
];

const palette = ['#4E4264', '#6B5B82', '#8D79A8', '#B6A4CC', '#D8CDEA', '#F7F3FF', '#FFFFFF'];
let W = 0, H = 0, DPR = 1;
let particles = [];
let dust = [];
let ripples = [];
let currentTextRender = { lines: ['顾老师', '六月快乐'], size: 64, lineHeight: 82, centerY: 0 };
let phraseIndex = 0;
let morphing = false;
let pointer = { x: -9999, y: -9999, px: -9999, py: -9999, down: false, active: false, lastMove: 0, speed: 0 };

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function rand(min, max) { return min + Math.random() * (max - min); }

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  makeDust();
  buildText(phrases[phraseIndex], false);
}

function makeDust() {
  const n = clamp(Math.floor(W * H / 9000), 70, 180);
  dust = Array.from({ length: n }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: rand(0.5, 2.2),
    a: rand(0.08, 0.34),
    vx: rand(-0.11, 0.11),
    vy: rand(-0.10, 0.10),
    pulse: Math.random() * Math.PI * 2
  }));
}

function wrapText(ctx2, text, maxWidth) {
  const raw = text.split('\n');
  const out = [];
  for (const para of raw) {
    let line = '';
    for (const ch of para) {
      const test = line + ch;
      if (ctx2.measureText(test).width > maxWidth && line) {
        out.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function textLayout(text, ctx2) {
  const maxWidth = W * (W < 560 ? 0.90 : 0.80);
  const maxHeight = H * (W < 560 ? 0.48 : 0.52);
  const minSize = W < 560 ? 25 : 36;
  let size = W < 560 ? 44 : 72;

  if (text.length <= 8) size = W < 560 ? 76 : 118;
  else if (text.length <= 16) size = W < 560 ? 58 : 90;
  else if (text.length <= 24) size = W < 560 ? 48 : 76;
  else if (text.length > 34) size = W < 560 ? 34 : 56;

  size = clamp(size, minSize, Math.min(W < 560 ? 82 : 124, W / 3.05));

  let lines = [];
  let lineHeight = size * 1.24;
  while (size >= minSize) {
    ctx2.font = `900 ${size}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
    lines = wrapText(ctx2, text, maxWidth);
    lineHeight = size * 1.24;
    const totalHeight = lines.length * lineHeight;
    const widest = Math.max(...lines.map(line => ctx2.measureText(line).width), 0);
    if (lines.length <= 4 && totalHeight <= maxHeight && widest <= maxWidth) break;
    size -= 2;
  }

  return { size, lines, lineHeight };
}

function getTextTargets(text) {
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');
  off.width = Math.floor(W * DPR);
  off.height = Math.floor(H * DPR);
  octx.setTransform(DPR, 0, 0, DPR, 0, 0);
  octx.clearRect(0, 0, W, H);
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  const { size, lines, lineHeight } = textLayout(text, octx);
  octx.font = `900 ${size}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
  octx.fillStyle = '#111';
  const centerY = H * (W < 560 ? 0.56 : 0.57);
  const totalH = (lines.length - 1) * lineHeight;
  currentTextRender = { lines, size, lineHeight, centerY };
  lines.forEach((line, i) => octx.fillText(line, W / 2, centerY - totalH / 2 + i * lineHeight));

  const data = octx.getImageData(0, 0, off.width, off.height).data;
  const gap = W < 560 ? 3 : 4;
  const targets = [];
  for (let y = 0; y < off.height; y += gap * DPR) {
    for (let x = 0; x < off.width; x += gap * DPR) {
      if (data[(y * off.width + x) * 4 + 3] > 80) targets.push({ x: x / DPR, y: y / DPR });
    }
  }
  return targets;
}

function buildText(text, scatter = true) {
  const targets = getTextTargets(text);
  const old = particles;
  const next = [];
  const maxParticles = W < 560 ? 6500 : 9000;
  const step = Math.max(1, Math.ceil(targets.length / maxParticles));
  for (let k = 0, i = 0; i < targets.length; i += step, k++) {
    const t = targets[i];
    const prev = old[k % Math.max(old.length, 1)];
    const angle = Math.random() * Math.PI * 2;
    const dist = scatter ? rand(180, Math.max(W, H) * 0.72) : 0;
    next.push({
      x: prev ? prev.x : t.x + Math.cos(angle) * dist,
      y: prev ? prev.y : t.y + Math.sin(angle) * dist,
      tx: t.x,
      ty: t.y,
      ox: t.x,
      oy: t.y,
      vx: scatter ? Math.cos(angle) * rand(4, 12) : rand(-0.5, 0.5),
      vy: scatter ? Math.sin(angle) * rand(4, 12) : rand(-0.5, 0.5),
      r: rand(W < 560 ? 0.72 : 0.82, W < 560 ? 1.38 : 1.62),
      color: palette[Math.floor(Math.random() * palette.length)],
      a: rand(0.62, 0.96),
      phase: Math.random() * Math.PI * 2
    });
  }
  particles = next;
}

function scatterAll(power = 1) {
  const cx = pointer.active ? pointer.x : W / 2;
  const cy = pointer.active ? pointer.y : H * 0.56;
  ripples.push({ x: cx, y: cy, r: 0, a: 0.55, w: 18 });
  for (const p of particles) {
    const dx = p.x - cx, dy = p.y - cy;
    const d = Math.hypot(dx, dy) || 1;
    const wave = clamp(1 - d / Math.max(W, H), 0.25, 1);
    const force = rand(7, 14) * power * wave;
    p.vx += (dx / d) * force + rand(-2.8, 2.8);
    p.vy += (dy / d) * force + rand(-2.8, 2.8);
  }
}

function nextPhrase() {
  if (morphing) return;
  morphing = true;
  scatterAll(1.45);
  setTimeout(() => {
    phraseIndex = (phraseIndex + 1) % phrases.length;
    caption.textContent = captions[phraseIndex % captions.length] + ` · ${phraseIndex + 1}/${phrases.length}`;
    buildText(phrases[phraseIndex], true);
    morphing = false;
  }, 520);
}

function drawBackground() {
  const g = ctx.createRadialGradient(W * 0.5, H * 0.56, 20, W * 0.5, H * 0.56, Math.max(W, H) * 0.72);
  g.addColorStop(0, 'rgba(255,255,255,.62)');
  g.addColorStop(0.38, 'rgba(216,205,234,.22)');
  g.addColorStop(1, 'rgba(216,205,234,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  for (const d of dust) {
    d.x += d.vx; d.y += d.vy; d.pulse += 0.015;
    if (d.x < -10) d.x = W + 10; if (d.x > W + 10) d.x = -10;
    if (d.y < -10) d.y = H + 10; if (d.y > H + 10) d.y = -10;
    ctx.beginPath();
    ctx.globalAlpha = d.a * (0.75 + Math.sin(d.pulse) * 0.25);
    ctx.fillStyle = '#9B86B8';
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawRipples() {
  ripples = ripples.filter(r => r.a > 0.01);
  for (const r of ripples) {
    r.r += r.w;
    r.w *= 0.965;
    r.a *= 0.93;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(155,134,184,${r.a})`;
    ctx.lineWidth = 1.4;
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawReadableText() {
  if (!currentTextRender || !currentTextRender.lines) return;
  const { lines, size, lineHeight, centerY } = currentTextRender;
  const totalH = (lines.length - 1) * lineHeight;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${size}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.shadowBlur = 0;

  lines.forEach((line, i) => {
    const y = centerY - totalH / 2 + i * lineHeight;
    // A light but crisp skeleton under the particles keeps Chinese strokes readable
    // without losing the particle-text effect.
    ctx.lineWidth = Math.max(3.2, size * 0.064);
    ctx.strokeStyle = 'rgba(255,255,255,0.90)';
    ctx.strokeText(line, W / 2, y);
    ctx.lineWidth = Math.max(1.8, size * 0.030);
    ctx.strokeStyle = 'rgba(56,46,76,0.66)';
    ctx.strokeText(line, W / 2, y);
    ctx.fillStyle = 'rgba(56,46,76,0.36)';
    ctx.fillText(line, W / 2, y);
  });
  ctx.restore();
}

function drawFinalTextClarity() {
  if (!currentTextRender || !currentTextRender.lines) return;
  const { lines, size, lineHeight, centerY } = currentTextRender;
  const totalH = (lines.length - 1) * lineHeight;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${size}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.shadowBlur = 0;
  lines.forEach((line, i) => {
    const y = centerY - totalH / 2 + i * lineHeight;
    ctx.lineWidth = Math.max(0.9, size * 0.012);
    ctx.strokeStyle = 'rgba(56,46,76,0.38)';
    ctx.strokeText(line, W / 2, y);
    ctx.fillStyle = 'rgba(56,46,76,0.18)';
    ctx.fillText(line, W / 2, y);
  });
  ctx.restore();
}

function updateParticles() {
  const now = performance.now();
  if (pointer.active && now - pointer.lastMove > 780 && !pointer.down) pointer.active = false;

  for (const p of particles) {
    const breathe = Math.sin(now * 0.0012 + p.phase) * 1.4;
    p.tx = p.ox + breathe;
    p.ty = p.oy + Math.cos(now * 0.001 + p.phase) * 1.1;

    let ax = (p.tx - p.x) * 0.022;
    let ay = (p.ty - p.y) * 0.022;

    if (pointer.active) {
      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      const dist = Math.hypot(dx, dy) || 1;
      const radius = pointer.down ? 300 : 250;
      if (dist < radius) {
        const t = 1 - dist / radius;
        const force = (pointer.down ? 3.2 : 2.35) * t * t * (1 + pointer.speed * 0.018);
        ax += (dx / dist) * force;
        ay += (dy / dist) * force;
        // soft tangential swirl for decompression feeling
        ax += (-dy / dist) * force * 0.22;
        ay += (dx / dist) * force * 0.22;
      }
    }

    p.vx = (p.vx + ax) * 0.875;
    p.vy = (p.vy + ay) * 0.875;
    p.x += p.vx;
    p.y += p.vy;

    const speedGlow = clamp(Math.hypot(p.vx, p.vy) / 10, 0, 1);
    ctx.beginPath();
    ctx.globalAlpha = p.a;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 1.5 + speedGlow * 4.5;
    ctx.arc(p.x, p.y, p.r + speedGlow * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawLinks() {
  const step = Math.max(2, Math.floor(particles.length / 420));
  for (let i = 0; i < particles.length; i += step) {
    const a = particles[i];
    for (let j = i + step; j < particles.length; j += step) {
      const b = particles[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 30) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(155,134,184,${0.09 * (1 - dist / 30)})`;
        ctx.lineWidth = 0.7;
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawRipples();
  drawReadableText();
  updateParticles();
  drawLinks();
  drawFinalTextClarity();
  requestAnimationFrame(animate);
}

function setPointer(event, active = true) {
  const x = event.clientX, y = event.clientY;
  pointer.speed = Math.hypot(x - pointer.px, y - pointer.py);
  pointer.px = pointer.x = x;
  pointer.py = pointer.y = y;
  pointer.active = active;
  pointer.lastMove = performance.now();
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

// Prevent mobile page scrolling while interacting with the canvas.
['touchstart', 'touchmove', 'touchend', 'gesturestart'].forEach(type => {
  window.addEventListener(type, e => e.preventDefault(), { passive: false });
});

window.addEventListener('resize', resize);
window.addEventListener('pointermove', (event) => { setPointer(event); });
window.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  event.preventDefault();
  setPointer(event);
  pointer.down = true;
  nextPhrase();
});
window.addEventListener('pointerup', () => { pointer.down = false; pointer.speed = 0; });
window.addEventListener('pointercancel', () => { pointer.down = false; pointer.active = false; pointer.speed = 0; });
window.addEventListener('pointerleave', () => { pointer.down = false; pointer.active = false; pointer.speed = 0; });

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
  try { await navigator.clipboard.writeText(location.href); showToast('链接已复制'); }
  catch { showToast('请手动复制地址栏链接'); }
});

resize();
caption.textContent = captions[0] + ` · 1/${phrases.length}`;
animate();
setTimeout(() => scatterAll(0.35), 380);
