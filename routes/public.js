const express   = require("express");
const router    = express.Router();
const Jadwal    = require("../models/Jadwal");
const Dokter    = require("../models/Dokter");
const Informasi = require("../models/Informasi");
const Puskesmas = require("../models/Puskesmas");

router.get("/",          (req, res) => res.render("landing",   { title: "Puskesmas Digital" }));
router.get("/chat",      (req, res) => res.render("index",     { title: "Chatbot Puskesmas", page: "chat" }));
router.get("/riwayat",   (req, res) => res.render("riwayat",   { title: "Riwayat Chat",      page: "riwayat" }));

router.get("/jadwal", async (req, res) => {
  const [jadwalPoli, daftarDokter] = await Promise.all([Jadwal.getAll(), Dokter.getAll()]);
  res.render("jadwal", { title: "Jadwal Poli", page: "jadwal", jadwalPoli, daftarDokter });
});

router.get("/informasi", async (req, res) => {
  const informasiKesehatan = await Informasi.getAll();
  res.render("informasi", { title: "Informasi Kesehatan", page: "informasi", informasiKesehatan });
});

router.get("/tentang", async (req, res) => {
  const infoPuskesmas = await Puskesmas.get();
  res.render("tentang", { title: "Tentang Puskesmas", page: "tentang", infoPuskesmas });
});

module.exports = router;
