const firebaseConfig = { 
  apiKey: "AIzaSyCrgepkYAgTAniQBrDRRqis470Aea6Stk4", 
  authDomain: "speedtype-pro-f0b75.firebaseapp.com", 
  projectId: "speedtype-pro-f0b75", 
  storageBucket: "speedtype-pro-f0b75.firebasestorage.app", 
  messagingSenderId: "121414853341", 
  appId: "1:121414853341:web:504c3f9f36b03329cfb134" 
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const dictionary = {
    vi: ["mình", "tin", "đất", "cổ", "tích", "dũng", "sinh", "định", "phải", "gió", "chim", "bướm", "hạt", "tên", "hãy", "khoa", "phố", "thanh", "niên", "mà", "lại", "đi", "trả", "người", "vui", "lá", "phần", "phân", "rộng", "mây", "độ", "hệ", "trời", "mưa", "con", "chức", "lực", "năng", "khiển", "tương", "kiểm", "tính", "thực", "ứng", "dụng", "sông", "kho", "thành", "trữ", "phím", "trình", "tra", "liệu", "phát", "mềm", "nỗ", "tập", "thống", "mở", "nối", "điều", "nhân", "hoa", "núi", "biển", "triển", "năng", "lập", "công", "việt", "nam", "đường", "kiến", "thức", "xây", "dựng", "vững", "mạnh", "tâm", "hồn", "ánh", "sáng", "bình", "minh"],
    en: ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "typing", "speed", "test", "coding", "future", "world", "light", "space", "star", "time", "work", "life", "challenge", "standard", "keyboard", "practice", "success", "develop", "system", "logic", "professional", "account", "profile", "password", "security", "database", "connection", "application", "software", "function", "storage", "analysis", "control", "member", "register", "login", "create", "update", "delete", "information", "national", "language", "energy", "power", "heavy", "simple", "complex", "history", "science", "physics", "nature"]
};

let currentLang = 'vi', words = [], idx = 0, timer = 60, isPlaying = false, interval, cWords = 0;

function init() {
    words = Array.from({length: 400}, () => dictionary[currentLang][Math.floor(Math.random() * dictionary[currentLang].length)]);
    idx = 0; timer = 60; isPlaying = false; cWords = 0;
    clearInterval(interval);
    document.getElementById('timer').innerText = "1:00";
    document.getElementById('word-input').value = "";
    document.getElementById('word-input').disabled = false;
    render();
}

function render() {
    const box = document.getElementById('word-display');
    box.innerHTML = words.map((w, i) => `<span id="w-${i}">${w}</span>`).join(" ");
    document.getElementById(`w-0`).className = "active";
}

document.getElementById('word-input').addEventListener('input', (e) => {
    if(!isPlaying) { isPlaying = true; startTimer(); }
    if(e.target.value.endsWith(" ")) {
        const typed = e.target.value.trim();
        const el = document.getElementById(`w-${idx}`);
        if(typed === words[idx]) { el.className = "correct"; cWords++; } 
        else { el.className = "wrong"; }
        idx++; e.target.value = "";
        const next = document.getElementById(`w-${idx}`);
        if(next) {
            next.className = "active";
            if(el.offsetTop < next.offsetTop) {
                document.querySelectorAll('.correct, .wrong').forEach(n => n.style.display = 'none');
            }
        }
    }
});

function startTimer() {
    interval = setInterval(() => {
        timer--;
        document.getElementById('timer').innerText = `0:${timer < 10 ? '0'+timer : timer}`;
        if(timer <= 0) { clearInterval(interval); finish(); }
    }, 1000);
}

function finish() {
    const wpm = Math.round(cWords);
    if(auth.currentUser && auth.currentUser.emailVerified) saveBestScore(wpm);
    else alert("Kết quả: " + wpm + " WPM. Đăng nhập & Xác thực Gmail để lưu Top!");
    init();
}

// HÀM TÀI KHOẢN TÁCH RIÊNG
auth.onAuthStateChanged(async (user) => {
    const accBox = document.getElementById('account-section');
    const status = document.getElementById('auth-status');
    if (user) {
        if (!user.emailVerified) {
            accBox.innerHTML = `<div class="auth-box"><h3>✉️ Xác thực Gmail</h3><p>Vui lòng nhấn link trong email gửi tới <b>${user.email}</b> để chơi.</p><button onclick="auth.signOut().then(()=>location.reload())">Thoát</button></div>`;
            return;
        }
        const userDoc = await db.collection("users").doc(user.uid).get();
        const name = userDoc.exists ? userDoc.data().username : "User";
        status.innerHTML = `<span>● ${name}</span>`;
        accBox.innerHTML = `<div class="profile-box"><h3>👤 HỒ SƠ</h3><p>Tên: <b>${name}</b></p><p>Email: ${user.email}</p><button onclick="auth.signOut().then(()=>location.reload())">Đăng xuất</button></div>`;
    } else {
        showAuthForm('login');
    }
    loadBoard();
});

function showAuthForm(type) {
    const box = document.getElementById('account-section');
    if (type === 'login') {
        box.innerHTML = `<div class="auth-box"><h3>ĐĂNG NHẬP</h3><input type="email" id="l-email" placeholder="Gmail"><input type="password" id="l-pass" placeholder="Mật khẩu"><button onclick="handleAuth('login')">Vào hệ thống</button><p onclick="showAuthForm('reg')">Chưa có acc? Đăng ký</p></div>`;
    } else {
        box.innerHTML = `<div class="auth-box"><h3>ĐĂNG KÝ</h3><input type="text" id="r-user" placeholder="Username"><input type="email" id="r-email" placeholder="Gmail thật"><input type="password" id="r-pass" placeholder="Mật khẩu"><button onclick="handleAuth('reg')">Tạo tài khoản</button><p onclick="showAuthForm('login')">Đã có acc? Đăng nhập</p></div>`;
    }
}

async function handleAuth(mode) {
    try {
        if (mode === 'reg') {
            const user = document.getElementById('r-user').value;
            const email = document.getElementById('r-email').value;
            const pass = document.getElementById('r-pass').value;
            const res = await auth.createUserWithEmailAndPassword(email, pass);
            await res.user.sendEmailVerification();
            await db.collection("users").doc(res.user.uid).set({ username: user, email: email, password: pass, createdAt: Date.now() });
            alert("Đã gửi link xác thực về Gmail của ông!");
        } else {
            const email = document.getElementById('l-email').value;
            const pass = document.getElementById('l-pass').value;
            await auth.signInWithEmailAndPassword(email, pass);
        }
        location.reload();
    } catch (e) { alert(e.message); }
}

async function saveBestScore(wpm) {
    const u = auth.currentUser;
    const userDoc = await db.collection("users").doc(u.uid).get();
    const name = userDoc.exists ? userDoc.data().username : u.email.split('@')[0];
    const userRef = db.collection("leaderboard").doc(u.uid);
    const doc = await userRef.get();
    if (!doc.exists || wpm > doc.data().wpm) {
        await userRef.set({ name: name, wpm: wpm, lang: currentLang === 'vi' ? "VN" : "EN", date: Date.now() });
    }
    loadBoard();
}

async function loadBoard() {
    const snap = await db.collection("leaderboard").orderBy("wpm", "desc").limit(10).get();
    let h = ""; let r = 1;
    snap.forEach(doc => {
        const d = doc.data();
        h += `<tr><td>${r++}</td><td>${d.name}</td><td>${d.wpm}</td><td>${d.lang}</td><td>Vừa xong</td></tr>`;
    });
    document.getElementById('leaderboard-data').innerHTML = h;
}

function changeLang(l) { currentLang = l; init(); }
function resetGame() { init(); }
init();
