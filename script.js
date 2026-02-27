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

let words = ["độc", "lập", "tự", "do", "hạnh", "phúc", "công", "nghệ", "bàn", "phím", "tốc", "độ", "thách", "thức"];
let timer = 60, isPlaying = false, score = 0, interval;
let userCountry = "Unknown", userCountryCode = "vn";

// Lấy quốc gia
fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
    userCountry = d.country_name;
    userCountryCode = d.country_code.toLowerCase();
});

// Auth
async function handleAuth(type) {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        if(type === 'signup') await auth.createUserWithEmailAndPassword(email, pass);
        else await auth.signInWithEmailAndPassword(email, pass);
        document.getElementById('user-info').innerText = "Chào: " + email;
    } catch (e) { alert(e.message); }
}

// Game Logic
function renderWords() {
    const random = Array.from({length: 10}, () => words[Math.floor(Math.random() * words.length)]);
    document.getElementById('word-display').innerText = random.join(" ");
}

document.getElementById('word-input').addEventListener('input', (e) => {
    if(!isPlaying) { isPlaying = true; startTimer(); }
    const input = e.target.value.trim();
    const display = document.getElementById('word-display').innerText.split(" ")[0];

    if(input === display) {
        score += input.length;
        e.target.value = "";
        renderWords();
        document.getElementById('wpm').innerText = Math.round((score/5) / ((60-timer)/60) || 0);
    }
});

function startTimer() {
    interval = setInterval(() => {
        timer--;
        document.getElementById('timer').innerText = timer;
        if(timer === 0) {
            clearInterval(interval);
            isPlaying = false;
            saveScore();
        }
    }, 1000);
}

async function saveScore() {
    const user = auth.currentUser;
    const finalWpm = parseInt(document.getElementById('wpm').innerText);
    if(user && finalWpm > 0) {
        await db.collection("leaderboard").add({
            email: user.email,
            wpm: finalWpm,
            country: userCountry,
            code: userCountryCode,
            time: Date.now()
        });
        loadLeaderboard();
    }
}

async function loadLeaderboard() {
    const snapshot = await db.collection("leaderboard").orderBy("wpm", "desc").limit(10).get();
    let html = "";
    snapshot.forEach((doc, i) => {
        const d = doc.data();
        html += `<tr><td>${i+1}</td><td>${d.email}</td><td>${d.wpm}</td><td>${d.country} 🏳️</td></tr>`;
    });
    document.getElementById('leaderboard-body').innerHTML = html;
}

renderWords();
loadLeaderboard();
