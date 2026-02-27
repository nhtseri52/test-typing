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

// KHO TỪ VỰNG KHỔNG LỒ
const wordsBank = {
    vi: ["mình", "tin", "đất", "cổ", "tích", "dũng", "sinh", "định", "phải", "gió", "chim", "bướm", "hạt", "tên", "hãy", "khoa", "phố", "thanh", "niên", "trả", "anh", "đường", "vui", "người", "con", "lá", "hoa", "sông", "núi", "biển", "trời", "mây", "nắng", "mưa", "học", "tập", "nỗ", "lực", "thành", "công", "sáng", "tạo", "việt", "nam", "bàn", "phím", "tốc", "độ", "máy", "tính", "lập", "trình", "tương", "lai", "phát", "triển", "hệ", "thống", "thực", "thi", "kiểm", "tra", "ứng", "dụng", "dữ", "liệu", "kết", "nối", "phần", "mềm", "mở", "rộng", "chức", "năng", "kho", "lưu", "trữ", "phân", "tích", "điều", "khiển"],
    en: ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "typing", "speed", "test", "coding", "future", "world", "light", "space", "star", "time", "work", "life", "challenge", "standard", "keyboard", "practice", "success", "develop", "system", "logic", "professional", "account", "profile", "password", "security", "database", "connection", "application", "software", "function", "storage", "analysis", "control", "member", "register", "login", "create", "update", "delete", "information", "national", "language", "energy", "power", "heavy", "simple", "complex", "history", "science", "physics", "nature"]
};

let currentLang = 'vi', words = [], idx = 0, timer = 60, isPlaying = false, interval;
let cWords = 0, tKeys = 0, cKeys = 0, userLoc = "vn";

fetch('https://ipapi.co/json/').then(r => r.json()).then(d => userLoc = d.country_code.toLowerCase());

function init() {
    // Random 300 từ mỗi lần chơi để không bao giờ hết
    words = Array.from({length: 300}, () => wordsBank[currentLang][Math.floor(Math.random() * wordsBank[currentLang].length)]);
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

// Logic đổi mật khẩu chuyên nghiệp
async function changePassword() {
    const oldP = document.getElementById('old-pass').value;
    const newP = document.getElementById('new-pass').value;
    const user = auth.currentUser;

    // Firebase yêu cầu xác thực lại nếu muốn đổi pass
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, oldP);
    try {
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newP);
        alert("Đổi mật khẩu thành công!");
    } catch (err) {
        alert("Lỗi: Mật khẩu cũ không chính xác!");
    }
}

// Hiển thị hồ sơ khi đăng nhập
auth.onAuthStateChanged(u => {
    if(u) {
        document.getElementById('user-status').innerHTML = `<button onclick="showProfile()">Hồ sơ của ${u.email.split('@')[0]}</button>`;
        document.getElementById('auth-forms').style.display = 'none';
        document.getElementById('p-name').innerText = u.email;
        document.getElementById('p-created').innerText = new Date(u.metadata.creationTime).toLocaleDateString('vi-VN');
    }
});

function showProfile() {
    const p = document.getElementById('profile-section');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

function finish() {
    const wpm = Math.round(cWords);
    alert("Kết thúc! WPM của bạn: " + wpm);
    if(auth.currentUser) updateBestScore(wpm);
    init();
}

async function updateBestScore(newWpm) {
    const u = auth.currentUser;
    const userRef = db.collection("leaderboard").doc(u.uid);
    const doc = await userRef.get();
    if (!doc.exists || newWpm > doc.data().wpm) {
        await userRef.set({
            name: u.email.split('@')[0], wpm: newWpm, code: userLoc, 
            lang: currentLang === 'vi' ? "Vietnamese" : "English", date: Date.now()
        });
    }
    loadBoard();
}

async function loadBoard() {
    const snap = await db.collection("leaderboard").orderBy("wpm", "desc").limit(10).get();
    let h = ""; let top = 1;
    snap.forEach(doc => {
        const d = doc.data();
        h += `<tr><td>${top++}</td><td>${d.name}</td><td>${d.wpm}</td><td><img src="https://flagcdn.com/20x15/${d.code}.png"></td><td>${d.lang}</td><td>Vừa xong</td></tr>`;
    });
    document.getElementById('leaderboard-body').innerHTML = h;
}

async function handleAuth(t) {
    const e = document.getElementById(t === 'login' ? 'l-email' : 'r-email').value;
    const p = document.getElementById(t === 'login' ? 'l-pass' : 'r-pass').value;
    try {
        if(t === 'signup') await auth.createUserWithEmailAndPassword(e, p);
        else await auth.signInWithEmailAndPassword(e, p);
        location.reload();
    } catch (err) { alert(err.message); }
}

function changeLang(l) { currentLang = l; init(); }
function resetGame() { init(); }
init(); loadBoard();
