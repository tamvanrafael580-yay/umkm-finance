# UMKM Finance

Aplikasi web sederhana untuk pencatatan transaksi tiga UMKM:
- Kantin Kampus
- Es Kacang Merah
- Warung Jajanan

## Fitur
- Dashboard pemasukan, pengeluaran, selisih kas, dan jumlah transaksi.
- Filter jenis UMKM dan bulan.
- Form transaksi dengan kategori dinamis.
- Riwayat transaksi dan hapus transaksi.
- Ekspor CSV.
- Ringkasan bulanan September-November 2026.
- Mode demo localStorage jika Firebase belum dikonfigurasi.
- Dukungan Firestore untuk menyimpan data secara online.

## Menjalankan demo lokal
Karena aplikasi memakai JavaScript module, jalankan melalui server lokal (bukan membuka index.html langsung).
1. Instal Node.js jika belum ada.
2. Buka terminal di folder ini.
3. Jalankan `npx serve .`
4. Buka alamat localhost yang ditampilkan terminal.

Alternatif: gunakan ekstensi Live Server di VS Code lalu pilih `Open with Live Server`.

Mode demo menyimpan data hanya pada browser/perangkat tersebut. Data demo tidak tersinkron antarperangkat.

## Mengaktifkan database online Firebase
1. Masuk ke https://console.firebase.google.com/ dan buat project.
2. Tambahkan aplikasi Web di Project settings, lalu salin konfigurasi SDK.
3. Isi nilai di `firebase-config.js`.
4. Di Build > Firestore Database, buat database.
5. Untuk penggunaan multi-perangkat dengan aman, aktifkan Firebase Authentication (misalnya Email/Password), tambahkan halaman login, lalu terapkan Firestore Security Rules.
6. Jangan gunakan aturan database yang mengizinkan semua orang membaca/menulis data. File `firestore.rules.example` hanya contoh dasar yang mensyaratkan pengguna login.
7. Hosting dapat menggunakan Firebase Hosting, Netlify, atau layanan statis lain. Unggah seluruh file proyek.

## Catatan penting
Versi ini adalah prototipe pencatatan kas, bukan sistem akuntansi penuh. Pemasukan/pengeluaran kas tidak otomatis sama dengan pendapatan/beban akrual. Belum tersedia jurnal debit-kredit, persediaan/HPP, piutang/utang terperinci, saldo awal, dan autentikasi siap pakai. Jangan menganggap laporan sebagai laporan keuangan resmi sebelum fungsi tersebut ditambahkan dan diuji.

Data tiap UMKM diberi label `business` dan dapat difilter, tetapi versi awal memakai satu koleksi transaksi bersama. Untuk data bisnis yang benar-benar terisolasi, tambahkan aturan akses dan struktur database per organisasi.
