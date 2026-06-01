# 🏥 Puskesmas Digital

Web app fullstack sistem informasi puskesmas — Express.js + MySQL + REST API.

## 📁 Struktur Project

```
puskesmas_app/
├── app.js                  ← Entry point
├── .env                    ← Konfigurasi (DB, PORT, dsb)
├── config/
│   ├── db.js               ← Koneksi MySQL (Pool)
│   └── migrate.js          ← Setup tabel + seed data
├── models/                 ← Query database
│   ├── Admin.js
│   ├── Dokter.js
│   ├── Jadwal.js
│   ├── ChatHistory.js
│   ├── Informasi.js
│   └── Puskesmas.js
├── controllers/            ← Logic bisnis
│   ├── adminController.js
│   ├── dokterController.js
│   ├── jadwalController.js
│   └── chatController.js   ← Rule-based chatbot
├── routes/
│   ├── public.js           ← Halaman publik
│   ├── admin.js            ← Panel admin (protected session)
│   └── api.js              ← REST API
├── views/                  ← EJS templates
└── public/                 ← CSS, JS, assets
```

## 🚀 Cara Menjalankan

### 1. Pastikan MySQL berjalan

```bash
# Windows:  net start mysql
# Mac/Linux: sudo service mysql start
```

### 2. Konfigurasi .env

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=puskesmas_db
DB_USER=root
DB_PASSWORD=        # password MySQL kamu
PORT=3000
```

### 3. Install + migrate + start

```bash
npm install
npm run migrate     # buat DB, tabel, dan seed data
npm start
```

Buka: **http://localhost:3000**

## 🗄️ Tabel Database MySQL

| Tabel            | Keterangan                             |
|------------------|----------------------------------------|
| `admins`         | Akun admin (bcrypt hashed password)    |
| `dokter`         | Data dokter & tenaga medis             |
| `jadwal_poli`    | Jadwal poli puskesmas                  |
| `chat_history`   | Header sesi percakapan chatbot         |
| `chat_messages`  | Isi pesan per sesi (FK → chat_history) |
| `informasi`      | Artikel informasi kesehatan            |
| `puskesmas_info` | Profil puskesmas                       |

## 🔌 REST API Endpoints

| Method | Endpoint              | Keterangan              |
|--------|-----------------------|-------------------------|
| GET    | `/api/dokter`         | Semua dokter            |
| POST   | `/api/dokter`         | Tambah dokter           |
| PUT    | `/api/dokter/:id`     | Update dokter           |
| DELETE | `/api/dokter/:id`     | Hapus dokter            |
| GET    | `/api/jadwal`         | Semua jadwal poli       |
| POST   | `/api/jadwal`         | Tambah jadwal           |
| PUT    | `/api/jadwal/:id`     | Update jadwal           |
| DELETE | `/api/jadwal/:id`     | Hapus jadwal            |
| POST   | `/api/chat`           | Kirim pesan chatbot     |
| POST   | `/api/riwayat/simpan` | Simpan sesi chat ke DB  |

## 🔐 Login Admin

| Username  | Password              |
|-----------|-----------------------|
| `admin`   | `Admin@Puskesmas2025` |
| `petugas` | `Petugas@2025`        |

Panel admin: **http://localhost:3000/admin/login**
