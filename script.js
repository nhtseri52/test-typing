// Dán Firebase Config của ông vào đây
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

// KHO TỪ VỰNG KHỔNG LỒ (Thêm hàng trăm từ vào đây)
const wordsList = {
    vi: ["mình", "tin", "đất", "hay", "cổ", "tích", "dũng", "sinh", "định", "phải", "gió", "chim", "bướm", "hạt", "tên", "hãy", "khoa", "phố", "thanh", "niên", "mà", "lại", "đi", "trả", "người", "vui", "lá", "phần", "phân", "rộng", "mây", "độ", "hệ", "trời", "mưa", "con", "chức", "lực", "năng", "khiển", "tương", "kiểm", "tính", "thực", "ứng", "dụng", "sông", "kho", "thành", "trữ", "phím", "trình", "tra", "liệu", "phát", "mềm", "nỗ", "tập", "thống", "mở", "nối", "điều", "nhân", "hoa", "núi", "biển", "triển", "năng", "lập", "công", "việt", "nam", "đường", "kiến", "thức", "xây", "dựng", "vững", "mạnh", "tâm", "hồn", "ánh", "sáng", "bình", "minh"],
    en: ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "typing", "speed", "test", "coding", "future", "world", "light", "space", "star", "time", "work", "life", "challenge", "standard", "keyboard", "practice", "success", "develop", "system", "logic", "professional", "account", "profile", "password", "security", "database", "connection", "application", "software", "function", "storage", "analysis", "control", "member", "register", "login", "create", "update", "delete", "information", "national", "language", "energy", "power", "heavy", "simple", "complex", "history", "science", "physics", "nature"]
};

let currentLang = 'vi', words = [], idx = 0, timer = 60, isPlaying = false, interval;
let cWords = 0, userLoc = "vn";

fetch('https://ipapi.co/json/').then(r => r.json()).then(d => userLoc = d.country_code.toLowerCase());

function init() {
    words = Array.from({length: 500}, () => wordsList[currentLang][Math.floor(Math.random() * wordsList[currentLang].length)]);
    idx = 0; timer = 60; isPlaying = false; cWords = 0;
    clearInterval(interval);
    document.getElementById('timer').innerText = "1:00";
    document.getElementById('word-input').value = "";
    document.getElementById('word-input').disabled = false;
    render();
}

function render() {
    const box = document.getElementById('word-box');
    box.innerHTML = words.map((w, i) => `<span id="w-${i}">${w}</span>`).join(" ");
    document.getElementById(`w-0`).className = "active";
}

document.getElementById('word-input').addEventListener('input', (e) => {
    if(!isPlaying) { isPlaying = true; startTimer(); }
    if(e.target.value.endsWith(" ")) {
        const typed = e.target.value.trim();
        const target = words[idx];
        const el = document.getElementById(`w-${idx}`);

        if(typed === target) {
            el.className = "correct";
            cWords++;
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
    document.getElementById('word-input').disabled = true;
    if(auth.currentUser) updateScore(wpm);
    else alert("Please login to save your WPM!");
    init();
}

// Cập nhật điểm & Sửa lỗi undefined LANG
async function updateScore(wpm) {
    const user = auth.currentUser;
    const userRef = db.collection("leaderboard").doc(user.uid);
    const langLabel = currentLang === 'vi' ? "Vietnamese" : "English";
    const doc = await userRef.get();

    if (!doc.exists || wpm > doc.data().wpm) {
        await userRef.set({
            name: user.email.split('@')[0],
            wpm: wpm,
            code: userLoc,
            lang: langLabel,
            date: Date.now()
        });
    }
    loadBoard();
}

// Load Top 100 World Rankings
async function loadBoard() {
    const snap = await db.collection("leaderboard").orderBy("wpm", "desc").limit(100).get();
    let h = ""; let rank = 1;
    snap.forEach(doc => {
        const d = doc.data();
        h += `<tr>
            <td>${rank++}</td>
            <td>${d.name}</td>
            <td class="wpm-val">${d.wpm}</td>
            <td><img src="https://flagcdn.com/20x15/${d.code}.png"></td>
            <td>${d.lang || "English"}</td>
            <td class="time-ago">Recently</td>
        </tr>`;
    });
    document.getElementById('lb-body').innerHTML = h;
}

// Profile & Auth Status
auth.onAuthStateChanged(u => {
    if(u) {
        document.getElementById('user-nav').innerHTML = `<button class="p-btn" onclick="toggleProfile()">Profile: ${u.email.split('@')[0]}</button>`;
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('profile-panel').style.display = 'none'; // Ẩn mặc định, ấn nút mới hiện
        document.getElementById('p-user').innerText = u.email;
        document.getElementById('p-created').innerText = new Date(u.metadata.creationTime).toLocaleDateString();
    }
});

function toggleProfile() {
    const p = document.getElementById('profile-panel');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

async function changePassword() {
    const oldP = document.getElementById('old-p').value;
    const newP = document.getElementById('new-p').value;
    const user = auth.currentUser;
    const cred = firebase.auth.EmailAuthProvider.credential(user.email, oldP);
    try {
        await user.reauthenticateWithCredential(cred);
        await user.updatePassword(newP);
        alert("Password updated!");
    } catch (e) { alert("Old password incorrect!"); }
}

async function handleAuth(type) {
    const email = document.getElementById(type === 'login' ? 'l-email' : 'r-email').value;
    const pass = document.getElementById(type === 'login' ? 'l-pass' : 'r-pass').value;
    try {
        if(type === 'signup') await auth.createUserWithEmailAndPassword(email, pass);
        else await auth.signInWithEmailAndPassword(email, pass);
        location.reload();
    } catch (e) { alert(e.message); }
}

function changeLang(l) { currentLang = l; init(); }
function resetGame() { init(); }
init(); loadBoard();
