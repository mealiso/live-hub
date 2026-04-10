// --- ÇOK DİLLİ SÖZLÜK ---
const translations = {
    en: {
        titleText: "Live Hub",
        lobbyCreateTitle: "Start a Meeting",
        lobbyCreateDesc: "Start a new video conference and invite others.",
        btnCreate: "Start New Meeting",
        lobbyJoinTitle: "Join a Meeting",
        lobbyJoinDesc: "Meeting ID or Link:",
        btnJoin: "Join Meeting",
        inviteText: "Invite others to join using this link (Click to copy):",
        you: "You",
        connecting: "Connecting...",
        copied: "Link Copied!",
        camError: "Could not access camera/microphone.",
        leaveConfirm: "Are you sure you want to leave the meeting?"
    },
    tr: {
        titleText: "Live Hub",
        lobbyCreateTitle: "Toplantı Başlat",
        lobbyCreateDesc: "Yeni bir görüntülü konferans başlatın ve diğerlerini davet edin.",
        btnCreate: "Yeni Toplantı Başlat",
        lobbyJoinTitle: "Toplantıya Katıl",
        lobbyJoinDesc: "Toplantı ID veya Linki:",
        btnJoin: "Toplantıya Katıl",
        inviteText: "Diğerlerini davet etmek için bu linki paylaşın (Kopyalamak için tıklayın):",
        you: "Sen",
        connecting: "Bağlanılıyor...",
        copied: "Link Kopyalandı!",
        camError: "Kamera veya mikrofona erişilemedi.",
        leaveConfirm: "Toplantıdan ayrılmak istediğinize emin misiniz?"
    }
};

let currentLang = localStorage.getItem('appLang') || 'en';

// --- ELEMENTLER ---
const lobbyScreen = document.getElementById('lobbyScreen');
const meetingScreen = document.getElementById('meetingScreen');
const createMeetingBtn = document.getElementById('createMeetingBtn');
const joinMeetingBtn = document.getElementById('joinMeetingBtn');
const roomInput = document.getElementById('roomInput');
const videoGrid = document.getElementById('videoGrid');
const inviteLink = document.getElementById('inviteLink');

// Kontroller
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const leaveMeetingBtn = document.getElementById('leaveMeetingBtn');

// --- DİL YÖNETİMİ ---
function applyLanguage() {
    const t = translations[currentLang];
    document.getElementById('titleText').innerText = t.titleText;
    document.getElementById('lobbyCreateTitle').innerText = t.lobbyCreateTitle;
    document.getElementById('lobbyCreateDesc').innerText = t.lobbyCreateDesc;
    createMeetingBtn.innerText = t.btnCreate;
    document.getElementById('lobbyJoinTitle').innerText = t.lobbyJoinTitle;
    document.getElementById('lobbyJoinDesc').innerText = t.lobbyJoinDesc;
    joinMeetingBtn.innerText = t.btnJoin;
    document.getElementById('inviteText').innerText = t.inviteText;
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'tr' : 'en';
    localStorage.setItem('appLang', currentLang);
    applyLanguage();
}

// --- GLOBAL DEĞİŞKENLER ---
let myPeer;
let myStream;
let myPeerId;
let isHost = false;
let currentFacingMode = "user";

// Peer listesi (Sadece Host yönetir)
let peersInRoom = []; 
let hostDataConnections = {}; 

// Medya aramaları listesi (Herkes yönetir)
const calls = {}; 

// URL Kontrolü (Linkle mi gelindi?)
const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = urlParams.get('room');

if (roomFromUrl) {
    roomInput.value = roomFromUrl;
}

// --- KAMERA VE MİKROFON İZNİ AL ---
async function getMedia() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: currentFacingMode }, 
            audio: true 
        });
        myStream = stream;
        
        // Eğer mobil cihazsa veya ön kamera açıksa, "Kamera Çevir" butonunu göster
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
            const caps = videoTrack.getCapabilities();
            if (caps.facingMode && caps.facingMode.length > 0) {
                switchCameraBtn.style.display = 'flex';
            }
        }
        return true;
    } catch (err) {
        alert(translations[currentLang].camError + "\n" + err.message);
        return false;
    }
}

// --- KENDİ VİDEOMUZU GRİDE EKLEME ---
function addVideoStream(video, stream, peerId, isMe = false) {
    // Zaten ekliyse tekrar ekleme
    if (document.getElementById('container-' + peerId)) return;

    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    
    if (isMe) {
        video.muted = true; // Kendi sesimizi yankı yapmasın diye kısıyoruz
        if (currentFacingMode === "user") video.classList.add('mirror');
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'video-container';
    wrapper.id = 'container-' + peerId;

    const nameBadge = document.createElement('div');
    nameBadge.className = 'name-badge';
    nameBadge.innerText = isMe ? translations[currentLang].you : "Guest";

    wrapper.appendChild(video);
    wrapper.appendChild(nameBadge);
    videoGrid.appendChild(wrapper);
}

// --- BAŞKASINA BAĞLANMA (CALL) ---
function connectToNewUser(peerId, stream) {
    if (peerId === myPeerId || calls[peerId]) return; // Kendimizi veya zaten bağlı olduğumuzu aramayalım

    const call = myPeer.call(peerId, stream);
    const video = document.createElement('video');
    
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream, peerId, false);
    });
    
    call.on('close', () => {
        const box = document.getElementById('container-' + peerId);
        if (box) box.remove();
    });

    calls[peerId] = call;
}

// --- LOBİDEN TOPLANTIYI BAŞLATMA (HOST) ---
createMeetingBtn.addEventListener('click', async () => {
    createMeetingBtn.disabled = true;
    createMeetingBtn.innerText = translations[currentLang].connecting;

    const hasMedia = await getMedia();
    if (!hasMedia) {
        createMeetingBtn.disabled = false;
        createMeetingBtn.innerText = translations[currentLang].btnCreate;
        return;
    }

    isHost = true;
    myPeer = new Peer(); // Rastgele ID alır

    myPeer.on('open', id => {
        myPeerId = id;
        setupMeetingUI(id);
        peersInRoom.push(id); // Host kendisini odaya ekler
    });

    setupPeerEvents();
});

// --- LOBİDEN TOPLANTIYA KATILMA (GUEST) ---
joinMeetingBtn.addEventListener('click', async () => {
    let hostIdToJoin = roomInput.value.trim();
    
    // Link olarak girildiyse sadece ID'yi al (örn: ?room=XYZ -> XYZ)
    if (hostIdToJoin.includes('?room=')) {
        hostIdToJoin = hostIdToJoin.split('?room=')[1];
    }

    if (!hostIdToJoin) return;

    joinMeetingBtn.disabled = true;
    joinMeetingBtn.innerText = translations[currentLang].connecting;

    const hasMedia = await getMedia();
    if (!hasMedia) {
        joinMeetingBtn.disabled = false;
        joinMeetingBtn.innerText = translations[currentLang].btnJoin;
        return;
    }

    myPeer = new Peer();

    myPeer.on('open', id => {
        myPeerId = id;
        setupMeetingUI(hostIdToJoin);

        // 1. Host'a "Ben Geldim" mesajı atıyoruz (Veri Kanalı)
        const conn = myPeer.connect(hostIdToJoin);
        conn.on('open', () => {
            conn.on('data', data => {
                // Host bize odadaki diğer kişilerin listesini atar
                if (data.type === 'PEER_LIST') {
                    // Odadaki herkese (Host dahil) görüntümüzü yolluyoruz
                    data.peers.forEach(peerInRoom => {
                        connectToNewUser(peerInRoom, myStream);
                    });
                }
            });
        });
    });

    setupPeerEvents();
});

// --- PEER OLAYLARI (HERKES İÇİN ORTAK) ---
function setupPeerEvents() {
    
    // Biri bizi ararsa (Görüntü/Ses gelirse)
    myPeer.on('call', call => {
        call.answer(myStream); // Kendi görüntümüzle cevap veriyoruz
        const video = document.createElement('video');
        
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream, call.peer, false);
        });

        call.on('close', () => {
            const box = document.getElementById('container-' + call.peer);
            if (box) box.remove();
        });

        calls[call.peer] = call;
    });

    // SADECE HOST İÇİN: Yeni biri veri bağlantısı kurduğunda (Odaya girdiğinde)
    myPeer.on('connection', conn => {
        if (isHost) {
            conn.on('open', () => {
                // Yeni gelene, odadaki mevcut kişilerin listesini gönder
                conn.send({ type: 'PEER_LIST', peers: peersInRoom });
                
                // Odaya yeni kişiyi kaydet
                peersInRoom.push(conn.peer);
                hostDataConnections[conn.peer] = conn;
            });

            conn.on('close', () => {
                peersInRoom = peersInRoom.filter(p => p !== conn.peer);
                delete hostDataConnections[conn.peer];
            });
        }
    });
}

// --- ARAYÜZÜ TOPLANTI MODUNA GEÇİR ---
function setupMeetingUI(roomId) {
    lobbyScreen.style.display = 'none';
    meetingScreen.style.display = 'flex';

    // Linki oluştur ve ekrana yaz
    const baseUrl = window.location.href.split('?')[0];
    const fullLink = `${baseUrl}?room=${roomId}`;
    inviteLink.innerText = fullLink;

    // Kendi kameramızı gride ekle
    const myVideo = document.createElement('video');
    addVideoStream(myVideo, myStream, myPeerId, true);
}

// Link Kopyalama
window.copyInviteLink = function() {
    navigator.clipboard.writeText(inviteLink.innerText).then(() => {
        const originalText = inviteLink.innerText;
        inviteLink.innerText = translations[currentLang].copied;
        setTimeout(() => inviteLink.innerText = originalText, 2000);
    });
}

// --- KONTROL BUTONLARI (SES/VİDEO/KAMERA) ---

toggleAudioBtn.addEventListener('click', () => {
    const audioTrack = myStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        toggleAudioBtn.classList.toggle('active');
        toggleAudioBtn.innerText = audioTrack.enabled ? "🎤" : "🔇";
    }
});

toggleVideoBtn.addEventListener('click', () => {
    const videoTrack = myStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        toggleVideoBtn.classList.toggle('active');
        toggleVideoBtn.innerText = videoTrack.enabled ? "📷" : "🚫";
    }
});

// Kamera Çevirme (Zoom tarzı, yayını kesmeden `replaceTrack` ile)
switchCameraBtn.addEventListener('click', async () => {
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    
    try {
        const newStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: currentFacingMode } 
        });
        
        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = myStream.getVideoTracks()[0];
        
        newVideoTrack.enabled = oldVideoTrack.enabled; // Kapalıysa kapalı kalır
        
        oldVideoTrack.stop();
        myStream.removeTrack(oldVideoTrack);
        myStream.addTrack(newVideoTrack);
        
        // Kendi videomuzu güncelle
        const myVideo = document.querySelector(`#container-${myPeerId} video`);
        if (myVideo) {
            myVideo.srcObject = myStream;
            if (currentFacingMode === "user") myVideo.classList.add('mirror');
            else myVideo.classList.remove('mirror');
        }

        // Diğer herkese giden görüntüyü değiştir
        Object.values(calls).forEach(call => {
            if (call.peerConnection) {
                const sender = call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) sender.replaceTrack(newVideoTrack);
            }
        });

    } catch (err) {
        console.error("Camera switch error", err);
    }
});

// Toplantıdan Ayrıl
leaveMeetingBtn.addEventListener('click', () => {
    if (confirm(translations[currentLang].leaveConfirm)) {
        location.href = window.location.href.split('?')[0]; // Parametresiz URL'e geri dön (sayfayı yeniler)
    }
});

// İlk Yüklemede Dili Uygula
applyLanguage();
