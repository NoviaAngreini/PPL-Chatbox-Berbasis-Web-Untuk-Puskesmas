const initSqlJs = require("sql.js");
const fs        = require("fs");
const path      = require("path");
const bcrypt    = require("bcryptjs");

const DB_FILE = path.join(__dirname, "puskesmas.db");

let _db  = null;   // sql.js Database instance
let _SQL = null;   // sql.js module

// ─── OPEN / INIT ──────────────────────────────────────────────────────────────
async function openDb() {
  if (_db) return _db;
  _SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE)) {
    _db = new _SQL.Database(fs.readFileSync(DB_FILE));
  } else {
    _db = new _SQL.Database();
  }
  _db.run("PRAGMA journal_mode = WAL;");
  _db.run("PRAGMA foreign_keys = ON;");
  return _db;
}

// Auto-save to file after every write
function save() {
  const data = _db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

// ─── QUERY HELPERS ────────────────────────────────────────────────────────────
// Run a write query (INSERT / UPDATE / DELETE / CREATE)
function run(sql, params = []) {
  _db.run(sql, params);
  save();
}

// Return all rows as array of objects
function all(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// Return single row or null
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

// ─── MIGRATIONS ───────────────────────────────────────────────────────────────
async function migrate() {
  const db = await openDb();

  db.run(`CREATE TABLE IF NOT EXISTS jadwal (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    poli    TEXT NOT NULL,
    hari    TEXT NOT NULL,
    jam     TEXT NOT NULL,
    dokter  TEXT NOT NULL,
    status  TEXT NOT NULL DEFAULT 'Buka',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS dokter (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nama        TEXT NOT NULL,
    spesialis   TEXT NOT NULL,
    pengalaman  TEXT,
    status      TEXT NOT NULL DEFAULT 'Tersedia',
    foto        TEXT DEFAULT 'dokter1',
    created_at  TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS riwayat_chat (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    topik      TEXT NOT NULL DEFAULT 'Percakapan',
    pesan      TEXT NOT NULL,   -- JSON string
    tanggal    TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS informasi (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    judul      TEXT NOT NULL,
    kategori   TEXT NOT NULL DEFAULT 'Umum',
    isi        TEXT NOT NULL,
    icon       TEXT DEFAULT 'info-circle',
    tanggal    TEXT DEFAULT (date('now','localtime')),
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS puskesmas_info (
    id              INTEGER PRIMARY KEY DEFAULT 1,
    nama            TEXT,
    tagline         TEXT,
    alamat          TEXT,
    telepon         TEXT,
    email           TEXT,
    jam_operasional TEXT,
    tentang         TEXT,
    visi            TEXT,
    misi            TEXT,   -- JSON array
    fasilitas       TEXT    -- JSON array
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    nama       TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'petugas',
    avatar     TEXT DEFAULT 'A',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS api_keys (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    key_value  TEXT NOT NULL UNIQUE,
    active     INTEGER NOT NULL DEFAULT 1,
    scope      TEXT DEFAULT '["read"]',   -- JSON array
    last_used  TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  save();
  console.log("✅  Migrasi database selesai");
}

// ─── SEED (hanya kalau tabel masih kosong) ────────────────────────────────────
async function seed() {
  const db = await openDb();

  // Jadwal
  const jadwalCount = get("SELECT COUNT(*) as c FROM jadwal");
  if (!jadwalCount?.c) {
    const jadwals = [
      ["Poli Umum",   "Senin - Sabtu",        "08:00 - 12:00", "dr. Ahmad Santoso",  "Buka"],
      ["Poli Gigi",   "Senin, Rabu, Jumat",   "08:00 - 11:00", "drg. Sari Dewi",     "Buka"],
      ["Poli KIA/KB", "Selasa, Kamis",        "08:00 - 12:00", "dr. Rina Kusuma",    "Buka"],
      ["Poli Lansia", "Senin, Kamis",         "08:00 - 10:00", "dr. Budi Hartono",   "Buka"],
      ["Poli Anak",   "Senin - Jumat",        "09:00 - 12:00", "dr. Maya Putri",     "Buka"],
      ["Poli Gizi",   "Selasa, Jumat",        "08:00 - 11:00", "Ns. Dwi Cahyani",    "Libur"],
    ];
    for (const j of jadwals)
      run("INSERT INTO jadwal (poli,hari,jam,dokter,status) VALUES (?,?,?,?,?)", j);
    console.log("  ↳ Seed jadwal");
  }

  // Dokter
  const dokterCount = get("SELECT COUNT(*) as c FROM dokter");
  if (!dokterCount?.c) {
    const dokters = [
      ["dr. Ahmad Santoso", "Dokter Umum",   "10 Tahun", "Tersedia",       "dokter1"],
      ["drg. Sari Dewi",    "Dokter Gigi",   "8 Tahun",  "Tersedia",       "dokter2"],
      ["dr. Rina Kusuma",   "Dokter KIA/KB", "12 Tahun", "Tersedia",       "dokter3"],
      ["dr. Budi Hartono",  "Dokter Lansia", "15 Tahun", "Tidak Tersedia", "dokter4"],
      ["dr. Maya Putri",    "Dokter Anak",   "7 Tahun",  "Tersedia",       "dokter5"],
      ["Ns. Dwi Cahyani",   "Ahli Gizi",     "5 Tahun",  "Tersedia",       "dokter6"],
    ];
    for (const d of dokters)
      run("INSERT INTO dokter (nama,spesialis,pengalaman,status,foto) VALUES (?,?,?,?,?)", d);
    console.log("  ↳ Seed dokter");
  }

  // Riwayat chat
  const riwayatCount = get("SELECT COUNT(*) as c FROM riwayat_chat");
  if (!riwayatCount?.c) {
    const chats = [
      ["Jadwal Poli Umum",     JSON.stringify([{role:"user",text:"Jam berapa poli umum buka?"},{role:"bot",text:"Poli Umum buka Senin–Sabtu pukul 08:00–12:00 WIB dengan dokter dr. Ahmad Santoso."},{role:"user",text:"Terima kasih!"},{role:"bot",text:"Sama-sama! Ada lagi yang bisa saya bantu?"}])],
      ["Informasi Dokter Gigi",JSON.stringify([{role:"user",text:"Siapa dokter gigi di sini?"},{role:"bot",text:"Dokter gigi kami adalah drg. Sari Dewi dengan pengalaman 8 tahun."}])],
      ["Cara Pendaftaran",     JSON.stringify([{role:"user",text:"Bagaimana cara daftar?"},{role:"bot",text:"Anda bisa datang langsung ke loket pendaftaran atau menghubungi hotline kami di (0274) 123-4567."}])],
    ];
    for (const c of chats)
      run("INSERT INTO riwayat_chat (topik,pesan) VALUES (?,?)", c);
    console.log("  ↳ Seed riwayat chat");
  }

  // Informasi kesehatan
  const infoCount = get("SELECT COUNT(*) as c FROM informasi");
  if (!infoCount?.c) {
    const infos = [
      ["Tips Menjaga Imunitas Tubuh",          "Pencegahan", "Konsumsi makanan bergizi seimbang, olahraga teratur minimal 30 menit sehari, tidur cukup 7-8 jam, dan kelola stres dengan baik.", "shield-heart", "2025-04-10"],
      ["Gejala dan Penanganan Demam Berdarah", "Penyakit",   "Demam berdarah ditandai dengan demam tinggi mendadak, nyeri kepala, nyeri otot dan sendi, serta munculnya bintik merah pada kulit.", "virus",        "2025-04-12"],
      ["Pentingnya Vaksinasi untuk Anak",      "Imunisasi",  "Vaksinasi melindungi anak dari berbagai penyakit berbahaya. Program imunisasi dasar meliputi BCG, Polio, DPT, Hepatitis B, dan Campak.", "syringe",      "2025-04-15"],
      ["Panduan Gizi Seimbang Ibu Hamil",      "Gizi",       "Ibu hamil membutuhkan asupan nutrisi ekstra meliputi asam folat, zat besi, kalsium, dan protein.", "apple-alt",    "2025-04-17"],
    ];
    for (const i of infos)
      run("INSERT INTO informasi (judul,kategori,isi,icon,tanggal) VALUES (?,?,?,?,?)", i);
    console.log("  ↳ Seed informasi kesehatan");
  }

  // Puskesmas info
  const pkmCount = get("SELECT COUNT(*) as c FROM puskesmas_info");
  if (!pkmCount?.c) {
    run(`INSERT INTO puskesmas_info VALUES (1,?,?,?,?,?,?,?,?,?,?)`, [
      "Puskesmas Digital Darul Kamal",
      "Layanan Kesehatan Terpadu",
      "JLN. T. FAKINAH KM.09 PEUKAN BILUY,  KEC. DARUL KAMAL",
      "(0274) 123-4567",
      "info@puskesmasdigital.id",
      "Senin - Sabtu: 08:00 - 14:00 WIB",
      "Puskesmas Digital adalah fasilitas kesehatan tingkat pertama yang berkomitmen memberikan pelayanan kesehatan yang berkualitas, terjangkau, dan mudah diakses oleh seluruh masyarakat.",
      "Menjadi pusat kesehatan masyarakat yang modern, profesional, dan terpercaya.",
      JSON.stringify(["Memberikan pelayanan kesehatan prima kepada seluruh masyarakat","Meningkatkan derajat kesehatan masyarakat melalui program promotif dan preventif","Mengembangkan SDM kesehatan yang kompeten dan berdedikasi","Menerapkan teknologi informasi dalam pelayanan kesehatan"]),
      JSON.stringify(["Poli Umum","Poli Gigi","Poli KIA/KB","Poli Lansia","Poli Anak","Poli Gizi","Laboratorium","Apotek","Ruang UGD"]),
    ]);
    console.log("  ↳ Seed info puskesmas");
  }

  // Admins
  const adminCount = get("SELECT COUNT(*) as c FROM admins");
  if (!adminCount?.c) {
    const adminHash   = bcrypt.hashSync("Admin@Puskesmas2025", 10);
    const petugasHash = bcrypt.hashSync("Petugas@2025", 10);
    run("INSERT INTO admins (username,password,nama,role,avatar) VALUES (?,?,?,?,?)", ["admin",   adminHash,   "Administrator",     "admin",   "A"]);
    run("INSERT INTO admins (username,password,nama,role,avatar) VALUES (?,?,?,?,?)", ["petugas", petugasHash, "Petugas Puskesmas", "petugas", "P"]);
    console.log("  ↳ Seed admins");
  }

  // API Keys
  const keyCount = get("SELECT COUNT(*) as c FROM api_keys");
  if (!keyCount?.c) {
    const crypto = require("crypto");
    run("INSERT INTO api_keys (name,key_value,scope) VALUES (?,?,?)", [
      "Mobile App Integration",
      "pkm_live_" + crypto.randomBytes(24).toString("hex"),
      JSON.stringify(["read","write"])
    ]);
    run("INSERT INTO api_keys (name,key_value,scope) VALUES (?,?,?)", [
      "Internal Dashboard",
      "pkm_live_" + crypto.randomBytes(24).toString("hex"),
      JSON.stringify(["read"])
    ]);
    console.log("  ↳ Seed API keys");
  }

  console.log("✅  Seed selesai");
}

// ─── INIT SEQUENCE ────────────────────────────────────────────────────────────
async function init() {
  await openDb();
  await migrate();
  await seed();
  return { run, all, get, save };
}

module.exports = { init, run, all, get, save, openDb };
