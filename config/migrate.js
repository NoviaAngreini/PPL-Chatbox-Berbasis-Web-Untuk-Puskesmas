require("dotenv").config();
const mysql  = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function migrate() {
  // Connect tanpa database dulu supaya bisa buat DB kalau belum ada
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || "mysql.railway.internal",
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "rKmFKAmbYOrQiFifvlZEdRuJvVqjRbqn",
    multipleStatements: true,
  });

  const DB = process.env.DB_NAME || "railway";

  console.log(`\n🔧  Membuat database '${DB}' jika belum ada...`);
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${DB}\``);

  // ─── TABEL ──────────────────────────────────────────────────────────────────
  console.log("📦  Membuat tabel...");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      username   VARCHAR(100) NOT NULL UNIQUE,
      password   VARCHAR(255) NOT NULL,
      nama       VARCHAR(150) NOT NULL,
      role       ENUM('admin','petugas') DEFAULT 'petugas',
      avatar     VARCHAR(10) DEFAULT 'A',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS dokter (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      nama        VARCHAR(150) NOT NULL,
      spesialis   VARCHAR(100) NOT NULL,
      pengalaman  VARCHAR(50),
      status      ENUM('Tersedia','Tidak Tersedia') DEFAULT 'Tersedia',
      foto        VARCHAR(50) DEFAULT 'dokter1',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS jadwal_poli (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      poli       VARCHAR(100) NOT NULL,
      hari       VARCHAR(100) NOT NULL,
      jam        VARCHAR(50)  NOT NULL,
      dokter     VARCHAR(150) NOT NULL,
      status     ENUM('Buka','Libur') DEFAULT 'Buka',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id       INT AUTO_INCREMENT PRIMARY KEY,
      topik    VARCHAR(200) NOT NULL DEFAULT 'Percakapan',
      tanggal  DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      history_id INT NOT NULL,
      role       ENUM('user','bot') NOT NULL,
      text       TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (history_id) REFERENCES chat_history(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS informasi (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      judul      VARCHAR(255) NOT NULL,
      kategori   VARCHAR(100) DEFAULT 'Umum',
      isi        TEXT NOT NULL,
      icon       VARCHAR(50)  DEFAULT 'info-circle',
      tanggal    DATE         DEFAULT (CURDATE()),
      created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS puskesmas_info (
      id              INT PRIMARY KEY DEFAULT 1,
      nama            VARCHAR(150),
      tagline         VARCHAR(200),
      alamat          TEXT,
      telepon         VARCHAR(50),
      email           VARCHAR(100),
      jam_operasional VARCHAR(200),
      tentang         TEXT,
      visi            TEXT,
      misi            TEXT,
      fasilitas       TEXT
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(150) NOT NULL,
      key_value  VARCHAR(100) NOT NULL UNIQUE,
      active     TINYINT(1)   DEFAULT 1,
      scope      VARCHAR(100) DEFAULT 'read',
      last_used  DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  console.log("✅  Tabel berhasil dibuat");

  // ─── SEED ────────────────────────────────────────────────────────────────────
  console.log("🌱  Memeriksa data awal...");

  // Admins
  const [[{ cnt: ac }]] = await conn.query("SELECT COUNT(*) cnt FROM admins");
  if (+ac === 0) {
    const adminHash   = await bcrypt.hash("Admin@Puskesmas2025", 10);
    const petugasHash = await bcrypt.hash("Petugas@2025", 10);
    await conn.query("INSERT INTO admins (username,password,nama,role,avatar) VALUES (?,?,?,?,?)",
      ["admin",   adminHash,   "Administrator",    "admin",   "A"]);
    await conn.query("INSERT INTO admins (username,password,nama,role,avatar) VALUES (?,?,?,?,?)",
      ["petugas", petugasHash, "Petugas Puskesmas","petugas", "P"]);
    console.log("  ↳ Seed admins");
  }

  // Dokter
  const [[{ cnt: dc }]] = await conn.query("SELECT COUNT(*) cnt FROM dokter");
  if (+dc === 0) {
    const dokters = [
      ["dr. Ahmad Santoso", "Dokter Umum",   "10 Tahun", "Tersedia",       "dokter1"],
      ["drg. Sari Dewi",    "Dokter Gigi",   "8 Tahun",  "Tersedia",       "dokter2"],
      ["dr. Rina Kusuma",   "Dokter KIA/KB", "12 Tahun", "Tersedia",       "dokter3"],
      ["dr. Budi Hartono",  "Dokter Lansia", "15 Tahun", "Tidak Tersedia", "dokter4"],
      ["dr. Maya Putri",    "Dokter Anak",   "7 Tahun",  "Tersedia",       "dokter5"],
      ["Ns. Dwi Cahyani",   "Ahli Gizi",     "5 Tahun",  "Tersedia",       "dokter6"],
    ];
    for (const d of dokters)
      await conn.query("INSERT INTO dokter (nama,spesialis,pengalaman,status,foto) VALUES (?,?,?,?,?)", d);
    console.log("  ↳ Seed dokter");
  }

  // Jadwal Poli
  const [[{ cnt: jc }]] = await conn.query("SELECT COUNT(*) cnt FROM jadwal_poli");
  if (+jc === 0) {
    const jadwals = [
      ["Poli Umum",   "Senin - Sabtu",      "08:00 - 12:00", "dr. Ahmad Santoso", "Buka"],
      ["Poli Gigi",   "Senin, Rabu, Jumat", "08:00 - 11:00", "drg. Sari Dewi",    "Buka"],
      ["Poli KIA/KB", "Selasa, Kamis",      "08:00 - 12:00", "dr. Rina Kusuma",   "Buka"],
      ["Poli Lansia", "Senin, Kamis",       "08:00 - 10:00", "dr. Budi Hartono",  "Buka"],
      ["Poli Anak",   "Senin - Jumat",      "09:00 - 12:00", "dr. Maya Putri",    "Buka"],
      ["Poli Gizi",   "Selasa, Jumat",      "08:00 - 11:00", "Ns. Dwi Cahyani",   "Libur"],
    ];
    for (const j of jadwals)
      await conn.query("INSERT INTO jadwal_poli (poli,hari,jam,dokter,status) VALUES (?,?,?,?,?)", j);
    console.log("  ↳ Seed jadwal_poli");
  }

  // Chat History
  const [[{ cnt: cc }]] = await conn.query("SELECT COUNT(*) cnt FROM chat_history");
  if (+cc === 0) {
    const sessions = [
      { topik: "Jadwal Poli Umum", msgs: [
          { role:"user", text:"Jam berapa poli umum buka?" },
          { role:"bot",  text:"Poli Umum buka Senin–Sabtu pukul 08:00–12:00 WIB dengan dokter dr. Ahmad Santoso." },
          { role:"user", text:"Terima kasih!" },
          { role:"bot",  text:"Sama-sama! Ada lagi yang bisa saya bantu?" },
      ]},
      { topik: "Informasi Dokter Gigi", msgs: [
          { role:"user", text:"Siapa dokter gigi di sini?" },
          { role:"bot",  text:"Dokter gigi kami adalah drg. Sari Dewi dengan pengalaman 8 tahun." },
      ]},
      { topik: "Cara Pendaftaran", msgs: [
          { role:"user", text:"Bagaimana cara daftar?" },
          { role:"bot",  text:"Anda bisa datang langsung ke loket pendaftaran atau menghubungi hotline kami di (0274) 123-4567." },
      ]},
    ];
    for (const s of sessions) {
      const [result] = await conn.query("INSERT INTO chat_history (topik) VALUES (?)", [s.topik]);
      const hId = result.insertId;
      for (const m of s.msgs)
        await conn.query("INSERT INTO chat_messages (history_id,role,text) VALUES (?,?,?)", [hId, m.role, m.text]);
    }
    console.log("  ↳ Seed chat_history + chat_messages");
  }

  // Informasi Kesehatan
  const [[{ cnt: ic }]] = await conn.query("SELECT COUNT(*) cnt FROM informasi");
  if (+ic === 0) {
    const infos = [
      ["Tips Menjaga Imunitas Tubuh",          "Pencegahan", "Konsumsi makanan bergizi seimbang, olahraga teratur minimal 30 menit sehari, tidur cukup 7-8 jam, dan kelola stres dengan baik.", "shield-heart", "2025-04-10"],
      ["Gejala dan Penanganan Demam Berdarah", "Penyakit",   "Demam berdarah ditandai dengan demam tinggi mendadak, nyeri kepala, nyeri otot dan sendi, serta munculnya bintik merah pada kulit.", "virus",        "2025-04-12"],
      ["Pentingnya Vaksinasi untuk Anak",      "Imunisasi",  "Vaksinasi melindungi anak dari berbagai penyakit berbahaya. Program imunisasi dasar meliputi BCG, Polio, DPT, Hepatitis B, dan Campak.", "syringe",      "2025-04-15"],
      ["Panduan Gizi Seimbang Ibu Hamil",      "Gizi",       "Ibu hamil membutuhkan asupan nutrisi ekstra meliputi asam folat, zat besi, kalsium, dan protein.", "apple-alt",    "2025-04-17"],
    ];
    for (const i of infos)
      await conn.query("INSERT INTO informasi (judul,kategori,isi,icon,tanggal) VALUES (?,?,?,?,?)", i);
    console.log("  ↳ Seed informasi");
  }

  // Puskesmas Info
  const [[{ cnt: pc }]] = await conn.query("SELECT COUNT(*) cnt FROM puskesmas_info");
  if (+pc === 0) {
    await conn.query(`INSERT INTO puskesmas_info VALUES (1,?,?,?,?,?,?,?,?,?,?)`, [
      "Puskesmas Digital",
      "Layanan Kesehatan Terpadu",
      "Jl. Kesehatan No. 1, Kota Sehat",
      "(0274) 123-4567",
      "info@puskesmasdigital.id",
      "Senin - Sabtu: 08:00 - 14:00 WIB",
      "Puskesmas Digital adalah fasilitas kesehatan tingkat pertama yang berkomitmen memberikan pelayanan kesehatan yang berkualitas, terjangkau, dan mudah diakses oleh seluruh masyarakat.",
      "Menjadi pusat kesehatan masyarakat yang modern, profesional, dan terpercaya.",
      "Memberikan pelayanan kesehatan prima\nMeningkatkan derajat kesehatan masyarakat\nMengembangkan SDM kesehatan yang kompeten\nMenerapkan teknologi informasi dalam pelayanan",
      "Poli Umum\nPoli Gigi\nPoli KIA/KB\nPoli Lansia\nPoli Anak\nPoli Gizi\nLaboratorium\nApotek\nRuang UGD",
    ]);
    console.log("  ↳ Seed puskesmas_info");
  }

  await conn.end();
  console.log("\n✅  Migrasi & seed selesai!\n");
}

migrate().catch(err => {
  console.error("\n❌  Error migrasi:", err.message);
  console.error("    Pastikan MySQL berjalan dan konfigurasi .env sudah benar.\n");
  process.exit(1);
});
