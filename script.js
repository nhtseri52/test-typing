const wordsVN = ["con", "mèo", "trèo", "cây", "cau", "hỏi", "thăm", "ông", "chuột", "đi", "đâu", "vắng", "nhà"];
const wordsEN = ["the", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog", "typing", "speed", "test"];

let currentWords = wordsVN;
let timer = 60;
let score = 0;
let isPlaying = false;
let userCountry = "VN";

// 1. Tự động lấy quốc gia khi vào web
fetch('https://ipapi.co/json/')
    .then(res => res.json())
    .then(data => {
        userCountry = data.country_code;
        console.log("User đến từ:", userCountry);
    });

function setLanguage(lang) {
    currentWords = (lang === 'vi') ? wordsVN : wordsEN;
    resetGame();
}

function renderWords() {
    const randomWords = [];
    for(let i=0; i<10; i++) {
        randomWords.push(currentWords[Math.floor(Math.random() * currentWords.length)]);
    }
    document.getElementById('word-display').innerText = randomWords.join(" ");
}

// 2. Logic tính WPM đơn giản
document.getElementById('word-input').addEventListener('input', (e) => {
    if(!isPlaying) {
        startTimer();
        isPlaying = true;
    }
    // (Logic kiểm tra từ đúng/sai sẽ viết thêm ở đây)
});

function startTimer() {
    let interval = setInterval(() => {
        timer--;
        document.getElementById('timer').innerText = timer;
        if(timer === 0) {
            clearInterval(interval);
            alert("Hết giờ! Quốc gia của bạn: " + userCountry);
            // Sau này gọi hàm lưu điểm vào Firebase ở đây
        }
    }, 1000);
}

renderWords();
