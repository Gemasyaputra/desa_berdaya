# 🚀 Rencana Fitur Baru

## 1. Nama Fitur / Modul
Modul Action Plan & Integrasi Intervensi Program (SIDB)

## 2. Deskripsi Singkat
Fitur untuk mendigitalisasi proses perencanaan (Action Plan) dari format *spreadsheet* ke dalam sistem SIDB. Fitur ini memungkinkan Relawan Inspirasi (RI) mengajukan Rencana Anggaran Biaya (RAB) dan target Penerima Manfaat (PM) secara dinamis sesuai kategori program (Ekonomi, Kesehatan, Lingkungan, Pendidikan). Setelah disetujui (Approved) oleh Monev Pusat, data Action Plan ini akan terhubung langsung sebagai rujukan wajib saat RI menginput laporan realisasi penyaluran dana (Intervensi).

## 3. Kebutuhan Pengguna (User Story) / Flow
- **Role:** Relawan Inspirasi (RI)
- **Alur (Action Plan):** RI mengakses menu Tambah Action Plan -> Memilih Program -> Mengisi field spesifik (Kapasitas, Jenis Sampah, Keterangan SE, dll) -> Menginput baris detail RAB (Bulan, Uraian, Nominal) -> Memilih target PM dari database (khusus Ekonomi) -> Submit ajuan (berstatus *Waiting Approval*).
- **Alur (Intervensi):** RI mengakses menu Tambah Intervensi -> Memilih Action Plan yang sudah *Approved* -> Memilih spesifik Aktivitas RAB yang akan direalisasikan -> Mengisi nominal aktual, tanggal, dan upload bukti CA -> Submit laporan intervensi.

- **Role:** Monev Pusat
- **Alur:** Mengakses daftar ajuan Action Plan dari berbagai RI -> Mereview detail RAB dan target PM -> Memberikan keputusan berupa *Approve* (disetujui) atau *Revision* (dikembalikan ke RI beserta catatan perbaikan).

## 4. Kebutuhan Database (Opsional)
- **Tabel Baru:**
  - `action_plans`: Tabel induk perencanaan (berisi `ri_id`, `desa_id`, `program_id`, `tahun_aktivasi`, `status`, `total_ajuan`, serta kolom opsional seperti `keterangan_se`, `jenis_sampah`, `kapasitas_pengelolaan`, `jumlah_pengajar`).
  - `action_plan_activities`: Tabel rincian RAB (berisi `action_plan_id`, `bulan_implementasi`, `uraian_kebutuhan`, `nominal_rencana`, serta kolom khusus ekonomi: `jumlah_unit`, `frekuensi`, `harga_satuan`).
  - `action_plan_beneficiaries`: Tabel penghubung target PM khusus program Ekonomi (berisi `action_plan_id`, `pm_id`, `penghasilan_awal`).
- **Tabel Lama (Modifikasi):**
  - `intervensi`: Penambahan *Foreign Key* `action_plan_id` dan `action_plan_activity_id` untuk mengunci relasi dengan perencanaan, serta penambahan kolom `nominal_aktual`.

## 5. Rencana Tampilan (UI/UX)
- **Halaman Daftar Action Plan (`/dashboard/action-plan/page.tsx`):** Menampilkan *Data Table* daftar ajuan dengan fitur filter berdasarkan status, desa, dan program.
- **Halaman Tambah/Edit Action Plan (`/dashboard/action-plan/tambah/page.tsx`):** Form input dinamis. Menggunakan komponen *Dynamic Field Array* (tambah/hapus baris) untuk pengisian RAB, dan komponen *Data Table* dengan fitur *Checkbox* untuk memilih target Penerima Manfaat (PM). Field input utama akan berubah menyesuaikan jenis program yang dipilih.
- **Halaman Review Action Plan (`/dashboard/action-plan/[id]/page.tsx`):** Tampilan *read-only* berisi ringkasan lengkap untuk Monev, dilengkapi tombol aksi "Setujui" dan "Revisi" (yang akan memunculkan modal untuk mengisi catatan).
- **Halaman Tambah Intervensi (Pembaruan):** Modifikasi form intervensi saat ini dengan menambahkan *Cascading Dropdown* di awal form (Pilih Action Plan -> Pilih Aktivitas). Pilihan ini akan men-*trigger auto-fill* untuk Kategori Program dan menampilkan info target Nominal Rencana.

## 6. Aturan Bisnis (Business Logic / Validasi)
- **Validasi Status:** Form Intervensi hanya boleh memuat dan mengeksekusi Action Plan yang memiliki status `APPROVED`.
- **Validasi Keterisian (Dynamic Required):** Field *Keterangan SE* wajib diisi jika program adalah Kesehatan atau Lingkungan. Field *Jenis Sampah* wajib jika program Lingkungan.
- **Validasi Anggaran Terkunci:** Dropdown pemilihan aktivitas pada form Intervensi idealnya memfilter/menyembunyikan item RAB yang nominalnya sudah direalisasikan sepenuhnya, guna mencegah duplikasi klaim.
- **Peringatan *Overbudget*:** Jika RI menginput `Nominal Aktual` pada form Intervensi yang jumlahnya melebihi `Nominal Rencana` di Action Plan, sistem akan memunculkan peringatan (*Warning Alert*) sebelum data dapat di-*submit*.
- **Persetujuan Berjenjang:** Perubahan status menjadi `APPROVED` hanya bisa dilakukan oleh *role* Monev Pusat (atau role yang lebih tinggi sesuai kewenangan).

## 7. Catatan Tambahan
- Referensi rancangan database dan form mengacu langsung pada 4 format *spreadsheet* Action Plan (Ekonomi, Kesehatan, Lingkungan, Pendidikan).
- Fitur ini akan sangat bergantung pada data Penerima Manfaat (PM) yang sudah ada di SIDB, sehingga diperlukan integrasi *query* ke modul `/app/dashboard/pm/`.
- Pengembangan fitur akan memanfaatkan Prisma Schema untuk manajemen database dan *Server Actions* Next.js untuk pemrosesan data.