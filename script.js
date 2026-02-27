// Dán Config Firebase của ông vào đây
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

// KHO TỪ VỰNG KHỔNG LỒ (Tôi đã thêm cực nhiều từ)
const dictionary = {
    vi: ["mình", "tin", "đất", "hay", "cổ", "tích", "dũng", "sinh", "định", "phải", "gió", "chim", "bướm", "hạt", "tên", "hãy", "khoa", "phố", "thanh", "niên", "mà", "lại", "đi", "trả", "người", "vui", "lá", "phần", "phân", "dũng", "rộng", "mây", "độ", "hệ", "trời", "mưa", "con", "chức", "lực", "năng", "khiển", "tương", "kiểm", "tính", "thực", "ứng", "dụng", "sông", "kho", "thành", "trữ", "phím", "trình", "tra", "liệu", "phát", "mềm", "nỗ", "tập", "thống", "mở", "nối", "điều", "nhân", "hoa", "núi", "biển", "triển", "năng", "lập", "công", "việt", "nam", "đường", "kiến", "thức", "xây", "dựng", "vững", "mạnh", "tâm", "hồn", "ánh", "sáng", "bình", "minh"],
    en: ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "typing", "speed", "test", "coding", "future", "world", "light", "space", "star", "time", "work", "life", "challenge", "standard", "keyboard", "practice", "success", "develop", "system", "logic", "professional", "account", "profile", "password", "security", "database", "connection", "application", "software", "function", "storage", "analysis", "control", "member", "register", "login", "create", "update", "delete", "information", "national", "language", "energy", "power", "heavy", "simple", "complex", "history", "science", "physics", "nature"]
};

let currentLang = 'vi', words = [], idx = 0, timer = 60, isPlaying = false, interval;
let cWords = 0, tKeys = 0, cKeys = 0, userLoc = "vn";

fetch('https://ipapi.co/json/').then(r => r.json()).then(d => userLoc = d.country_code.toLowerCase());

function init() {
    words = Array.from({length: 400}, () => dictionary[currentLang][Math.floor(Math.random() * dictionary[currentLang].length)]);
    idx = 0; timer = 60; isPlaying = false; cWords = 0; tKeys = 0; cKeys = 0;
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
    tKeys++;
    if(e.target.value.endsWith(" ")) {
        const typed = e.target.value.trim();
        const target = words[idx];
        const el = document.getElementById(`w-${idx}`);

        if(typed === target) {
            el.className = "correct";
            cWords++; cKeys += target.length + 1;
        } else { el.className = "wrong"; }
        
        idx++;
        e.target.value = "";
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
    alert("Hết giờ! WPM của bạn: " + wpm);
    if(auth.currentUser) updateScore(wpm);
    init();
}

// Hàm cập nhật điểm (Sửa lỗi undefined Language)
async function updateScore(wpm) {
    const user = auth.currentUser;
    const langName = currentLang === 'vi' ? "Vietnamese" : "English"; // Ép kiểu string rõ ràng
    const userRef = db.collection("leaderboard").doc(user.uid);
    const doc = await userRef.get();

    if (!doc.exists || wpm > doc.data().wpm) {
        await userRef.set({
            name: user.email.split('@')[0],
            wpm: wpm,
            code: userLoc,
            lang: langName, // Lưu dưới dạng chữ rõ ràng
            date: Date.now()
        });
    }
    loadBoard();
}

// Đổi Tab Đăng nhập / Đăng ký
function switchAuth(type) {
    document.getElementById('form-login').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('form-reg').style.display = type === 'reg' ? 'block' : 'none';
    document.getElementById('tab-login').classList.toggle('active', type === 'login');
    document.getElementById('tab-reg').classList.toggle('active', type === 'reg');
}

// Profile & Auth Status
auth.onAuthStateChanged(u => {
    if(u) {
        document.getElementById('user-header').innerHTML = `<button class="p-btn" onclick="toggleProfile()">Hồ sơ: ${u.email.split('@')[0]}</button>`;
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('p-email').innerText = u.email;
        document.getElementById('p-date').innerText = new Date(u.metadata.creationTime).toLocaleDateString();
    }
});

function toggleProfile() {
    const card = document.getElementById('profile-card');
    card.style.display = card.style.display === 'none' ? 'block' : 'none';
}

async function handleAuth(type) {
    const e = document.getElementById(type === 'login' ? 'l-email' : 'r-email').value;
    const p = document.getElementById(type === 'login' ? 'l-pass' : 'r-pass').value;
    try {
        if(type === 'signup') await auth.createUserWithEmailAndPassword(e, p);
        else await auth.signInWithEmailAndPassword(e, p);
        location.reload();
    } catch (err) { alert("Lỗi: " + err.message); }
}

async function loadBoard() {
    const snap = await db.collection("leaderboard").orderBy("wpm", "desc").limit(10).get();
    let h = ""; let i = 1;
    snap.forEach(doc => {
        const d = doc.data();
        h += `<tr>
            <td>${i++}</td>
            <td>${d.name}</td>
            <td style="color:#5cb85c; font-weight:bold">${d.wpm}</td>
            <td><img src="https://flagcdn.com/16x12/${d.code}.png"></td>
            <td>${d.lang || "Unknown"}</td>
            <td style="font-size:12px; color:#888">Vừa xong</td>
        </tr>`;
    });
    document.getElementById('leaderboard-body').innerHTML = h;
}

init(); loadBoard();
