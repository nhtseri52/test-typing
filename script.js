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
    vi: ["mình", "tin", "đất", "cổ", "tích", "dũng", "sinh", "định", "phải", "gió", "chim", "bướm", "hạt", "tên", "hãy", "khoa", "phố", "thanh", "niên", "trả", "anh", "đường", "vui"],
    en: ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "typing", "speed", "test", "coding", "future", "world", "light", "space", "star"]
};

let currentLang = 'vi', wordsList = [], wordIdx = 0, timer = 60;
let isPlaying = false, interval, correctKeys = 0, totalKeys = 0, correctCount = 0, wrongCount = 0;
let countryInfo = { name: "Việt Nam", code: "vn" };

fetch('https://ipapi.co/json/').then(r => r.json()).then(d => { countryInfo = { name: d.country_name, code: d.country_code.toLowerCase() }; });

function init() {
    wordsList = Array.from({length: 150}, () => wordsBank[currentLang][Math.floor(Math.random() * wordsBank[currentLang].length)]);
    wordIdx = 0; timer = 60; isPlaying = false; 
    correctCount = 0; wrongCount = 0; correctKeys = 0; totalKeys = 0;
    clearInterval(interval);
    document.getElementById('timer-box').innerText = "1:00";
    document.getElementById('word-input').disabled = false;
    document.getElementById('word-input').value = "";
    render();
}

function render() {
    const container = document.getElementById('word-display');
    container.innerHTML = wordsList.map((w, i) => `<span id="word-${i}">${w}</span>`).join(" ");
    document.getElementById(`word-0`).className = "current";
}

document.getElementById('word-input').addEventListener('input', (e) => {
    if(!isPlaying) { isPlaying = true; startTimer(); }
    const val = e.target.value;
    totalKeys++;

    if(val.endsWith(" ")) {
        const typed = val.trim();
        const target = wordsList[wordIdx];
        const el = document.getElementById(`word-${wordIdx}`);

        if(typed === target) {
            el.className = "correct";
            correctCount++;
            correctKeys += target.length + 1;
        } else {
            el.className = "wrong";
            wrongCount++;
        }
        
        wordIdx++;
        e.target.value = "";
        document.getElementById(`word-${wordIdx}`).className = "current";
        // Logic cuộn dòng giống 10FastFingers
        if(el.offsetTop < document.getElementById(`word-${wordIdx}`).offsetTop) {
            document.querySelectorAll('.correct, .wrong').forEach(node => node.style.display = 'none');
        }
    }
});

function startTimer() {
    interval = setInterval(() => {
        timer--;
        document.getElementById('timer-box').innerText = `0:${timer < 10 ? '0'+timer : timer}`;
        if(timer <= 0) stopGame();
    }, 1000);
}

function stopGame() {
    clearInterval(interval);
    document.getElementById('word-input').disabled = true;
    const wpm = Math.round(correctCount);
    const acc = Math.round((correctKeys / totalKeys) * 100) || 0;
    
    document.getElementById('final-wpm').innerText = wpm;
    document.getElementById('final-acc').innerText = acc + "%";
    document.getElementById('total-keys').innerText = totalKeys;
    document.getElementById('correct-words').innerText = correctCount;
    document.getElementById('wrong-words').innerText = wrongCount;
    document.getElementById('result-overlay').style.display = 'flex';
    
    save(wpm);
}

// Chức năng Auth & Bảng xếp hạng
async function save(wpm) {
    const u = auth.currentUser;
    if(u && wpm > 0) {
        await db.collection("leaderboard").add({
            name: u.email.split('@')[0], wpm: wpm, code: countryInfo.code, date: Date.now()
        });
        load();
    }
}

async function load() {
    const snap = await db.collection("leaderboard").orderBy("wpm", "desc").limit(10).get();
    let h = "";
    snap.forEach((doc, i) => {
        const d = doc.data();
        h += `<tr><td>${i+1}</td><td>${d.name}</td><td>${d.wpm}</td><td><img src="https://flagcdn.com/16x12/${d.code}.png"></td></tr>`;
    });
    document.getElementById('leaderboard-data').innerHTML = h;
}

function setLang(l) { currentLang = l; document.getElementById('btn-vi').className = l === 'vi' ? 'active' : ''; document.getElementById('btn-en').className = l === 'en' ? 'active' : ''; init(); }
function openAuth() { document.getElementById('auth-modal').style.display = 'flex'; }
function closeAuth() { document.getElementById('auth-modal').style.display = 'none'; }
function closeResult() { document.getElementById('result-overlay').style.display = 'none'; init(); }
async function handleAuth(t) {
    const e = document.getElementById('email').value, p = document.getElementById('password').value;
    try {
        if(t === 'signup') await auth.createUserWithEmailAndPassword(e, p);
        else await auth.signInWithEmailAndPassword(e, p);
        document.getElementById('user-status').innerText = e;
        closeAuth();
    } catch (err) { alert(err.message); }
}

init(); load();
