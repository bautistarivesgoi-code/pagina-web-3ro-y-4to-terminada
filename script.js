const GAMES = [
  { glow: '#6dff4a', title: 'Ben 10 Game', cat: 'Aventura', cover: './juego1_cover.png', cat_img: './gato2.png',
    url: 'https://scratch.mit.edu/projects/1206065561/fullscreen/',
    desc: 'Ponete el Omnitrix y enfrentá la aventura con los héroes de Ben 10.' },
  { glow: '#ff8a3d', title: 'Juego de la pelota', cat: 'Arcade', cover: './pelota_naranja.png', cat_img: './gato4.png',
    url: 'https://scratch.mit.edu/projects/409551080/fullscreen/',
    desc: 'Guiá la pelota naranja por el camino sin caerte al vacío.' },
  { glow: '#3de8ff', title: 'Space Pong', cat: 'Arcade', cover: './space_pong.png', cat_img: './gato5.png',
    url: 'https://scratch.mit.edu/projects/1089298842/fullscreen/',
    desc: 'El clásico Pong llevado al espacio: rebotá la pelota y no dejes que pase.' },
  { glow: '#ffb84d', title: 'Restaurante Busetinni', cat: 'Aventura', cover: './restaurante.png', cat_img: './gato3.png',
    url: 'https://scratch.mit.edu/projects/1320380514/fullscreen/',
    desc: 'Entrá al restaurante y descubrí qué te espera en esta aventura.' }
];

const $ = id => document.getElementById(id);
const track = $('track');
const stage = $('stage');
const info = $('info');
const input = $('search-input');
let list = GAMES.slice();
let idx = 0;
let cat = 'todos';
let lastX = null;
let blurRaf = 0;

function setImageSource(image, source) {
  // Resolve from the page URL so root assets work both locally and on project GitHub Pages.
  image.src = new URL(source.replace(/^\.\//, ''), document.baseURI).href;
  image.addEventListener('error', () => {
    image.classList.add('image-missing');
    image.removeAttribute('src');
  }, { once: true });
}

function build() {
  track.replaceChildren();
  list.forEach((game, i) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    tile.style.setProperty('--d', Math.abs(i - idx));
    tile.setAttribute('aria-label', game.title);

    const blurred = document.createElement('img');
    blurred.className = 'bgimg';
    blurred.alt = '';
    blurred.setAttribute('aria-hidden', 'true');
    setImageSource(blurred, game.cover);

    const cover = document.createElement('img');
    cover.className = 'cover';
    cover.alt = game.title;
    setImageSource(cover, game.cover);

    const title = document.createElement('span');
    title.className = 'tile-name';
    title.textContent = game.title;
    tile.append(blurred, cover, title);
    tile.addEventListener('click', () => i === idx ? launch() : select(i));
    track.appendChild(tile);
  });

  const empty = list.length === 0;
  $('no-results').classList.toggle('active', empty);
  info.classList.toggle('hidden', empty);
  track.style.display = empty ? 'none' : 'flex';
  if (empty) renderRecs();
  else select(0, true);
}

function motionBlur(distance) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const std = $('hblur-std');
  if (!std) return;
  const peak = Math.min(12, distance / 35);
  const duration = 420;
  const start = performance.now();
  cancelAnimationFrame(blurRaf);
  track.style.filter = 'url(#hblur)';
  function step(now) {
    const progress = Math.min(1, (now - start) / duration);
    const value = peak * Math.sin(Math.PI * progress);
    std.setAttribute('stdDeviation', `${value.toFixed(2)} 0`);
    if (progress < 1) blurRaf = requestAnimationFrame(step);
    else track.style.filter = '';
  }
  blurRaf = requestAnimationFrame(step);
}

function select(i, first = false) {
  if (!list.length) return;
  const previous = idx;
  idx = Math.max(0, Math.min(list.length - 1, i));
  track.dataset.dir = idx >= previous ? 'r' : 'l';
  [...track.children].forEach((tile, k) => {
    tile.style.setProperty('--d', Math.abs(k - idx));
    tile.classList.toggle('sel', k === idx);
    tile.setAttribute('aria-pressed', String(k === idx));
  });
  document.documentElement.style.setProperty('--glow', list[idx].glow);

  const tile = track.children[idx];
  if (tile) {
    // offsetLeft is relative to the track; center the selected tile in the viewport stage.
    const x = stage.clientWidth / 2 - (tile.offsetLeft + tile.offsetWidth / 2);
    if (lastX !== null && !first && Math.abs(x - lastX) > 1) motionBlur(Math.abs(x - lastX));
    lastX = x;
    track.style.transform = `translate3d(${x}px,-50%,0)`;
  }
  const game = list[idx];
  $('info-tag').textContent = game.cat;
  $('info-title').textContent = game.title;
  $('info-desc').textContent = game.desc;
  setImageSource($('mascot'), game.cat_img);
  info.classList.remove('in');
  void info.offsetWidth;
  info.classList.add('in');
}

function launch() {
  const game = list[idx];
  if (game) window.open(game.url, '_blank', 'noopener,noreferrer');
}

function filter() {
  const query = input.value.trim().toLocaleLowerCase();
  list = GAMES.filter(game => (cat === 'todos' || game.cat === cat) && game.title.toLocaleLowerCase().includes(query));
  idx = 0;
  lastX = null;
  build();
}

function renderRecs() {
  const box = $('recommendations');
  box.replaceChildren();
  GAMES.forEach(game => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = game.title;
    chip.addEventListener('click', () => {
      input.value = game.title;
      cat = 'todos';
      setTab('todos');
      filter();
    });
    box.appendChild(chip);
  });
}

function setTab(category) {
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.cat === category));
}

$('tabs').addEventListener('click', event => {
  const button = event.target.closest('.tab');
  if (!button) return;
  cat = button.dataset.cat;
  setTab(cat);
  filter();
});
input.addEventListener('input', filter);
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === 'ArrowDown') input.blur();
  if (event.key === 'Escape') {
    input.value = '';
    input.blur();
    filter();
  }
});
$('play').addEventListener('click', launch);

document.addEventListener('keydown', event => {
  if (document.activeElement === input) return;
  if (event.key === 'ArrowRight') select(idx + 1);
  else if (event.key === 'ArrowLeft') select(idx - 1);
  else if (event.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') launch();
  else if (event.key === '/') { event.preventDefault(); input.focus(); }
});

let wheelLock = false;
stage.addEventListener('wheel', event => {
  event.preventDefault();
  if (wheelLock) return;
  wheelLock = true;
  setTimeout(() => { wheelLock = false; }, 280);
  select(idx + ((event.deltaY || event.deltaX) > 0 ? 1 : -1));
}, { passive: false });

let touchStartX = null;
stage.addEventListener('touchstart', event => { touchStartX = event.touches[0].clientX; }, { passive: true });
stage.addEventListener('touchend', event => {
  if (touchStartX === null) return;
  const deltaX = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(deltaX) > 40) select(idx + (deltaX < 0 ? 1 : -1));
  touchStartX = null;
});
window.addEventListener('resize', () => select(idx, true));

function tick() {
  $('clock').textContent = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
tick();
setInterval(tick, 10000);
build();
