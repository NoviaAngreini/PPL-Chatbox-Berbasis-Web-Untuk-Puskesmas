const Jadwal      = require("../models/Jadwal");
const Dokter      = require("../models/Dokter");
const ChatHistory = require("../models/ChatHistory");

// ─── RULE-BASED BOT ENGINE ────────────────────────────────────────────────────
function matchKeywords(msg, keywords) {
  return keywords.some(k => msg.includes(k));
}

async function getBotResponse(msg) {
  const m = msg.toLowerCase().trim();

  // Salam
  if (matchKeywords(m, ["halo","hai","hello","hi","selamat pagi","selamat siang","selamat sore"])) {
    return { type: "text", text: `👋 Halo! Selamat datang di <strong>Puskesmas Digital</strong>.<br>Ada yang bisa saya bantu hari ini?<br><br>Coba ketik: <em>jadwal</em>, <em>dokter</em>, <em>pendaftaran</em>, <em>lokasi</em>, atau <em>bpjs</em>.` };
  }

  // Jadwal poli
  if (matchKeywords(m, ["jadwal","poli","schedule","pelayanan"])) {
    const jadwal = await Jadwal.getAll();
    return { type: "jadwal", data: jadwal };
  }

  // Dokter
  if (matchKeywords(m, ["dokter","doctor","tenaga medis","dokter gigi","spesialis"])) {
    const dokter = await Dokter.getAll();
    return { type: "dokter", data: dokter };
  }

  // Jam operasional
  if (matchKeywords(m, ["jam","buka","tutup","operasional","waktu","kapan"])) {
    return { type: "text", text: `🕗 <strong>Jam Operasional Puskesmas:</strong><br>Senin – Kamis : 08:00 – 14:00 WIB<br>Jumat         : 08:00 – 11:30 WIB<br>Sabtu         : 08:00 – 13:00 WIB<br>Minggu        : <em>Tutup</em><br><br>⚠️ Untuk kedaruratan, segera ke IGD terdekat.` };
  }

  // Pendaftaran
  if (matchKeywords(m, ["daftar","pendaftaran","antrian","nomor antri","loket"])) {
    return { type: "text", text: `📋 <strong>Cara Pendaftaran:</strong><br>1. Datang ke loket pendaftaran<br>2. Ambil nomor antrian<br>3. Tunggu panggilan di ruang tunggu<br><br>📌 Pendaftaran dibuka: <strong>08:00 – 11:30 WIB</strong><br>Bawa: <strong>KTP / KIS / Kartu BPJS</strong>` };
  }

  // Lokasi
  if (matchKeywords(m, ["lokasi","alamat","dimana","maps","peta","jalan"])) {
    return { type: "text", text: `📍 <strong>Lokasi Puskesmas Digital</strong><br>Jl. Kesehatan No. 1, Kec. Sehat Sejahtera<br><br>🚌 Bisa dijangkau dengan angkutan umum rute 5 & 12A.<br>🅿️ Tersedia parkir gratis.` };
  }

  // BPJS
  if (matchKeywords(m, ["bpjs","jkn","asuransi","kartu sehat","jaminan"])) {
    return { type: "text", text: `💳 <strong>Layanan BPJS Kesehatan:</strong><br>Kami melayani pasien BPJS/JKN.<br><br>📌 Prosedur:<br>1. Datang sesuai jam pelayanan<br>2. Tunjukkan kartu BPJS aktif + KTP<br>3. Daftar di loket BPJS (loket 2)<br><br>Hotline: <strong>(0274) 123-4567</strong>` };
  }

  // Kontak
  if (matchKeywords(m, ["telepon","hubungi","kontak","nomor","whatsapp","wa","phone"])) {
    return { type: "text", text: `📞 <strong>Kontak Puskesmas Digital:</strong><br>Telepon: (0274) 123-4567<br>Email: info@puskesmasdigital.id<br><br>Jam layanan telepon: Senin–Sabtu 08:00–13:00 WIB` };
  }

  // Terima kasih
  if (matchKeywords(m, ["terima kasih","makasih","thanks","thank you"])) {
    return { type: "text", text: `😊 Sama-sama! Semoga Anda selalu sehat. Jangan ragu untuk bertanya kembali ya!` };
  }

  // Keluhan umum
  if (message.includes("demam")) {
    return { type: "text", text: "Keluhan demam memerlukan pemeriksaan lebih lanjut. Silakan mengunjungi puskesmas atau fasilitas kesehatan terdekat untuk mendapatkan penanganan yang tepat." };
  }

  if (message.includes("batuk")) {
    return { type: "text", text: "Keluhan batuk dapat disebabkan oleh berbagai kondisi. Untuk pemeriksaan lebih lanjut, silakan berkonsultasi langsung dengan dokter di puskesmas." };
  }

  if (message.includes("sakit kepala")) {
    return { type: "text", text: "Sakit kepala dapat memiliki banyak penyebab. Disarankan untuk memeriksakan diri ke puskesmas apabila keluhan berlanjut." };
  }

  if (message.includes("diare")) {
    return { type: "text", text: "Pastikan kebutuhan cairan tubuh tetap terpenuhi. Jika kondisi tidak membaik, silakan kunjungi puskesmas untuk pemeriksaan lebih lanjut." };
  }

  // Default
  return {
    type: "text",
    text: `Maaf, saya belum memahami pertanyaan tersebut. 😊<br><br>Silakan coba:<br>👉 <strong>jadwal</strong> – jadwal poli<br>👉 <strong>dokter</strong> – info dokter<br>👉 <strong>pendaftaran</strong> – cara daftar<br>👉 <strong>jam</strong> – jam operasional<br>👉 <strong>lokasi</strong> – alamat puskesmas<br>👉 <strong>bpjs</strong> – layanan BPJS`,
  };
}

// ─── CONTROLLER ───────────────────────────────────────────────────────────────
// POST /api/chat  — chatbot endpoint
exports.chat = async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) {
    return res.status(422).json({ success: false, message: "Pesan tidak boleh kosong." });
  }
  const response = await getBotResponse(message);
  res.json({ success: true, data: response });
};

// POST /api/riwayat/simpan  — simpan sesi chat ke DB
exports.simpan = async (req, res) => {
  const { topik, pesan } = req.body;
  if (!Array.isArray(pesan) || pesan.length === 0)
    return res.status(422).json({ success: false, message: "Tidak ada pesan untuk disimpan." });
  const id = await ChatHistory.create(topik || "Percakapan", pesan);
  res.json({ success: true, message: "Riwayat berhasil disimpan.", id });
};
