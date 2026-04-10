// --- KONTROLLER ---
const myUsername = sessionStorage.getItem('hubUsername');
const isHost = sessionStorage.getItem('hubIsHost') === 'true';
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

if (!myUsername || !roomId) {
    window.location.href = 'index.html'; 
}

// --- ÇOK DİLLİ SÖZLÜK ---
const translations = {
    en: {
        you: "You", hostLabel: "[Host]", guestLabel: "Guest",
        copied: "Link Copied!", leaveConfirm: "Are you sure you want to leave?",
        tabPeople: "People", tabChat: "Chat", tabSettings: "Settings",
        muteAll: "Mute All Mics", camsOffAll: "Turn Off All Cams",
        chatDisabled: "Chat is currently disabled by Host.",
        chatPlaceholder: "Type a message...", closePanel: "Close Panel",
        lblRoomRules: "GLOBAL ROOM RULES", lblAllowCam: "Allow Cameras",
        lblAllowChat: "Enable Chat", lblStrictMute: "Strict Mute (No Chat)",
        lblChatOnly: "Chat Only Mode", mutedAlert: "The Host has muted your microphone.",
        camAlert: "The Host has disabled your camera."
    },
    tr: {
        you: "Sen", hostLabel: "[Yönetici]", guestLabel: "Misafir",
        copied: "Link Kopyalandı!", leaveConfirm: "Ayrılmak istediğinize emin misiniz?",
        tabPeople: "Kişiler", tabChat: "Sohbet", tabSettings: "Ayarlar",
        muteAll: "Herkesi Sustur", camsOffAll: "Kameraları Kapat",
        chatDisabled: "Sohbet yönetici tarafından kapatıldı.",
        chatPlaceholder: "Mesaj yazın...", closePanel: "Paneli Kapat",
        lblRoomRules: "GENEL ODA KURALLARI", lblAllowCam: "Kameralara İzin Ver",
        lblAllowChat: "Sohbete İzin Ver", lblStrictMute: "Sıkı Susturma (Sohbet Yasak)",
        lblChatOnly: "Sadece Sohbet Modu", mutedAlert: "Yönetici mikrofonunuzu kapattı.",
        camAlert: "Yönetici kameranızı kapattı."
    }
};

let currentLang = localStorage.getItem('appLang') || 'en';

function applyLanguage() {
    const t = translations[currentLang];
    document.getElementById('tabBtnParticipants').innerText = t.tabPeople;
    document.getElementById('tabBtnChat').innerText = t.tabChat;
    document.getElementById('tabBtnSettings').innerText = t.tabSettings;
    
    document.getElementById('muteAllBtn').innerText = t.muteAll;
    document.getElementById('camsOffAllBtn').innerText = t.camsOffAll;
    
    document.getElementById('chatDisabledMsg').innerText = t.chatDisabled;
    document.getElementById('chatInput').placeholder = t.chatPlaceholder;
    document.getElementById('txtClose').innerText = t.closePanel;
    
    document.getElementById('lblRoomRules').innerText = t.lblRoomRules;
    document.getElementById('lblAllowCam').innerText = t.lblAllowCam;
    document.getElementById('lblAllowChat').innerText = t.lblAllowChat;
    document.getElementById('lblStrictMute').innerText = t.lblStrictMute;
    document.getElementById('lblChatOnly').innerText = t.lblChatOnly;

    updateVideoNames();
    renderParticipants();
}

window.toggleLanguage = function() {
    currentLang = currentLang === 'en' ? 'tr' : 'en';
    localStorage.setItem('appLang', currentLang);
    applyLanguage();
}

// --- GLOBAL STATE ---
let myPeer, myStream, myPeerId;
let hostId = isHost ? null : roomId; 

let peersData = {}; 
let hostDataConnections = {}; 
let myHostConnection = null;  
const calls = {}; 

let roomSettings = { allowCam: true, allowChat: true, strictMute: false, chatOnly: false };
let userRestrictions = {}; // { peerId: { micBlocked: false, camBlocked: false, chatBlocked: false } }
let myPermissions = { canMic: true, canCam: true, canChat: true };

// --- ELEMENTLER ---
const videoGrid = document.getElementById('videoGrid');
const inviteLink = document.getElementById('inviteLink');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const sidebar = document.getElementById('sidebar');
const participantsList = document.getElementById('participantsList');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatInputArea = document.getElementById('chatInputArea');
const chatDisabledMsg = document.getElementById('chatDisabledMsg');

// --- BAŞLATMA ---
async function initRoom() {
    inviteLink.innerText = `${window.location.href.split('?')[0]}?room=${roomId}`;
    applyLanguage();

    // EĞER YÖNETİCİ (HOST) İSEK AYARLAR BUTONLARINI AKTİF ET
    if (isHost) {
        document.getElementById('tabBtnSettings').style.display = 'block';
        document.getElementById('toggleSettingsBtn').style.display = 'flex';
        document.getElementById('hostQuickActions').style.display = 'block';
        setupHostSettingsListeners();
    }

    try {
        myStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (e) {
        myStream = new MediaStream();
    }

    myPeer = isHost ? new Peer(roomId) : new Peer();

    myPeer.on('open', id => {
        myPeerId = id;
        if (isHost) hostId = id;
        peersData[id] = myUsername;
        
        const myVideo = document.createElement('video');
        addVideoStream(myVideo, myStream, id, true);
        renderParticipants();

        if (isHost) setupHostEvents();
        else joinAsGuest();
    });

    myPeer.on('call', call => {
        call.answer(myStream); 
        const video = document.createElement('video');
        call.on('stream', userVideoStream => { addVideoStream(video, userVideoStream, call.peer, false); });
        call.on('close', () => { document.getElementById('container-' + call.peer)?.remove(); });
        calls[call.peer] = call;
    });
}

function joinAsGuest() {
    myHostConnection = myPeer.connect(hostId);
    myHostConnection.on('open', () => {
        myHostConnection.send({ type: 'GUEST_HELLO', name: myUsername });
        myHostConnection.on('data', data => {
            if (data.type === 'CALL_LIST') data.list.forEach(pId => connectToNewUser(pId, myStream));
            else handleIncomingData(data, hostId);
        });
    });
}

function setupHostEvents() {
    myPeer.on('connection', conn => {
        conn.on('open', () => {
            hostDataConnections[conn.peer] = conn;
            conn.on('data', data => {
                if (data.type === 'GUEST_HELLO') {
                    peersData[conn.peer] = data.name;
                    userRestrictions[conn.peer] = { micBlocked: false, camBlocked: false, chatBlocked: false };
                    syncAllToGuests(); 
                    
                    const otherPeers = Object.keys(peersData).filter(p => p !== conn.peer);
                    conn.send({ type: 'CALL_LIST', list: otherPeers });
                } else {
                    handleIncomingData(data, conn.peer);
                }
            });
        });
        conn.on('close', () => {
            delete hostDataConnections[conn.peer]; delete peersData[conn.peer]; delete userRestrictions[conn.peer];
            syncAllToGuests();
        });
    });
}

// --- VERİ DİNLEME ---
function handleIncomingData(data, senderId) {
    if (data.type === 'SYNC_STATE') {
        peersData = data.peersData;
        roomSettings = data.settings;
        
        if (!isHost && data.restrictions) {
            const myRestricts = data.restrictions[myPeerId] || {};
            
            myPermissions.canChat = roomSettings.allowChat && !myRestricts.chatBlocked && (!roomSettings.strictMute || !myRestricts.micBlocked);
            myPermissions.canCam = roomSettings.allowCam && !roomSettings.chatOnly && !myRestricts.camBlocked;
            myPermissions.canMic = !roomSettings.chatOnly && !myRestricts.micBlocked;
            
            enforcePermissions();
        }
        
        updateVideoNames();
        renderParticipants();
    }
    
    if (data.type === 'CHAT') {
        appendChatMessage(data.senderName, data.text, data.senderId === myPeerId);
        if (isHost && senderId !== myPeerId) broadcastData(data); 
    }

    if (data.type === 'CMD_FORCE_HARDWARE') {
        if(data.target === 'mic') { setMyMic(data.state); alert(translations[currentLang].mutedAlert); }
        if(data.target === 'cam') { setMyCam(data.state); alert(translations[currentLang].camAlert); }
    }
}

function broadcastData(dataObj) {
    if (isHost) {
        Object.keys(hostDataConnections).forEach(peerId => {
            const conn = hostDataConnections[peerId];
            if (conn.open) {
                if (dataObj.type === 'SYNC_STATE') conn.send({ ...dataObj, restrictions: userRestrictions });
                else conn.send(dataObj);
            }
        });
    } else if (myHostConnection && myHostConnection.open) {
        myHostConnection.send(dataObj);
    }
}

function syncAllToGuests() {
    if(!isHost) return;
    broadcastData({ type: 'SYNC_STATE', peersData, settings: roomSettings });
    updateVideoNames(); renderParticipants();
}

// --- KURAL UYGULAYICI ---
function enforcePermissions() {
    if (!myPermissions.canCam) { setMyCam(false); toggleVideoBtn.disabled = true; } 
    else { toggleVideoBtn.disabled = false; }

    if (!myPermissions.canMic) { setMyMic(false); toggleAudioBtn.disabled = true; } 
    else { toggleAudioBtn.disabled = false; }

    if (!myPermissions.canChat) { chatInputArea.style.display = 'none'; chatDisabledMsg.style.display = 'block'; } 
    else { chatInputArea.style.display = 'flex'; chatDisabledMsg.style.display = 'none'; }
}

function setMyMic(state) {
    const track = myStream.getAudioTracks()[0];
    if (track) {
        track.enabled = state;
        if(state) { toggleAudioBtn.classList.remove('off'); toggleAudioBtn.querySelector('span').innerText = "mic"; }
        else { toggleAudioBtn.classList.add('off'); toggleAudioBtn.querySelector('span').innerText = "mic_off"; }
    }
}

function setMyCam(state) {
    const track = myStream.getVideoTracks()[0];
    if (track) {
        track.enabled = state;
        if(state) { toggleVideoBtn.classList.remove('off'); toggleVideoBtn.querySelector('span').innerText = "videocam"; }
        else { toggleVideoBtn.classList.add('off'); toggleVideoBtn.querySelector('span').innerText = "videocam_off"; }
    }
}

toggleAudioBtn.addEventListener('click', () => { const t = myStream.getAudioTracks()[0]; if (t) setMyMic(!t.enabled); });
toggleVideoBtn.addEventListener('click', () => { const t = myStream.getVideoTracks()[0]; if (t) setMyCam(!t.enabled); });

// --- VİDEO VE GRİD ---
function addVideoStream(video, stream, peerId, isMe = false) {
    if (document.getElementById('container-' + peerId)) return;
    video.srcObject = stream; video.autoplay = true; video.playsInline = true;
    if (isMe) { video.muted = true; video.classList.add('mirror'); }
    
    const wrapper = document.createElement('div');
    wrapper.className = 'video-container'; wrapper.id = 'container-' + peerId;
    const badge = document.createElement('div'); badge.className = 'name-badge';
    
    wrapper.appendChild(video); wrapper.appendChild(badge);
    videoGrid.appendChild(wrapper);
    updateVideoNames();
}

function connectToNewUser(peerId, stream) {
    if (peerId === myPeerId || calls[peerId]) return; 
    const call = myPeer.call(peerId, stream);
    const video = document.createElement('video');
    call.on('stream', userStream => addVideoStream(video, userStream, peerId, false));
    call.on('close', () => document.getElementById('container-' + peerId)?.remove());
    calls[peerId] = call;
}

function updateVideoNames() {
    const t = translations[currentLang];
    document.querySelectorAll('.video-container').forEach(div => {
        const id = div.id.replace('container-', '');
        const badge = div.querySelector('.name-badge');
        if (badge) {
            let text = peersData[id] || t.guestLabel;
            if (id === myPeerId) text += ` (${t.you})`;
            if (id === hostId) text += ` ${t.hostLabel}`;
            badge.innerText = text;
        }
    });
}

// --- HOST AYARLARI ---
function setupHostSettingsListeners() {
    document.getElementById('setAllowCam').addEventListener('change', e => { roomSettings.allowCam = e.target.checked; syncAllToGuests(); });
    document.getElementById('setAllowChat').addEventListener('change', e => { roomSettings.allowChat = e.target.checked; syncAllToGuests(); });
    document.getElementById('setStrictMute').addEventListener('change', e => { roomSettings.strictMute = e.target.checked; syncAllToGuests(); });
    document.getElementById('setChatOnly').addEventListener('change', e => { roomSettings.chatOnly = e.target.checked; syncAllToGuests(); });

    document.getElementById('muteAllBtn').addEventListener('click', () => { broadcastData({ type: 'CMD_FORCE_HARDWARE', target: 'mic', state: false }); });
    document.getElementById('camsOffAllBtn').addEventListener('click', () => { broadcastData({ type: 'CMD_FORCE_HARDWARE', target: 'cam', state: false }); });
}

window.toggleUserRestriction = function(peerId, type) {
    if(!isHost || !userRestrictions[peerId]) return;
    
    if(type === 'mic') userRestrictions[peerId].micBlocked = !userRestrictions[peerId].micBlocked;
    if(type === 'cam') userRestrictions[peerId].camBlocked = !userRestrictions[peerId].camBlocked;
    if(type === 'chat') userRestrictions[peerId].chatBlocked = !userRestrictions[peerId].chatBlocked;
    
    syncAllToGuests();
}

function renderParticipants() {
    const t = translations[currentLang];
    participantsList.innerHTML = '';
    Object.keys(peersData).forEach(id => {
        let name = peersData[id];
        if (id === myPeerId) name += ` (${t.you})`;
        if (id === hostId) name += ` ${t.hostLabel}`;

        const item = document.createElement('div');
        item.className = 'participant-item';
        let html = `<span>${name}</span>`;
        
        if (isHost && id !== myPeerId) {
            const r = userRestrictions[id] || {};
            html += `<div class="user-actions">
                <button class="action-btn ${r.micBlocked ? 'restricted':''}" onclick="toggleUserRestriction('${id}', 'mic')" title="Toggle Mic"><span class="material-symbols-rounded" style="font-size:16px;">${r.micBlocked ? 'mic_off' : 'mic'}</span></button>
                <button class="action-btn ${r.camBlocked ? 'restricted':''}" onclick="toggleUserRestriction('${id}', 'cam')" title="Toggle Cam"><span class="material-symbols-rounded" style="font-size:16px;">${r.camBlocked ? 'videocam_off' : 'videocam'}</span></button>
                <button class="action-btn ${r.chatBlocked ? 'restricted':''}" onclick="toggleUserRestriction('${id}', 'chat')" title="Toggle Chat"><span class="material-symbols-rounded" style="font-size:16px;">${r.chatBlocked ? 'comments_disabled' : 'chat'}</span></button>
            </div>`;
        }
        item.innerHTML = html;
        participantsList.appendChild(item);
    });
}

// --- CHAT VE SIDEBAR ---
function sendChat() {
    if(!myPermissions.canChat && !isHost) return;
    const text = chatInput.value.trim();
    if (!text) return;
    const msgObj = { type: 'CHAT', senderId: myPeerId, senderName: myUsername, text: text };
    broadcastData(msgObj); 
    appendChatMessage(myUsername, text, true); 
    chatInput.value = "";
}
document.getElementById('sendChatBtn').addEventListener('click', sendChat);
chatInput.addEventListener('keypress', e => { if(e.key === 'Enter') sendChat(); });

function appendChatMessage(senderName, text, isMe) {
    const box = document.createElement('div');
    box.className = `msg-box ${isMe ? 'me' : ''}`;
    box.innerHTML = `<div class="msg-author">${isMe ? translations[currentLang].you : senderName}</div><div>${text}</div>`;
    chatMessages.appendChild(box);
    chatMessages.scrollTop = chatMessages.scrollHeight; 
}

function openTab(tabId) {
    sidebar.style.display = 'flex';
    setTimeout(() => sidebar.classList.add('open'), 10);
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active-tab'));

    if(tabId === 'tabParticipants') {
        document.getElementById('tabBtnParticipants').classList.add('active');
        document.getElementById('tabParticipants').classList.add('active');
        document.getElementById('toggleParticipantsBtn').classList.add('active-tab');
    }
    else if(tabId === 'tabChat') {
        document.getElementById('tabBtnChat').classList.add('active');
        document.getElementById('tabChat').classList.add('active');
        document.getElementById('toggleChatBtn').classList.add('active-tab');
    }
    else if(tabId === 'tabSettings') {
        document.getElementById('tabBtnSettings').classList.add('active');
        document.getElementById('tabSettings').classList.add('active');
        document.getElementById('toggleSettingsBtn').classList.add('active-tab');
    }
}

document.getElementById('toggleParticipantsBtn').addEventListener('click', () => openTab('tabParticipants'));
document.getElementById('toggleChatBtn').addEventListener('click', () => openTab('tabChat'));
document.getElementById('toggleSettingsBtn').addEventListener('click', () => openTab('tabSettings'));
document.getElementById('tabBtnParticipants').addEventListener('click', () => openTab('tabParticipants'));
document.getElementById('tabBtnChat').addEventListener('click', () => openTab('tabChat'));
document.getElementById('tabBtnSettings').addEventListener('click', () => openTab('tabSettings'));

document.getElementById('closeSidebarMobile').addEventListener('click', () => {
    sidebar.classList.remove('open');
    setTimeout(() => sidebar.style.display = 'none', 300);
    document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active-tab'));
});

window.copyInviteLink = function() {
    navigator.clipboard.writeText(inviteLink.innerText).then(() => {
        inviteLink.innerText = translations[currentLang].copied;
        setTimeout(() => inviteLink.innerText = `${window.location.href.split('?')[0]}?room=${roomId}`, 2000);
    });
}

document.getElementById('leaveMeetingBtn').addEventListener('click', () => {
    if(confirm(translations[currentLang].leaveConfirm)) window.location.href = 'index.html';
});

initRoom();
