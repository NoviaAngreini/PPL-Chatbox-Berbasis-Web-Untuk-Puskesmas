const { query, queryOne } = require("../config/db");

const Puskesmas = {
  get: async () => {
    const row = await queryOne("SELECT * FROM puskesmas_info WHERE id = 1");
    if (!row) return null;
    return {
      ...row,
      jamOperasional: row.jam_operasional,
      misi:      (row.misi      || "").split("\n").filter(Boolean),
      fasilitas: (row.fasilitas || "").split("\n").filter(Boolean),
    };
  },

  update: ({ nama, tagline, alamat, telepon, email, jamOperasional, tentang, visi, misi, fasilitas }) => {
    const misiStr = Array.isArray(misi) ? misi.join("\n") : (misi || "").split("\n").filter(Boolean).join("\n");
    const fasStr  = Array.isArray(fasilitas) ? fasilitas.join("\n") : (fasilitas || "").split("\n").filter(Boolean).join("\n");
    return query(
      `UPDATE puskesmas_info SET nama=?,tagline=?,alamat=?,telepon=?,email=?,jam_operasional=?,tentang=?,visi=?,misi=?,fasilitas=? WHERE id=1`,
      [nama, tagline, alamat, telepon, email, jamOperasional, tentang, visi, misiStr, fasStr]
    );
  },
};

module.exports = Puskesmas;
