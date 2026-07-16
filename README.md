# ✨ TokenGo AI Studio & Image Generator (`ImgGenerateAI`)

<div align="center">
  <h3>🚀 Aplikasi Web AI Full-Stack Berdayakan 5 Juta Token TokenGo API</h3>
  <p><strong>Generate Gambar dari Teks · Edit & Modifikasi Gambar · AI Coding & Chat Assistant</strong></p>
</div>

---

## 🌟 Tentang Proyek Ini

**ImgGenerateAI (TokenGo AI Studio)** adalah aplikasi web modern yang dibangun menggunakan **Next.js (App Router)** dan **Vanilla CSS Premium (Glassmorphism & Cyberpunk Dark Mode)**. Aplikasi ini dirancang untuk memanfaatkan kuota besar **5 Juta Token** dari layanan [TokenGo API Gateway](https://tokengo.com) secara maksimal, aman, dan efisien.

Seluruh proses pemanggilan model AI (baik untuk pembuatan gambar maupun percakapan teks) dilakukan di **Sisi Server (Server-Side Routes)** melalui endpoint API Next.js (`/api/generate`, `/api/edit`, dan `/api/chat`). Hal ini memastikan **API Key rahasia Anda tetap 100% aman dan tidak pernah bocor ke peramban (browser) pengguna**.

---

## ✨ Fitur Unggulan

- **🎨 1. Image Generation (Buat Gambar Baru)**
  - Mengubah deskripsi teks (prompt) menjadi karya seni visual berkualitas tinggi.
  - Dukungan kustomisasi ukuran (`1024x1024`, `512x512`, `256x256`) dan kualitas (`Standard`, `HD`).
  - Ide prompt preset instan untuk mempercepat eksperimen desain.
  - Tombol unduh langsung untuk menyimpan gambar hasil generate ke perangkat Anda.

- **🪄 2. Image Editor (Edit & Manipulasi Gambar)**
  - Unggah gambar asli dari komputer Anda (format `.PNG` atau `.JPG`).
  - Masukkan instruksi natural (contoh: *"Tambahkan kacamata hitam di wajah kucing"* atau *"Ganti latar belakang menjadi pemandangan gurun malam hari"*).
  - AI secara otomatis memodifikasi gambar sesuai arahan prompt Anda.

- **💬 3. AI Chat & Coding Assistant**
  - Asisten koding dan penalaran berbasis LLM yang siap membantu memecahkan bug, merancang arsitektur, atau menjawab pertanyaan umum.
  - Dukungan pemilihan model cerdas seperti **DeepSeek V4 Pro**, **Claude 3.5 Sonnet**, dan **GPT-4o**.
  - Antarmuka percakapan interaktif dengan riwayat pesan real-time.

- **🔒 4. Keamanan & Override API Key Fleksibel**
  - Menggunakan API Key bawaan dari server (`.env.local`) secara default.
  - Menyediakan opsi client-side override jika Anda ingin menguji atau mengganti API Key untuk sesi penjelajahan tertentu tanpa mengubah kode server.

---

## 🛠️ Teknologi yang Digunakan

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router & Server API Routes)
- **Bahasa:** TypeScript / React 19
- **Styling:** Pure Vanilla CSS (Desain sistem kustom dengan Glassmorphism, Ambient Glow, dan Responsivitas tinggi)
- **SDK & Komunikasi API:** Resmi `openai` Node.js SDK & Native `fetch` API (`multipart/form-data` untuk gambar)
- **Ikonografia:** `lucide-react`

---

## 📋 Prasyarat & Instalasi Lokal

### 1. Kloning Repositori
```bash
git clone https://github.com/Arterouss/ImgGenerateAI.git
cd ImgGenerateAI
```

### 2. Instalasi Dependensi
Pastikan Anda menggunakan Node.js versi 18+ atau 20+:
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file baru bernama `.env.local` di direktori akar proyek, lalu masukkan kredensial TokenGo Anda:

```env
# API Key Resmi TokenGo Anda
TOKENGO_API_KEY=API_KEY_TOKENGO_ANDA

# Base URL untuk TokenGo API (OpenAI Compatible)
TOKENGO_BASE_URL=https://api.tokengo.com/v1
```

### 4. Jalankan Server Pengembangan Lokal
```bash
npm run dev
```
Buka peramban (browser) Anda dan akses: **`http://localhost:3000`**

---

## 🚀 Panduan Deploy ke Vercel (1-Klik Tanpa Ribet)

Karena proyek ini dibangun menggunakan standar **Next.js App Router**, proses deployment ke **Vercel** dapat dilakukan dalam beberapa detik:

1. **Push ke GitHub:** Pastikan seluruh kode proyek ini sudah di-push ke repositori GitHub Anda (`https://github.com/Arterouss/ImgGenerateAI.git`).
2. **Buka Vercel:** Masuk ke dashboard [Vercel.com](https://vercel.com) dan klik tombol **Add New... -> Project**.
3. **Impor Repositori:** Pilih repositori `ImgGenerateAI` milik Anda.
4. **Atur Environment Variables di Vercel:**
   Pada menu dropdown **Environment Variables** sebelum klik deploy, tambahkan variabel berikut:
   - **Key:** `TOKENGO_API_KEY`
   - **Value:** `API_KEY_TOKENGO_ANDA` *(Contoh: `TMTOMwR3tDcnY54QPLvtzq2YJC5H3hQ6lm7q6NxlLVeBmdvN`)*
   - **Key:** `TOKENGO_BASE_URL`
   - **Value:** `https://api.tokengo.com/v1`
5. Klik **Deploy**! 

Dalam kurang dari 1 menit, aplikasi **ImgGenerateAI** Anda akan live dan siap digunakan dari seluruh dunia dengan keamanan server-side terjamin!

---

## 📁 Struktur Direktori Proyek

```
ImgGenerateAI/
├── src/
│   └── app/
│       ├── api/
│       │   ├── chat/
│       │   │   └── route.ts         # Endpoint Server-Side untuk AI Chat (OpenAI Compatible)
│       │   ├── edit/
│       │   │   └── route.ts         # Endpoint Server-Side untuk Image Edit (Multipart/form-data)
│       │   └── generate/
│       │       └── route.ts         # Endpoint Server-Side untuk Image Generation
│       ├── globals.css              # Design System Vanilla CSS Premium (Glassmorphism & Neon)
│       ├── layout.tsx               # Root Layout dengan Kustomisasi Google Fonts (Outfit & Inter)
│       └── page.tsx                 # Dashboard Utama Interaktif (Tabs: Generate, Edit, Chat, Settings)
├── .env.local                       # File rahasia kredensial API (Tidak ikut di-push ke Git)
├── .gitignore                       # Aturan pengabaian file Git & Vercel
├── next.config.ts                   # Konfigurasi Next.js
├── package.json                     # Daftar dependensi dan skrip npm
└── tsconfig.json                    # Konfigurasi TypeScript
```

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan portofolio, edukasi, dan otomatisasi kreatif. Bebas dimodifikasi dan dikembangkan lebih lanjut.
