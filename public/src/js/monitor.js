const socket = io();

// Jam Digital Ruang Tunggu
setInterval(() => {
    document.getElementById('jam').textContent = new Date().toLocaleTimeString('id-ID');
}, 1000);

// Aktifkan Izin Audio via Klik User
document.body.addEventListener('click', () => {
    console.log("Izin audio diaktifkan.");
});

// Update data real-time di layar TV
socket.on('updateData', (data) => {
    ['UMUM', 'GIGI', 'ANAK'].forEach(poli => {
        document.getElementById(`tv-${poli}`).textContent = data.counters[poli].active;
        document.getElementById(`tv-doc-${poli}`).textContent = data.counters[poli].petugas;
    });
});

// Mainkan Efek Bel Suara saat ada panggilan lewat LAN
socket.on('suaraBel', (data) => {
    const bel = new Audio('/public/assets/audio/bel.mp3');
    bel.play().catch(e => console.log("Gagal memutar audio otomatis, perlu klik layar 1x terlebih dahulu."));
});