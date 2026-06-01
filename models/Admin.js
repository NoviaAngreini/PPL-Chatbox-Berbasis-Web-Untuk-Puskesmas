const { query, queryOne } = require("../config/db");
const bcrypt = require("bcryptjs");

const Admin = {
  getByUsername: (username) =>
    queryOne("SELECT * FROM admins WHERE username = ?", [username.toLowerCase().trim()]),

  getById: (id) =>
    queryOne("SELECT id, username, nama, role, avatar FROM admins WHERE id = ?", [id]),

  updatePassword: async (id, newPassword) => {
    const hash = await bcrypt.hash(newPassword, 10);
    return query("UPDATE admins SET password = ? WHERE id = ?", [hash, id]);
  },

  verifyPassword: (plain, hash) => bcrypt.compare(plain, hash),
};

module.exports = Admin;
