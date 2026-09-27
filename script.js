const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Menu mobile
const nav = document.querySelector('.nav');
const toggle = document.querySelector('.nav__toggle');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', open);
});
document.querySelectorAll('.nav__links a').forEach((a) =>
  a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  })
);

// Année du footer
document.getElementById('year').textContent = new Date().getFullYear();

/* ==========================================================
   Frappe « clavier coréen » : les jamos se composent en syllabes
   ex. 소 → ㅅ, 소 ; 김 → ㄱ, 기, 김
   ========================================================== */
const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
function imeSteps(text) {
  const steps = [];
  let done = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code >= 0 && code < 11172) {
      const l = Math.floor(code / 588);
      const v = Math.floor((code % 588) / 28);
      steps.push(done + INITIALS[l]);
      steps.push(done + String.fromCharCode(0xac00 + l * 588 + v * 28));
      if (code % 28) steps.push(done + ch);
    } else {
      steps.push(done + ch);
    }
    done += ch;
  }
  return steps;
}
async function typeHangul(el, text, speed = 110) {
  for (const step of imeSteps(text)) {
    el.textContent = step;
    await wait(speed);
  }
}
async function eraseText(el, speed = 45) {
  while (el.textContent.length) {
    el.textContent = el.textContent.slice(0, -1);
    await wait(speed);
  }
}

// Petit tag du hero qui alterne les salutations
async function loopGreetings() {
  const el = document.querySelector('.ime');
  if (!el || reduceMotion) return;
  const words = el.dataset.words.split('|');
  let i = 0;
  for (;;) {
    await wait(1800);
    await eraseText(el);
    i = (i + 1) % words.length;
    await typeHangul(el, words[i], 100);
  }
}

/* ==========================================================
   Intro : portes de hanok
   ========================================================== */
let isReady = false;
function ready() {
  if (isReady) return;
  isReady = true;
  root.classList.remove('intro-lock');
  document.body.classList.add('is-ready');
  loopGreetings();
}
const intro = document.querySelector('.intro');
if (!intro || root.classList.contains('no-intro')) {
  intro?.remove();
  ready();
} else {
  try { sessionStorage.setItem('sosiji-intro', '1'); } catch (e) { /* stockage indisponible */ }
  let opened = false;
  const open = () => {
    if (opened) return;
    opened = true;
    intro.classList.add('is-open');
    ready();
    setTimeout(() => intro.remove(), 1300);
  };
  intro.addEventListener('click', open);
  addEventListener('keydown', open, { once: true });
  const word = intro.querySelector('.intro__word');
  wait(350)
    .then(() => typeHangul(word, '소시지', 150))
    .then(() => { intro.classList.add('is-typed'); return wait(900); })
    .then(open);
  setTimeout(open, 5000); // sécurité
}

/* ==========================================================
   Hangeul qui « scramble » avant de se révéler
   ========================================================== */
function scramble(el) {
  const chars = [...el.dataset.final];
  const total = 16;
  let frame = 0;
  const tick = () => {
    frame++;
    el.textContent = chars
      .map((c, i) => {
        if (!/[가-힣]/.test(c) || frame > (total * (i + 1)) / chars.length) return c;
        return String.fromCharCode(0xac00 + Math.floor(Math.random() * 11172));
      })
      .join('');
    if (frame <= total) setTimeout(tick, 45);
  };
  tick();
}
const scrambleTargets = document.querySelectorAll('.card__ko, .vibe__ko, .section-head .ko, .hangul-lesson dt');
scrambleTargets.forEach((el) => {
  // on ne scramble que le premier nœud texte (le bouton 🔊 reste intact)
  const node = el.firstChild;
  if (node && node.nodeType === 3) {
    const span = document.createElement('span');
    span.textContent = node.textContent;
    span.dataset.final = node.textContent;
    node.replaceWith(span);
  }
});

/* ==========================================================
   Apparition au scroll
   ========================================================== */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-visible');
    if (!reduceMotion) e.target.querySelectorAll('[data-final]').forEach(scramble);
    io.unobserve(e.target);
  }),
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal, .section-head').forEach((el) => io.observe(el));

// Néons de Séoul qui s'allument
const seoul = document.querySelector('.seoul');
new IntersectionObserver(
  (entries, obs) => entries.forEach((e) => {
    if (e.isIntersecting) { seoul.classList.add('is-on'); obs.disconnect(); }
  }),
  { threshold: 0.25 }
).observe(seoul);

/* ==========================================================
   Pétales de cerisier 벚꽃 (canvas du hero)
   ========================================================== */
function cherryBlossoms(canvas) {
  const ctx = canvas.getContext('2d');
  const colors = ['#ffd6e6', '#ffc2da', '#fff1f6', '#ffb0cd'];
  const count = innerWidth < 700 ? 16 : 34;
  let w = 0, h = 0, raf = 0, running = false;
  const petals = [];

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const make = (anywhere) => ({
    x: rand(0, w), y: anywhere ? rand(0, h) : rand(-60, -10),
    s: rand(5, 11), vy: rand(0.5, 1.3), vx: rand(-0.4, 0.5),
    a: rand(0, 6.28), va: rand(-0.03, 0.03), sw: rand(0, 6.28),
    c: pick(colors),
  });
  const draw = (p) => {
    const s = p.s;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a);
    ctx.scale(Math.cos(p.sw * 1.3), 1); // effet de pétale qui tourne sur lui-même
    ctx.fillStyle = p.c;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, s);
    ctx.bezierCurveTo(-s, s * 0.3, -s * 0.8, -s * 0.8, -s * 0.25, -s);
    ctx.lineTo(0, -s * 0.7);
    ctx.lineTo(s * 0.25, -s);
    ctx.bezierCurveTo(s * 0.8, -s * 0.8, s, s * 0.3, 0, s);
    ctx.fill();
    ctx.restore();
  };
  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    for (const p of petals) {
      p.sw += 0.03;
      p.x += p.vx + Math.sin(p.sw) * 0.6;
      p.y += p.vy;
      p.a += p.va;
      if (p.y > h + 20 || p.x < -30 || p.x > w + 30) Object.assign(p, make(false));
      draw(p);
    }
    if (running) raf = requestAnimationFrame(tick);
  };

  resize();
  for (let i = 0; i < count; i++) petals.push(make(true));
  addEventListener('resize', resize);
  new IntersectionObserver(([e]) => {
    running = e.isIntersecting && !document.hidden;
    cancelAnimationFrame(raf);
    if (running) tick();
  }).observe(canvas.parentElement);
}
const petalCanvas = document.querySelector('.petals');
if (petalCanvas && !reduceMotion) cherryBlossoms(petalCanvas);

/* ==========================================================
   Lanternes 연등 + skyline de Séoul avec la N Seoul Tower
   ========================================================== */
const lanterns = document.querySelector('.lanterns');
if (lanterns) {
  const n = innerWidth < 700 ? 5 : 10;
  const colors = ['#ff4fa3', '#f2605b', '#ffd24a', '#3dffc5', '#ff8fc6'];
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span');
    el.className = 'lantern';
    el.style.left = `${((i + 0.5) / n) * 100}%`;
    el.style.setProperty('--len', `${Math.round(rand(14, 80))}px`);
    el.style.setProperty('--c', colors[i % colors.length]);
    el.style.setProperty('--d', `${rand(2.4, 4).toFixed(2)}s`);
    el.style.setProperty('--dl', `-${rand(0, 3).toFixed(2)}s`);
    el.innerHTML = '<i></i>';
    lanterns.appendChild(el);
  }
}

const skyline = document.querySelector('.skyline');
if (skyline) {
  const H = 200;
  let svg = '<path d="M600 200 Q 830 90 1060 200Z" fill="#10231f"/>';
  // N Seoul Tower sur la colline de Namsan
  svg += '<g><path d="M818 146 L842 146 L836 122 L824 122Z" fill="#1d1b27"/>'
    + '<rect x="826" y="52" width="8" height="72" fill="#1d1b27"/>'
    + '<rect x="810" y="56" width="40" height="15" rx="5" fill="#26233a"/>'
    + '<rect class="tower-ring" x="814" y="62" width="32" height="3" fill="#ff4fa3"/>'
    + '<rect x="829" y="16" width="2" height="40" fill="#1d1b27"/>'
    + '<circle class="tower-light" cx="830" cy="14" r="3"/></g>';
  let x = 0;
  while (x < 1200) {
    const bw = rand(34, 80);
    const tall = x > 700 && x < 960 ? rand(28, 58) : rand(50, 150);
    const top = H - tall;
    svg += `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${(bw - 3).toFixed(1)}" height="${tall.toFixed(1)}" fill="#17151f"/>`;
    for (let wy = top + 8; wy < H - 6; wy += 12) {
      for (let wx = x + 6; wx < x + bw - 9; wx += 9) {
        if (Math.random() > 0.35) continue;
        const neon = Math.random() < 0.12;
        const col = neon ? pick(['#ff4fa3', '#3dffc5']) : '#ffd98a';
        const cls = Math.random() < 0.25 ? 'win tw' : 'win';
        svg += `<rect class="${cls}" x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="4" height="5" fill="${col}" style="animation-delay:-${rand(0, 4).toFixed(2)}s"/>`;
      }
    }
    x += bw;
  }
  skyline.innerHTML = svg;
}

/* ==========================================================
   Photocards K-pop : inclinaison 3D + reflet holographique
   ========================================================== */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.classList.add('is-tilting');
      card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 16}deg) rotateY(${(x - 0.5) * 16}deg) translateY(-6px)`;
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
      card.style.setProperty('--gx', `${x * 100}%`);
      card.style.setProperty('--gy', `${y * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.transform = '';
    });
  });
}

/* ==========================================================
   Traînée ✦ ♥ ㅋ derrière le curseur
   ========================================================== */
if (finePointer && !reduceMotion) {
  const glyphs = ['✦', '♥', 'ㅋ', '✧', '♡', '★', 'ㅎ'];
  const colors = ['#ff4fa3', '#1d6b57', '#f2605b', '#0fae84'];
  let last = 0;
  addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - last < 55) return;
    last = now;
    const s = document.createElement('span');
    s.className = 'trail';
    s.textContent = pick(glyphs);
    s.style.left = `${e.clientX}px`;
    s.style.top = `${e.clientY}px`;
    s.style.setProperty('--c', pick(colors));
    s.style.setProperty('--dx', `${rand(-24, 24)}px`);
    s.style.setProperty('--r', `${rand(-90, 90)}deg`);
    s.addEventListener('animationend', () => s.remove());
    document.body.appendChild(s);
  }, { passive: true });
}

/* ==========================================================
   Mini cours : écouter la prononciation (voix coréenne du navigateur)
   ========================================================== */
if ('speechSynthesis' in window) {
  document.querySelectorAll('.say').forEach((btn) => {
    btn.hidden = false;
    btn.addEventListener('click', () => {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(btn.dataset.say);
      u.lang = 'ko-KR';
      u.rate = 0.85;
      const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith('ko'));
      if (voice) u.voice = voice;
      btn.classList.add('is-speaking');
      u.onend = u.onerror = () => btn.classList.remove('is-speaking');
      speechSynthesis.speak(u);
    });
  });
}
