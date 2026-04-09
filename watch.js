// --- DİL SÖZLÜĞÜ (TRANSLATIONS) ---
const translations = {
    en: {
        viewers: "Viewers",
        connecting: "Connecting to stream...",
        waiting: "Waiting for broadcaster...",
        ended: "The stream has ended.",
        errorLink: "Invalid or missing stream link!",
        offline: "Broadcaster is offline or stream ended."
    },
    tr: {
        viewers: "İzleyici",
        connecting: "Yayına bağlanılıyor...",
        waiting: "Yayıncı bekleniyor...",
        ended: "Yayın sona erdi.",
        errorLink: "Hatalı veya eksik yayın linki!",
        offline: "Yayıncıya ulaşılamadı veya yayın bitti."
    }
};

let currentLang = localStorage.getItem('appLang') || 'en';
let currentStatusKey = 'connecting'; // Ekrandaki yazının anlık durumunu tutar

const remoteVideo = document.getElementById('remoteVideo');
const statusTextElement = document.getElementById('statusText');
const viewerBadge = document.getElementById('viewerBadge');

// --- DİLİ UYGULA ---
function applyLanguage() {
    const t = translations[currentLang];
    
    // İzleyici kelimesini çevir
    document.querySelectorAll('.lang-viewers').forEach(el => el.innerText = t.viewers);
    
    // Anlık durum metnini çevir (Eğer ekranda görünüyorsa)
    if (statusTextElement.style.display !== 'none') {
        statusTextElement.innerText = t[currentStatusKey];
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'tr' : 'en';
    localStorage.setItem('appLang', currentLang);
    applyLanguage();
}

// Durum metnini değiştiren ve çevirisini ayarlayan yardımcı fonksiyon
function setStatus(key, isError = false) {
    currentStatusKey = key;
    statusTextElement.innerText = translations[currentLang][key];
    statusTextElement.style.display = 'block';
    if (isError) {
        statusTextElement.style.color = '#ef4444'; // Kırmızı hata rengi
    } else {
        statusTextElement.style.color = '#cbd5e1'; // Normal gri renk
    }
}

// URL'den Oda ID'sini Al
const urlParams = new URLSearchParams(window.location.search);
const broadcasterId = urlParams.get('room');

if (!broadcasterId) {
    setStatus('errorLink', true);
} else {
    setStatus('connecting');

    const peer = new Peer();

    peer.on('open', () => {
        setStatus('waiting');
        
        // 1. Veri Bağlantısı (İzleyici Sayısı İçin)
        const conn = peer.connect(broadcasterId);
        
        conn.on('data', (data) => {
            if (data.type === 'VIEWER_COUNT') {
                viewerBadge.style.display = 'flex';
                document.getElementById('viewerNumber').innerText = data.count;
            }
        });

        conn.on('close', () => {
            setStatus('ended');
            viewerBadge.style.display = 'none';
            remoteVideo.srcObject = null;
        });
    });

    // 2. Medya Bağlantısı (Görüntü İçin)
    peer.on('call', (call) => {
        call.answer(); // Gelen yayını kabul et
        
        call.on('stream', (remoteStream) => {
            remoteVideo.srcObject = remoteStream;
            // Yayın başladığında durum yazısını gizle
            statusTextElement.style.display = 'none'; 
        });
    });

    peer.on('error', (err) => {
        console.error(err);
        setStatus('offline', true);
        viewerBadge.style.display = 'none';
    });
}

// Sayfa ilk yüklendiğinde dili uygula
applyLanguage();
