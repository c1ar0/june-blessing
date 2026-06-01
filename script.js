const titleEl = document.querySelector("#title");
const typed = document.querySelector("#typed");
const wishBtn = document.querySelector("#wishBtn");
const copyBtn = document.querySelector("#copyBtn");
const canvas = document.querySelector("#scene");
const ctx = canvas.getContext("2d");

const titleText = "顾老师六月快乐";
const blessingText = `愿六月的风温柔明亮，\n愿每一天都有新的欢喜。\n愿顾老师心中有光，眼里有笑，\n一路从容，万事顺遂。`;

titleEl.textContent = titleText;

let width = 0;
let height = 0;
let particles = [];
let bursts = [];
let pointer = { x: -9999, y: -9999, active: false };
const colors = ["#a855f7", "#c084fc", "#d8b4fe", "#f0abfc", "#ffffff"];

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(Math.floor((width * height) / 8500), 120);
  particles = Array.from({ length: Math.max(count, 58) }, createParticle);
}

function createParticle() {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.36,
    vy: (Math.random() - 0.5) * 0.36,
    r: Math.random() * 2.4 + 0.9,
    alpha: Math.random() * 0.45 + 0.35,
    color: colors[Math.floor(Math.random() * colors.length)]
  };
}

function typeText(content, index = 0) {
  if (index <= content.length) {
    typed.textContent = content.slice(0, index);
    setTimeout(() => typeText(content, index + 1), index < 8 ? 82 : 46);
  } else {
    typed.classList.add("done");
  }
}

function addBurst(x, y, power = 1) {
  const amount = Math.floor(42 * power);
  for (let i = 0; i < amount; i += 1) {
    const angle = (Math.PI * 2 * i) / amount + Math.random() * 0.22;
    const speed = 1.3 + Math.random() * 4.2 * power;
    bursts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: Math.random() * 2.8 + 1.2,
      life: 1,
      decay: 0.012 + Math.random() * 0.014,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function drawBackgroundGlow() {
  const g1 = ctx.createRadialGradient(width * 0.5, height * 0.45, 10, width * 0.5, height * 0.45, Math.max(width, height) * 0.72);
  g1.addColorStop(0, "rgba(255, 255, 255, 0.22)");
  g1.addColorStop(0.42, "rgba(216, 180, 254, 0.08)");
  g1.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, width, height);
}

function drawParticles() {
  for (const p of particles) {
    const dx = p.x - pointer.x;
    const dy = p.y - pointer.y;
    const dist = Math.hypot(dx, dy);

    if (pointer.active && dist < 140) {
      const force = (140 - dist) / 140;
      p.vx += (dx / (dist || 1)) * force * 0.055;
      p.vy += (dy / (dist || 1)) * force * 0.055;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.992;
    p.vy *= 0.992;

    if (p.x < -20) p.x = width + 20;
    if (p.x > width + 20) p.x = -20;
    if (p.y < -20) p.y = height + 20;
    if (p.y > height + 20) p.y = -20;

    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.shadowBlur = 14;
    ctx.shadowColor = p.color;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 118) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.13 * (1 - dist / 118)})`;
        ctx.lineWidth = 1;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
}

function drawBursts() {
  bursts = bursts.filter((b) => b.life > 0);

  for (const b of bursts) {
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.018;
    b.vx *= 0.986;
    b.vy *= 0.986;
    b.life -= b.decay;

    ctx.beginPath();
    ctx.globalAlpha = Math.max(b.life, 0);
    ctx.fillStyle = b.color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = b.color;
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function animate() {
  ctx.clearRect(0, 0, width, height);
  drawBackgroundGlow();
  drawParticles();
  drawBursts();
  requestAnimationFrame(animate);
}

function showToast(message) {
  const old = document.querySelector(".toast");
  if (old) old.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1700);
}

function handleInteraction(x, y, power = 1) {
  pointer.x = x;
  pointer.y = y;
  pointer.active = true;
  addBurst(x, y, power);
  setTimeout(() => {
    pointer.active = false;
  }, 700);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
});
window.addEventListener("pointerleave", () => {
  pointer.active = false;
});

document.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  handleInteraction(event.clientX, event.clientY, 1.15);
});

wishBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  const rect = wishBtn.getBoundingClientRect();
  handleInteraction(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.35);
});

copyBtn.addEventListener("click", async (event) => {
  event.stopPropagation();
  try {
    await navigator.clipboard.writeText(location.href);
    showToast("祝福链接已复制");
  } catch {
    showToast("请手动复制地址栏链接");
  }
});

resize();
typeText(blessingText);
animate();
setTimeout(() => addBurst(width / 2, height * 0.42, 1.25), 650);
