# Desa Berdaya - Relawan Management System

Sistem manajemen operasional lapangan (Desa Berdaya V2) untuk Relawan Rumah Zakat dengan arsitektur murni Serverless (Next.js App Router + Neon Postgres). Sistem ini digunakan untuk mengelola program pembinaan desa secara aktif.

## 🏗️ Arsitektur Baru

```text
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend + API)              │
│  - Next.js App Router (UI Dashboard & Mobile First)    │
│  - Vercel AI SDK (KTP OCR Scanner)                      │
│  - Vercel Blob (Image & Receipt Storage)                │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ Database (Neon Postgres via Drizzle ORM)
                        ↓
              ┌──────────────────┐
              │  Neon Serverless │
              │  (Postgres DB)   │
              └──────────────────┘
```

## 🚀 Fitur Utama

### 1. Manajemen Penerima Manfaat (PM) & Desa Binaan

- Pencatatan Penerima Manfaat berdasarkan kategori: LANSIA, BUMIL, BALITA, EKONOMI.
- Pengelompokan hirarkis wilayah (Provinsi -> Kota -> Kecamatan -> Desa).

### 2. Modul AI KTP Scanner (OCR)

- Otomatisasi pembacaan KTP (NIK, Nama, dan Alamat) menggunakan Vercel AI SDK (Vision), mempermudah Relawan saat memasukkan data di lapangan.

### 3. Hierarki User (Monev, Korwil, Relawan)

- **Monev**: Mengawasi seluruh Korwil dan Relawan.
- **Korwil**: Berfungsi sebagai Relawan yang juga menjadi supervisor/validator bagi Relawan di wilayahnya.
- **Relawan**: Menginput kegiatan, data PM, dan laporan keuangan bulanan.

### 4. Pelaporan Kegiatan & Keuangan Bulanan

- Double-entry system (Alokasi vs Realisasi).
- Pengunggahan bukti kwitansi pengeluaran dan serah terima (Vercel Blob).
- Sistem Refund jika realisasi di bawah alokasi dana akhir bulan.
- Client-side PDF Report Generation.

### 5. Formulir Monitoring Dinamis (JSONB)

- Penyimpanan laporan bulanan berbentuk _schemaless_ yang bergantung pada kategori Penerima Manfaat.

---

## 📦 Setup & Instalasi Lokal

### Prerequisites

- Node.js 18+
- pnpm / npm
- Neon Postgres database
- Vercel account (Blob & API Keys)

### Environment Variables (.env.local)

```bash
# Database
DATABASE_URL=<neon_postgres_connection_string>
POSTGRES_URL=<sama dengan DATABASE_URL>

# Vercel Blob (File Storage)
BLOB_READ_WRITE_TOKEN=<token dari vercel dashboard>

# Zains API Configuration (Sinkronisasi)
URL_API_ZAINS_PRODUCTION=<production_url>
URL_API_ZAINS_STAGING=<staging_url>
API_KEY_ZAINS=<zains_api_key>
IS_PRODUCTION=<true|false>
```

### Database Operations

Aplikasi memisahkan operasional standar dengan migrasi skema. Migrasi dan Seeding menggunakan **Drizzle ORM via Neon HTTP Driver**.

```bash
npm run migrate   # Run database schema migrations
npm run seed      # Seed default users, master data, roles, clinics
```

---

## 💻 Menjalankan Server Development

```bash
npm install
npm run dev
```

Dashboard akan bisa diakses melalui URL lokal `http://localhost:3000`.

## 🔗 Links Penting

- **Vercel Dashboard**: https://vercel.com
- **Neon Dashboard**: https://console.neon.tech
