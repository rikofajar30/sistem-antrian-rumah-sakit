const socket = io();

function ambilAntrian(poli) {
    socket.emit('ambilTiket', { poli: poli });
}

socket.on('cetakTiketBerhasil', (nomorTiket) => {
    document.getElementById('no-tiket').textContent = nomorTiket;
    document.getElementById('modal-tiket').classList.remove('hidden');
    console.log(`[PRINTER OUT] Mencetak struk tiket: ${nomorTiket}`);
});

function tutupTiket() {
    document.getElementById('modal-tiket').classList.add('hidden');
}