const { query, queryOne } = require("../config/db");

const Jadwal = {
  getAll: (filters = {}) => {
    let sql = "SELECT * FROM jadwal_poli WHERE 1=1";
    const params = [];
    if (filters.status) { sql += " AND LOWER(status) = ?";    params.push(filters.status.toLowerCase()); }
    if (filters.poli)   { sql += " AND LOWER(poli) LIKE ?";   params.push(`%${filters.poli.toLowerCase()}%`); }
    return query(sql + " ORDER BY id", params);
  },

  getById: (id) =>
    queryOne("SELECT * FROM jadwal_poli WHERE id = ?", [id]),

  create: ({ poli, hari, jam, dokter, status }) =>
    query(
      "INSERT INTO jadwal_poli (poli, hari, jam, dokter, status) VALUES (?, ?, ?, ?, ?)",
      [poli, hari, jam, dokter, status || "Buka"]
    ),

  update: (id, { poli, hari, jam, dokter, status }) =>
    query(
      "UPDATE jadwal_poli SET poli=?, hari=?, jam=?, dokter=?, status=? WHERE id=?",
      [poli, hari, jam, dokter, status, id]
    ),

  delete: (id) =>
    query("DELETE FROM jadwal_poli WHERE id = ?", [id]),
};

module.exports = Jadwal;
