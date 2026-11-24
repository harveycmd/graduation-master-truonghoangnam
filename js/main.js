// Dán URL Google Apps Script (Web app) vào đây để nhận RSVP vào Google Sheet. Để trống = mở email soạn sẵn.
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbx7ShsSfGF10k0cri7bY3eILo2eOyqE9cvTtPWfn4QYo7waqby0yw5liszDMdsnqKvf/exec';
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

// nav: tô sáng mục đang xem (đường kẻ giữa màn hình chạm section nào)
const navLinks = [...document.querySelectorAll('.nav-links a')];
const no = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && navLinks.forEach(a => a.classList.toggle('on', a.hash === '#' + e.target.id))), {rootMargin: '-45% 0px -45% 0px'});
document.querySelectorAll('section[id]').forEach(s => no.observe(s));

// một bài duy nhất "A Little Dream of Me": phát từ giây START ngay khi vào splash, chạy liền sang trang chính, hết bài thì lặp lại từ START
const START = 0;
let started = false;
function playMusic() {
  if (started) return;
  started = true;
  bgm.currentTime = START;
  bgm.play().catch(() => { started = false; }); // trình duyệt chặn → chờ cú chạm đầu tiên
}
bgm.onended = () => { bgm.currentTime = START; bgm.play(); };
playMusic();
['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, playMusic, {once: true, passive: true}));

const env = $('#env');
const openEnv = () => {
  if (env.classList.contains('open')) return;
  env.classList.add('open');
  $('#gate').classList.add('opening');
  setTimeout(() => $('#gate').classList.add('off'), 2600);
};
env.onclick = $('#open').onclick = openEnv;
// link riêng cho từng khách: .../@chị-linh  |  .../#@chị-linh  |  ...?to=chị linh  → "Chị Linh"
function guestName() {
  try {
    const raw = (location.pathname + location.hash).match(/@([^/#?]+)/)?.[1] ?? new URLSearchParams(location.search).get('to') ?? '';
    return decodeURIComponent(raw).split(/[-_+\s]+/).filter(Boolean)
      .map(w => w[0].toLocaleUpperCase('vi') + w.slice(1)).join(' ').slice(0, 40);
  } catch { return ''; }
}
$('#guest').textContent = guestName() || 'Bạn';
env.onkeydown = e => (e.key === 'Enter' || e.key === ' ') && openEnv();
$('#mute').onclick = e => {
  muted = !muted;
  e.currentTarget.textContent = muted ? '✕' : '♪';
};

// RSVP
$('#f').onsubmit = async e => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true; btn.classList.add('loading'); btn.textContent = 'Đang gửi…';
  const d = {guests: '1', ...Object.fromEntries(new FormData(e.target))};
  if (ENDPOINT) {
    try { await fetch(ENDPOINT, {method:'POST', mode:'no-cors', body:JSON.stringify(d)}); }
    catch {
      alert('Gửi chưa được, bạn kiểm tra mạng và thử lại nhé.');
      btn.disabled = false; btn.classList.remove('loading'); btn.textContent = 'Gửi xác nhận';
      return;
    }
  } else {
    const body = `Họ tên: ${d.name}\nTham dự: ${d.attend}\nSố người: ${d.guests}\nLời nhắn: ${d.note}`;
    location.href = `mailto:${MAIL}?subject=${encodeURIComponent('RSVP Lễ tốt nghiệp - ' + d.name)}&body=${encodeURIComponent(body)}`;
  }
  addWish(d, true);
  e.target.style.display = 'none';
  $('#ok').firstChild.textContent = d.attend === 'Có' ? 'Cảm ơn bạn! Hẹn gặp ngày 26/11 ♥' : 'Tiếc quá, cảm ơn bạn đã nhắn mình. Hẹn dịp khác nhé ♥';
  $('#ok').style.display = 'block';
  $('#chuc').scrollIntoView({behavior: 'smooth'});
};

// bong bóng lời chúc (chỉ hiện tên + lời nhắn, không bao giờ hiện SĐT)
const wall = $('#wall'), seen = new Set();
function addWish({name = '', note = ''}, own) {
  name = name.trim(); note = note.trim();
  const key = name + '|' + note;
  if (!note || seen.has(key)) return;
  seen.add(key);
  const L = wall.clientWidth > 700 ? 4 : 2, i = seen.size - 1, d = 26; // L cột rải đều trái → phải
  const el = document.createElement('div');
  el.className = 'wish';
  el.innerHTML = '<header><i></i><b></b></header><p></p>';
  el.querySelector('i').textContent = (name[0] || '♥').toUpperCase();
  el.querySelector('b').textContent = name || 'Bạn ẩn danh';
  el.querySelector('p').textContent = note;
  const f = Math.min(1, Math.max(0, (i % L) / (L - 1) + (Math.random() - .5) * .08)); // 0 = sát trái, 1 = sát phải
  // trễ nhịp theo tỉ lệ vàng để các bóng cách đều nhau theo chiều dọc
  el.style.cssText = `--f:${f};--d:${d}s;--dl:${own ? 0 : -((i * .618) % 1) * d}s;--sx:${(Math.random() * 16 + 8) | 0}px`;
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
// dừng bóng bay khi khung lời chúc ra khỏi màn hình (đỡ tốn GPU khi cuộn)
new IntersectionObserver(([e]) => wall.classList.toggle('off', !e.isIntersecting)).observe(wall);
