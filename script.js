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

const wordsBank = {
    vi: ["thành", "tập", "lực", "trình", "tốc", "nỗ", "bàn", "nam", "học", "máy", "phím", "sáng", "công", "việt"],
    en: ["challenge", "standard", "keyboard", "practice", "success", "future", "develop", "system", "typing"]
};

let currentLang = 'vi', words = [], idx = 0, timer = 60, isPlaying = false, interval;
let cWords = 0, tKeys = 0, cKeys = 0, userLoc = "vn";

// Lấy quốc gia
fetch('https://ipapi.co/json/').then(r => r.json()).then(d => userLoc = d.country_code.toLowerCase());

function init() {
    words = Array.from({length: 100}, () => wordsBank[currentLang][Math.floor(Math.random() * wordsBank[currentLang].length)]);
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
    document.getElementById('res-wpm').innerText = wpm + " WPM";
    document.getElementById('word-input').disabled = true;
    
    const u = auth.currentUser;
    if(u) {
        document.getElementById('res-msg').innerText = "✓ Đang kiểm tra kỉ lục...";
        updateBestScore(wpm);
    } else {
        document.getElementById('res-msg').innerText = "⚠ Đăng nhập để lưu điểm!";
    }
    document.getElementById('res-modal').style.display = 'flex';
}

async function updateBestScore(newWpm) {
    const u = auth.currentUser;
    const userRef = db.collection("leaderboard").doc(u.uid);
    const doc = await userRef.get();

    if (doc.exists) {
        if (newWpm > doc.data().wpm) {
            await userRef.update({ wpm: newWpm, date: Date.now(), lang: currentLang === 'vi' ? "Vietnamese" : "English" });
        }
    } else {
        await userRef.set({
            name: u.email.split('@')[0],
            wpm: newWpm,
            code: userLoc,
            lang: currentLang === 'vi' ? "Vietnamese" : "English",
            date: Date.now()
        });
    }
    loadBoard();
}

function timeAgo(date) {
    const sec = Math.floor((new Date() - date) / 1000);
    if (sec < 60) return "vừa xong";
    if (sec < 3600) return Math.floor(sec/60) + " phút trước";
    return Math.floor(sec/3600) + " giờ trước";
}

async function loadBoard() {
    const snap = await db.collection("leaderboard").orderBy("wpm", "desc").limit(10).get();
    let h = "";
    let top = 1;
    snap.forEach(doc => {
        const d = doc.data();
        h += `<tr>
            <td>${top++}</td>
            <td>${d.name}</td>
            <td style="color:#5cb85c">${d.wpm}</td>
            <td><img src="https://flagcdn.com/20x15/${d.code}.png"></td>
            <td>${d.lang}</td>
            <td style="font-size:11px; color:#999">${timeAgo(d.date)}</td>
        </tr>`;
    });
    document.getElementById('leaderboard-body').innerHTML = h;
}

// Auth Logic
async function handleAuth(t) {
    const e = document.getElementById(t === 'login' ? 'login-email' : 'reg-email').value;
    const p = document.getElementById(t === 'login' ? 'login-pass' : 'reg-pass').value;
    try {
        if(t === 'signup') await auth.createUserWithEmailAndPassword(e, p);
        else await auth.signInWithEmailAndPassword(e, p);
        location.reload();
    } catch (err) { alert(err.message); }
}

auth.onAuthStateChanged(u => {
    if(u) {
        document.getElementById('user-info').innerHTML = `<span>Hi, ${u.email.split('@')[0]}</span> <button onclick="auth.signOut().then(()=>location.reload())">Thoát</button>`;
        document.getElementById('auth-forms').style.display = 'none';
    }
});

function changeLang(l) { currentLang = l; init(); }
function resetGame() { init(); }
function closeModal() { document.getElementById('res-modal').style.display = 'none'; resetGame(); }

init(); loadBoard();
