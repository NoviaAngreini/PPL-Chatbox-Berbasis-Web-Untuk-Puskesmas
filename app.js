require("dotenv").config();
const express = require("express");
const path    = require("path");
const session = require("express-session");

const app = express();

app.use((req, res, next) => {

  const ignored = [
    ".css",
    ".js",
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".ico"
  ];

  const isStatic = ignored.some(ext =>
    req.url.endsWith(ext)
  );

  if (!isStatic) {
    console.log(`${req.method} ${req.url}`);
  }

  next();
});

// ─── View engine ─────────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ─── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Session ─────────────────────────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || "pkm-digital-s3cr3t-2025!",
  resave:            false,
  saveUninitialized: false,
  cookie:            { maxAge: 4 * 60 * 60 * 1000 }, // 4 jam
}));

// ─── Inject adminUser ke semua view ──────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.adminUser = req.session.adminUser || null;
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/",       require("./routes/public"));
app.use("/admin",  require("./routes/admin"));
app.use("/api",    require("./routes/api"));


// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  if (req.path.startsWith("/api")) {
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
  res.status(500).send(`<h2>Error: ${err.message}</h2>`);
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅  Server berjalan di http://localhost:${PORT}`);
  console.log(`    Mode: ${process.env.NODE_ENV || "development"}`);
});
