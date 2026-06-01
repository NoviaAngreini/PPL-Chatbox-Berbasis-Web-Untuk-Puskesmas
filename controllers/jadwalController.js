const Jadwal = require("../models/Jadwal");

// ─── Validasi ──────────────────────────────────────────────────────────────────
function validate({ poli, hari, jam, dokter, status }) {
  if (!poli?.trim())   return "Nama poli wajib diisi.";
  if (!hari?.trim())   return "Hari wajib diisi.";
  if (!jam?.trim())    return "Jam wajib diisi.";
  if (!dokter?.trim()) return "Nama dokter wajib diisi.";
  if (status && !["Buka","Libur"].includes(status)) return "Status tidak valid.";
  return null;
}

exports.store = async (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(422).json({ success: false, message: err });
  await Jadwal.create(req.body);
  res.json({ success: true, message: "Jadwal berhasil ditambahkan." });
};

exports.update = async (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(422).json({ success: false, message: err });
  const existing = await Jadwal.getById(+req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: "Jadwal tidak ditemukan." });
  await Jadwal.update(+req.params.id, req.body);
  res.json({ success: true, message: "Jadwal berhasil diperbarui." });
};

exports.destroy = async (req, res) => {
  const existing = await Jadwal.getById(+req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: "Jadwal tidak ditemukan." });
  await Jadwal.delete(+req.params.id);
  res.json({ success: true, message: "Jadwal berhasil dihapus." });
};
