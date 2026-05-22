'use strict';

/* ═══════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════ */
const PASSWORD = 'NIS23052026';
const STEPS = [
  { id: 1, emoji: '🗄️', title: 'Data Preparation', color: '#fbbf24', desc: 'Collect & normalize data' },
  { id: 2, emoji: '➡️', title: 'Forward Pass',     color: '#38bdf8', desc: 'Predict through layers' },
  { id: 3, emoji: '📉', title: 'Loss Calculation', color: '#fb7185', desc: 'Measure prediction error' },
  { id: 4, emoji: '⬅️', title: 'Backward Pass',    color: '#a78bfa', desc: 'Compute gradients' },
  { id: 5, emoji: '⚙️', title: 'Optimization',     color: '#34d399', desc: 'Update weights & repeat' },
];
const LAYERS  = [3, 4, 4, 2];
const LCOLORS = ['#fbbf24', '#818cf8', '#818cf8', '#34d399'];
const NR = 14, VG = 52;

const $ = id => document.getElementById(id);

/* ═══════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════ */
let trainingCardsBuilt = false;

function switchGame(n) {
  document.querySelectorAll('.gscreen').forEach(s => {
    s.classList.remove('active');
  });
  document.querySelectorAll('.game-item').forEach(i => i.classList.remove('active'));

  const target = $('g' + n);
  target.classList.add('active');
  $('nav' + n).classList.add('active');

  if ($('sidebar').classList.contains('open')) {
    $('sidebar').classList.remove('open');
  }

  const canvas = $('bgCanvas');
  if (canvas) {
    canvas.style.display = n === 2 ? 'block' : 'none';
    if (n === 2) {
      requestAnimationFrame(resizeCanvas);
    }
  }

  if (n === 2 && !trainingCardsBuilt) {
    requestAnimationFrame(() => requestAnimationFrame(buildCards));
    trainingCardsBuilt = true;
  }
}

/* ═══════════════════════════════════════
   PASSWORD
   ═══════════════════════════════════════ */
function tryUnlock() {
  const input = $('passInput');
  const err = $('passErr');
  const overlay = $('lockOverlay');

  if (input.value === PASSWORD) {
    overlay.classList.add('unlocking');
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 450);
  } else {
    err.classList.add('show');
    input.classList.add('shake');
    input.value = '';
    setTimeout(() => {
      input.classList.remove('shake');
      err.classList.remove('show');
    }, 2200);
  }
}

$('passInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') tryUnlock();
});

/* ═══════════════════════════════════════
   NEURAL NETWORK BACKGROUND
   ═══════════════════════════════════════ */
const canvas = $('bgCanvas');
let ctx, W, H, nodes = [], particles = [];

function resizeCanvas() {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  W = canvas.width = canvas.offsetWidth * dpr;
  H = canvas.height = canvas.offsetHeight * dpr;
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  buildNodes();
}

function buildNodes() {
  nodes = [];
  const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
  const mx = cw / 2, my = ch / 2;
  const gapX = Math.min(140, cw / (LAYERS.length + 1));
  const startX = mx - ((LAYERS.length - 1) * gapX) / 2;

  LAYERS.forEach((count, li) => {
    const gapY = Math.min(90, ch / (count + 2));
    const startY = my - ((count - 1) * gapY) / 2;
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: startX + li * gapX,
        y: startY + i * gapY,
        layer: li,
        idx: i,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  });
}

function spawnParticle() {
  const layer0 = nodes.filter(n => n.layer === 0);
  if (!layer0.length) return;
  const src = layer0[Math.floor(Math.random() * layer0.length)];
  particles.push({
    x: src.x, y: src.y,
    layer: 0, speed: 0.6 + Math.random() * 1.2,
    life: 1,
  });
}

function drawNet() {
  if (!ctx || !canvas) return;
  const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
  ctx.clearRect(0, 0, cw, ch);

  const t = Date.now() / 1000;

  // Subtle background glow
  const bgGrad = ctx.createRadialGradient(cw/2, ch/2, 0, cw/2, ch/2, Math.max(cw, ch)*0.6);
  bgGrad.addColorStop(0, 'rgba(56,189,248,0.03)');
  bgGrad.addColorStop(1, 'rgba(56,189,248,0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, cw, ch);

  // Connection energy pulses
  nodes.forEach((a, i) => {
    nodes.forEach((b, j) => {
      if (j <= i || b.layer !== a.layer + 1) return;
      const baseAlpha = 0.08 + 0.08 * Math.sin(t * 1.5 + i * 0.9 + j * 0.5);

      // Main connection line
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(139,92,246,${baseAlpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Traveling pulse dot on connection
      const pulsePos = (t * 0.6 + i * 0.3 + j * 0.2) % 1;
      const px = a.x + (b.x - a.x) * pulsePos;
      const py = a.y + (b.y - a.y) * pulsePos;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167,139,250,${0.5 + 0.3 * Math.sin(t * 4 + i)})`;
      ctx.shadowColor = 'rgba(167,139,250,0.6)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  });

  // Nodes
  nodes.forEach(n => {
    const glow = 0.3 + 0.25 * Math.sin(t * 2 + n.pulse);
    const color = LCOLORS[n.layer] || '#94a3b8';

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(n.x, n.y, NR + 6 + glow * 4, 0, Math.PI * 2);
    ctx.fillStyle = color + '15';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(n.x, n.y, NR + 3 + glow * 2, 0, Math.PI * 2);
    ctx.fillStyle = color + '25';
    ctx.fill();

    // Solid background circle
    ctx.beginPath();
    ctx.arc(n.x, n.y, NR + 1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(2,6,23,0.85)';
    ctx.fill();

    // Colored core
    ctx.beginPath();
    ctx.arc(n.x, n.y, NR, 0, Math.PI * 2);
    const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, NR);
    grd.addColorStop(0, color);
    grd.addColorStop(0.7, color + 'cc');
    grd.addColorStop(1, 'rgba(2,6,23,0.7)');
    ctx.fillStyle = grd;
    ctx.fill();

    // Bright center dot
    ctx.beginPath();
    ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + glow * 0.3) + ')';
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ring outline
    ctx.beginPath();
    ctx.arc(n.x, n.y, NR, 0, Math.PI * 2);
    ctx.strokeStyle = color + '60';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  // Layer labels
  const labels = ['Input', 'Hidden 1', 'Hidden 2', 'Output'];
  ctx.font = '600 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  labels.forEach((lbl, li) => {
    const layerNodes = nodes.filter(n => n.layer === li);
    if (!layerNodes.length) return;
    const cx = layerNodes.reduce((s, n) => s + n.x, 0) / layerNodes.length;
    const bottom = Math.max(...layerNodes.map(n => n.y));
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.fillText(lbl, cx, bottom + 28);
  });

  // Particles
  if (particles.length < 10 && Math.random() < 0.04) spawnParticle();

  particles.forEach((p, i) => {
    const nextLayer = nodes.filter(n => n.layer === p.layer + 1);
    if (!nextLayer.length) { p.life = 0; return; }

    const target = nextLayer[Math.floor(p.x * 997 + p.y * 331) % nextLayer.length];
    const dx = target.x - p.x, dy = target.y - p.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 6) {
      p.layer++;
      if (p.layer >= LAYERS.length - 1) p.life = 0;
    } else {
      p.x += (dx / dist) * p.speed * 2.5;
      p.y += (dy / dist) * p.speed * 2.5;
    }

    // Particle trail
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(56,189,248,${p.life * 0.9})`;
    ctx.shadowColor = 'rgba(56,189,248,0.8)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Particle head glow
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  });

  particles = particles.filter(p => p.life > 0);

  requestAnimationFrame(drawNet);
}

if (canvas) {
  resizeCanvas();
  window.addEventListener('resize', () => {
    clearTimeout(window._crt);
    window._crt = setTimeout(resizeCanvas, 200);
  });
  drawNet();
}

/* ═══════════════════════════════════════
   GAME 1: DRAG & DROP
   ═══════════════════════════════════════ */
let chips = [], slots = [], trayGhosts = [];
let dragEl = null, dragOffset = { x: 0, y: 0 };
let slotRects = [], trayRects = [];

function buildSlots() {
  const bar = $('slotsBar');
  bar.innerHTML = '';
  slots = [];
  for (let i = 0; i < 5; i++) {
    const s = document.createElement('div');
    s.className = 'slot';
    s.dataset.pos = i + 1;
    s.innerHTML = `<span class="slot-label">${i + 1}</span>`;
    bar.appendChild(s);
    slots.push(s);
  }
}

function buildCards() {
  const tray = $('tray');
  tray.querySelectorAll('.chip').forEach(c => c.remove());
  chips = [];

  let shuffled;
  do {
    shuffled = [...STEPS].sort(() => Math.random() - 0.5);
  } while (shuffled.every((s, i) => s.id === i + 1));

  trayGhosts = Array.from(tray.querySelectorAll('.tray-ghost'));
  rebuildPositions();

  shuffled.forEach((step, i) => {
    const c = document.createElement('div');
    c.className = 'chip';
    c.dataset.id = step.id;
    c.style.setProperty('--c', step.color);
    c.innerHTML = `
      <span class="chip-emoji">${step.emoji}</span>
      <span class="chip-title">${step.title}</span>
      <span class="chip-desc">${step.desc}</span>
    `;
    tray.appendChild(c);

    const g = trayGhosts[i];
    const r = g.getBoundingClientRect();
    const tr = tray.getBoundingClientRect();
    c.style.left = (r.left - tr.left) + 'px';
    c.style.top = (r.top - tr.top) + 'px';

    chips.push({
      el: c, homeX: r.left - tr.left, homeY: r.top - tr.top,
      trayIdx: i, slotPos: null,
    });

    c.addEventListener('mousedown', onDown);
    c.addEventListener('touchstart', onDown, { passive: false });
  });
}

function rebuildPositions() {
  const tray = $('tray');
  if (!tray) return;
  trayGhosts = Array.from(tray.querySelectorAll('.tray-ghost'));
  const tr = tray.getBoundingClientRect();
  trayGhosts.forEach((g, i) => {
    const r = g.getBoundingClientRect();
    if (chips[i]) {
      chips[i].homeX = r.left - tr.left;
      chips[i].homeY = r.top - tr.top;
      if (!chips[i].slotPos) {
        moveCard(chips[i].el, chips[i].homeX, chips[i].homeY);
      }
    }
  });
}

function onDown(e) {
  e.preventDefault();
  const chipEl = e.currentTarget;
  const chip = chips.find(c => c.el === chipEl);
  if (!chip) return;

  dragEl = chip;
  const rect = chipEl.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  dragOffset.x = clientX - rect.left;
  dragOffset.y = clientY - rect.top;

  chipEl.classList.add('lifted');
  chipEl.style.transition = 'none';

  if (chip.slotPos !== null) {
    const slot = slots.find(s => +s.dataset.pos === chip.slotPos);
    if (slot) slot.classList.remove('filled');
    chip.slotPos = null;
  }

  updateRects();
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onUp);
}

function onMove(e) {
  if (!dragEl) return;
  e.preventDefault();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const tray = $('tray');
  const tr = tray.getBoundingClientRect();

  dragEl.el.style.left = (clientX - tr.left - dragOffset.x) + 'px';
  dragEl.el.style.top = (clientY - tr.top - dragOffset.y) + 'px';

  slots.forEach(s => s.classList.remove('over'));
  const cx = clientX - dragOffset.x + dragEl.el.offsetWidth / 2;
  const cy = clientY - dragOffset.y + dragEl.el.offsetHeight / 2;

  for (let i = 0; i < slotRects.length; i++) {
    const r = slotRects[i];
    if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
      slots[i].classList.add('over');
      break;
    }
  }
}

function onUp(e) {
  if (!dragEl) return;
  document.removeEventListener('mousemove', onMove);
  document.removeEventListener('mouseup', onUp);
  document.removeEventListener('touchmove', onMove);
  document.removeEventListener('touchend', onUp);

  dragEl.el.classList.remove('lifted');
  dragEl.el.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), left 0.3s cubic-bezier(0.34,1.56,0.64,1), top 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s';

  const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
  const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
  const cx = clientX - dragOffset.x + dragEl.el.offsetWidth / 2;
  const cy = clientY - dragOffset.y + dragEl.el.offsetHeight / 2;

  let dropped = false;
  for (let i = 0; i < slotRects.length; i++) {
    const r = slotRects[i];
    if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
      const existing = chips.find(c => c !== dragEl && c.slotPos === +slots[i].dataset.pos);
      if (existing) {
        existing.slotPos = null;
        moveCard(existing.el, existing.homeX, existing.homeY);
      }
      snapToSlot(dragEl, slots[i]);
      dropped = true;
      break;
    }
  }

  if (!dropped) {
    moveCard(dragEl.el, dragEl.homeX, dragEl.homeY);
  }

  slots.forEach(s => s.classList.remove('over'));
  dragEl = null;
}

function snapToSlot(chip, slot) {
  const tray = $('tray');
  const tr = tray.getBoundingClientRect();
  const sr = slot.getBoundingClientRect();
  chip.slotPos = +slot.dataset.pos;
  slot.classList.add('filled');
  moveCard(chip.el, sr.left - tr.left + (sr.width - chip.el.offsetWidth) / 2, sr.top - tr.top + (sr.height - chip.el.offsetHeight) / 2);
}

function moveCard(el, x, y) {
  el.style.left = x + 'px';
  el.style.top = y + 'px';
}

function updateRects() {
  slotRects = slots.map(s => s.getBoundingClientRect());
}

window.addEventListener('resize', () => {
  clearTimeout(window._cpos);
  window._cpos = setTimeout(rebuildPositions, 200);
});

/* ═══════════════════════════════════════
   GAME 1: VALIDATION & SUCCESS
   ═══════════════════════════════════════ */
$('checkBtn').addEventListener('click', () => {
  const placed = chips.filter(c => c.slotPos !== null);
  if (placed.length < 5) {
    showToast('Place all 5 cards into the slots first!', 'err');
    return;
  }

  const wrong = placed.filter(c => c.slotPos !== +c.el.dataset.id);
  if (wrong.length) {
    showToast('Not quite right. Check the order and try again.', 'err');
    wrong.forEach(c => {
      const slot = slots.find(s => +s.dataset.pos === c.slotPos);
      if (slot) {
        slot.classList.add('wrong');
        setTimeout(() => slot.classList.remove('wrong'), 600);
      }
    });
    return;
  }

  showToast('Perfect! All steps are in the correct order!', 'ok');
  launchSuccess();
});

function showToast(msg, type) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  setTimeout(() => t.classList.remove('show'), 2800);
}

let trainTimer = null, epochData = [], lossData = [];

function launchSuccess() {
  spawnConfetti();
  const overlay = $('successOverlay');
  const pillsBar = $('pillsBar');
  pillsBar.innerHTML = '';

  STEPS.forEach(s => {
    const p = document.createElement('div');
    p.className = 'pill';
    p.textContent = s.emoji + ' ' + s.title;
    p.style.setProperty('--bgc', s.color + '22');
    p.style.setProperty('--bc', s.color + '40');
    p.style.setProperty('--tc', s.color);
    pillsBar.appendChild(p);
  });

  overlay.classList.add('show');

  $('epNum').textContent = '0';
  $('accNum').textContent = '0%';
  epochData = [];
  lossData = [];

  let ep = 0;
  if (trainTimer) clearInterval(trainTimer);
  trainTimer = setInterval(() => {
    ep++;
    const loss = Math.max(0.05, 2.4 * Math.exp(-ep * 0.08) + (Math.random() - 0.5) * 0.08);
    const acc = Math.min(99, Math.round(10 + 89 * (1 - Math.exp(-ep * 0.09))));

    epochData.push(ep);
    lossData.push(loss);

    $('epNum').textContent = ep;
    $('accNum').textContent = acc + '%';

    drawChart($('lossC'), lossData, '#fb7185', 3);
    drawChart($('accC'), epochData.map((e, i) => 100 - lossData[i] * 30 + Math.random() * 5), '#34d399', 2.8);

    const pills = pillsBar.querySelectorAll('.pill');
    pills.forEach(p => p.classList.remove('active'));
    const activeIdx = Math.floor((ep - 1) / 5) % STEPS.length;
    pills[activeIdx]?.classList.add('active');

    if (ep >= 60) clearInterval(trainTimer);
  }, 100);
}

function drawChart(cvs, data, color, maxY) {
  if (!cvs) return;
  const w = cvs.width, h = cvs.height;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  if (data.length < 2) return;

  const pad = 10;
  const maxVal = Math.max(...data, maxY);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - ((v - minVal) / range) * (h - pad * 2),
  }));

  ctx.beginPath();
  ctx.moveTo(points[0].x, h);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, h);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + '30');
  grad.addColorStop(1, color + '02');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(last.x, last.y, 8, 0, Math.PI * 2);
  ctx.strokeStyle = color + '40';
  ctx.lineWidth = 2;
  ctx.stroke();
}

$('btnAgain').addEventListener('click', () => {
  if (trainTimer) clearInterval(trainTimer);
  $('successOverlay').classList.remove('show');
  chips.forEach(c => {
    c.slotPos = null;
    moveCard(c.el, c.homeX, c.homeY);
  });
  slots.forEach(s => s.classList.remove('filled'));
  setTimeout(buildCards, 300);
});

/* ═══════════════════════════════════════
   GAME 1: GURUHGA BO'LISH
   ═══════════════════════════════════════ */
const TEAM_A = ['Bahriniso', 'Abdulloh', 'Gulmira', 'Mushtariy', 'Shaxboz', 'Hojiakbar'];
const TEAM_B = ['Abdulbosit', 'Dilrabo', 'Shoxjahon', 'Madina', 'Ruhshona'];

function shuffleTeams() {
  const btn = $('g1ShuffleBtn');
  const pool = $('g1Pool');
  const results = $('g1Results');
  const teamA = $('g1TeamA');
  const teamB = $('g1TeamB');

  btn.disabled = true;
  btn.textContent = 'Guruhlanmoqda...';
  results.classList.remove('show');
  teamA.innerHTML = '';
  teamB.innerHTML = '';

  // Hide the pool with a fade
  pool.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  pool.style.opacity = '0';
  pool.style.transform = 'translateY(-10px)';

  setTimeout(() => {
    pool.style.display = 'none';
    results.classList.add('show');

    TEAM_A.forEach((name, i) => {
      const span = document.createElement('span');
      span.textContent = name;
      span.style.animationDelay = (i * 180 + 200) + 'ms';
      teamA.appendChild(span);
    });

    TEAM_B.forEach((name, i) => {
      const span = document.createElement('span');
      span.textContent = name;
      span.style.animationDelay = (i * 180 + 500) + 'ms';
      teamB.appendChild(span);
    });

    spawnConfetti();

    btn.textContent = 'Qayta ko\'rish';
    btn.disabled = false;
    btn.onclick = resetTeams;
  }, 600);
}

function resetTeams() {
  const btn = $('g1ShuffleBtn');
  const pool = $('g1Pool');
  const results = $('g1Results');

  results.classList.remove('show');

  pool.style.display = 'block';
  requestAnimationFrame(() => {
    pool.style.opacity = '1';
    pool.style.transform = 'translateY(0)';
  });

  btn.textContent = "Guruhga bo'lish";
  btn.onclick = shuffleTeams;
}

/* ═══════════════════════════════════════
   CONFETTI
   ═══════════════════════════════════════ */
function spawnConfetti() {
  const layer = $('confLayer');
  const cols = ['#38bdf8','#a78bfa','#34d399','#fbbf24','#fb7185','#f472b6'];
  for (let i = 0; i < 120; i++) {
    const p = document.createElement('div');
    p.className = 'cp';
    const sz = 5 + Math.random() * 10;
    const shape = Math.random() > 0.5 ? '50%' : (Math.random() > 0.5 ? '3px' : '0');
    p.style.cssText = `
      left:${Math.random()*100}%;
      width:${sz}px; height:${sz}px;
      background:${cols[i%cols.length]};
      border-radius:${shape};
      animation-duration:${1.4+Math.random()*2.2}s;
      animation-delay:${Math.random()*0.5}s;
      opacity:${0.7+Math.random()*0.3};
    `;
    layer.appendChild(p);
    setTimeout(() => p.remove(), 4500);
  }
}

/* ═══════════════════════════════════════
   BOOT
   ═══════════════════════════════════════ */
buildSlots();
requestAnimationFrame(() => requestAnimationFrame(buildCards));
