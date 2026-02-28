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
const provider = new firebase.auth.GoogleAuthProvider();

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
    const input = document.getElementById('word-input');
    input.value = ""; input.disabled = false;
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
    // Lưu kỷ lục vào bảng leaderboard
    const userRef = db.collection("leaderboard").doc(u.uid);
    const doc = await userRef.get();
    if (!doc.exists || wpm > doc.data().wpm) {
        await userRef.set({
            name: u.displayName, 
            wpm: wpm, 
            code: userLoc, 
            lang: currentLang === 'vi' ? "Vietnamese" : "English", 
            date: Date.now()
        });
    }
    loadBoard();
}

async function login() {
    await auth.signInWithPopup(provider);
    location.reload();
}

auth.onAuthStateChanged((u) => {
    const status = document.getElementById('auth-status');
    if (u) {
        status.innerHTML = `Hi, ${u.displayName} <button onclick="auth.signOut().then(()=>location.reload())">Thoát</button>`;
    } else {
        status.innerHTML = `<button onclick="login()">Đăng nhập bằng Google</button>`;
    }
});

async function loadBoard() {
    const snap = await db.collection("leaderboard").orderBy("wpm", "desc").limit(100).get();
    let h = ""; let r = 1;
    snap.forEach(doc => {
        const d = doc.data();
        h += `<tr><td>${r++}</td><td>${d.name}</td><td style="color:#28a745; font-weight:bold">${d.wpm}</td>
        <td><img src="https://flagcdn.com/20x15/${d.code}.png"></td><td>${d.lang || "Vietnamese"}</td><td>Vừa xong</td></tr>`;
    });
    document.getElementById('leaderboard-data').innerHTML = h;
}

function changeLang(l) { currentLang = l; init(); }
function resetGame() { init(); }
init(); loadBoard();
