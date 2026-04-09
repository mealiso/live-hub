// HTML Elementlerini Seçme
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

// Global Değişkenler
let localStream;
let peer;
let activeDataConnections = []; 
let activeMediaCalls = [];      
let currentFacingMode = "user"; 
let currentMode = "camera";     

// --- AYNA EFEKTİNİ KONTROL ET ---
function updateMirrorEffect() {
    // Sadece kamera modunda ve ön kameradayken aynala
    if (currentMode === "camera" && currentFacingMode === "user") {
        videoElement.classList.add('mirror'); 
    } else {
        videoElement.classList.remove('mirror'); 
    }
}

// --- İZLEYİCİ SAYISINI GÜNCELLE VE YAYINLA ---
function updateViewerCount() {
    const count = activeDataConnections.length;
    viewerBadge.innerText = `👁️ ${count} İzleyici`;
    
    activeDataConnections.forEach(conn => {
        if (conn.open) {
            conn.send({ type: 'VIEWER_COUNT', count: count });
        }
    });
}

// --- YAYINI BAŞLATMA ---
async function startStream() {
    startBtn.disabled = true;
    startBtn.innerText = "Hazırlanıyor...";
    currentMode = streamSourceSelect.value;

    try {
        if (currentMode === "camera") {
            const constraints = { video: { facingMode: currentFacingMode }, audio: true };
            try {
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            }
            switchCameraBtn.style.display = 'inline-block';
        } else {
            // Ekran Paylaşımı
            try {
                localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            } catch (err) {
                localStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            }
            switchCameraBtn.style.display = 'none';
        }

        // Videoyu ekrana ver ve ayna efektini ayarla
        videoElement.srcObject = localStream;
        updateMirrorEffect(); 

        // PeerJS Oadası Kur
        peer = new Peer(); 

        peer.on('open', (id) => {
            const watchUrl = `https://mealiso.github.io/live-hub/watch.html?room=${id}`;
            shareLinkInput.value = watchUrl;
            
            // Arayüz geçişleri
            setupPanel.style.display = 'none'; 
            linkContainer.style.display = 'block';
            controlsPanel.style.display = 'flex'; 
            viewerBadge.style.display = 'block';
        });

        // İzleyici Bağlandığında
        peer.on('connection', (conn) => {
            conn.on('open', () => {
                activeDataConnections.push(conn);
                updateViewerCount();
                
                // İzleyiciye Görüntüyü Gönder
                const call = peer.call(conn.peer, localStream);
                activeMediaCalls.push(call);

                call.on('close', () => { activeMediaCalls = activeMediaCalls.filter(c => c !== call); });
                call.on('error', () => { activeMediaCalls = activeMediaCalls.filter(c => c !== call); });
            });

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

// --- ÖN/ARKA KAMERA ÇEVİRME ---
switchCameraBtn.addEventListener('click', async () => {
    if (currentMode !== 'camera') return;

    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    switchCameraBtn.disabled = true;
    switchCameraBtn.innerText = "Çevriliyor...";

    try {
        const newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode }
        });

        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = localStream.getVideoTracks()[0];

        // Görüntü kapatılmışsa yeni kamerada da kapalı kalsın
        newVideoTrack.enabled = oldVideoTrack.enabled; 

        // İzi (Track) değiştir
        oldVideoTrack.stop();
        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(newVideoTrack);

        videoElement.srcObject = localStream;
        updateMirrorEffect(); // Kamera yönü değiştiği için ayna kontrolü yap

        // İzleyicilerdeki videoyu anlık değiştir
        activeMediaCalls.forEach(call => {
            if (call.peerConnection) {
                const sender = call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(newVideoTrack);
                }
            }
        });

    } catch (err) {
        console.error("Kamera çevirme hatası:", err);
        alert("Kamera çevrilemedi! Cihazınız desteklemiyor olabilir.");
        // Hata olursa modu geri al
        currentFacingMode = currentFacingMode === "user" ? "environment" : "user"; 
    } finally {
        switchCameraBtn.disabled = false;
        switchCameraBtn.innerText = "Ön/Arka Kamera Çevir";
    }
});

// --- GÖRÜNTÜYÜ AÇ/KAPAT ---
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

// --- SESİ AÇ/KAPAT ---
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
        // Tüm izleyicileri at ve sayıları sıfırla
        activeDataConnections.forEach(conn => conn.close());
        activeDataConnections = [];
        activeMediaCalls = [];
        updateViewerCount();

        // Bağlantıları kopar
        if (peer) peer.destroy();
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        
        // Arayüzü sıfırla
        videoElement.srcObject = null;
        videoElement.classList.remove('mirror');
        
        controlsPanel.style.display = 'none';
        linkContainer.style.display = 'none';
        viewerBadge.style.display = 'none';
        
        setupPanel.style.display = 'block';
        startBtn.disabled = false;
        startBtn.innerText = "Yayını Başlat";
        
        // Butonları eski haline getir
        toggleVideoBtn.innerText = "Görüntüyü Kapat";
        toggleVideoBtn.classList.remove('active');
        toggleAudioBtn.innerText = "Sesi Kapat";
        toggleAudioBtn.classList.remove('active');
    }
});

// Başlat butonunu dinle
startBtn.addEventListener('click', startStream);
