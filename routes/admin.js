const express    = require("express");
const router     = express.Router();
const ctrl       = require("../controllers/adminController");
const jadwalCtrl = require("../controllers/jadwalController");
const dokterCtrl = require("../controllers/dokterController");

// ─── Middleware: proteksi semua route /admin kecuali login ────────────────────
function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) return next();
  res.redirect("/admin/login?redirect=" + encodeURIComponent(req.originalUrl));
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.get( "/login",  ctrl.loginPage);
router.post("/login",  ctrl.login);
router.post("/logout", ctrl.logout);

// ─── Protected pages ──────────────────────────────────────────────────────────
router.use(requireAdmin);

router.get("/",               ctrl.dashboard);
router.get("/jadwal",         ctrl.jadwalPage);
router.get("/riwayat",        ctrl.riwayatPage);
router.get("/informasi",      ctrl.informasiPage);
router.get("/puskesmas",      ctrl.puskesmasPage);
router.get("/ganti-password", ctrl.gantiPasswordPage);

// ─── CRUD Jadwal ──────────────────────────────────────────────────────────────
router.post("/jadwal",    jadwalCtrl.store);
router.put("/jadwal/:id", jadwalCtrl.update);
router.delete("/jadwal/:id", jadwalCtrl.destroy);

// ─── CRUD Dokter ──────────────────────────────────────────────────────────────
router.post("/dokter",    dokterCtrl.store);
router.put("/dokter/:id", dokterCtrl.update);
router.delete("/dokter/:id", dokterCtrl.destroy);

// ─── Riwayat Chat ─────────────────────────────────────────────────────────────
router.delete("/riwayat/:id", ctrl.deleteRiwayat);

// ─── Informasi ────────────────────────────────────────────────────────────────
router.post("/informasi",    ctrl.storeInformasi);
router.put("/informasi/:id", ctrl.updateInformasi);
router.delete("/informasi/:id", ctrl.deleteInformasi);

// ─── Puskesmas ────────────────────────────────────────────────────────────────
router.put("/puskesmas", ctrl.updatePuskesmas);

// ─── Ganti Password ───────────────────────────────────────────────────────────
router.post("/ganti-password", ctrl.gantiPassword);

module.exports = router;
