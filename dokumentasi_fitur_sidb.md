# Sistem Informasi Desa Berdaya (SIDB) - Dokumentasi Fitur Utama

Sistem Informasi Desa Berdaya (SIDB) adalah sebuah platform manajemen terpadu berbasis web yang dirancang khusus untuk memonitor, mengelola, dan melaporkan seluruh kegiatan pemberdayaan desa secara transparan dan sistematis.

Berikut adalah penjelasan lengkap mengenai fitur-fitur dan modul utama yang tersedia di sistem ini:

## 1. Manajemen Entitas Utama (Master Data)
Modul ini bertugas sebagai basis data dasar untuk operasional program.
* **Desa Binaan (`/desa`)**: Mengelola profil desa-desa target pemberdayaan beserta relawan/fasilitator yang ditugaskan di desa tersebut.
* **Penerima Manfaat (`/pm`)**: Basis data lengkap untuk mencatat individu atau keluarga yang menerima bantuan program (termasuk NIK, alamat, kondisi keluarga, dll).
* **Kelompok (`/kelompok`)**: Fitur untuk mengelompokkan Penerima Manfaat ke dalam unit-unit atau paguyuban di suatu desa untuk mempermudah monitoring.
* **Master Program (`/master-program`)**: Katalog yang berisi daftar seluruh program pemberdayaan yang tersedia (seperti program pendidikan, ekonomi, sarana infrastruktur, atau kesehatan).

## 2. Perencanaan & Alokasi (Planning)
* **Intervensi Program (`/intervensi`)**: Merupakan "jantung" perencanaan sistem. Di sini manajemen mengalokasikan suatu program (dari Master Program) ke Desa tertentu, menentukan anggarannya, serta bulan pelaksanaannya. Terdapat fitur **Import Massal Excel** untuk mendistribusikan 1 jenis program ke banyak desa dan banyak bulan sekaligus dalam satu kali proses.

## 3. Pelaporan & Realisasi (Reporting)
Modul untuk memastikan akuntabilitas program di lapangan.
* **Laporan Kegiatan (`/laporan-kegiatan`)**: Tempat bagi Relawan di lapangan untuk melaporkan bukti fisik dan dokumentasi bahwa suatu kegiatan intervensi telah benar-benar dilaksanakan.
* **Laporan Keuangan Intervensi (`/laporan-keuangan-intervensi`)**: Sistem pelaporan finansial (Cash Advance / CA). Relawan mengunggah bukti nota pengeluaran operasional. Laporan ini kemudian akan diperiksa dan **diverifikasi** oleh tim *Finance/Admin* di pusat.
* **Rekap Penyaluran (`/rekap-penyaluran`)**: Rangkuman komprehensif mengenai status dana yang telah disalurkan, riwayat realisasi anggaran, dan pelacakan sisa atau pengembalian dana.

## 4. Monitoring Perkembangan Dampak (Monev)
* **Update Ekonomi (`/ekonomi`)**: Melacak metrik perkembangan ekonomi dari setiap Penerima Manfaat secara berkala (misalnya memantau omzet bulanan, modal usaha, fluktuasi pendapatan, dan jumlah tanggungan).
* **Update Kesehatan (`/kesehatan`)**: Memantau status dan perkembangan kesehatan bagi Penerima Manfaat yang menjadi peserta khusus di program kesehatan.

## 5. Analitik & Dashboard (Dashboarding)
* **Summary Dashboard & Chart (`/summary-dashboard`, `/summary-se`)**: Menyajikan grafik interaktif, agregat angka capaian, dan peta statistik geografis (*Super Admin Map*) yang memberikan wawasan performa (*helicopter view*) kepada para pimpinan/manajemen atas seluruh portofolio program yang sedang berjalan.
* **Monitoring (`/monitoring`)**: Memantau *progress* atau keaktifan laporan dari relawan dan pencapaian target harian/bulanan secara *real-time*.

## 6. Manajemen Organisasi & Pengguna
* **Manajemen Tim & Struktur (`/manajemen-tim`, `/struktur-tim`)**: Mengatur pembuatan akun pengguna dengan *Role-Based Access Control* (membedakan hak akses Admin, Tim Monev, Relawan, Korwil, Finance, dan Office). Sistem ini juga memetakan hierarki (siapa melapor ke siapa, misalnya Relawan dibawahi oleh spesifik Korwil).
* **Konfigurasi & Settings**: Pengaturan variabel sistem secara umum dan pemeliharaan aplikasi.

---

## ✨ Fitur Unggulan Antarmuka (UX)
Untuk mempermudah penggunaan (*User Experience*), sistem ini dilengkapi standarisasi fitur di hampir semua tabel data:

1. **Sistem *Grouping* Dinamis (Group By)**: Pengguna dapat mengelompokkan data tabel hingga berlapis-lapis (misal: di-group berdasarkan *Bulan*, lalu di dalamnya di-group lagi berdasarkan *Desa*). Grup susunan ini dapat disimpan secara permanen sebagai **"Favorit Grouping"** untuk mempercepat proses akses data keesokan harinya.
2. **Filter Massal Berjenjang**: Sistem filter *checkbox multi-select* dinamis yang sangat ringkas di sisi atas tabel untuk mengisolasi data spesifik secara efisien tanpa memenuhi layar.
3. **Ekspor & Impor Excel**: Fleksibilitas *import* data secara curah (ribuan baris) sekaligus kemampuan *export* data langsung ke spreedsheet format `.xlsx` untuk pengolahan lebih lanjut.
4. **Alur Verifikasi (*Approval Workflow*)**: Berbagai laporan krusial dilindungi status transisi berlapis (contoh: *Pending* ➔ *Selesai* atau *Draft* ➔ *Diverifikasi*) yang mengunci data agar tidak diubah sembarangan setelah disetujui oleh atasan.
