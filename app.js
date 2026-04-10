const translations = {
    en: {
        titleText: "Live Hub", lobbyNameDesc: "Your Name:", namePlaceholder: "Enter your name...",
        btnCreate: "Start New Meeting", roomPlaceholder: "Meeting ID or Link...", btnJoin: "Join Meeting",
        nameRequired: "Please enter your name first!", roomRequired: "Please enter a Meeting ID!"
    },
    tr: {
        titleText: "Live Hub", lobbyNameDesc: "Adınız:", namePlaceholder: "Adınızı girin...",
        btnCreate: "Yeni Toplantı Başlat", roomPlaceholder: "Toplantı ID veya Linki...", btnJoin: "Toplantıya Katıl",
        nameRequired: "Lütfen önce adınızı girin!", roomRequired: "Lütfen Toplantı ID'si girin!"
    }
};

let currentLang = localStorage.getItem('appLang') || 'en';

function applyLanguage() {
    const t = translations[currentLang];
    document.getElementById('titleText').innerText = t.titleText;
    document.getElementById('lobbyNameDesc').innerText = t.lobbyNameDesc;
    document.getElementById('usernameInput').placeholder = t.namePlaceholder;
    document.getElementById('btnCreateText').innerText = t.btnCreate;
    document.getElementById('roomInput').placeholder = t.roomPlaceholder;
    document.getElementById('btnJoinText').innerText = t.btnJoin;
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'tr' : 'en';
    localStorage.setItem('appLang', currentLang);
    applyLanguage();
}

// URL'de oda linki varsa otomatik doldur
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('room')) {
    document.getElementById('roomInput').value = urlParams.get('room');
}

// ODA KUR (HOST)
document.getElementById('createMeetingBtn').addEventListener('click', () => {
    const name = document.getElementById('usernameInput').value.trim();
    if (!name) return alert(translations[currentLang].nameRequired);

    // Rastgele bir oda ID'si oluştur (WebRTC uyumlu basit ID)
    const roomId = 'hub-' + Math.random().toString(36).substr(2, 9);
    
    sessionStorage.setItem('hubUsername', name);
    sessionStorage.setItem('hubIsHost', 'true');
    window.location.href = `room.html?room=${roomId}`;
});

// ODAYA KATIL (GUEST)
document.getElementById('joinMeetingBtn').addEventListener('click', () => {
    const name = document.getElementById('usernameInput').value.trim();
    if (!name) return alert(translations[currentLang].nameRequired);

    let roomId = document.getElementById('roomInput').value.trim();
    if (!roomId) return alert(translations[currentLang].roomRequired);
    if (roomId.includes('?room=')) roomId = roomId.split('?room=')[1];

    sessionStorage.setItem('hubUsername', name);
    sessionStorage.setItem('hubIsHost', 'false');
    window.location.href = `room.html?room=${roomId}`;
});

applyLanguage();
