# 🏥 Dokumentasi Resmi Sistem Antrian LAN RS Waluyo

Selamat datang di portal dokumentasi resmi Sistem Antrian Rumah Sakit Waluyo. Dokumentasi ini disusun untuk memberikan panduan lengkap mengenai gambaran umum sistem, alur fitur, serta konfigurasi teknis bagi pengguna dan pengembang yang di-hosting langsung melalui GitHub Pages maupun implementasi lokal (*Intranet*).

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
* **Real-Time WebSocket Sync:** Sinkronisasi instan dua arah antar perangkat (HP Pasien, HP Dokter, TV Monitor) menggunakan teknologi `Socket.io` melalui event khusus `updateData`.
* **Voice Announcement System:** Fitur pemanggilan otomatis berbasis suara bel digital (`suaraBel`) yang keluar langsung dari browser TV ruang tunggu setelah mengklik layar pertama kali untuk memicu izin interaksi audio.
* **Anti-Blackout Storage:** Penyimpanan data berbasis *File System Persistent Storage* (`fs.writeFileSync`) ke dalam file `antrian.json` yang menjamin nomor antrian hari berjalan tidak hilang jika terjadi mati lampu atau pemadaman listrik secara tiba-tiba pada laptop server.
* **Auto-Reset System:** Pembersihan dan pengosongan nomor antrian otomatis kembali ke angka dasar (`000`) setiap kali mendeteksi pergantian hari (`new Date().toDateString()`) saat server di-restart di hari baru.

---

## 2. Panduan Penggunaan Fitur Secara Terurut (Sequential Steps)

Berikut adalah panduan alur operasional sistem yang berjalan berurutan berdasarkan diagram alir (*workflow*) sistem:

### Langkah 1: Pengambilan Tiket oleh Pasien (Kios Pasien)
1. Pasien mendatangi tablet/HP Kios Antrian di lobi rumah sakit (Akses lokal: `http://IP_SERVER:5500/public/kios.html`).
2. Pasien memilih salah satu tombol poliklinik yang dituju (**UMUM**, **GIGI**, atau **ANAK**).
3. Sisi client memicu event `ambilTiket` via WebSocket. Server memproses data, menaikkan angka variabel `.current`, membuat kode string (Contoh: **A-001** untuk Umum, **B-001** untuk Gigi, **C-001** untuk Anak), memasukkan objek ke array `history` dengan status `'menunggu'`, lalu menyimpannya ke dalam file harddisk `antrian.json`.

### Langkah 2: Pemantauan Layar Ruang Tunggu (Monitor Utama)
1. Di ruang tunggu, Smart TV atau monitor utama membuka halaman monitor (Akses lokal: `http://IP_SERVER:5500/public/monitor.html`).
2. Petugas melakukan klik 1x di area mana saja pada layar TV saat pertama kali dibuka untuk mengaktifkan izin suara (*Autoplay Policy Browser*).
3. Setiap kali ada tiket baru diambil dari Langkah 1, server akan menyiarkan event `updateData` ke seluruh jaringan sehingga indikator antrian pada TV ter-update secara instan.

### Langkah 3: Pemanggilan Pasien oleh Tenaga Medis (Dashboard Dokter)
1. Dokter membuka HP masing-masing dan mengakses portal medis (Akses lokal: `http://IP_SERVER:5500`).
2. Dokter melakukan login dengan memasukkan nama petugas dan memilih bidang poliklinik tempatnya bertugas (**UMUM**, **GIGI**, atau **ANAK**). Sesi ini akan dikunci di `localStorage` (`petugas_user` dan `petugas_poli`).
3. Pada halaman `admin.html`, dokter dapat melihat total antrian yang telah diambil di kios melalui indikator **Total Antrian Diambil Kios** (`infoPoliAktif.current`).
4. Dokter menekan tombol **"🔊 Panggil Selanjutnya"** yang memicu fungsi `mintaKonfirmasi()` untuk memunculkan modal validasi. Ketika dokter mengklik **"Ya, Panggil"**, sistem mengeksekusi event `panggilBerikutnya`.
5. **Reaksi Sistem:** * Server Node.js mencari antrian berkode sesuai poli dokter yang berstatus `'menunggu'` di dalam array `history`.
   * Mengubah statusnya menjadi `'dipanggil'` dan mencatat nama pemanggil (`oleh = username`).
   * Memperbarui objek `dataAntrian.counters[poli]` untuk mengubah nilai `.active` menjadi nomor antrian pasien baru dan `.petugas` menjadi nama dokter bersangkutan.
   * Mengamankan data ter-update ke file `antrian.json`.
   * Memancarkan sinyal `updateData` untuk memperbarui teks nomor di layar dokter dan TV, serta memicu event `suaraBel` ke monitor ruang tunggu untuk membunyikan bel panggilah *"Ding Dong"*.

### Langkah 4: Penyelesaian Penanganan Pasien
1. Setelah pemeriksaan medis pasien selesai dilakukan, dokter menekan tombol **"✅ Selesai Ditangani"** di HP-nya.
2. Sisi client mengirimkan sinyal `selesaiPenanganan` ke server.
3. Server mencari tiket yang berstatus `'dipanggil'` pada poli tersebut, mengubah statusnya menjadi `'selesai'`, dan memperbarui variabel tampilan nomor aktif pada poli terkait menjadi teks **`SELESAI`**.
4. Data diamankan kembali ke harddisk (`antrian.json`) dan disiarkan secara *real-time* ke seluruh layar monitor.

---

## 3. Spesifikasi Arsitektur Data (Teknis Backend & Frontend)

### Struktur Penyimpanan Objek JSON (`antrian.json`)
Sistem menggunakan struktur data terpusat tunggal untuk mempermudah sinkronisasi state antar komponen:
```json
{
  "tanggal": "Tue Jun 16 2026",
  "history": [
    {
      "id": 1718548200000,
      "poli": "UMUM",
      "nomor": "A-001",
      "status": "selesai",
      "oleh": "DR. BUDI"
    }
  ],
  "counters": {
    "UMUM": { "current": 1, "active": "SELESAI", "prefix": "A", "petugas": "DR. BUDI" },
    "GIGI": { "current": 0, "active": "000", "prefix": "B", "petugas": "-" },
    "ANAK": { "current": 0, "active": "000", "prefix": "C", "petugas": "-" }
  }
}