// --- DİL SÖZLÜĞÜ (TRANSLATIONS) ---
const translations = {
    en: {
        mainTitle: "Broadcast Panel",
        setupTitle: "Stream Settings",
        labelSource: "Select Stream Type:",
        optCamera: "Camera Stream",
        optScreen: "Screen Share",
        startBtn: "Start Stream",
        shareText: "Your viewers can join using this link:",
        viewers: "Viewers",
        switchCamera: "Switch Camera",
        muteVideo: "Mute Video",
        unmuteVideo: "Unmute Video",
        muteAudio: "Mute Audio",
        unmuteAudio: "Unmute Audio",
        endStream: "End Stream",
        preparing: "Preparing...",
        errorAccess: "Access denied or cancelled.",
        confirmEnd: "Are you sure you want to end the stream?",
        turning: "Switching...",
        waiting: "Ready for viewers..."
    },
    tr: {
        mainTitle: "Yayıncı Paneli",
        setupTitle: "Yayın Ayarları",
        labelSource: "Yayın Türünü Seçin:",
        optCamera: "Kamera ile Yayın",
        optScreen: "Ekran Paylaşımı",
        startBtn: "Yayını Başlat",
        shareText: "İzleyicilerin bu linkten yayına katılabilir:",
        viewers: "İzleyici",
        switchCamera: "Kamerayı Çevir",
        muteVideo: "Görüntüyü Kapat",
        unmuteVideo: "Görüntüyü Aç",
        muteAudio: "Sesi Kapat",
        unmuteAudio: "Sesi Aç",
        endStream: "Yayını Bitir",
        preparing: "Hazırlanıyor...",
        errorAccess: "Erişim reddedildi veya iptal edildi.",
        confirmEnd: "Yayını bitirmek istediğinize emin misiniz?",
        turning: "Çevriliyor...",
        waiting: "Yayın devam ediyor..."
    }
};

let currentLang = localStorage.getItem('appLang') || 'en';

// Elementleri Seçme
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

// --- DİLİ UYGULA ---
function applyLanguage() {
    const t = translations[currentLang];
    document.getElementById('mainTitle').innerText = t.mainTitle;
    document.getElementById('setupTitle').innerText = t.setupTitle;
    document.getElementById('labelSource').innerText = t.labelSource;
    document.getElementById('optCamera').innerText = t.optCamera;
    document.getElementById('optScreen').innerText = t.optScreen;
    if (!startBtn.disabled) startBtn.innerText = t.startBtn;
    document.getElementById('shareText').innerText = t.shareText;
    
    // Sayaç metni
    document.querySelectorAll('.lang-viewers').forEach(el => el.innerText = t.viewers);
    
    // Yayın içi butonlar
    if (!switchCameraBtn.disabled) switchCameraBtn.innerText = t.switchCamera;
    stopStreamBtn.innerText = t.endStream;
    
    const vTrack = localStream ? localStream.getVideoTracks()[0] : null;
    if (vTrack) toggleVideoBtn.innerText = vTrack.enabled ? t.muteVideo : t.unmuteVideo;
    else toggleVideoBtn.innerText = t.muteVideo;

    const aTrack = localStream ? localStream.getAudioTracks()[0] : null;
    if (aTrack) toggleAudioBtn.innerText = aTrack.enabled ? t.muteAudio : t.unmuteAudio;
    else toggleAudioBtn.innerText = t.muteAudio;
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'tr' : 'en';
    localStorage.setItem('appLang', currentLang);
    applyLanguage();
}

// Global Değişkenler
let localStream;
let peer;
let activeDataConnections = []; 
let activeMediaCalls = [];      
let currentFacingMode = "user"; 
let currentMode = "camera";     

function updateMirrorEffect() {
    if (currentMode === "camera" && currentFacingMode === "user") videoElement.classList.add('mirror'); 
    else videoElement.classList.remove('mirror'); 
}

function updateViewerCount() {
    const count = activeDataConnections.length;
    // Sadece sayıyı güncelliyoruz, animasyonlu nokta ve çeviri kısmı HTML'de kalıyor
    document.getElementById('viewerNumber').innerText = count;
    
    activeDataConnections.forEach(conn => {
        if (conn.open) conn.send({ type: 'VIEWER_COUNT', count: count });
    });
}

// --- YAYINI BAŞLATMA ---
async function startStream() {
    startBtn.disabled = true;
    startBtn.innerText = translations[currentLang].preparing;
    currentMode = streamSourceSelect.value;

    try {
        if (currentMode === "camera") {
            const constraints = { video: { facingMode: currentFacingMode }, audio: true };
            try {
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch(e) {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            }
            switchCameraBtn.style.display = 'inline-block';
        } else {
            try {
                localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            } catch(e) {
                localStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            }
            switchCameraBtn.style.display = 'none';
        }

        videoElement.srcObject = localStream;
        updateMirrorEffect(); 
        applyLanguage(); 

        peer = new Peer(); 
        peer.on('open', (id) => {
            const watchUrl = `https://mealiso.github.io/live-hub/watch.html?room=${id}`;
            shareLinkInput.value = watchUrl;
            
            // Görsel geçişler
            setupPanel.style.display = 'none'; 
            linkContainer.style.display = 'block';
            controlsPanel.style.display = 'flex'; 
            
            // Flex ile canli nokta ve metni hizala
            viewerBadge.style.display = 'flex';
        });

        peer.on('connection', (conn) => {
            conn.on('open', () => {
                activeDataConnections.push(conn);
                updateViewerCount();
                const call = peer.call(conn.peer, localStream);
                activeMediaCalls.push(call);
            });
            conn.on('close', () => {
                activeDataConnections = activeDataConnections.filter(c => c.peer !== conn.peer);
                updateViewerCount();
            });
        });

    } catch (err) {
        startBtn.disabled = false;
        startBtn.innerText = translations[currentLang].startBtn;
        alert(translations[currentLang].errorAccess + "\n" + err.message);
    }
}

// --- KAMERA ÇEVİRME ---
switchCameraBtn.addEventListener('click', async () => {
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    switchCameraBtn.disabled = true;
    switchCameraBtn.innerText = translations[currentLang].turning;

    try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode } });
        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = localStream.getVideoTracks()[0];
        
        newVideoTrack.enabled = oldVideoTrack.enabled;

        oldVideoTrack.stop();
        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(newVideoTrack);
        
        videoElement.srcObject = localStream;
        updateMirrorEffect();

        activeMediaCalls.forEach(call => {
            if (call.peerConnection) {
                const sender = call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) sender.replaceTrack(newVideoTrack);
            }
        });
    } catch (err) {
        alert("Camera error!");
        currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    } finally {
        switchCameraBtn.disabled = false;
        switchCameraBtn.innerText = translations[currentLang].switchCamera;
    }
});

toggleVideoBtn.addEventListener('click', () => {
    if (localStream) {
        const track = localStream.getVideoTracks()[0];
        track.enabled = !track.enabled;
        toggleVideoBtn.innerText = track.enabled ? translations[currentLang].muteVideo : translations[currentLang].unmuteVideo;
        toggleVideoBtn.classList.toggle('active');
    }
});

toggleAudioBtn.addEventListener('click', () => {
    if (localStream) {
        const track = localStream.getAudioTracks()[0];
        track.enabled = !track.enabled;
        toggleAudioBtn.innerText = track.enabled ? translations[currentLang].muteAudio : translations[currentLang].unmuteAudio;
        toggleAudioBtn.classList.toggle('active');
    }
});

stopStreamBtn.addEventListener('click', () => {
    if (confirm(translations[currentLang].confirmEnd)) {
        location.reload(); 
    }
});

startBtn.addEventListener('click', startStream);

// Sayfa yüklendiğinde varsayılan veya kaydedilmiş dili çalıştır
applyLanguage();
