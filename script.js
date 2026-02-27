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

// KHO TỪ VỰNG CỰC NHIỀU
const dictionary = {
    vi: ["mình", "tin", "đất", "cổ", "tích", "dũng", "sinh", "định", "phải", "gió", "chim", "bướm", "hạt", "tên", "hãy", "khoa", "phố", "thanh", "niên", "mà", "lại", "đi", "trả", "người", "vui", "lá", "phần", "phân", "rộng", "mây", "độ", "hệ", "trời", "mưa", "con", "chức", "lực", "năng", "khiển", "tương", "kiểm", "tính", "thực", "ứng", "dụng", "sông", "kho", "thành", "trữ", "phím", "trình", "tra", "liệu", "phát", "mềm", "nỗ", "tập", "thống", "mở", "nối", "điều", "nhân", "hoa", "núi", "biển", "triển", "năng", "lập", "công", "việt", "nam", "đường", "kiến", "thức", "xây", "dựng", "vững", "mạnh", "tâm", "hồn", "ánh", "sáng", "bình", "minh"],
    en: ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "typing", "speed", "test", "coding", "future", "world", "light", "space", "star", "time", "work", "life", "challenge", "standard", "keyboard", "practice", "success", "develop", "system", "logic", "professional", "account", "profile", "password", "security", "database", "connection", "application", "software", "function", "storage", "analysis", "control", "member", "register", "login", "create", "update", "delete", "information", "national", "language", "energy", "power", "heavy", "simple", "complex", "history", "science", "physics", "nature"]
};

let currentLang = 'vi', words = [], idx = 0, timer = 60, isPlaying = false, interval, cWords = 0, userLoc = "vn";

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
    alert("WPM Score: " + wpm);
    if(auth.currentUser) saveBestScore(wpm);
    init();
}

async function saveBestScore(wpm) {
    const u = auth.currentUser;
    const lang = currentLang === 'vi' ? "Vietnamese" : "English";
    const userRef = db.collection("leaderboard").doc(u.uid);
    const doc = await userRef.get();
    
    // Chỉ cập nhật nếu gõ nhanh hơn kỉ lục cũ
    if (!doc.exists || wpm > doc.data().wpm) {
        await userRef.set({
            name: u.email.split('@')[0], wpm: wpm, code: userLoc, lang: lang, date: Date.now()
        });
    }
    loadBoard();
}

// Chuyển Tab Login/Register
function switchTab(tab) {
    document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('reg-form').style.display = tab === 'reg' ? 'block' : 'none';
    document.getElementById('tab-login-btn').className = tab === 'login' ? 'active' : '';
    document.getElementById('tab-reg-btn').className = tab === 'reg' ? 'active' : '';
}

// Profile UI
auth.onAuthStateChanged(u => {
    if(u) {
        document.getElementById('auth-status').innerHTML = `<button class="prof-btn" onclick="toggleProfile()">Profile: ${u.email.split('@')[0]}</button>`;
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('p-username').innerText = u.email;
        document.getElementById('p-date').innerText = new Date(u.metadata.creationTime).toLocaleDateString();
    }
});

function toggleProfile() {
    const p = document.getElementById('profile-section');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

async function handleAuth(type) {
    const e = document.getElementById(type === 'login' ? 'l-email' : 'r-email').value;
    const p = document.getElementById(type === 'login' ? 'l-pass' : 'r-pass').value;
    try {
        if(type === 'signup') await auth.createUserWithEmailAndPassword(e, p);
        else await auth.signInWithEmailAndPassword(e, p);
        location.reload();
    } catch (err) { alert(err.message); }
}

async function loadBoard() {
    const snap = await db.collection("leaderboard").orderBy("wpm", "desc").limit(100).get();
    let h = ""; let r = 1;
    snap.forEach(doc => {
        const d = doc.data();
        h += `<tr><td>${r++}</td><td>${d.name}</td><td style="color:#5cb85c; font-weight:bold">${d.wpm}</td><td><img src="https://flagcdn.com/20x15/${d.code}.png"></td><td>${d.lang}</td><td style="font-size:11px; color:#888">Online</td></tr>`;
    });
    document.getElementById('leaderboard-data').innerHTML = h;
}

function changeLang(l) { currentLang = l; init(); }
function resetGame() { init(); }
init(); loadBoard();
