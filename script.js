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

// Danh sách từ vựng Tiếng Việt
const words = ["kiên trì", "nỗ lực", "thành công", "sáng tạo", "việt nam", "công nghệ", "lập trình", "tốc độ", "bàn phím", "thương hiệu"];
let timer = 60, isPlaying = false, score = 0, interval;
let userCountry = "Việt Nam", userCode = "vn";

// Lấy quốc gia tự động
fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
    userCountry = d.country_name === "Vietnam" ? "Việt Nam" : d.country_name;
    userCode = d.country_code.toLowerCase();
});

function renderWords() {
    const random = Array.from({length: 8}, () => words[Math.floor(Math.random() * words.length)]);
    document.getElementById('word-display').innerText = random.join(" ");
}

document.getElementById('word-input').addEventListener('input', (e) => {
    if(!isPlaying) { isPlaying = true; startTimer(); }
    const val = e.target.value.trim();
    const current = document.getElementById('word-display').innerText.split(" ")[0];
    if(val === current) {
        score += val.length;
        e.target.value = "";
        renderWords();
        document.getElementById('wpm').innerText = Math.round((score/5) / ((60-timer)/60) || 0);
    }
});

function startTimer() {
    interval = setInterval(() => {
        timer--;
        document.getElementById('timer').innerText = timer;
        if(timer <= 0) {
            clearInterval(interval);
            isPlaying = false;
            saveScore();
        }
    }, 1000);
}

async function saveScore() {
    const u = auth.currentUser;
    const w = parseInt(document.getElementById('wpm').innerText);
    if(u && w > 0) {
        await db.collection("leaderboard").add({
            name: u.email.split('@')[0],
            wpm: w,
            country: userCountry,
            code: userCode,
            time: Date.now()
        });
        alert("Đã lưu điểm thành công!");
        loadBoard();
    } else { alert("Hết giờ! Đăng nhập để lưu điểm nhé."); }
}

async function loadBoard() {
    const snap = await db.collection("leaderboard").orderBy("wpm", "desc").limit(10).get();
    let html = "";
    snap.forEach((doc, i) => {
        const d = doc.data();
        // Hiển thị cờ quốc gia bằng link ảnh
        const flag = `https://flagcdn.com/20x15/${d.code}.png`;
        html += `<tr><td>${i+1}</td><td>${d.name}</td><td>${d.wpm}</td><td><img src="${flag}"> ${d.country}</td></tr>`;
    });
    document.getElementById('leaderboard-body').innerHTML = html;
}

renderWords();
loadBoard();
