// ====== FIREBASE (import harus di paling atas) ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxw54XsXWXzNbof6hNRg8NqqQ9CItgAa8",
  authDomain: "buku-undangan.firebaseapp.com",
  projectId: "buku-undangan",
  storageBucket: "buku-undangan.firebasestorage.app",
  messagingSenderId: "369119839425",
  appId: "1:369119839425:web:ddf5ae4ea04a60c2490040",
};
const db = getFirestore(initializeApp(firebaseConfig));
const ucapanRef = collection(db, "ucapan");

// ====== KONFIGURASI ACARA ======
// Format: YYYY-MM-DDTHH:mm:ss+08:00 (WITA)
const TANGGAL_ACARA = new Date('2026-10-18T08:00:00+08:00');

// ====== 1. NAMA TAMU DARI URL (?to=Budi-dan-Mba-Siti) ======
const params = new URLSearchParams(window.location.search);
const rawName = (params.get('to') || '').replace(/-/g, ' ').trim();
document.getElementById('guestName').textContent = rawName || 'Tamu Undangan';

// ====== 2. BUKA UNDANGAN ======
const cover = document.getElementById('cover');
const main = document.getElementById('main');
const bgm = document.getElementById('bgm');
const musicBtn = document.getElementById('musicBtn');

document.getElementById('openBtn').addEventListener('click', () => {
  bgm.play().then(() => musicBtn.classList.add('playing')).catch(() => {});
  cover.classList.add('fade-out');
  main.classList.remove('hidden');
  document.body.classList.remove('locked');
  window.scrollTo(0, 0);
  setTimeout(() => cover.classList.add('hidden'), 900);
  initReveal();
  musicBtn.classList.remove('hidden');
});

musicBtn.addEventListener('click', () => {
  if (bgm.paused) {
    bgm.play();
    musicBtn.classList.add('playing');
  } else {
    bgm.pause();
    musicBtn.classList.remove('playing');
  }
});

// ====== 3. COUNTDOWN ======
const cd = {
  d: document.getElementById('cd-d'), h: document.getElementById('cd-h'),
  m: document.getElementById('cd-m'), s: document.getElementById('cd-s'),
};
function updateCountdown() {
  const diff = TANGGAL_ACARA - new Date();
  if (diff <= 0) {
    document.getElementById('cd-msg').textContent = 'Hari bahagia telah tiba!';
    cd.d.textContent = cd.h.textContent = cd.m.textContent = cd.s.textContent = 0;
    clearInterval(timer);
    return;
  }
  cd.d.textContent = Math.floor(diff / 86400000);
  cd.h.textContent = Math.floor(diff / 3600000) % 24;
  cd.m.textContent = Math.floor(diff / 60000) % 60;
  cd.s.textContent = Math.floor(diff / 1000) % 60;
}
const timer = setInterval(updateCountdown, 1000);
updateCountdown();

// ====== 4. SALIN NOMOR REKENING + TOAST ======
const toast = document.getElementById('toast');
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove('show'), 2200);
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}
document.querySelectorAll('.copy').forEach(btn => {
  btn.addEventListener('click', async () => {
    const no = document.getElementById(btn.dataset.target).textContent.trim();
    await copyText(no);
    showToast('Nomor rekening disalin: ' + no);
  });
});

// ====== 5. RSVP & UCAPAN (tersimpan di Firestore) ======
let wishes = [];
const form = document.getElementById('rsvpForm');
const wishList = document.getElementById('wishList');

function renderWishes() {
  wishList.innerHTML = '';
  if (!wishes.length) {
    wishList.innerHTML = '<p class="empty">Belum ada ucapan.</p>';
    return;
  }
  wishes.forEach(w => {
    const item = document.createElement('div');
    item.className = 'wish';
    const head = document.createElement('div');
    const name = document.createElement('b');
    name.textContent = w.nama;
    const badge = document.createElement('span');
    badge.className = 'badge' + (w.hadir === 'Hadir' ? '' : w.hadir === 'Ragu-ragu' ? ' maybe' : ' no');
    badge.textContent = w.hadir;
    head.append(name, badge);
    const p = document.createElement('p');
    p.textContent = w.pesan;
    item.append(head, p);
    wishList.appendChild(item);
  });
}

// Ambil ucapan secara real-time (otomatis update saat ada ucapan baru)
onSnapshot(
  query(ucapanRef, orderBy("waktu", "desc"), limit(50)),
  snap => { wishes = snap.docs.map(d => d.data()); renderWishes(); },
  err => console.error("Gagal memuat ucapan:", err)
);

form.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    await addDoc(ucapanRef, {
      nama: form.nama.value.trim(),
      hadir: form.hadir.value,
      pesan: form.pesan.value.trim(),
      waktu: serverTimestamp(),
    });
    form.reset();
    showToast('Terima kasih, ucapan Anda terkirim!');
  } catch (err) {
    console.error(err);
    showToast('Gagal mengirim, coba lagi.');
  }
  btn.disabled = false;
});

// ====== 6. ANIMASI MUNCUL SAAT SCROLL ======
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
}