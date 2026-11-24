// Dán URL Google Apps Script (Web app) vào đây để nhận RSVP vào Google Sheet. Để trống = mở email soạn sẵn.
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbwfV_n-a_VOI_rhdeRXpcFi5KXI9F8Rzk0iHf0KTz0yUtsjujc6YsADA8SZgPJzR0P9Dw/exec';
const MAIL = 'nam.truonghoang@tribox.me';

const $ = s => document.querySelector(s);
const bgm = $('#bgm');

// countdown tới 13:30 26/11/2026 (GMT+7)
const target = new Date('2026-11-26T13:30:00+07:00');
const cd = $('#count');
function tick(){
  let s = Math.max(0, (target - Date.now()) / 1000 | 0);
  const v = [[86400,'ngày'],[3600,'giờ'],[60,'phút'],[1,'giây']].map(([n,l]) => {
    const x = s / n | 0; s -= x * n; return `<div><b>${String(x).padStart(2,'0')}</b><span>${l}</span></div>`;
  });
  cd.innerHTML = v.join('');
}
tick(); setInterval(tick, 1000);

// reveal
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), {threshold:.15});
document.querySelectorAll('.rv').forEach(el => io.observe(el));

// nhạc: một bài, âm lượng đổi mượt theo section đang xem
let want = 0, muted = false;
bgm.volume = 0;
setInterval(() => {
  const goal = muted ? 0 : want, d = goal - bgm.volume;
  bgm.volume = Math.min(1, Math.max(0, Math.abs(d) < .02 ? goal : bgm.volume + d * .12));
}, 60);
const so = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (want = +e.target.dataset.vol)), {threshold:.5});
document.querySelectorAll('section[data-vol]').forEach(s => so.observe(s));

const env = $('#env');
const openEnv = () => {
  if (env.classList.contains('open')) return;
  env.classList.add('open');
  $('#gate').classList.add('opening');
  bgm.play().catch(() => {});
  setTimeout(() => $('#gate').classList.add('off'), 2600);
};
env.onclick = $('#open').onclick = openEnv;
// link riêng cho từng khách: index.html?to=Anh%20Minh
const to = new URLSearchParams(location.search).get('to');
if (to) $('#guest').textContent = to.slice(0, 40);
env.onkeydown = e => (e.key === 'Enter' || e.key === ' ') && openEnv();
$('#mute').onclick = e => {
  muted = !muted;
  e.currentTarget.textContent = muted ? '✕' : '♪';
};

// RSVP
$('#f').onsubmit = async e => {
  e.preventDefault();
  const d = {guests: '1', ...Object.fromEntries(new FormData(e.target))};
  if (ENDPOINT) {
    try { await fetch(ENDPOINT, {method:'POST', mode:'no-cors', body:JSON.stringify(d)}); }
    catch { alert('Gửi chưa được, bạn kiểm tra mạng và thử lại nhé.'); return; }
  } else {
    const body = `Họ tên: ${d.name}\nSĐT/Zalo: ${d.phone}\nSố người: ${d.guests}\nLời nhắn: ${d.note}`;
    location.href = `mailto:${MAIL}?subject=${encodeURIComponent('RSVP Lễ tốt nghiệp - ' + d.name)}&body=${encodeURIComponent(body)}`;
  }
  addWish(d, true);
  e.target.style.display = 'none';
  $('#ok').style.display = 'block';
};

// bong bóng lời chúc (chỉ hiện tên + lời nhắn, không bao giờ hiện SĐT)
const wall = $('#wall'), seen = new Set();
function addWish({name = '', note = ''}, own) {
  name = name.trim(); note = note.trim();
  const key = name + '|' + note;
  if (!note || seen.has(key)) return;
  seen.add(key);
  const L = innerWidth < 760 ? 1 : 4, d = 22 + Math.random() * 10;
  const el = document.createElement('div');
  el.className = 'wish';
  el.innerHTML = '<header><i></i><b></b></header><p></p>';
  el.querySelector('i').textContent = (name[0] || '♥').toUpperCase();
  el.querySelector('b').textContent = name || 'Bạn ẩn danh';
  el.querySelector('p').textContent = note;
  el.style.cssText = `left:${((seen.size - 1) % L) * (100 / L) + Math.random() * (L > 1 ? 2 : 18)}%;--d:${d}s;--dl:${own ? 0 : -Math.random() * d}s;--sx:${(Math.random() * 36 + 8) | 0}px`;
  el.onclick = () => el.classList.toggle('hold');
  wall.appendChild(el);
  $('#empty').style.display = 'none';
  $('#wcount').textContent = `${seen.size} lời chúc`;
}
async function loadWishes() {
  if (!ENDPOINT) return;
  try { (await (await fetch(ENDPOINT)).json()).forEach(w => addWish(w)); } catch {}
}
loadWishes(); setInterval(loadWishes, 90000);
