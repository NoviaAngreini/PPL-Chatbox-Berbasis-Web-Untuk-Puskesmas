const { query, queryOne } = require("../config/db");

const Dokter = {
  getAll: () =>
    query("SELECT * FROM dokter ORDER BY id"),

  getById: (id) =>
    queryOne("SELECT * FROM dokter WHERE id = ?", [id]),

  create: ({ nama, spesialis, pengalaman, status }) =>
    query(
      "INSERT INTO dokter (nama, spesialis, pengalaman, status) VALUES (?, ?, ?, ?)",
      [nama, spesialis, pengalaman || "-", status || "Tersedia"]
    ),

  update: (id, { nama, spesialis, pengalaman, status }) =>
    query(
      "UPDATE dokter SET nama=?, spesialis=?, pengalaman=?, status=? WHERE id=?",
      [nama, spesialis, pengalaman, status, id]
    ),

  delete: (id) =>
    query("DELETE FROM dokter WHERE id = ?", [id]),
};

module.exports = Dokter;
