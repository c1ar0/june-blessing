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
  '小粒子勾勒笔画，大粒子填充字心',
  '滑动会拨开星尘，松开后慢慢回到文字',
  '点击一次，粒子散开并组成下一句祝福',
  '周围的半透明光斑会一起轻轻流动',
  '这是纯粒子描边版，没有普通实体描边'
];

const edgePalette = ['#3F3454', '#514368', '#6A5A84', '#806D9D'];
const fillPalette = ['#A691C3', '#BBA9D2', '#D9CEE8', '#F7F3FF', '#FFFFFF'];
const orbPalette = ['rgba(155,134,184,', 'rgba(216,205,234,', 'rgba(255,255,255,'];

let W = 0, H = 0, DPR = 1;
let particles = [];
let dust = [];
let orbs = [];
let ripples = [];
let textMeta = { lines: ['顾老师', '六月快乐'], size: 64, lineHeight: 80, centerY: 0 };
let phraseIndex = 0;
let morphing = false;
let pointer = { x: -9999, y: -9999, px: -9999, py: -9999, down: false, active: false, lastMove: 0, speed: 0 };

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function rand(min, max) { return min + Math.random() * (max - min); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  makeAtmosphere();
  buildText(phrases[phraseIndex], false);
}

function makeAtmosphere() {
  const dustCount = clamp(Math.floor(W * H / 12000), 45, 130);
  dust = Array.from({ length: dustCount }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: rand(0.45, 1.55), a: rand(0.05, 0.22),
    vx: rand(-0.08, 0.08), vy: rand(-0.08, 0.08), pulse: Math.random() * Math.PI * 2
  }));

  const orbCount = W < 560 ? 18 : 30;
  orbs = Array.from({ length: orbCount }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: rand(W < 560 ? 14 : 18, W < 560 ? 42 : 58),
    a: rand(0.035, 0.13),
    vx: rand(-0.16, 0.16), vy: rand(-0.12, 0.12),
    color: pick(orbPalette), pulse: Math.random() * Math.PI * 2
  }));
}

function wrapText(ctx2, text, maxWidth) {
  const out = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const ch of para) {
      const test = line + ch;
      if (ctx2.measureText(test).width > maxWidth && line) { out.push(line); line = ch; }
      else line = test;
    }
    if (line) out.push(line);
  }
  return out;
}

function textLayout(text, ctx2) {
  const maxWidth = W * (W < 560 ? 0.91 : 0.82);
  const maxHeight = H * (W < 560 ? 0.48 : 0.54);
  const minSize = W < 560 ? 25 : 36;
  let size = W < 560 ? 44 : 72;
  if (text.length <= 8) size = W < 560 ? 78 : 120;
  else if (text.length <= 16) size = W < 560 ? 58 : 92;
  else if (text.length <= 24) size = W < 560 ? 48 : 78;
  else if (text.length > 34) size = W < 560 ? 34 : 56;
  size = clamp(size, minSize, Math.min(W < 560 ? 84 : 126, W / 3));

  let lines = [];
  let lineHeight = size * 1.22;
  while (size >= minSize) {
    ctx2.font = `900 ${size}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
    lines = wrapText(ctx2, text, maxWidth);
    lineHeight = size * 1.22;
    const totalHeight = lines.length * lineHeight;
    const widest = Math.max(...lines.map(line => ctx2.measureText(line).width), 0);
    if (lines.length <= 4 && totalHeight <= maxHeight && widest <= maxWidth) break;
    size -= 2;
  }
  return { size, lines, lineHeight };
}

function getTextMaps(text) {
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
  lines.forEach((line, i) => octx.fillText(line, W / 2, centerY - totalH / 2 + i * lineHeight));
  textMeta = { lines, size, lineHeight, centerY };

  const data = octx.getImageData(0, 0, off.width, off.height).data;
  return { data, width: off.width, height: off.height };
}

function isSolid(data, width, height, x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return false;
  return data[(y * width + x) * 4 + 3] > 80;
}

function isEdge(data, width, height, x, y, span) {
  if (!isSolid(data, width, height, x, y)) return false;
  return !isSolid(data, width, height, x + span, y) ||
         !isSolid(data, width, height, x - span, y) ||
         !isSolid(data, width, height, x, y + span) ||
         !isSolid(data, width, height, x, y - span) ||
         !isSolid(data, width, height, x + span, y + span) ||
         !isSolid(data, width, height, x - span, y - span);
}

function makeParticle(target, old, layer) {
  const angle = Math.random() * Math.PI * 2;
  const dist = layer.scatter ? rand(180, Math.max(W, H) * 0.72) : 0;
  const prev = old;
  const edge = layer.kind === 'edge';
  return {
    x: prev ? prev.x : target.x + Math.cos(angle) * dist,
    y: prev ? prev.y : target.y + Math.sin(angle) * dist,
    tx: target.x, ty: target.y, ox: target.x, oy: target.y,
    vx: layer.scatter ? Math.cos(angle) * rand(edge ? 4 : 6, edge ? 10 : 14) : rand(-0.4, 0.4),
    vy: layer.scatter ? Math.sin(angle) * rand(edge ? 4 : 6, edge ? 10 : 14) : rand(-0.4, 0.4),
    r: edge ? rand(0.42, W < 560 ? 0.86 : 0.95) : rand(W < 560 ? 1.15 : 1.3, W < 560 ? 2.45 : 2.8),
    a: edge ? rand(0.78, 1) : rand(0.38, 0.68),
    color: edge ? pick(edgePalette) : pick(fillPalette),
    kind: layer.kind,
    stiffness: edge ? 0.034 : 0.020,
    friction: edge ? 0.82 : 0.885,
    push: edge ? 1.0 : 1.55,
    blur: edge ? 0.8 : 5.5,
    phase: Math.random() * Math.PI * 2
  };
}

function buildText(text, scatter = true) {
  const { data, width, height } = getTextMaps(text);
  const edgeGap = W < 560 ? 2.4 : 3.0;
  const fillGap = W < 560 ? 5.4 : 6.4;
  const span = Math.max(1, Math.round(2 * DPR));
  const edges = [];
  const fills = [];

  for (let y = 0; y < height; y += Math.max(1, Math.round(edgeGap * DPR))) {
    for (let x = 0; x < width; x += Math.max(1, Math.round(edgeGap * DPR))) {
      if (isEdge(data, width, height, x, y, span)) edges.push({ x: x / DPR, y: y / DPR });
    }
  }
  for (let y = 0; y < height; y += Math.max(1, Math.round(fillGap * DPR))) {
    for (let x = 0; x < width; x += Math.max(1, Math.round(fillGap * DPR))) {
      if (isSolid(data, width, height, x, y) && !isEdge(data, width, height, x, y, span * 2)) fills.push({ x: x / DPR, y: y / DPR });
    }
  }

  const old = particles;
  const maxEdge = W < 560 ? 5200 : 7600;
  const maxFill = W < 560 ? 1700 : 2500;
  const edgeStep = Math.max(1, Math.ceil(edges.length / maxEdge));
  const fillStep = Math.max(1, Math.ceil(fills.length / maxFill));
  const next = [];

  for (let i = 0, k = 0; i < edges.length; i += edgeStep, k++) {
    next.push(makeParticle(edges[i], old[k % Math.max(old.length, 1)], { kind: 'edge', scatter }));
  }
  const offset = next.length;
  for (let i = 0, k = 0; i < fills.length; i += fillStep, k++) {
    next.push(makeParticle(fills[i], old[(offset + k) % Math.max(old.length, 1)], { kind: 'fill', scatter }));
  }
  particles = next;
}

function scatterAll(power = 1) {
  const cx = pointer.active ? pointer.x : W / 2;
  const cy = pointer.active ? pointer.y : H * 0.56;
  ripples.push({ x: cx, y: cy, r: 0, a: 0.45, w: 19 });
  for (const p of particles) {
    const dx = p.x - cx, dy = p.y - cy;
    const d = Math.hypot(dx, dy) || 1;
    const wave = clamp(1 - d / Math.max(W, H), 0.22, 1);
    const force = rand(p.kind === 'edge' ? 5 : 8, p.kind === 'edge' ? 10 : 16) * power * wave;
    p.vx += (dx / d) * force + rand(-2.2, 2.2);
    p.vy += (dy / d) * force + rand(-2.2, 2.2);
  }
}

function nextPhrase() {
  if (morphing) return;
  morphing = true;
  scatterAll(1.4);
  setTimeout(() => {
    phraseIndex = (phraseIndex + 1) % phrases.length;
    caption.textContent = captions[phraseIndex % captions.length] + ` · ${phraseIndex + 1}/${phrases.length}`;
    buildText(phrases[phraseIndex], true);
    morphing = false;
  }, 540);
}

function drawBackground() {
  const g = ctx.createRadialGradient(W * 0.5, H * 0.56, 20, W * 0.5, H * 0.56, Math.max(W, H) * 0.76);
  g.addColorStop(0, 'rgba(255,255,255,.62)');
  g.addColorStop(0.38, 'rgba(216,205,234,.22)');
  g.addColorStop(1, 'rgba(216,205,234,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  for (const o of orbs) {
    o.pulse += 0.01;
    o.x += o.vx; o.y += o.vy;
    const dx = o.x - pointer.x, dy = o.y - pointer.y;
    const d = Math.hypot(dx, dy) || 1;
    if (pointer.active && d < 260) {
      const f = (1 - d / 260) * 0.28;
      o.x += (dx / d) * f * (pointer.down ? 3.5 : 2);
      o.y += (dy / d) * f * (pointer.down ? 3.5 : 2);
    }
    if (o.x < -80) o.x = W + 80; if (o.x > W + 80) o.x = -80;
    if (o.y < -80) o.y = H + 80; if (o.y > H + 80) o.y = -80;
    const r = o.r * (0.92 + Math.sin(o.pulse) * 0.08);
    const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
    grad.addColorStop(0, `${o.color}${o.a})`);
    grad.addColorStop(1, `${o.color}0)`);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, Math.PI * 2); ctx.fill();
  }

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
    r.r += r.w; r.w *= 0.965; r.a *= 0.93;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(155,134,184,${r.a})`;
    ctx.lineWidth = 1.4;
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGhostText() {
  // Extremely weak text shadow: only prevents unreadability on low-contrast screens.
  const { lines, size, lineHeight, centerY } = textMeta;
  const totalH = (lines.length - 1) * lineHeight;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${size}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
  lines.forEach((line, i) => {
    const y = centerY - totalH / 2 + i * lineHeight;
    ctx.fillStyle = 'rgba(56,46,76,0.055)';
    ctx.fillText(line, W / 2, y);
  });
  ctx.restore();
}

function updateParticles() {
  const now = performance.now();
  if (pointer.active && now - pointer.lastMove > 780 && !pointer.down) pointer.active = false;

  for (const p of particles) {
    const breathe = Math.sin(now * 0.0011 + p.phase) * (p.kind === 'edge' ? 0.7 : 1.8);
    p.tx = p.ox + breathe;
    p.ty = p.oy + Math.cos(now * 0.001 + p.phase) * (p.kind === 'edge' ? 0.6 : 1.4);

    let ax = (p.tx - p.x) * p.stiffness;
    let ay = (p.ty - p.y) * p.stiffness;

    if (pointer.active) {
      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      const dist = Math.hypot(dx, dy) || 1;
      const radius = pointer.down ? 310 : 255;
      if (dist < radius) {
        const t = 1 - dist / radius;
        const force = p.push * (pointer.down ? 3.0 : 2.15) * t * t * (1 + pointer.speed * 0.016);
        ax += (dx / dist) * force;
        ay += (dy / dist) * force;
        ax += (-dy / dist) * force * 0.20;
        ay += (dx / dist) * force * 0.20;
      }
    }

    p.vx = (p.vx + ax) * p.friction;
    p.vy = (p.vy + ay) * p.friction;
    p.x += p.vx; p.y += p.vy;

    const speedGlow = clamp(Math.hypot(p.vx, p.vy) / 10, 0, 1);
    ctx.beginPath();
    ctx.globalAlpha = p.a;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.blur + speedGlow * (p.kind === 'edge' ? 2.0 : 8.0);
    ctx.arc(p.x, p.y, p.r + speedGlow * (p.kind === 'edge' ? 0.12 : 0.45), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawLinks() {
  const edgeParticles = particles.filter(p => p.kind === 'edge');
  const step = Math.max(3, Math.floor(edgeParticles.length / 500));
  for (let i = 0; i < edgeParticles.length; i += step) {
    const a = edgeParticles[i];
    for (let j = i + step; j < edgeParticles.length; j += step) {
      const b = edgeParticles[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 18) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(63,52,84,${0.11 * (1 - dist / 18)})`;
        ctx.lineWidth = 0.55;
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawRipples();
  drawGhostText();
  updateParticles();
  drawLinks();
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
