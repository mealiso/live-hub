// --- ÇOK DİLLİ SÖZLÜK ---
const translations = {
    en: {
        titleText: "Live Hub",
        lobbyNameDesc: "Your Name:",
        namePlaceholder: "Enter your name...",
        lobbyCreateTitle: "Start a Meeting",
        btnCreate: "Start Meeting",
        lobbyJoinTitle: "Join a Meeting",
        roomPlaceholder: "Meeting ID or Link...",
        btnJoin: "Join Meeting",
        inviteText: "Invite others to join using this link (Click to copy):",
        you: "You",
        connecting: "Connecting...",
        copied: "Link Copied!",
        camError: "Could not access camera/microphone.",
        leaveConfirm: "Are you sure you want to leave the meeting?",
        nameRequired: "Please enter your name first!",
        tabParticipants: "Participants",
        tabChat: "Chat",
        muteAll: "Mute All",
        chatPlaceholder: "Type a message...",
        host: "(Host)",
        mutedByHost: "The Host has muted your microphone.",
        closePanel: "Close Panel"
    },
    tr: {
        titleText: "Live Hub",
        lobbyNameDesc: "Adınız:",
        namePlaceholder: "Adınızı girin...",
        lobbyCreateTitle: "Toplantı Başlat",
        btnCreate: "Toplantıyı Başlat",
        lobbyJoinTitle: "Toplantıya Katıl",
        roomPlaceholder: "Toplantı ID veya Linki...",
        btnJoin: "Toplantıya Katıl",
        inviteText: "Diğerlerini davet etmek için bu linki paylaşın (Kopyalamak için tıklayın):",
        you: "Sen",
        connecting: "Bağlanılıyor...",
        copied: "Link Kopyalandı!",
        camError: "Kamera veya mikrofona erişilemedi.",
        leaveConfirm: "Toplantıdan ayrılmak istediğinize emin misiniz?",
        nameRequired: "Lütfen önce adınızı girin!",
        tabParticipants: "Katılımcılar",
        tabChat: "Sohbet",
        muteAll: "Herkesi Sustur",
        chatPlaceholder: "Mesajınızı yazın...",
        host: "(Yönetici)",
        mutedByHost: "Yönetici mikrofonunuzu kapattı.",
        closePanel: "Paneli Kapat"
    }
};

let currentLang = localStorage.getItem('appLang') || 'en';

// --- ELEMENTLER ---
const lobbyScreen = document.getElementById('lobbyScreen');
const meetingWrapper = document.getElementById('meetingWrapper');
const createMeetingBtn = document.getElementById('createMeetingBtn');
const joinMeetingBtn = document.getElementById('joinMeetingBtn');
const usernameInput = document.getElementById('usernameInput');
const roomInput = document.getElementById('roomInput');
const videoGrid = document.getElementById('videoGrid');
const inviteLink = document.getElementById('inviteLink');

const btnCreateText = document.getElementById('btnCreateText');
const btnJoinText = document.getElementById('btnJoinText');

// Kontroller
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const leaveMeetingBtn = document.getElementById('leaveMeetingBtn');
const toggleParticipantsBtn = document.getElementById('toggleParticipantsBtn');
const toggleChatBtn = document.getElementById('toggleChatBtn');

// Sidebar
const sidebar = document.getElementById('sidebar');
const closeSidebarMobile = document.getElementById('closeSidebarMobile');
const tabBtnParticipants = document.getElementById('tabBtnParticipants');
const tabBtnChat = document.getElementById('tabBtnChat');
const tabParticipants = document.getElementById('tabParticipants');
const tabChat = document.getElementById('tabChat');
const participantsList = document.getElementById('participantsList');
const hostControls = document.getElementById('hostControls');
const muteAllBtn = document.getElementById('muteAllBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

// --- DİL YÖNETİMİ ---
function applyLanguage() {
    const t = translations[currentLang];
    document.getElementById('titleText').innerText = t.titleText;
    document.getElementById('lobbyNameDesc').innerText = t.lobbyNameDesc;
    usernameInput.placeholder = t.namePlaceholder;
    document.getElementById('lobbyCreateTitle').innerText = t.lobbyCreateTitle;
    btnCreateText.innerText = t.btnCreate;
    document.getElementById('lobbyJoinTitle').innerText = t.lobbyJoinTitle;
    roomInput.placeholder = t.roomPlaceholder;
    btnJoinText.innerText = t.btnJoin;
    document.getElementById('inviteText').innerText = t.inviteText;
    
    tabBtnParticipants.innerText = t.tabParticipants;
    tabBtnChat.innerText = t.tabChat;
    chatInput.placeholder = t.chatPlaceholder;
    muteAllBtn.innerHTML = `<span class="material-symbols-rounded">mic_off</span> ${t.muteAll}`;
    
    // Close panel span
    const closeSpan = closeSidebarMobile.querySelectorAll('span')[1];
    if(closeSpan) closeSpan.innerText = t.closePanel;

    updateVideoNames();
    renderParticipants();
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
let myUsername = "";
let isHost = false;
let hostId = null; 
let currentFacingMode = "user";

let peersData = {}; 
let hostDataConnections = {}; 
let myHostConnection = null;  
const calls = {}; 

const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = urlParams.get('room');
if (roomFromUrl) roomInput.value = roomFromUrl;

// --- YARDIMCI FONKSİYONLAR ---
async function getMedia() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode }, audio: true });
        const videoTrack = myStream.getVideoTracks()[0];
        if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
            const caps = videoTrack.getCapabilities();
            if (caps.facingMode && caps.facingMode.length > 0) switchCameraBtn.style.display = 'flex';
        }
        return true;
    } catch (err) {
        alert(translations[currentLang].camError + "\n" + err.message);
        return false;
    }
}

function updateVideoNames() {
    document.querySelectorAll('.video-container').forEach(div => {
        const id = div.id.replace('container-', '');
        const badge = div.querySelector('.name-badge');
        if (badge) {
            let text = peersData[id] || "Guest";
            if (id === myPeerId) text += ` (${translations[currentLang].you})`;
            if (id === hostId) text += ` ${translations[currentLang].host}`;
            badge.innerText = text;
        }
    });
}

function addVideoStream(video, stream, peerId, isMe = false) {
    if (document.getElementById('container-' + peerId)) return;
    video.srcObject = stream;
    video.autoplay = true; video.playsInline = true;
    if (isMe) { video.muted = true; if (currentFacingMode === "user") video.classList.add('mirror'); }

    const wrapper = document.createElement('div');
    wrapper.className = 'video-container';
    wrapper.id = 'container-' + peerId;

    const nameBadge = document.createElement('div');
    nameBadge.className = 'name-badge';
    
    wrapper.appendChild(video);
    wrapper.appendChild(nameBadge);
    videoGrid.appendChild(wrapper);
    updateVideoNames();
}

function connectToNewUser(peerId, stream) {
    if (peerId === myPeerId || calls[peerId]) return; 
    const call = myPeer.call(peerId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => { addVideoStream(video, userVideoStream, peerId, false); });
    call.on('close', () => { document.getElementById('container-' + peerId)?.remove(); });
    calls[peerId] = call;
}

// --- VERİ İLETİŞİMİ ---
function broadcastData(dataObj) {
    if (isHost) {
        Object.values(hostDataConnections).forEach(conn => {
            if (conn.open) conn.send(dataObj);
        });
    } else if (myHostConnection && myHostConnection.open) {
        myHostConnection.send(dataObj);
    }
}

function handleIncomingData(data, senderId) {
    if (data.type === 'SYNC_PEERS') {
        peersData = data.peersData;
        updateVideoNames();
        renderParticipants();
    }
    
    if (data.type === 'CHAT') {
        appendChatMessage(data.senderName, data.text, data.senderId === myPeerId);
        if (isHost && senderId !== myPeerId) broadcastData(data);
    }

    if (data.type === 'CMD_MUTE') {
        const audioTrack = myStream.getAudioTracks()[0];
        if (audioTrack && audioTrack.enabled) {
            audioTrack.enabled = false;
            toggleAudioBtn.classList.add('off');
            toggleAudioBtn.querySelector('.material-symbols-rounded').innerText = "mic_off";
            alert(translations[currentLang].mutedByHost);
        }
    }
}

// --- HOST BAŞLATMA ---
createMeetingBtn.addEventListener('click', async () => {
    myUsername = usernameInput.value.trim();
    if (!myUsername) return alert(translations[currentLang].nameRequired);

    createMeetingBtn.disabled = true; btnCreateText.innerText = translations[currentLang].connecting;
    if (!(await getMedia())) { createMeetingBtn.disabled = false; btnCreateText.innerText = translations[currentLang].btnCreate; return; }

    isHost = true;
    myPeer = new Peer(); 
    myPeer.on('open', id => {
        myPeerId = id; hostId = id;
        peersData[id] = myUsername; 
        setupMeetingUI(id);
        hostControls.style.display = 'flex'; // Yöneticilik butonlarını aç
        renderParticipants();
    });

    setupPeerEvents();
});

// --- GUEST KATILMA ---
joinMeetingBtn.addEventListener('click', async () => {
    myUsername = usernameInput.value.trim();
    if (!myUsername) return alert(translations[currentLang].nameRequired);

    let hostIdToJoin = roomInput.value.trim();
    if (hostIdToJoin.includes('?room=')) hostIdToJoin = hostIdToJoin.split('?room=')[1];
    if (!hostIdToJoin) return;

    joinMeetingBtn.disabled = true; btnJoinText.innerText = translations[currentLang].connecting;
    if (!(await getMedia())) { joinMeetingBtn.disabled = false; btnJoinText.innerText = translations[currentLang].btnJoin; return; }

    myPeer = new Peer();
    myPeer.on('open', id => {
        myPeerId = id; hostId = hostIdToJoin;
        peersData[id] = myUsername;
        setupMeetingUI(hostIdToJoin);

        myHostConnection = myPeer.connect(hostIdToJoin);
        myHostConnection.on('open', () => {
            myHostConnection.send({ type: 'GUEST_HELLO', name: myUsername });
            myHostConnection.on('data', data => {
                if (data.type === 'CALL_LIST') {
                    data.list.forEach(pId => connectToNewUser(pId, myStream));
                } else {
                    handleIncomingData(data, hostIdToJoin);
                }
            });
        });
    });

    setupPeerEvents();
});

// --- PEER OLAYLARI ---
function setupPeerEvents() {
    myPeer.on('call', call => {
        call.answer(myStream); 
        const video = document.createElement('video');
        call.on('stream', userVideoStream => { addVideoStream(video, userVideoStream, call.peer, false); });
        call.on('close', () => { document.getElementById('container-' + call.peer)?.remove(); });
        calls[call.peer] = call;
    });

    myPeer.on('connection', conn => {
        if (isHost) {
            conn.on('open', () => {
                hostDataConnections[conn.peer] = conn;
                conn.on('data', data => {
                    if (data.type === 'GUEST_HELLO') {
                        peersData[conn.peer] = data.name;
                        broadcastData({ type: 'SYNC_PEERS', peersData: peersData });
                        updateVideoNames(); renderParticipants();

                        const otherPeers = Object.keys(peersData).filter(p => p !== conn.peer);
                        conn.send({ type: 'CALL_LIST', list: otherPeers });
                    } else {
                        handleIncomingData(data, conn.peer);
                    }
                });
            });

            conn.on('close', () => {
                delete hostDataConnections[conn.peer];
                delete peersData[conn.peer];
                broadcastData({ type: 'SYNC_PEERS', peersData: peersData });
                updateVideoNames(); renderParticipants();
            });
        }
    });
}

// --- ARAYÜZ FONKSİYONLARI ---
function setupMeetingUI(roomId) {
    lobbyScreen.style.display = 'none';
    meetingWrapper.style.display = 'flex';
    inviteLink.innerText = `${window.location.href.split('?')[0]}?room=${roomId}`;
    
    const myVideo = document.createElement('video');
    addVideoStream(myVideo, myStream, myPeerId, true);
}

window.copyInviteLink = function() {
    navigator.clipboard.writeText(inviteLink.innerText).then(() => {
        const originalText = inviteLink.innerText;
        inviteLink.innerText = translations[currentLang].copied;
        setTimeout(() => inviteLink.innerText = originalText, 2000);
    });
}

// --- SIDEBAR VE CHAT ---
function openSidebar(tab) {
    sidebar.style.display = 'flex';
    // Mobilde animasyonlu girmesi için ufak bir gecikme
    setTimeout(() => { sidebar.classList.add('open'); }, 10);
    
    if(tab === 'participants') {
        tabBtnParticipants.classList.add('active'); tabBtnChat.classList.remove('active');
        tabParticipants.classList.add('active'); tabChat.classList.remove('active');
        toggleParticipantsBtn.classList.add('sidebar-active'); toggleChatBtn.classList.remove('sidebar-active');
    } else {
        tabBtnChat.classList.add('active'); tabBtnParticipants.classList.remove('active');
        tabChat.classList.add('active'); tabParticipants.classList.remove('active');
        toggleChatBtn.classList.add('sidebar-active'); toggleParticipantsBtn.classList.remove('sidebar-active');
    }
}

function closeSidebar() {
    sidebar.classList.remove('open');
    setTimeout(() => { if(!sidebar.classList.contains('open')) sidebar.style.display = 'none'; }, 300);
    toggleParticipantsBtn.classList.remove('sidebar-active');
    toggleChatBtn.classList.remove('sidebar-active');
}

toggleParticipantsBtn.addEventListener('click', () => {
    if(sidebar.style.display === 'flex' && tabParticipants.classList.contains('active')) closeSidebar();
    else openSidebar('participants');
});

toggleChatBtn.addEventListener('click', () => {
    if(sidebar.style.display === 'flex' && tabChat.classList.contains('active')) closeSidebar();
    else openSidebar('chat');
});

closeSidebarMobile.addEventListener('click', closeSidebar);
tabBtnParticipants.addEventListener('click', () => openSidebar('participants'));
tabBtnChat.addEventListener('click', () => openSidebar('chat'));

function sendChat() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    const msgObj = { type: 'CHAT', senderId: myPeerId, senderName: myUsername, text: text };
    broadcastData(msgObj); 
    appendChatMessage(myUsername, text, true); 
    chatInput.value = "";
}

sendChatBtn.addEventListener('click', sendChat);
chatInput.addEventListener('keypress', e => { if(e.key === 'Enter') sendChat(); });

function appendChatMessage(senderName, text, isMe) {
    const box = document.createElement('div');
    box.className = `msg-box ${isMe ? 'me' : ''}`;
    box.innerHTML = `<div class="msg-author">${isMe ? translations[currentLang].you : senderName}</div><div>${text}</div>`;
    chatMessages.appendChild(box);
    chatMessages.scrollTop = chatMessages.scrollHeight; 
}

function renderParticipants() {
    participantsList.innerHTML = '';
    
    Object.keys(peersData).forEach(id => {
        let name = peersData[id];
        if (id === myPeerId) name += ` (${translations[currentLang].you})`;
        if (id === hostId) name += ` ${translations[currentLang].host}`;

        const item = document.createElement('div');
        item.className = 'participant-item';
        
        let html = `<span>${name}</span>`;
        if (isHost && id !== myPeerId) {
            html += `<button class="mute-user-btn" onclick="muteSpecificUser('${id}')" title="Mute Audio"><span class="material-symbols-rounded" style="font-size: 18px;">mic_off</span></button>`;
        }
        
        item.innerHTML = html;
        participantsList.appendChild(item);
    });
}

window.muteSpecificUser = function(targetId) {
    if (isHost && hostDataConnections[targetId]) hostDataConnections[targetId].send({ type: 'CMD_MUTE' });
}

muteAllBtn.addEventListener('click', () => {
    if (isHost) broadcastData({ type: 'CMD_MUTE' });
});

// --- KAMERA/SES KONTROLLERİ ---
toggleAudioBtn.addEventListener('click', () => {
    const audioTrack = myStream.getAudioTracks()[0];
    const iconSpan = toggleAudioBtn.querySelector('.material-symbols-rounded');
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        toggleAudioBtn.classList.toggle('off');
        iconSpan.innerText = audioTrack.enabled ? "mic" : "mic_off"; 
    }
});

toggleVideoBtn.addEventListener('click', () => {
    const videoTrack = myStream.getVideoTracks()[0];
    const iconSpan = toggleVideoBtn.querySelector('.material-symbols-rounded');
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        toggleVideoBtn.classList.toggle('off');
        iconSpan.innerText = videoTrack.enabled ? "videocam" : "videocam_off";
    }
});

switchCameraBtn.addEventListener('click', async () => {
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode } });
        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = myStream.getVideoTracks()[0];
        newVideoTrack.enabled = oldVideoTrack.enabled; 
        
        oldVideoTrack.stop(); myStream.removeTrack(oldVideoTrack); myStream.addTrack(newVideoTrack);
        
        const myVideo = document.querySelector(`#container-${myPeerId} video`);
        if (myVideo) {
            myVideo.srcObject = myStream;
            if (currentFacingMode === "user") myVideo.classList.add('mirror'); else myVideo.classList.remove('mirror');
        }
        Object.values(calls).forEach(call => {
            if (call.peerConnection) {
                const sender = call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) sender.replaceTrack(newVideoTrack);
            }
        });
    } catch (err) {}
});

leaveMeetingBtn.addEventListener('click', () => {
    if (confirm(translations[currentLang].leaveConfirm)) location.href = window.location.href.split('?')[0]; 
});

applyLanguage();
