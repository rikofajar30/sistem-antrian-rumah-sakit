const socket = io();
const username = localStorage.getItem('petugas_user');
const poliTujuan = localStorage.getItem('petugas_poli');

// Kick ke portal jika mencoba masuk tanpa milih Poli
if (!username || !poliTujuan) {
    window.location.href = '/index.html';
}

document.getElementById('nama-petugas').textContent = `${username} (${poliTujuan})`;

// Sinkronisasi data nomor antrian spesifik poli milik sang dokter
socket.on('updateData', (data) => {
    document.getElementById('adm-nomor').textContent = data.counters[poliTujuan].active;
});

function mintaKonfirmasi() {
    document.getElementById('modal-konfirmasi').classList.remove('hidden');
}

function batalPanggil() {
    document.getElementById('modal-konfirmasi').classList.add('hidden');
}

function eksekusiPanggil() {
    socket.emit('panggilBerikutnya', { poli: poliTujuan, username: username });
    document.getElementById('modal-konfirmasi').classList.add('hidden');
}

function selesaiLayani() {
    socket.emit('selesaiPenanganan', { poli: poliTujuan });
}

function keluarSistem() {
    localStorage.clear();
    window.location.href = '/index.html';
}

socket.on('notifikasi', (msg) => alert(msg));
socket.on('notifikasiSelesai', (msg) => alert(msg));