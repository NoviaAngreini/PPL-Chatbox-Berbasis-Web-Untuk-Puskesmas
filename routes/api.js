const express    = require("express");
const router     = express.Router();
const Jadwal     = require("../models/Jadwal");
const Dokter     = require("../models/Dokter");
const chatCtrl   = require("../controllers/chatController");

// Response helpers
const ok  = (res, data, meta = {}) => res.json({ success: true, ...meta, data });
const err = (res, msg, code = 400) => res.status(code).json({ success: false, message: msg });

// ─── Dokter ───────────────────────────────────────────────────────────────────
// GET /api/dokter
router.get("/dokter", async (req, res) => {
  const data = await Dokter.getAll();
  ok(res, data, { total: data.length });
});

// GET /api/dokter/:id
router.get("/dokter/:id", async (req, res) => {
  const item = await Dokter.getById(+req.params.id);
  if (!item) return err(res, "Dokter tidak ditemukan.", 404);
  ok(res, item);
});

// POST /api/dokter
router.post("/dokter", async (req, res) => {
  const { nama, spesialis, pengalaman, status } = req.body;
  if (!nama?.trim())      return err(res, "Nama dokter wajib diisi.");
  if (!spesialis?.trim()) return err(res, "Spesialis wajib diisi.");
  await Dokter.create({ nama, spesialis, pengalaman, status });
  const created = (await Dokter.getAll()).at(-1);
  res.status(201).json({ success: true, message: "Dokter berhasil ditambahkan.", data: created });
});

// PUT /api/dokter/:id
router.put("/dokter/:id", async (req, res) => {
  const { nama, spesialis, pengalaman, status } = req.body;
  if (!nama?.trim())      return err(res, "Nama dokter wajib diisi.");
  if (!spesialis?.trim()) return err(res, "Spesialis wajib diisi.");
  const existing = await Dokter.getById(+req.params.id);
  if (!existing) return err(res, "Dokter tidak ditemukan.", 404);
  await Dokter.update(+req.params.id, { nama, spesialis, pengalaman, status });
  ok(res, await Dokter.getById(+req.params.id), { message: "Dokter berhasil diperbarui." });
});

// DELETE /api/dokter/:id
router.delete("/dokter/:id", async (req, res) => {
  const existing = await Dokter.getById(+req.params.id);
  if (!existing) return err(res, "Dokter tidak ditemukan.", 404);
  await Dokter.delete(+req.params.id);
  ok(res, null, { message: "Dokter berhasil dihapus." });
});

// ─── Jadwal Poli ─────────────────────────────────────────────────────────────
// GET /api/jadwal
router.get("/jadwal", async (req, res) => {
  const data = await Jadwal.getAll({ status: req.query.status, poli: req.query.poli });
  ok(res, data, { total: data.length });
});

// GET /api/jadwal/:id
router.get("/jadwal/:id", async (req, res) => {
  const item = await Jadwal.getById(+req.params.id);
  if (!item) return err(res, "Jadwal tidak ditemukan.", 404);
  ok(res, item);
});

// POST /api/jadwal
router.post("/jadwal", async (req, res) => {
  const { poli, hari, jam, dokter, status } = req.body;
  if (!poli?.trim())   return err(res, "Nama poli wajib diisi.");
  if (!hari?.trim())   return err(res, "Hari wajib diisi.");
  if (!jam?.trim())    return err(res, "Jam wajib diisi.");
  if (!dokter?.trim()) return err(res, "Nama dokter wajib diisi.");
  await Jadwal.create({ poli, hari, jam, dokter, status });
  const all = await Jadwal.getAll();
  res.status(201).json({ success: true, message: "Jadwal berhasil ditambahkan.", data: all.at(-1) });
});

// PUT /api/jadwal/:id
router.put("/jadwal/:id", async (req, res) => {
  const { poli, hari, jam, dokter, status } = req.body;
  if (!poli?.trim())   return err(res, "Nama poli wajib diisi.");
  if (!hari?.trim())   return err(res, "Hari wajib diisi.");
  if (!jam?.trim())    return err(res, "Jam wajib diisi.");
  if (!dokter?.trim()) return err(res, "Nama dokter wajib diisi.");
  const existing = await Jadwal.getById(+req.params.id);
  if (!existing) return err(res, "Jadwal tidak ditemukan.", 404);
  await Jadwal.update(+req.params.id, { poli, hari, jam, dokter, status });
  ok(res, await Jadwal.getById(+req.params.id), { message: "Jadwal berhasil diperbarui." });
});

// DELETE /api/jadwal/:id
router.delete("/jadwal/:id", async (req, res) => {
  const existing = await Jadwal.getById(+req.params.id);
  if (!existing) return err(res, "Jadwal tidak ditemukan.", 404);
  await Jadwal.delete(+req.params.id);
  ok(res, null, { message: "Jadwal berhasil dihapus." });
});

// ─── Chatbot ──────────────────────────────────────────────────────────────────
// POST /api/chat
router.post("/chat", chatCtrl.chat);

// POST /api/riwayat/simpan
router.post("/riwayat/simpan", chatCtrl.simpan);

// ─── 404 ─────────────────────────────────────────────────────────────────────
router.use((req, res) => {
  err(res, `Endpoint '${req.method} /api${req.path}' tidak ditemukan.`, 404);
});

module.exports = router;
