const videoElement = document.getElementById('liveVideo');
const startBtn = document.getElementById('startBtn');
const linkContainer = document.getElementById('linkContainer');
const shareLinkInput = document.getElementById('shareLink');

let localStream;
let peer;

async function startStream() {
    // Butona basıldığında durumu güncelleyelim
    startBtn.disabled = true;
    startBtn.innerText = "Kamera Açılıyor...";

    try {
        // 1. Önce mobil cihazlar için en stabil olan "ön kamera" ayarını deniyoruz
        const mobileConstraints = {
            video: { facingMode: "user" },
            audio: true
        };

        try {
            // İlk deneme
            localStream = await navigator.mediaDevices.getUserMedia(mobileConstraints);
        } catch (firstError) {
            console.warn("Özel kamera ayarı başarısız, standart ayarlarla deneniyor...", firstError);
            // 2. Eğer üstteki ayar hata verirse (bazı cihazlar desteklemez), en basit haliyle tekrar dene
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }

        // Kamera başarıyla açıldıysa videoyu ekrana ver
        videoElement.srcObject = localStream;

        // PeerJS ile bağlantıyı kur (Rastgele ID alır)
        peer = new Peer(); 

        peer.on('open', (id) => {
            // Linki oluştur ve ekranda göster
            const watchUrl = `https://mealiso.github.io/live-hub/watch.html?room=${id}`;
            shareLinkInput.value = watchUrl;
            linkContainer.style.display = 'block';
            startBtn.innerText = "Yayın Devam Ediyor...";
        });

        // İzleyici odaya bağlandığında çalışır
        peer.on('connection', (conn) => {
            console.log("Yeni bir izleyici bağlandı:", conn.peer);
            // İzleyiciye kamera ve ses yayınımızı (localStream) gönderiyoruz
            peer.call(conn.peer, localStream);
        });

    } catch (err) {
        // Hata durumunda butonu tekrar aktif edelim
        startBtn.disabled = false;
        startBtn.innerText = "Tekrar Dene";
        
        console.error("Kamera açılamadı detaylı hata:", err);
        
        // Hatanın ne olduğunu tam olarak tespit edip kullanıcıya söylüyoruz
        let errorMessage = "Kameraya erişilemedi.\n\nSEBEP: ";
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMessage += "Tarayıcı ayarlarına girip bu site için Kamera ve Mikrofon iznini kapattınız. Lütfen izin verin.";
        } else if (err.name === 'NotFoundError') {
            errorMessage += "Cihazınızda çalışır durumda bir kamera veya mikrofon bulunamadı.";
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            errorMessage += "Kamera veya mikrofonunuz şu an başka bir uygulama (WhatsApp, Instagram, Telefon görüşmesi vb.) tarafından kullanılıyor. Lütfen o uygulamayı arka planda kapatıp tekrar deneyin.";
        } else {
            errorMessage += err.name + " - " + err.message;
        }
        
        alert(errorMessage);
    }
}

// Butona tıklanma olayını dinle
startBtn.addEventListener('click', startStream);
