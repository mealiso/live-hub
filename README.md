# 🔴 Live Hub - P2P Live Streaming Platform

🌍 **Language / Dil:** [English](#english) | [Türkçe](#türkçe)

---

<a id="english"></a>
## 🇬🇧 English

Live Hub is a modern live streaming platform that works directly from browser to browser (Peer-to-Peer) without the need for any backend server. It is built on WebRTC and PeerJS technologies. It is completely free and can be hosted on static servers (e.g., GitHub Pages).

### ✨ Features

* **🎥 Multiple Stream Sources:** Broadcast using your front/rear camera or share your screen.
* **⚙️ Advanced Stream Settings:** Adjust Resolution (480p, 720p, 1080p) and FPS (15, 30, 60) based on your internet speed and hardware.
* **👁️ Real-Time Viewer Counter:** Live viewer count updated simultaneously on both the broadcaster's and viewers' screens.
* **🎛️ In-Stream Controls:** Switch the camera, mute the microphone, or turn off the video instantly without interrupting the stream.
* **🌍 Multi-Language Support:** Switch between English (EN) and Turkish (TR) with a single click (user preferences are saved in the browser).
* **💎 Modern UI:** Responsive and stylish design featuring Glassmorphism and a Dark Mode aesthetic.

### 🚀 How It Works & Usage

The project consists of two main pages: The Broadcaster Panel (`live.html`) and the Viewer Panel (`watch.html`).

1. **Starting a Stream:** The broadcaster opens `live.html`, selects the stream type and quality settings, then clicks "Start Stream".
2. **Link Sharing:** The system generates a random room ID via WebRTC/PeerJS and provides a unique watch link (e.g., `.../watch.html?room=XYZ`).
3. **Joining a Stream:** Viewers click the provided link and connect directly (P2P) to the stream without any installations or setups.

### 🔒 Permissions

To function properly, the platform requires the following browser permissions:
* **Camera Permission:** Required to broadcast your video (only when "Camera Stream" is selected).
* **Microphone Permission:** Required to broadcast your audio.
* **Screen Recording Permission:** Required to broadcast your screen/window (only when "Screen Share" is selected).
* *Note: Viewers (on watch.html) are not prompted for any hardware permissions.*

### 🛡️ Privacy Policy

Live Hub is designed with your maximum privacy in mind:
1. **Serverless & P2P:** Your video and audio data are never sent to, recorded on, or processed by any central server (Backend/Database). The data flow happens directly and encrypted between your browser and your viewers' browsers (via WebRTC).
2. **No Recordings:** Streams are not recorded or stored by the platform in any way. Once the stream ends, the data flow is completely destroyed.
3. **Cookies:** The platform does not use tracking cookies. It only utilizes your browser's local storage (`localStorage`) to remember your language preference (EN/TR) for your next visit.
4. **Data Collection:** Viewer IP addresses, identity information, or location data are not collected by us. The system operates entirely on anonymous room IDs.

### 🛠️ Technologies
* HTML5, CSS3 (Modern Glass UI)
* Vanilla JavaScript (ES6+)
* WebRTC (Media streaming)
* PeerJS (P2P signaling infrastructure)

### 💻 Installation (For Developers)
The project consists entirely of static files. You do not need Node.js or any database.
1. Clone the repository.
2. Upload the files to any web hosting service (Live Server, GitHub Pages, Vercel, Netlify).
3. You are ready to go!

---

<a id="türkçe"></a>
## 🇹🇷 Türkçe

Live Hub, herhangi bir arka plan sunucusuna (Backend) ihtiyaç duymadan, doğrudan tarayıcı üzerinden tarayıcıya (Peer-to-Peer) çalışan modern bir canlı yayın platformudur. WebRTC ve PeerJS teknolojileri üzerine inşa edilmiştir. Tamamen ücretsizdir, statik sunucularda (Örn: GitHub Pages) barındırılabilir.

### ✨ Özellikler

* **🎥 Çoklu Yayın Kaynağı:** Ön/Arka kamera ile yayın yapabilme veya ekran paylaşımı (Screen Share) yapabilme.
* **⚙️ Gelişmiş Yayın Ayarları:** İnternet hızına göre Çözünürlük (480p, 720p, 1080p) ve FPS (15, 30, 60) belirleyebilme.
* **👁️ Gerçek Zamanlı Sayaç:** Yayıncı ve izleyici ekranlarında eşzamanlı güncellenen canlı izleyici sayısı.
* **🎛️ Yayın İçi Kontroller:** Yayını kesmeden kamerayı çevirme, mikrofonu veya görüntüyü anlık olarak susturma.
* **🌍 Çoklu Dil Desteği:** Tek tıkla İngilizce (EN) ve Türkçe (TR) arasında geçiş yapabilme (Kullanıcı tercihi tarayıcıya kaydedilir).
* **💎 Modern UI:** Glassmorphism (Buzlu cam) efektli, karanlık tema (Dark Mode) odaklı şık ve duyarlı (responsive) tasarım.

### 🚀 Nasıl Çalışır & Kullanım

Proje iki ana sayfadan oluşur: Yayıncı paneli (`live.html`) ve İzleyici paneli (`watch.html`).

1. **Yayını Başlatmak:** Yayıncı `live.html` sayfasına girer. Yayın türünü ve kalite ayarlarını seçip "Yayını Başlat" butonuna tıklar.
2. **Link Paylaşımı:** Sistem, WebRTC/PeerJS üzerinden rastgele bir oda ID'si oluşturur ve ekrana bir izleme linki verir (Örn: `.../watch.html?room=XYZ`).
3. **İzlemeye Katılmak:** İzleyiciler bu linke tıkladığında hiçbir kurulum yapmadan yayına doğrudan (P2P) bağlanır ve izlemeye başlarlar.

### 🔒 İzinler

Platformun temel işlevini yerine getirebilmesi için aşağıdaki tarayıcı izinlerine ihtiyaç duyulur:
* **Kamera İzni:** Yalnızca "Kamera ile Yayın" seçeneği kullanıldığında görüntünüzü izleyicilere aktarmak için istenir.
* **Mikrofon İzni:** Yayın sırasında sesinizi izleyicilere iletmek için istenir.
* **Ekran Kaydı İzni:** Yalnızca "Ekran Paylaşımı" seçeneği kullanıldığında, seçeceğiniz pencereyi veya sekmeyi izleyicilere aktarmak için istenir.
* *Not: İzleyicilerden (watch.html sayfasında) hiçbir donanım izni istenmez.*

### 🛡️ Gizlilik Politikası

Live Hub, gizliliğinizi en üst düzeyde tutacak mimariyle tasarlanmıştır:
1. **Sunucu Yok (Serverless & P2P):** Görüntü ve ses verileriniz hiçbir merkezi sunucuya (Backend/Database) gönderilmez, kaydedilmez veya işlenmez. Veri akışı yalnızca sizin tarayıcınız ile sizi izleyen kişilerin tarayıcıları arasında (WebRTC üzerinden) doğrudan ve şifreli olarak gerçekleşir.
2. **Kayıt Tutulmaz:** Yayınlar platform tarafından hiçbir şekilde kaydedilmez veya saklanmaz. Yayın bittiği an veri akışı tamamen yok olur.
3. **Çerezler (Cookies):** Platform, sizi takip eden çerezler (tracking cookies) kullanmaz. Yalnızca seçtiğiniz dil tercihini (TR/EN) bir sonraki ziyaretinizde hatırlamak için tarayıcınızın yerel depolama alanını (`localStorage`) kullanır.
4. **Veri Toplama:** İzleyici IP adresleri, kimlik bilgileri veya konum verileri tarafımızca toplanmaz. Sistem tamamen anonim oda ID'leri üzerinden çalışır.

### 🛠️ Teknolojiler
* HTML5, CSS3 (Modern Glass UI)
* Vanilla JavaScript (ES6+)
* WebRTC (Medya aktarımı için)
* PeerJS (P2P sinyalleşme altyapısı için)

### 💻 Kurulum (Geliştiriciler İçin)
Proje tamamen statik dosyalardan oluşur. Node.js veya herhangi bir veritabanı kurmanıza gerek yoktur.
1. Depoyu klonlayın.
2. Dosyaları herhangi bir web sunucusuna (Live Server, GitHub Pages, Vercel, Netlify) yükleyin.
3. Çalıştırmaya hazırsınız!

---
> *Developed to showcase the power of modern web technologies (WebRTC & P2P).*
> 
