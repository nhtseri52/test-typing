const firebaseConfig = { 
  apiKey: "AIzaSyCrgepkYAgTAniQBrDRRqis470Aea6Stk4", 
  authDomain: "test-typing-lac.vercel.app", // Link Vercel cũ của ông
  projectId: "speedtype-pro-f0b75", 
  storageBucket: "speedtype-pro-f0b75.firebasestorage.app", 
  messagingSenderId: "121414853341", 
  appId: "1:121414853341:web:504c3f9f36b03329cfb134" 
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const dict = {
    vi: ["mình", "tin", "đất", "công", "biển", "nam", "phát", "trình", "liệu", "thanh", "niên", "hãy", "vững", "mạnh"],
    en: ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "typing", "future", "coding", "logic"]
};

let currentLang = 'vi', words = [], idx = 0, timer = 60, isPlaying = false, interval, correctWords = 0;

// --- 1. HỆ THỐNG AUTH & PROFILE ---
auth.onAuthStateChanged(user => {
    const info = document.getElementById('user-info');
    if (user) {
        info.innerHTML = `<span>👤 ${user.displayName || 'Người dùng'}</span> <button onclick="auth.signOut().then(()=>location.reload())">Thoát</button>`;
        document.getElementById('auth-modal').style.display = 'none';
    } else {
        renderAuthForm('login');
        document.getElementById('auth-modal').style.display = 'flex';
    }
    loadLeaderboard();
});

function renderAuthForm(mode) {
    const content = document.getElementById('auth-form-content');
    if(mode === 'login') {
        content.innerHTML = `<h3>ĐĂNG NHẬP</h3><input id="email" placeholder="Email"><input type="password" id="pw" placeholder="Mật khẩu"><button onclick="doAuth('login')">Vào Game</button><p onclick="renderAuthForm('reg')">Chưa có acc? Đăng ký</p>`;
    } else {
        content.innerHTML = `<h3>ĐĂNG KÝ</h3><input id="nick" placeholder="Tên hiển thị"><input id="email" placeholder="Email"><input type="password" id="pw" placeholder="Mật khẩu"><button onclick="doAuth('reg')">Tạo tài khoản</button><p onclick="renderAuthForm('login')">Đã có acc? Đăng nhập</p>`;
    }
}

async function doAuth(mode) {
    const email = document.getElementById('email').value, pw = document.getElementById('pw').value;
    try {
        if(mode === 'reg') {
            const nick = document.getElementById('nick').value;
            const res = await auth.createUserWithEmailAndPassword(email, pw);
            await res.user.updateProfile({displayName: nick});
            await db.collection("users").doc(res.user.uid).set({username: nick, bestWpm: 0});
        } else { await auth.signInWithEmailAndPassword(email, pw); }
        location.reload();
    } catch(e) { alert("Lỗi: " + e.message); }
}

// --- 2. QUẢNG CÁO TỰ ĐỘNG ---
function refreshAds() {
    const slots = ['ad-top', 'ad-left', 'ad-right', 'ad-bottom'];
    slots.forEach(id => {
        const el = document.getElementById(id);
        el.innerHTML = `<div class="ad-wrapper"><button class="ad-x" onclick="this.parentElement.remove()">X</button><div class="ad-content">Quảng cáo AdSense</div></div>`;
    });
}

// --- 3. LOGIC GAME & LEADERBOARD ---
function init() {
    words = Array.from({length: 100}, () => dict[currentLang][Math.floor(Math.random()*dict[currentLang].length)]);
    idx = 0; timer = 60; isPlaying = false; correctWords = 0;
    clearInterval(interval);
    document.getElementById('timer').innerText = "1:00";
    document.getElementById('word-input').value = "";
    const box = document.getElementById('word-display');
    box.innerHTML = words.map((w, i) => `<span id="w-${i}">${w}</span>`).join(" ");
    document.getElementById(`w-0`).className = "active";
}

document.getElementById('word-input').addEventListener('input', (e) => {
    if(!isPlaying) { isPlaying = true; startTimer(); }
    if(e.target.value.endsWith(" ")) {
        const typed = e.target.value.trim();
        const el = document.getElementById(`w-${idx}`);
        if(typed === words[idx]) { el.className = "correct"; correctWords++; }
        else { el.className = "wrong"; }
        idx++; e.target.value = "";
        if(document.getElementById(`w-${idx}`)) document.getElementById(`w-${idx}`).className = "active";
    }
});

function startTimer() {
    interval = setInterval(() => {
        timer--;
        document.getElementById('timer').innerText = `0:${timer < 10 ? '0'+timer : timer}`;
        if(timer <= 0) finish();
    }, 1000);
}

function finish() {
    clearInterval(interval);
    const wpm = correctWords;
    document.getElementById('final-wpm').innerText = wpm;
    document.getElementById('result-modal').style.display = 'flex';
    if(auth.currentUser) saveToLeaderboard(wpm);
    refreshAds(); // Hiện quảng cáo mới khi xong
}

async function saveToLeaderboard(wpm) {
    const u = auth.currentUser;
    const ref = db.collection("leaderboard").doc(u.uid);
    const doc = await ref.get();
    if(!doc.exists || wpm > doc.data().wpm) {
        await ref.set({name: u.displayName, wpm: wpm, date: Date.now()});
    }
    loadLeaderboard();
}

async function loadLeaderboard() {
    const snap = await db.collection("leaderboard").orderBy("wpm", "desc").limit(5).get();
    let html = ""; let rank = 1;
    snap.forEach(d => {
        html += `<tr><td>${rank++}</td><td>${d.data().name}</td><td>${d.data().wpm}</td><td>Online</td></tr>`;
    });
    document.getElementById('lb-data').innerHTML = html;
}

function closeResult() { document.getElementById('result-modal').style.display = 'none'; init(); }
function changeLang(l) { currentLang = l; init(); }
function resetGame() { init(); }
window.onload = () => { init(); refreshAds(); };
