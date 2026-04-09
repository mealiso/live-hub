const remoteVideo = document.getElementById('remoteVideo');
const statusText = document.getElementById('status');

// 1. URL'den "?room=XYZ" kısmındaki ID'yi alıyoruz
const urlParams = new URLSearchParams(window.location.search);
const broadcasterId = urlParams.get('room');

if (!broadcasterId) {
    statusText.innerText = "Hatalı veya eksik yayın linki!";
    statusText.style.color = "red";
} else {
    // 2. İzleyici olarak PeerJS'ye bağlanıyoruz
    const peer = new Peer();

    peer.on('open', () => {
        // 3. Yayıncıya "Ben geldim" mesajı (bağlantısı) gönderiyoruz
        peer.connect(broadcasterId);
        statusText.innerText = "Yayıncı bekleniyor...";
    });

    // 4. Yayıncı bizi fark edip videoyu gönderdiğinde çalışır
    peer.on('call', (call) => {
        // Gelen aramayı kendi kameramız olmadan (boş) cevaplıyoruz
        call.answer(); 
        
        // Yayıncının videosu ulaştığında ekrana basıyoruz
        call.on('stream', (remoteStream) => {
            remoteVideo.srcObject = remoteStream;
            statusText.style.display = 'none'; // Yazıyı gizle
        });
    });

    peer.on('error', (err) => {
        console.error(err);
        statusText.innerText = "Yayıncıya ulaşılamadı. Yayın bitmiş olabilir.";
    });
}
