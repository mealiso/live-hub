const videoElement = document.getElementById('liveVideo');
const startBtn = document.getElementById('startBtn');
const linkContainer = document.getElementById('linkContainer');
const shareLinkInput = document.getElementById('shareLink');

let localStream;
let peer;

async function startStream() {
    try {
        // 1. Kamerayı aç
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoElement.srcObject = localStream;

        // 2. PeerJS ile sunucuya bağlan (Rastgele ID oluşturur)
        peer = new Peer(); 

        peer.on('open', (id) => {
            // 3. GitHub Pages linkine kendi ID'mizi ekleyip paylaşım linki oluşturuyoruz
            const watchUrl = `https://mealiso.github.io/live-hub/watch.html?room=${id}`;
            shareLinkInput.value = watchUrl;
            linkContainer.style.display = 'block';
            startBtn.disabled = true;
            startBtn.innerText = "Yayın Devam Ediyor...";
        });

        // 4. Biri bizim odamıza bağlandığında ne olacak?
        peer.on('connection', (conn) => {
            console.log("Yeni bir izleyici geldi:", conn.peer);
            // İzleyiciye kendi video/ses yayınımızı (localStream) gönderiyoruz
            peer.call(conn.peer, localStream);
        });

    } catch (err) {
        console.error("Kamera açılamadı:", err);
        alert("Kameraya izin vermeniz gerekiyor.");
    }
}

startBtn.addEventListener('click', startStream);
