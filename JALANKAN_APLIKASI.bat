@echo off
title MENYALAKAN SERVER ANTRIAN RS WALUYO
echo ==================================================
echo 🏥 SEDANG MENGAKTIFKAN SERVER LOKAL RUMAH SAKIT...
echo ==================================================
echo Mohon jangan tutup jendela hitam (CMD) ini selama aplikasi digunakan!
echo ==================================================
start cmd /k "node server.js"
timeout /t 2 >nul
start http://localhost:5500/index.html