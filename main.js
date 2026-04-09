const videoElement = document.getElementById('liveVideo');
const setupPanel = document.getElementById('setupPanel');
const streamSourceSelect = document.getElementById('streamSource');
const startBtn = document.getElementById('startBtn');
const linkContainer = document.getElementById('linkContainer');
const shareLinkInput = document.getElementById('shareLink');

const controlsPanel = document.getElementById('controlsPanel');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const stopStreamBtn = document.getElementById('stopStreamBtn');
const viewerBadge = document.getElementById('viewerBadge');

let localStream;
let peer;
let activeDataConnections = []; // İzleyici sayı mesajları için
let activeMediaCalls = [];      // Görüntü aktarımları için (kamera çevirirken lazım)
let currentFacingMode = "user"; // "user" = ön kamera, "environment" = arka kamera
let currentMode = "camera";     // "camera" veya "screen"

// --- İZLEYİCİ SAYISINI GÜNCELLE ---
function updateViewerCount() {
    const count = activeDataConnections.length;
    viewerBadge.innerText = `👁️ ${count} İzleyici`;
    activeDataConnections.forEach(conn => {
        if (conn.open) conn.send({ type: 'VIEWER_COUNT', count: count });
    });
}

// --- YAYINI BAŞLATMA ---
async function startStream() {
    startBtn.disabled = true;
    startBtn.innerText = "Hazırlanıyor...";
    currentMode = streamSourceSelect.value;

    try {
        if (currentMode === "camera") {
            // KAMERA YAYINI
            const constraints = { video: { facingMode: currentFacingMode }, audio: true };
            try {
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                // Özel ayar tutmazsa standart kamera iste
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            }
            switchCameraBtn.style.display = 'inline-block'; // Kamera çevir butonunu göster
        } else {
            // EKRAN PAYLAŞIMI YAYINI
            try {
                localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            } catch (err) {
                // Bazı tarayıcılar ekran paylaşımında ses desteklemez, sadece video deneriz
                localStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            }
            switchCameraBtn.style.display = 'none'; // Ekran paylaşımında kamerayı çevir gizle
        }

        videoElement.srcObject = localStream;
        peer = new Peer(); 

        peer.on('open', (id) => {
            const watchUrl = `https://mealiso.github.io/live-hub/watch.html?room=${id}`;
            shareLinkInput.value = watchUrl;
            
            setupPanel.style.display = 'none'; // Ayarları gizle
            linkContainer.style.display = 'block';
            controlsPanel.style.display = 'flex'; 
            viewerBadge.style.display = 'block';
        });

        peer.on('connection', (conn) => {
            // Veri (mesajlaşma) bağlantısı açılınca
            conn.on('open', () => {
                activeDataConnections.push(conn);
                updateViewerCount();
                
                // İzleyiciye Görüntüyü Gönder
                const call = peer.call(conn.peer, localStream);
                activeMediaCalls.push(call);

                // Görüntü bağlantısı koparsa listeden temizle
                call.on('close', () => {
                    activeMediaCalls = activeMediaCalls.filter(c => c !== call);
                });
                call.on('error', () => {
                    activeMediaCalls = activeMediaCalls.filter(c => c !== call);
                });
            });

            // Veri bağlantısı kapanırsa
            conn.on('close', () => {
                activeDataConnections = activeDataConnections.filter(c => c.peer !== conn.peer);
                updateViewerCount();
            });
            conn.on('error', () => {
                activeDataConnections = activeDataConnections.filter(c => c.peer !== conn.peer);
                updateViewerCount();
            });
        });

    } catch (err) {
        startBtn.disabled = false;
        startBtn.innerText = "Yayını Başlat";
        alert("Erişim sağlanamadı veya iptal ettiniz.\nHata: " + err.message);
    }
}

// --- ÖN VE ARKA KAMERA ARASINDA GEÇİŞ YAP ---
switchCameraBtn.addEventListener('click', async () => {
    if (currentMode !== 'camera') return;

    // Kameranın yönünü değiştir
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    switchCameraBtn.disabled = true;
    switchCameraBtn.innerText = "Çevriliyor...";

    try {
        // Sadece yeni videoyu istiyoruz, sesi yeniden istemeye gerek yok
        const newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode }
        });

        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = localStream.getVideoTracks()[0];

        // Yayıncının (senin) görüntüsünü kapatıp açmış olma durumunu koru
        newVideoTrack.enabled = oldVideoTrack.enabled; 

        // Eski izi durdur ve yeni izi akışa ekle
        oldVideoTrack.stop();
        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(newVideoTrack);

        // Kendi ekranımızdaki videoyu tazele
        videoElement.srcObject = null;
        videoElement.srcObject = localStream;

        // **EN ÖNEMLİ KISIM:** Yayını kesmeden izleyicilerdeki videoyu yeni kamerayla değiştir
        activeMediaCalls.forEach(call => {
            if (call.peerConnection) {
                // Video göndericisini (sender) bul
                const sender = call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(newVideoTrack);
                }
            }
        });

    } catch (err) {
        console.error("Kamera çevirme hatası:", err);
        alert("Kamera çevrilemedi! Telefonunuz arka kamerayı desteklemiyor olabilir.");
    } finally {
        switchCameraBtn.disabled = false;
        switchCameraBtn.innerText = "Ön/Arka Kamera Çevir";
    }
});

// --- GÖRÜNTÜ VE SES KONTROLLERİ ---
toggleVideoBtn.addEventListener('click', () => {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            toggleVideoBtn.innerText = videoTrack.enabled ? "Görüntüyü Kapat" : "Görüntüyü Aç";
            toggleVideoBtn.classList.toggle('active');
        }
    }
});

toggleAudioBtn.addEventListener('click', () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            toggleAudioBtn.innerText = audioTrack.enabled ? "Sesi Kapat" : "Sesi Aç";
            toggleAudioBtn.classList.toggle('active');
        }
    }
});

// --- YAYINI TAMAMEN BİTİR ---
stopStreamBtn.addEventListener('click', () => {
    if (confirm("Yayını bitirmek istediğinize emin misiniz?")) {
        activeDataConnections.forEach(conn => conn.close());
        activeDataConnections = [];
        activeMediaCalls = [];
        updateViewerCount();

        if (peer) peer.destroy();
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        
        videoElement.srcObject = null;
        controlsPanel.style.display = 'none';
        linkContainer.style.display = 'none';
        viewerBadge.style.display = 'none';
        
        setupPanel.style.display = 'block';
        startBtn.disabled = false;
        startBtn.innerText = "Yayını Başlat";
        
        // Buton stillerini sıfırla
        toggleVideoBtn.innerText = "Görüntüyü Kapat";
        toggleVideoBtn.classList.remove('active');
        toggleAudioBtn.innerText = "Sesi Kapat";
        toggleAudioBtn.classList.remove('active');
    }
});

startBtn.addEventListener('click', startStream);
