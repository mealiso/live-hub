// HTML'deki elementleri seçiyoruz
const videoElement = document.getElementById('liveVideo');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

// Medya akışını (stream) tutacağımız değişken
let localStream;

// Yayını Başlatma Fonksiyonu
async function startStream() {
    try {
        // Kullanıcıdan kamera ve mikrofon izni istiyoruz
        const constraints = {
            video: true,
            audio: true
        };

        // Kameradan gelen veriyi alıyoruz
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Gelen akışı (stream) video elementine bağlıyoruz
        videoElement.srcObject = localStream;

        // Buton durumlarını güncelliyoruz
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        console.log("Kamera ve mikrofon başarıyla açıldı, yayın hazır.");

    } catch (error) {
        console.error("Medyaya erişilirken hata oluştu:", error);
        alert("Kamera veya mikrofona erişilemedi. Lütfen izinleri kontrol edin.");
    }
}

// Yayını Durdurma Fonksiyonu
function stopStream() {
    if (localStream) {
        // Akıştaki tüm yolları (video ve ses track'lerini) tek tek durduruyoruz
        const tracks = localStream.getTracks();
        tracks.forEach(track => track.stop());

        // Video elementini temizliyoruz
        videoElement.srcObject = null;

        // Buton durumlarını güncelliyoruz
        startBtn.disabled = false;
        stopBtn.disabled = true;

        console.log("Yayın durduruldu.");
    }
}

// Butonlara tıklanma olaylarını (event listener) ekliyoruz
startBtn.addEventListener('click', startStream);
stopBtn.addEventListener('click', stopStream);
