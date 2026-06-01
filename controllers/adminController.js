const Admin       = require("../models/Admin");
const Jadwal      = require("../models/Jadwal");
const Dokter      = require("../models/Dokter");
const ChatHistory = require("../models/ChatHistory");
const Informasi   = require("../models/Informasi");
const Puskesmas   = require("../models/Puskesmas");
const bcrypt      = require("bcryptjs");

// ─── Auth ─────────────────────────────────────────────────────────────────────
exports.loginPage = (req, res) => {
  if (req.session.isAdmin) return res.redirect("/admin");
  res.render("admin/login", { title: "Login Admin", error: null, redirect: req.query.redirect || "/admin" });
};

exports.login = async (req, res) => {
  const { username, password, redirect } = req.body;
  const renderErr = (msg) =>
    res.render("admin/login", { title: "Login Admin", error: msg, redirect: redirect || "/admin" });

  if (!username?.trim()) return renderErr("Username wajib diisi.");
  if (!password)         return renderErr("Password wajib diisi.");

  const user = await Admin.getByUsername(username);
  if (!user) return renderErr("Username atau password salah.");

  const valid = await Admin.verifyPassword(password, user.password);
  if (!valid) return renderErr("Username atau password salah.");

  req.session.isAdmin   = true;
  req.session.adminUser = { id: user.id, username: user.username, nama: user.nama, role: user.role, avatar: user.avatar };
  res.redirect(redirect?.startsWith("/admin") ? redirect : "/admin");
};

exports.logout = (req, res) =>
  req.session.destroy(() => res.redirect("/admin/login?out=1"));

// ─── Dashboard ────────────────────────────────────────────────────────────────
exports.dashboard = async (req, res) => {
  const [jadwalPoli, daftarDokter, chatHistory, informasiKesehatan] = await Promise.all([
    Jadwal.getAll(),
    Dokter.getAll(),
    ChatHistory.getAll(),
    Informasi.getAll(),
  ]);
  res.render("admin/dashboard", {
    title: "Dashboard Admin", page: "admin-dashboard",
    jadwalPoli, daftarDokter,
    chatHistory: chatHistory.map(c => ({ ...c, pesan: [] })),
    informasiKesehatan,
  });
};

// ─── Jadwal + Dokter page ─────────────────────────────────────────────────────
exports.jadwalPage = async (req, res) => {
  const [jadwalPoli, daftarDokter] = await Promise.all([Jadwal.getAll(), Dokter.getAll()]);
  res.render("admin/jadwal", { title: "Kelola Jadwal & Dokter", page: "admin-jadwal", jadwalPoli, daftarDokter });
};

// ─── Riwayat Chat ─────────────────────────────────────────────────────────────
exports.riwayatPage = async (req, res) => {
  const chatHistory = await ChatHistory.getAllWithMessages();
  res.render("admin/riwayat", { title: "Riwayat Chat", page: "admin-riwayat", chatHistory });
};

exports.deleteRiwayat = async (req, res) => {
  await ChatHistory.delete(+req.params.id);
  res.json({ success: true, message: "Riwayat dihapus." });
};

// ─── Informasi Kesehatan ──────────────────────────────────────────────────────
exports.informasiPage = async (req, res) => {
  const informasiKesehatan = await Informasi.getAll();
  res.render("admin/informasi", { title: "Kelola Informasi", page: "admin-informasi", informasiKesehatan });
};

exports.storeInformasi = async (req, res) => {
  const { judul, isi } = req.body;
  if (!judul?.trim()) return res.status(422).json({ success: false, message: "Judul wajib diisi." });
  if (!isi?.trim())   return res.status(422).json({ success: false, message: "Isi artikel wajib diisi." });
  await Informasi.create(req.body);
  res.json({ success: true, message: "Artikel berhasil ditambahkan." });
};

exports.updateInformasi = async (req, res) => {
  const { judul, isi } = req.body;
  if (!judul?.trim()) return res.status(422).json({ success: false, message: "Judul wajib diisi." });
  if (!isi?.trim())   return res.status(422).json({ success: false, message: "Isi artikel wajib diisi." });
  const existing = await Informasi.getById(+req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: "Artikel tidak ditemukan." });
  await Informasi.update(+req.params.id, req.body);
  res.json({ success: true, message: "Artikel berhasil diperbarui." });
};

exports.deleteInformasi = async (req, res) => {
  await Informasi.delete(+req.params.id);
  res.json({ success: true, message: "Artikel dihapus." });
};

// ─── Info Puskesmas ───────────────────────────────────────────────────────────
exports.puskesmasPage = async (req, res) => {
  const infoPuskesmas = await Puskesmas.get();
  res.render("admin/puskesmas", { title: "Info Puskesmas", page: "admin-puskesmas", infoPuskesmas });
};

exports.updatePuskesmas = async (req, res) => {
  await Puskesmas.update(req.body);
  res.json({ success: true, message: "Info puskesmas berhasil diperbarui." });
};

// ─── Ganti Password ───────────────────────────────────────────────────────────
exports.gantiPasswordPage = (req, res) =>
  res.render("admin/ganti-password", { title: "Ganti Password", page: "admin-ganti-password", error: null, success: null });

exports.gantiPassword = async (req, res) => {
  const render = (error, success) =>
    res.render("admin/ganti-password", { title: "Ganti Password", page: "admin-ganti-password", error, success });

  const { password_lama, password_baru, password_konfirmasi } = req.body;
  if (!password_lama || !password_baru || !password_konfirmasi) return render("Semua field wajib diisi.", null);
  if (password_baru.length < 8)                                 return render("Password baru minimal 8 karakter.", null);
  if (password_baru !== password_konfirmasi)                    return render("Konfirmasi password tidak cocok.", null);

  const user = await Admin.getByUsername(req.session.adminUser.username);
  if (!await Admin.verifyPassword(password_lama, user.password)) return render("Password lama salah.", null);

  await Admin.updatePassword(user.id, password_baru);
  render(null, "Password berhasil diubah!");
};
