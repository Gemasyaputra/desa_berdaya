🚀 Template Fitur Baru
1. Nama Fitur
 Intervensi Program

2. Tujuan / Objektif Fitur
Fitur ini bertujuan untuk merencanakan, mencatat, dan mengelola alokasi anggaran serta program intervensi spesifik (seperti kesehatan atau ekonomi) yang akan dijalankan di suatu desa. Memudahkan Super Admin memonitor pengajuan, persetujuan, dan pencairan dana secara terstruktur per bulan/tahun.

3. Akses Pengguna (Role)
Hanya SUPER ADMIN.

4. Halaman Baru atau Perubahan UI
Diperlukan pembuatan halaman baru di bawah struktur dashboard menggunakan Shadcn UI:

/dashboard/intervensi: Halaman utama berisi tabel daftar program intervensi beserta filter dan pencarian.

/dashboard/intervensi/tambah: Halaman form untuk membuat header Intervensi Program baru.

/dashboard/intervensi/[id]: Halaman detail yang terdiri dari:

Card Informasi Dasar (header).


Tab "Anggaran" berisi tabel rincian budget dan

Modal/Dialog (pop-up) untuk "Create Budget".

5. Kebutuhan Data (Database)
Memerlukan dua tabel baru dengan relasi One-to-Many:

Tabel Header (Intervensi Program):

Desa (Relasi ke tabel Desa)

Kategori Program

Nama Program (Relasi ke tabel Master Program)

Deskripsi

Sumber Dana

Fundraiser

Relawan (Relasi ke tabel Relawan)

Status Dokumen (DRAFT, APPROVED, CANCELLED)

Tabel Detail (Anggaran per bulan):

Relasi ke Header (ID Intervensi Program)

Tahun

Bulan

Ajuan RI (Nominal/Float)

Anggaran Disetujui (Nominal/Float)

Anggaran Dicairkan (Nominal/Float)

State/Status Pencairan (String, cth: "Dialokasikan")

ID STP

Catatan (Text)

is_DBF (Boolean)

is_RZ (Boolean)

6. Alur Kerja (User Flow/Workflow)
Super Admin masuk ke /dashboard/intervensi dan klik "Tambah Intervensi".

Sistem menampilkan form kosong. Super Admin mengisi data dasar (Desa, Program, Relawan, dll).

Setelah klik Simpan, data tersimpan dengan status "DRAFT", dan user diarahkan ke halaman detail (/dashboard/intervensi/[id]).

Di halaman detail pada tab "Anggaran", user klik tombol "Add a line".

Muncul modal pop-up "Create Budget". Form sebagian besar akan otomatis terisi berdasarkan data header (Desa, Program, Kategori Program, Info Relawan).

User mengisi rincian bulan, tahun, dan nominal Ajuan RI, lalu klik "Save & Close". Data baru masuk ke tabel anggaran.

Setelah rincian selesai, Super Admin bisa menekan tombol "APPROVE" untuk mengunci dokumen dari status DRAFT menjadi APPROVED.

7. Catatan Tambahan
Modal "Create Budget" harus menampilkan data rekening bank relawan (Read-only) secara otomatis saat form budget dibuka, mengambil referensi dari ID Relawan yang dipilih pada bagian Header form utama.

Setelah status berubah menjadi "APPROVED" atau "CANCELLED", seluruh input field di Header dan tombol "Add a line" harus terkunci (disabled) dan tidak bisa dimodifikasi lagi.

Tab "KPI" disiapkan sebagai placeholder UI terlebih dahulu.