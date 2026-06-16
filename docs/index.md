# 🏥 Dokumentasi Resmi Sistem Antrian LAN RS Waluyo

Selamat datang di portal dokumentasi resmi Sistem Antrian Rumah Sakit Waluyo. Dokumentasi ini disusun untuk memberikan panduan lengkap mengenai gambaran umum sistem, alur fitur, serta konfigurasi teknis bagi pengguna dan pengembang yang di-hosting langsung melalui GitHub Pages.

---

## 1. Gambaran Umum Sistem

### Nama Sistem
**Sistem Antrian LAN Terdistribusi RS Waluyo (Anti-Blackout Version)**

### Tujuan dan Manfaat Sistem
* **Tujuan:** Mengotomatisasi proses pengambilan dan pemanggilan nomor antrian pasien di poliklinik secara *real-time* tanpa ketergantungan pada koneksi internet luar (murni berbasis intranet/LAN).
* **Manfaat:** Mengurangi penumpukan antrian fisik di loket, memberikan estimasi panggilan yang transparan bagi pasien lewat monitor ruang tunggu, serta memudahkan tenaga medis (dokter) dalam memanggil pasien secara teratur hanya melalui perangkat genggam (HP).

### Target Pengguna
1. **Pasien:** Pengguna kios tablet/HP ambil tiket antrian di lobi utama.
2. **Petugas Medis / Dokter:** Pengguna dashboard kontrol pemanggilan antrian di masing-masing poliklinik menggunakan HP dokter.
3. **Pengunjung / Umum:** Pengamat papan layar monitor TV utama di ruang tunggu.

### Fitur-Fitur Utama yang Tersedia
* **Kios Tiket Multi-Poli:** Sistem penomoran otomatis dengan pemisahan kode unik per poli (Poli Umum = A, Poli Gigi = B, Poli Anak = C).
* **Real-Time WebSocket Sync:** Sinkronisasi instan antar perangkat (HP Pasien, HP Dokter, TV) menggunakan teknologi `Socket.io`.
* **Voice Announcement System:** Fitur pemanggilan otomatis berbasis suara bel digital yang keluar langsung dari browser TV ruang tunggu setelah mengklik layar pertama kali.
* **Anti-Blackout Storage:** Penyimpanan data berbasis *File System Persistent Storage* (`fs`) yang menjamin nomor antrian hari berjalan tidak hilang jika terjadi mati lampu atau pemadaman listrik secara tiba-tiba pada laptop server.
* **Auto-Reset System:** Pembersihan dan pengosongan nomor antrian otomatis kembali ke angka dasar (`000`) setiap kali mendeteksi pergantian hari (tanggal baru).

---

## 2. Panduan Penggunaan Fitur Secara Terurut (Sequential Steps)

Berikut adalah panduan alur operasional sistem yang berjalan berurutan berdasarkan diagram alir (*workflow*) sistem:

### Langkah 1: Pengambilan Tiket oleh Pasien (Kios Pasien)
1. Pasien mendatangi tablet/HP Kios Antrian di lobi rumah sakit (Akses: `http://IP_SERVER:5500/public/kios.html`).
2. Pasien memilih salah satu tombol poliklinik yang dituju (Umum, Gigi, atau Anak).
3. Sistem akan memproses data, menyimpan nomor ke database fisik server, dan menampilkan struk digital nomor antrian baru (Contoh: **A-001** untuk Umum, **B-001** untuk Gigi).

### Langkah 2: Pemantauan Layar Ruang Tunggu (Monitor Utama)
1. Di ruang tunggu, Smart TV atau monitor utama membuka halaman monitor (Akses: `http://IP_SERVER:5500/public/monitor.html`).
2. Petugas melakukan klik 1x di area mana saja pada layar TV saat pertama kali dibuka untuk mengaktifkan izin suara (*Autoplay Policy Browser*).
3. Setiap kali ada tiket baru diambil dari Langkah 1, data antrian menunggu pada layar TV akan langsung terupdate secara otomatis.

### Langkah 3: Pemanggilan Pasien oleh Tenaga Medis (Dashboard Dokter)
1. Dokter membuka HP masing-masing dan mengakses portal medis (Akses: `http://IP_SERVER:5500` -> Masuk Panel Medis).
2. Dokter memilih poliklinik tempatnya bertugas untuk mengunci sesi pemanggilan.
3. Dokter menekan tombol **"🔊 Panggil Selanjutnya"**.
4. **Reaksi Sistem:** 
   * Server Node.js mencari antrian berkode sesuai poli dokter yang berstatus 'menunggu'.
   * Mengubah statusnya menjadi 'dipanggil' dan mengamankannya ke dalam file `antrian.json`.
   * Memancarkan sinyal ke TV Monitor untuk berkedip menampilkan nomor tersebut dan memicu bunyi suara bel *"Ding Dong"*.

### Langkah 4: Penyelesaian Penanganan Pasien
1. Setelah pemeriksaan pasien selesai, dokter menekan tombol **"Selesai Penanganan"** di HP-nya.
2. Status antrian pasien tersebut diubah menjadi 'selesai' di dalam sistem, dan indikator loket TV akan menampilkan tanda `SELESAI` hingga dokter memanggil urutan berikutnya.

---

## 3. Tim Pengembang Proyek

Proyek perangkat lunak ini dikembangkan secara kolaboratif oleh Tim Pengembang RS Waluyo:
* **Fullstack Developer & System Architecture:** RIKO
* **Frontend UI/UX Designer (Mobile & TV):** IRMA,WIDYA,MUTAMIMMAH
* **Quality Assurance & Documentation:** RIYAD

*Sistem ini dibangun untuk memenuhi Tugas Besar mata kuliah Proyek Perangkat Lunak.*