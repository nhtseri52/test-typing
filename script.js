// Copy và dán đoạn này lên đầu file script.js
const firebaseConfig = { 
  apiKey: "AIzaSyCrgepkYAgTAniQBrDRRqis470Aea6Stk4", 
  authDomain: "speedtype-pro-f0b75.firebaseapp.com", 
  projectId: "speedtype-pro-f0b75", 
  storageBucket: "speedtype-pro-f0b75.firebasestorage.app", 
  messagingSenderId: "121414853341", 
  appId: "1:121414853341:web:504c3f9f36b03329cfb134" 
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Biến lưu quốc gia toàn cục
let userCountry = "Unknown";
let userCountryCode = "un";

// Hàm lấy quốc gia tự động
async function getGeo() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        userCountry = data.country_name;
        userCountryCode = data.country_code.toLowerCase();
    } catch (e) { console.error("Lỗi lấy quốc gia"); }
}
getGeo();
}

renderWords();
