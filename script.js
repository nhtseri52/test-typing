// Cấu hình Firebase của ông (Giữ nguyên config cũ của ông ở đây)
const firebaseConfig = { 
  apiKey: "AIzaSyCrgepkYAgTAniQBrDRRqis470Aea6Stk4", 
  authDomain: "speedtype-pro-f0b75.firebaseapp.com", 
  projectId: "speedtype-pro-f0b75", 
  storageBucket: "speedtype-pro-f0b75.firebasestorage.app", 
  messagingSenderId: "121414853341", 
  appId: "1:121414853341:web:504c3f9f36b03329cfb134" 
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Hàm tính thời gian cách đây (Time Ago)
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + " năm trước";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " tháng trước";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " ngày trước";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " giờ trước";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " phút trước";
    return "vừa xong";
}

// Logic lưu điểm có kiểm tra kỉ lục cũ
async function saveToDB(wpm) {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = db.collection("leaderboard").doc(user.uid);
    const doc = await userRef.get();

    if (doc.exists) {
        const oldRecord = doc.data().wpm;
        if (wpm > oldRecord) {
            await userRef.update({
                wpm: wpm,
                lang: currentLang === 'vi' ? "Vietnamese" : "English",
                date: Date.now(),
                code: userLoc.code
            });
            console.log("Đã phá kỉ lục!");
        } else {
            console.log("Không cao hơn kỉ lục cũ, không cập nhật.");
        }
    } else {
        // Nếu chưa bao giờ có điểm thì tạo mới
        await userRef.set({
            name: user.email.split('@')[0],
            wpm: wpm,
            lang: currentLang === 'vi' ? "Vietnamese" : "English",
            date: Date.now(),
            code: userLoc.code
        });
    }
    loadBoard();
}

// Hàm load bảng xếp hạng chuyên nghiệp
async function loadBoard() {
    const snap = await db.collection("leaderboard")
                       .orderBy("wpm", "desc")
                       .limit(10)
                       .get();
    
    let html = "";
    let top = 1;
    snap.forEach((doc) => {
        const d = doc.data();
        html += `
            <tr>
                <td><b>${top++}</b></td>
                <td>${d.name}</td>
                <td><span style="color:#5cb85c; font-weight:bold">${d.wpm}</span></td>
                <td><img class="flag-icon" src="https://flagcdn.com/w20/${d.code}.png" title="${d.code}"></td>
                <td>${d.lang}</td>
                <td class="time-ago">${timeAgo(d.date)}</td>
            </tr>`;
    });
    document.getElementById('leaderboard-body').innerHTML = html;
}

// Các phần logic gõ phím, init() và Modal ông giữ nguyên từ câu trả lời trước của tôi nhé.
// Chỉ cần thay thế hàm saveToDB và loadBoard bằng bản này là xong.
