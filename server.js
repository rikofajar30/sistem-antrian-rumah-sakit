import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; // Modul bawaan Node.js untuk tulis-baca file ke Harddisk

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Menyajikan folder utama proyek dan folder public sebagai static file server
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Path lokasi file penyimpanan di harddisk
const FILE_PATH = path.join(__dirname, 'antrian.json');

// Struktur data default jika file belum ada
const DATA_DEFAULT = {
    tanggal: new Date().toDateString(), // Untuk validasi reset harian
    history: [],
    counters: {
        UMUM: { current: 0, active: '000', prefix: 'A', petugas: '-' },
        GIGI: { current: 0, active: '000', prefix: 'B', petugas: '-' },
        ANAK: { current: 0, active: '000', prefix: 'C', petugas: '-' }
    }
};

// Melakukan Deep Copy agar data default asli tidak rusak/termodifikasi saat operasional berjalan
let dataAntrian = JSON.parse(JSON.stringify(DATA_DEFAULT));

// ==========================================
// FUNGSI PENYELAMAT DATA (ANTI MATI LAMPU)
// ==========================================

// 1. Fungsi memuat data dari Harddisk saat server baru dinyalakan
function muatDataDariHarddisk() {
    try {
        if (fs.existsSync(FILE_PATH)) {
            const fileData = fs.readFileSync(FILE_PATH, 'utf-8');
            const dataTersimpan = JSON.parse(fileData);

            // Cek apakah data yang tersimpan masih di hari yang sama
            if (dataTersimpan.tanggal === new Date().toDateString()) {
                dataAntrian = dataTersimpan;
                console.log('💾 [SISTEM] Data antrian hari ini berhasil dipulihkan dari Harddisk!');
            } else {
                // PERBAIKAN: Spasi pada nama variabel dataBaruHari sudah dihapus
                const dataBaruHari = JSON.parse(JSON.stringify(DATA_DEFAULT));
                simpanDataKeHarddisk(dataBaruHari);
                dataAntrian = dataBaruHari;
                console.log('🌅 [SISTEM] Hari baru terdeteksi. Antrian di-reset otomatis.');
            }
        } else {
            simpanDataKeHarddisk(DATA_DEFAULT);
        }
    } catch (error) {
        console.error('❌ Gagal membaca data cadangan:', error);
    }
}

// 2. Fungsi menulis data ke Harddisk setiap kali ada perubahan
function simpanDataKeHarddisk(data) {
    try {
        fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('❌ Gagal menyimpan data ke Harddisk:', error);
    }
}

// Jalankan pemulihan data tepat saat server start
muatDataDariHarddisk();

// ==========================================
// LOGIKA UTAMANYA (SOCKET.IO)
// ==========================================

io.on('connection', (socket) => {
    socket.emit('updateData', dataAntrian);

    // Pasien Ambil Nomor Antrian
    socket.on('ambilTiket', ({ poli }) => {
        let p = dataAntrian.counters[poli];
        p.current += 1;
        const nomorTiket = `${p.prefix}-${String(p.current).padStart(3, '0')}`;

        dataAntrian.history.push({
            id: Date.now(),
            poli: poli,
            nomor: nomorTiket,
            status: 'menunggu'
        });

        // Amankan ke Harddisk lalu siarkan ke jaringan
        simpanDataKeHarddisk(dataAntrian);
        io.emit('updateData', dataAntrian);
        socket.emit('cetakTiketBerhasil', nomorTiket);
    });

    // Dokter Panggil Pasien
    socket.on('panggilBerikutnya', ({ poli, username }) => {
        let history = dataAntrian.history;
        let tiketBerikutnya = history.find(t => t.poli === poli && t.status === 'menunggu');

        if (tiketBerikutnya) {
            tiketBerikutnya.status = 'dipanggil';
            tiketBerikutnya.oleh = username;

            dataAntrian.counters[poli].active = tiketBerikutnya.nomor;
            dataAntrian.counters[poli].petugas = username;

            simpanDataKeHarddisk(dataAntrian); // Amankan ke Harddisk
            io.emit('updateData', dataAntrian);
            io.emit('suaraBel', { poli: poli, nomor: tiketBerikutnya.nomor });
        } else {
            socket.emit('notifikasi', `Antrian Poli ${poli} sudah habis.`);
        }
    });

    // Menandai Pasien Selesai
    socket.on('selesaiPenanganan', ({ poli }) => {
        let history = dataAntrian.history;
        let tiketAktif = history.find(t => t.poli === poli && t.status === 'dipanggil');

        if (tiketAktif) {
            tiketAktif.status = 'selesai';
            dataAntrian.counters[poli].active = 'SELESAI';

            simpanDataKeHarddisk(dataAntrian); // Amankan ke Harddisk
            io.emit('updateData', dataAntrian);
            socket.emit('notifikasiSelesai', 'Status pasien berhasil diubah menjadi Selesai.');
        } else {
            socket.emit('notifikasi', 'Tidak ada pasien aktif yang sedang dipanggil.');
        }
    });
});

const PORT = 5500;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`🏥 SERVER ANTRIAN ANTI-BLACKOUT (PORT ${PORT}) AKTIF`);
    console.log(`==================================================`);
    console.log(`Data aman di harddisk: ${FILE_PATH}`);
    console.log(`==================================================\n`);
});