const Dokter = require("../models/Dokter");

// ─── Validasi ──────────────────────────────────────────────────────────────────
function validate({ nama, spesialis, status }) {
  if (!nama?.trim())      return "Nama dokter wajib diisi.";
  if (!spesialis?.trim()) return "Spesialis wajib diisi.";
  const validStatus = ["Tersedia", "Tidak Tersedia"];
  if (status && !validStatus.includes(status)) return "Status tidak valid.";
  return null;
}

// ─── Admin views ──────────────────────────────────────────────────────────────
exports.adminIndex = async (req, res) => {
  const daftarDokter = await Dokter.getAll();
  res.render("admin/jadwal", {
    title: "Kelola Jadwal & Dokter",
    page: "admin-jadwal",
    jadwalPoli:   require("../models/Jadwal").getAll(),
    daftarDokter,
  });
};

// ─── CRUD (AJAX) ──────────────────────────────────────────────────────────────
exports.store = async (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(422).json({ success: false, message: err });
  await Dokter.create(req.body);
  res.json({ success: true, message: "Dokter berhasil ditambahkan." });
};

exports.update = async (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(422).json({ success: false, message: err });
  const existing = await Dokter.getById(+req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: "Dokter tidak ditemukan." });
  await Dokter.update(+req.params.id, req.body);
  res.json({ success: true, message: "Dokter berhasil diperbarui." });
};

exports.destroy = async (req, res) => {
  const existing = await Dokter.getById(+req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: "Dokter tidak ditemukan." });
  await Dokter.delete(+req.params.id);
  res.json({ success: true, message: "Dokter berhasil dihapus." });
};
