const remoteVideo = document.getElementById('remoteVideo');
const statusText = document.getElementById('status');
const viewerBadge = document.getElementById('viewerBadge');

const urlParams = new URLSearchParams(window.location.search);
const broadcasterId = urlParams.get('room');

if (!broadcasterId) {
    statusText.innerText = "Hatalı veya eksik yayın linki!";
    statusText.style.color = "red";
} else {
    const peer = new Peer();

    peer.on('open', () => {
        statusText.innerText = "Yayıncı bekleniyor...";
        
        // 1. Yayıncıyla bir Veri Bağlantısı (Mesajlaşma) kuruyoruz
        const conn = peer.connect(broadcasterId);
        
        // Yayıncıdan bize bir veri (mesaj) geldiğinde...
        conn.on('data', (data) => {
            // Eğer gelen veri İZLEYİCİ SAYISI ise rozeti güncelle
            if (data.type === 'VIEWER_COUNT') {
                viewerBadge.style.display = 'block';
                viewerBadge.innerText = `👁️ ${data.count} İzleyici`;
            }
        });

        // Yayıncı yayını tamamen bitirirse (bağlantıyı kapatırsa)
        conn.on('close', () => {
            statusText.style.display = 'block';
            statusText.innerText = "Yayın sona erdi.";
            viewerBadge.style.display = 'none';
            remoteVideo.srcObject = null;
        });
    });

    // 2. Yayıncı bize Kamera Görüntüsünü gönderdiğinde...
    peer.on('call', (call) => {
        call.answer(); 
        
        call.on('stream', (remoteStream) => {
            remoteVideo.srcObject = remoteStream;
            statusText.style.display = 'none'; 
        });
    });

    peer.on('error', (err) => {
        console.error(err);
        statusText.innerText = "Yayıncıya ulaşılamadı. Yayın bitmiş olabilir.";
    });
}
