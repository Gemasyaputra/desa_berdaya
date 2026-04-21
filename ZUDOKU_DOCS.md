# Dokumentasi Portal API SIDB (Zudoku)

## Apa itu Zudoku?

[Zudoku](https://zudoku.dev) adalah framework dokumentasi API open-source berbasis React yang menghasilkan portal dokumentasi interaktif dari file spesifikasi **OpenAPI**. Portal ini tidak hanya menampilkan dokumentasi statis, tetapi juga memungkinkan pengguna untuk **mencoba (try it) setiap endpoint langsung dari browser**.

Di proyek SIDB, Zudoku digunakan sebagai portal dokumentasi resmi untuk semua endpoint HTTP yang tersedia di sistem.

---

## Struktur File

```
desa_berdaya/
├── zudoku.config.ts        # Konfigurasi utama Zudoku
├── public/
│   └── openapi.json        # Spesifikasi API (OpenAPI 3.1.0)
└── pages/
    ├── index.mdx           # Halaman pengenalan & overview
    └── context.mdx         # Konteks & latar belakang proyek
```

---

## Konfigurasi (`zudoku.config.ts`)

```ts
const config: ZudokuConfig = {
  theme: {
    light: { primary: "15 65% 35%" },   // Coklat kemerahan (brand SIDB)
    dark:  { primary: "15 65% 55%" },
  },
  site: {
    title: "SIDB API Docs",
  },
  docs: {
    files: "/pages/**/*.{md,mdx}",      // Semua file dokumentasi MDX
  },
  apis: [
    {
      type: "file",
      input: "./public/openapi.json",   // Spec OpenAPI dibaca dari sini
      path: "/api",                     // Ditampilkan di route /api
    },
  ],
  navigation: [
    {
      type: "category",
      label: "Dokumentasi",
      items: [
        { type: "doc", file: "index", label: "Pengenalan", path: "/" },
        { type: "doc", file: "context", label: "Konteks Proyek" },
      ],
    },
    {
      type: "link",
      to: "/api",
      label: "API Reference",
    },
  ],
};
```

---

## Cara Menjalankan Secara Lokal

```bash
# Jalankan portal dokumentasi (port 3001)
npx zudoku dev

# Akses di browser
http://localhost:3001
```

> **Catatan:** Aplikasi Next.js (`npm run dev`) harus juga berjalan di port `3000` jika ingin melakukan uji coba endpoint langsung dari fitur **Try it**.

---

## Endpoint yang Terdokumentasi

Portal ini mendokumentasikan **8 endpoint HTTP** yang tersedia di SIDB. Semua endpoint memerlukan sesi aktif (NextAuth) kecuali endpoint Auth.

### 🔐 Auth (3 endpoint)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/auth/error` | Handler redirect error OAuth (AccessDenied, dll) |
| `GET` | `/api/auth/csrf` | Mendapatkan CSRF token untuk operasi NextAuth |
| `GET` | `/api/auth/session` | Membaca data sesi pengguna yang sedang login |

**Catatan:** Login menggunakan **Google OAuth** — hanya email yang terdaftar di database `users` yang diizinkan masuk.

---

### 🪪 KTP Scanner (1 endpoint)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/scan-ktp` | OCR foto KTP menggunakan Gemini 2.5 Flash Vision |

**Alur kerja:**
1. Relawan upload foto KTP via `multipart/form-data`
2. Gambar dikirim ke **Gemini AI Vision** untuk diekstrak datanya
3. Foto KTP secara bersamaan di-upload ke **Vercel Blob**
4. Response berisi data terstruktur: NIK, Nama, Alamat, TTL, dll.

---

### 📁 Upload (2 endpoint)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/upload` | Inisiasi client-side upload bukti kegiatan ke Vercel Blob |
| `POST` | `/api/upload/blob` | Upload aset aplikasi (logo, background login, favicon) |

**Perbedaan keduanya:**
- `/api/upload` — Untuk file bukti kegiatan (foto/PDF) menggunakan mekanisme Vercel Blob client upload
- `/api/upload/blob` — Khusus untuk aset branding aplikasi, maksimal 4 MB, format PNG/JPEG/WebP/SVG

---

### ⚙️ Settings (2 endpoint)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/settings/app` | Ambil semua pengaturan aplikasi (logo, warna, nama, dll) |
| `PATCH` | `/api/settings/app` | Perbarui satu atau beberapa pengaturan aplikasi |

**Pengaturan yang dapat diubah secara dinamis** (tanpa deploy ulang):
- `app_title` — Judul halaman browser
- `app_company_name` — Nama perusahaan/organisasi
- `app_sidebar_bg_color` — Warna background sidebar
- `app_logo_url` — URL logo aplikasi
- `app_login_bg_url` — Gambar latar halaman login
- Dan lainnya sesuai whitelist di kode

---

### 🧩 Form Builder (1 endpoint)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/form-builder/categories` | Ambil kategori formulir monitoring beserta schema JSONB-nya |

Setiap kategori (LANSIA, BUMIL, BALITA, EKONOMI) memiliki schema formulir yang berbeda, didefinisikan dalam format **JSONB** di database.

---

## Perbedaan API Routes vs Server Actions

> Penting untuk dipahami agar tidak bingung kenapa operasi CRUD tidak muncul di dokumentasi ini.

| | **API Routes** (`app/api/*/route.ts`) | **Server Actions** (`lib/actions/*.ts`) |
|---|---|---|
| Punya URL HTTP? | ✅ Ya | ❌ Tidak |
| Bisa di-test via Postman/Zudoku? | ✅ Ya | ❌ Tidak |
| Cara dipanggil | `fetch('/api/...')` | Langsung: `await createPM(data)` |
| Didokumentasikan di Zudoku? | ✅ **Ya** | ❌ Tidak perlu |

Semua operasi CRUD (buat, ubah, hapus data PM, intervensi, kelompok, dll) menggunakan **Server Actions** — mekanisme internal Next.js yang tidak memiliki URL publik, sehingga tidak perlu dan tidak bisa didokumentasikan di Zudoku.

---

## Hierarki Role Pengguna

Endpoint `/api/auth/session` mengembalikan field `role` dengan nilai berikut:

**Jalur Lapangan:**
| Role | Keterangan |
|------|-----------|
| `MONEV` | Pengawas pusat — akses penuh ke semua data |
| `ADMIN` | Relawan dengan hak admin — kelola konfigurasi & semua fitur |
| `RELAWAN` | Input kegiatan, data PM, dan laporan keuangan |
| *(flag `is_korwil`)* | Relawan senior yang juga menjadi supervisor wilayah |

**Jalur Kantor:**
| Role | Keterangan |
|------|-----------|
| `OFFICE` | Staf kantor — monitor dan validasi laporan administratif |
| `FINANCE` | Staf keuangan — kelola pencairan dan verifikasi anggaran |
| `PROG_HEAD` | Kepala program — pengawas program pemberdayaan desa |

---

## Deploy ke Production

Portal dokumentasi Zudoku berjalan **terpisah** dari aplikasi Next.js utama. Untuk deploy ke Vercel:

```bash
# Build portal dokumentasi
npx zudoku build

# Output ada di folder dist/
# Deploy sebagai static site atau serverless
```

> **Tips:** Jika ingin portal dokumentasi berjalan di subdomain yang sama (misalnya `desa-berdaya.vercel.app/docs`), konfigurasikan `basePath` di `zudoku.config.ts`.

---

*Dokumen ini dibuat otomatis berdasarkan konfigurasi Zudoku dan spesifikasi OpenAPI yang ada di proyek SIDB.*
