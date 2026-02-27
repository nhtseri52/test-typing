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
    vi: ["mình", "tin", "đất", "hay", "sinh", "gió", "chim", "bướm", "hạt", "tên", "hãy", "khoa", "phố", "thanh", "niên", "trả", "anh", "đường", "vui", "mới", "lòng", "sông"],
    en: ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "typing", "speed", "test", "coding", "world", "light", "space", "star", "time", "work", "life"]
};

let currentLang = 'vi', words = [], idx = 0, timer = 60, isPlaying = false, interval;
let cWords = 0, wWords = 0, cKeys = 0, tKeys = 0;
let userLoc = { name: "Việt Nam", code: "vn" };

fetch('https://ipapi.co/json/').then(r => r.json()).then(d => { userLoc = { name: d.country_name, code: d.country_code.toLowerCase() }; });

function init() {
    words = Array.from({length: 200}, () => dict[currentLang][Math.floor(Math.random() * dict[currentLang].length)]);
    idx = 0; timer = 60; isPlaying = false; cWords = 0; wWords = 0; cKeys = 0; tKeys = 0;
    clearInterval(interval);
    document.getElementById('timer').innerText = "1:00";
    document.getElementById('word-input').disabled = false;
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
    const val = e.target.value;
    tKeys++;

    if(val.endsWith(" ")) {
        const typed = val.trim();
        const target = words[idx];
        const el = document.getElementById(`w-${idx}`);

        if(typed === target) {
            el.className = "correct";
            cWords++;
            cKeys += target.length + 1;
        } else {
            el.className = "wrong";
            wWords++;
        }
        
        idx++;
        e.target.value = "";
        const next = document.getElementById(`w-${idx}`);
        next.className = "active";
        // Tự cuộn dòng
        if(el.offsetTop < next.offsetTop) {
            document.querySelectorAll('.correct, .wrong').forEach(n => n.style.display = 'none');
        }
    }
});

function startTimer() {
    interval = setInterval(() => {
        timer--;
        document.getElementById('timer').innerText = `0:${timer < 10 ? '0'+timer : timer}`;
        if(timer <= 0) {
            clearInterval(interval);
            showResult();
        }
    }, 1000);
}

function showResult() {
    const wpm = Math.round(cWords);
    const acc = Math.round((cKeys / tKeys) * 100) || 0;
    document.getElementById('res-wpm').innerText = wpm;
    document.getElementById('res-acc').innerText = acc + "%";
    document.getElementById('res-keys').innerText = tKeys;
    document.getElementById('res-correct').innerText = cWords;
    document.getElementById('res-wrong').innerText = wWords;
    document.getElementById('result-popup').style.display = 'flex';
    document.getElementById('word-input').disabled = true;
    saveScore(wpm);
}

function changeLang(l) { 
    currentLang = l; 
    document.getElementById('lang-vi').classList.toggle('active', l === 'vi');
    document.getElementById('lang-en').classList.toggle('active', l === 'en');
    init(); 
}

async function saveScore(wpm) {
    const u = auth.currentUser;
    if(u && wpm > 0) {
        await db.collection("leaderboard").add({
            name: u.email.split('@')[0], wpm: wpm, code: userLoc.code, date: Date.now()
        });
        loadBoard();
    }
}

async function loadBoard() {
    const snap = await db.collection("leaderboard").orderBy("wpm", "desc").limit(5).get();
    let h = "";
    snap.forEach((doc, i) => {
        const d = doc.data();
        h += `<tr><td>${i+1}</td><td>${d.name}</td><td>${d.wpm}</td><td><img src="https://flagcdn.com/16x12/${d.code}.png"></td></tr>`;
    });
    document.getElementById('leaderboard-body').innerHTML = h;
}

function toggleAuth() { const m = document.getElementById('auth-modal'); m.style.display = m.style.display === 'flex' ? 'none' : 'flex'; }
function closeResult() { document.getElementById('result-popup').style.display = 'none'; init(); }
function resetGame() { init(); }

async function handleAuth(type) {
    const e = document.getElementById('email').value, p = document.getElementById('password').value;
    try {
        if(type === 'signup') await auth.createUserWithEmailAndPassword(e, p);
        else await auth.signInWithEmailAndPassword(e, p);
        document.getElementById('display-name').innerText = e;
        toggleAuth();
    } catch (err) { alert(err.message); }
}

init(); loadBoard();
