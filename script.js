// Giữ nguyên config Firebase của ông ở đây
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

const dict = {
    vi: ["học", "tập", "nỗ", "lực", "thành", "công", "sáng", "tạo", "việt", "nam", "bàn", "phím", "tốc", "độ", "máy", "tính", "lập", "trình"],
    en: ["challenge", "standard", "keyboard", "practice", "success", "future", "develop", "system", "typing", "professional", "logic"]
};

let currentLang = 'vi', words = [], idx = 0, timer = 60, isPlaying = false, interval;
let cWords = 0, tKeys = 0, cKeys = 0;
let userLoc = { code: "vn" };

fetch('https://ipapi.co/json/').then(r => r.json()).then(d => { userLoc.code = d.country_code.toLowerCase(); });

function init() {
    words = Array.from({length: 150}, () => dict[currentLang][Math.floor(Math.random() * dict[currentLang].length)]);
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
        next.className = "active";
        if(el.offsetTop < next.offsetTop) {
            document.querySelectorAll('.correct, .wrong').forEach(n => n.style.display = 'none');
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
    const acc = Math.round((cKeys / tKeys) * 100) || 0;
    document.getElementById('res-wpm').innerText = wpm;
    document.getElementById('res-acc').innerText = acc + "%";
    document.getElementById('word-input').disabled = true;
    
    const u = auth.currentUser;
    if(u) {
        document.getElementById('save-msg').innerText = "✓ Kết quả đã được lưu!";
        saveToDB(wpm);
    } else {
        document.getElementById('save-msg').innerText = "⚠ Đăng nhập để lên Bảng xếp hạng!";
    }
    openModal('result-modal');
}

async function saveToDB(wpm) {
    await db.collection("leaderboard").add({
        name: auth.currentUser.email.split('@')[0],
        wpm: wpm,
        code: userLoc.code,
        lang: currentLang === 'vi' ? "Vietnamese" : "English",
        date: Date.now()
    });
    loadBoard();
}

async function loadBoard() {
    const snap = await db.collection("leaderboard").orderBy("wpm", "desc").limit(10).get();
    let h = "";
    snap.forEach((doc, i) => {
        const d = doc.data();
        h += `<tr>
            <td>${i+1}</td>
            <td>${d.name}</td>
            <td>${d.wpm}</td>
            <td><img src="https://flagcdn.com/20x15/${d.code}.png"></td>
            <td>${d.lang}</td>
        </tr>`;
    });
    document.getElementById('leaderboard-body').innerHTML = h;
}

// UI Helpers
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function changeLang(l) { 
    currentLang = l; 
    document.getElementById('lang-vi').classList.toggle('active', l === 'vi');
    document.getElementById('lang-en').classList.toggle('active', l === 'en');
    init(); 
}

async function handleAuth(type) {
    const email = type === 'login' ? document.getElementById('login-email').value : document.getElementById('reg-email').value;
    const pass = type === 'login' ? document.getElementById('login-pass').value : document.getElementById('reg-pass').value;
    try {
        if(type === 'signup') await auth.createUserWithEmailAndPassword(email, pass);
        else await auth.signInWithEmailAndPassword(email, pass);
        location.reload();
    } catch (e) { alert(e.message); }
}

auth.onAuthStateChanged(u => {
    if(u) {
        document.getElementById('auth-status').innerHTML = `<span>Hi, ${u.email.split('@')[0]}</span> <button onclick="auth.signOut().then(()=>location.reload())">Thoát</button>`;
    }
});

init(); loadBoard();
