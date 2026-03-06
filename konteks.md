# Konteks Proyek

Silakan tulis di sini mengenai apa saja yang ingin Anda lakukan atau ubah dalam proyek ini.
Anda bisa menjelaskan:

Konteks Perombakan Proyek: Dari CSF Panel ke Desa Berdaya V2
Status Saat Ini: Codebase eksisting merupakan dashboard monitoring klinik yang sangat bergantung pada proses scraping otomatis (Playwright) via local worker, cron jobs, dan sinkronisasi data Zains.
Target Baru: Mengubah codebase ini menjadi sistem manajemen operasional lapangan (Desa Berdaya V2) untuk Relawan Rumah Zakat dengan arsitektur murni Serverless (Next.js 15 App Router + Neon Postgres). Fitur scraping akan dihapus sepenuhnya.

Berikut adalah panduan utama pengembangannya:

1. Tujuan Utama Proyek
Peralihan Fungsi Utilitas: Mengubah fungsi aplikasi dari alat penarik data pasif (scraper) menjadi aplikasi manajemen operasional aktif (CRUD) untuk mengelola program pembinaan desa.

Performa "Lightning Fast": Mencapai page load time < 1 detik untuk memfasilitasi Relawan yang sering bekerja di area susah sinyal.

Akurasi Keuangan (Anti-Fraud): Membangun sistem pelaporan kegiatan dan pencatatan keuangan (double-entry alokasi vs realisasi) yang 100% akurat tanpa selisih, menggantikan modul transaksi klinik lama.

Pembersihan Kode (Clean Up): Membuang direktori terkait scraping (app/api/scrap, app/api/cron untuk antrean, file konfigurasi Playwright, dan skrip scrap.js) karena beban server akan dialihkan sepenuhnya ke Vercel tanpa butuh local worker.

2. Fitur-Fitur Tambahan yang Ingin Dibuat
Modul AI KTP Scanner (OCR): Menggantikan cara input manual pasien klinik dengan sistem pemindai KTP pintar menggunakan Vercel AI SDK (Vision). Saat Relawan menambah Penerima Manfaat (PM) baru, sistem akan otomatis mengekstrak NIK, Nama, dan Alamat dari foto KTP.

Formulir Monitoring Dinamis (JSONB): Pembuatan form laporan bulanan yang bentuknya berubah otomatis sesuai tipe PM (Kesehatan Lansia, Ibu Hamil, Balita/Stunting, dan Ekonomi), memanfaatkan fleksibilitas kolom JSONB di PostgreSQL.

Sistem Penyimpanan Bukti (Vercel Blob): Mengintegrasikan sistem upload foto untuk bukti kwitansi pengeluaran dan foto kegiatan Relawan secara langsung, menggantikan unggahan mutasi bank (batch upload) pada sistem lama.

Client-Side Report Generation: Pembuatan PDF laporan kegiatan dan ekspor rekapan Excel yang di- generate langsung di sisi browser pengguna untuk menghemat pemakaian resource server.

3. Penyesuaian UI/UX atau Dashboard yang Diperlukan
Navigasi Baru: Merombak sidebar dan menu. Menu lama seperti pasien, klinik, dan transaksi diganti menjadi Desa Binaan, Penerima Manfaat, Kegiatan & Keuangan, dan Monitoring Bulanan.

Pendekatan Mobile-First: Karena target pengguna utama adalah Relawan dan Korwil di lapangan, seluruh komponen UI (menggunakan Tailwind & Shadcn UI yang sudah ada) harus diprioritaskan tampil sempurna dan mudah diklik dari layar smartphone.

UX Cepat Terhadap Kendala Jaringan: Mengoptimalkan Skeleton Loading (pengganti spinner yang menghalangi layar) saat memuat data dari database, dan memberikan balasan visual cepat (Toast / Sonner) setiap kali Relawan selesai menyimpan data.

Dashboard Visual (Recharts): Merombak halaman summary-dashboard dan summary-se menjadi grafik serapan anggaran, tren pertumbuhan omzet binaan, dan status gizi balita yang ditujukan untuk role Monev dan Program Head.

4. Aturan Bisnis (Business Logic) Spesifik Lainnya
Hierarki Self-Referencing User: Modifikasi tabel autentikasi dan otorisasi. Role tidak lagi statis. Korwil pada dasarnya adalah pengguna dengan role RELAWAN namun memiliki status is_korwil = true. Hal ini memberinya akses ganda: bisa membina desa (sebagai Relawan) sekaligus memvalidasi laporan dari Relawan lain di bawah pengawasannya (sebagai Korwil). Keduanya diawasi oleh akun MONEV.

Constraint Wilayah & Penugasan: Setiap entitas PM (Penerima Manfaat) tidak berdiri sendiri, melainkan wajib terikat secara ketat pada sebuah wilayah (Provinsi -> Kota -> Kecamatan -> Desa) dan diawasi oleh spesifik ID Relawan/Korwil yang ditugaskan di desa_berdaya tersebut.

Logika Keuangan Mutlak: Relawan tidak bisa menginput laporan kegiatan (pengeluaran) jika nominalnya melebihi Sisa Dana (Alokasi). Jika ada sisa saldo di akhir bulan (End of Month Closing), sistem wajib mewajibkan Relawan untuk mengunggah bukti pengembalian dana (Refund).

Integrasi ZAINS (Masa Depan): Logika sinkronisasi Zains API yang lama (lib/services/zains-sync.ts dan app/api/sync-transactions-to-zains) jangan dihapus total, namun disimpan dan diadaptasi. Fungsinya akan diubah dari sinkronisasi "transaksi klinik" menjadi sinkronisasi "laporan pencairan dana & refund" dari Desa Berdaya ke sistem ZAINS FINS pusat.