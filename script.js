const GAMES = [
  { glow: '#6dff4a', title: 'Ben 10 Game', cat: 'Aventura', cover: 'images/covers/juego1_cover.png', cat_img: 'images/nobg/gato2.png',
    url: 'https://scratch.mit.edu/projects/1206065561/fullscreen/',
    desc: 'Ponete el Omnitrix y enfrentá la aventura con los héroes de Ben 10.' },
  { glow: '#ff8a3d', title: 'Juego de la pelota', cat: 'Arcade', cover: 'images/covers/pelota_naranja.png', cat_img: 'images/nobg/gato4.png',
    url: 'https://scratch.mit.edu/projects/409551080/fullscreen/',
    desc: 'Guiá la pelota naranja por el camino sin caerte al vacío.' },
  { glow: '#3de8ff', title: 'Space Pong', cat: 'Arcade', cover: 'images/covers/space_pong.png', cat_img: 'images/nobg/gato5.png',
    url: 'https://scratch.mit.edu/projects/1089298842/fullscreen/',
    desc: 'El clásico Pong llevado al espacio: rebotá la pelota y no dejes que pase.' },
  { glow: '#ffb84d', title: 'Restaurante Busetinni', cat: 'Aventura', cover: 'images/covers/restaurante.png', cat_img: 'images/nobg/gato3.png',
    url: 'https://scratch.mit.edu/projects/1320380514/fullscreen/',
    desc: 'Entrá al restaurante y descubrí qué te espera en esta aventura.' }
];

const $ = id => document.getElementById(id);
const track = $('track'), stage = $('stage'), info = $('info'), input = $('search-input');
let list = GAMES.slice(), idx = 0, cat = 'todos';

function build() {
  track.innerHTML = '';
  list.forEach((g, i) => {
    const t = document.createElement('div');
    t.className = 'tile';
    t.tabIndex = -1;
    t.setAttribute('role', 'button');
    t.setAttribute('aria-label', g.title);
    t.innerHTML = `<img class="bgimg" src="${g.cover}" alt=""><img class="cover" src="${g.cover}" alt="${g.title}">` + `<span class="tile-name">${g.title}</span>`;
    t.addEventListener('click', () => (i === idx ? launch() : select(i)));
    track.appendChild(t);
  });
  const empty = list.length === 0;
  $('no-results').classList.toggle('active', empty);
  info.classList.toggle('hidden', empty);
  track.style.display = empty ? 'none' : 'flex';
  if (empty) renderRecs(); else select(0, true);
}

let lastX = null, blurRaf = 0;
function motionBlur(dist) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const std = document.getElementById('hblur-std');
  const peak = Math.min(34, dist / 10), dur = 1600, t0 = performance.now();
  cancelAnimationFrame(blurRaf);
  track.style.filter = 'url(#hblur)';
  (function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    const v = peak * Math.sin(Math.PI * Math.pow(p, .7));   // sube rápido y se disuelve al frenar
    std.setAttribute('stdDeviation', v.toFixed(2) + ' 0');
    if (p < 1) blurRaf = requestAnimationFrame(step);
    else track.style.filter = '';
  })(t0);
}

function select(i, first) {
  const prev = idx;
  idx = Math.max(0, Math.min(list.length - 1, i));
  track.dataset.dir = idx >= prev ? 'r' : 'l';
  const tiles = track.children;
  [...tiles].forEach((t, k) => {
    t.style.setProperty('--d', Math.abs(k - idx));
    t.classList.toggle('sel', k === idx);
  });
  if (list[idx]) document.documentElement.style.setProperty('--glow', list[idx].glow);
  const t = tiles[idx];
  if (t) {
    const x = stage.clientWidth / 2 - (t.offsetLeft + t.offsetWidth / 2);
    if (lastX !== null && !first && Math.abs(x - lastX) > 1) motionBlur(Math.abs(x - lastX));
    lastX = x;
    track.style.transform = `translate(${x}px,-50%)`;
  }
  const g = list[idx];
  if (!g) return;
  $('info-tag').textContent = g.cat;
  $('info-title').textContent = g.title;
  $('info-desc').textContent = g.desc;
  $('mascot').src = g.cat_img;
  info.classList.remove('in'); void info.offsetWidth; info.classList.add('in');
}

function launch() {
  const g = list[idx];
  if (g) window.open(g.url, '_blank', 'noopener');
}

function filter() {
  const q = input.value.trim().toLowerCase();
  list = GAMES.filter(g => (cat === 'todos' || g.cat === cat) && g.title.toLowerCase().includes(q));
  build();
}

function renderRecs() {
  const box = $('recommendations');
  box.innerHTML = '';
  GAMES.forEach(g => {
    const c = document.createElement('button');
    c.className = 'chip';
    c.textContent = g.title;
    c.onclick = () => { input.value = g.title; cat = 'todos'; setTab('todos'); filter(); };
    box.appendChild(c);
  });
}

function setTab(c) {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.cat === c));
}

$('tabs').addEventListener('click', e => {
  const b = e.target.closest('.tab');
  if (!b) return;
  cat = b.dataset.cat; setTab(cat); filter();
});
input.addEventListener('input', filter);
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === 'ArrowDown') { input.blur(); }
  if (e.key === 'Escape') { input.value = ''; input.blur(); filter(); }
});
$('play').addEventListener('click', launch);

document.addEventListener('keydown', e => {
  if (document.activeElement === input) return;
  if (e.key === 'ArrowRight') select(idx + 1);
  else if (e.key === 'ArrowLeft') select(idx - 1);
  else if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') launch();
  else if (e.key === '/') { e.preventDefault(); input.focus(); }
});

let wheelLock = false;
stage.addEventListener('wheel', e => {
  e.preventDefault();
  if (wheelLock) return;
  wheelLock = true; setTimeout(() => (wheelLock = false), 280);
  select(idx + ((e.deltaY || e.deltaX) > 0 ? 1 : -1));
}, { passive: false });

let x0 = null;
stage.addEventListener('touchstart', e => (x0 = e.touches[0].clientX), { passive: true });
stage.addEventListener('touchend', e => {
  if (x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0;
  if (Math.abs(dx) > 40) select(idx + (dx < 0 ? 1 : -1));
  x0 = null;
});
window.addEventListener('resize', () => select(idx));

function tick() {
  $('clock').textContent = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
tick(); setInterval(tick, 10000);

build();
