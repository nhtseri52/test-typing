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

const words = ["mình", "tin", "đất", "hay", "cổ", "tích", "dũng", "sinh", "định", "phải", "gió", "chim", "bướm", "hạt", "tên", "hãy", "khoa", "phố", "thanh", "niên", "mà", "lại", "đi", "trả"];
let currentWords = [];
let timer = 60, isPlaying = false, score = 0, interval;
let userCountry = "Việt Nam", userCode = "vn";

fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
    userCountry = d.country_name;
    userCode = d.country_code.toLowerCase();
});

function initGame() {
    currentWords = Array.from({length: 40}, () => words[Math.floor(Math.random() * words.length)]);
    renderWords();
}

function renderWords() {
    const box = document.getElementById('word-box');
    box.innerHTML = currentWords.map((w, i) => `<span id="word-${i}">${w}</span>`).join(" ");
    document.getElementById(`word-0`).classList.add('current-word');
}

let wordIndex = 0;
document.getElementById('word-input').addEventListener('input', (e) => {
    if(!isPlaying) { isPlaying = true; startTimer(); }
    
    const input = e.target.value;
    if (input.endsWith(" ")) {
        const typedWord = input.trim();
        const targetWord = currentWords[wordIndex];
        const wordElement = document.getElementById(`word-${wordIndex}`);

        if (typedWord === targetWord) {
            wordElement.className = 'correct';
            score += targetWord.length;
        } else {
            wordElement.className = 'incorrect';
        }

        wordIndex++;
        e.target.value = "";
        if (document.getElementById(`word-${wordIndex}`)) {
            document.getElementById(`word-${wordIndex}`).classList.add('current-word');
        }
    }
});

function startTimer() {
    interval = setInterval(() => {
        timer--;
        document.getElementById('timer').innerText = `0:${timer < 10 ? '0'+timer : timer}`;
        if(timer <= 0) {
            clearInterval(interval);
            isPlaying = false;
            document.getElementById('word-input').disabled = true;
            saveScore();
        }
    }, 1000);
}

async function handleAuth(type) {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    try {
        if(type === 'signup') await auth.createUserWithEmailAndPassword(e, p);
        else await auth.signInWithEmailAndPassword(e, p);
        alert("Thành công!");
    } catch (err) { alert(err.message); }
}

async function saveScore() {
    const u = auth.currentUser;
    const wpm = Math.round((score/5));
    if(u) {
        await db.collection("leaderboard").add({
            name: u.email.split('@')[0],
            wpm: wpm,
            country: userCountry,
            code: userCode,
            date: Date.now()
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

document.getElementById('reset-btn').onclick = () => location.reload();
initGame();
loadBoard();
