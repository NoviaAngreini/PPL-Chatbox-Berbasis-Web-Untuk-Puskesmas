const { query, queryOne } = require("../config/db");

const Informasi = {
  getAll: (filters = {}) => {
    let sql = "SELECT * FROM informasi WHERE 1=1";
    const params = [];
    if (filters.kategori) { sql += " AND LOWER(kategori) = ?"; params.push(filters.kategori.toLowerCase()); }
    return query(sql + " ORDER BY id DESC", params);
  },

  getById: (id) =>
    queryOne("SELECT * FROM informasi WHERE id = ?", [id]),

  create: ({ judul, kategori, isi, icon }) =>
    query(
      "INSERT INTO informasi (judul, kategori, isi, icon) VALUES (?, ?, ?, ?)",
      [judul, kategori || "Umum", isi, icon || "info-circle"]
    ),

  update: (id, { judul, kategori, isi, icon }) =>
    query(
      "UPDATE informasi SET judul=?, kategori=?, isi=?, icon=? WHERE id=?",
      [judul, kategori, isi, icon || "info-circle", id]
    ),

  delete: (id) =>
    query("DELETE FROM informasi WHERE id = ?", [id]),
};

module.exports = Informasi;
