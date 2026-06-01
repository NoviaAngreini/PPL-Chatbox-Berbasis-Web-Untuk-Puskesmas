const { query, queryOne } = require("../config/db");

const ChatHistory = {
  // Ambil semua history (tanpa messages)
  getAll: () =>
    query("SELECT * FROM chat_history ORDER BY id DESC"),

  // Ambil satu history beserta semua messages-nya
  getById: async (id) => {
    const history = await queryOne("SELECT * FROM chat_history WHERE id = ?", [id]);
    if (!history) return null;
    history.pesan = await query(
      "SELECT role, text FROM chat_messages WHERE history_id = ? ORDER BY id",
      [id]
    );
    return history;
  },

  // Ambil semua history + messages (untuk admin riwayat)
  getAllWithMessages: async () => {
    const histories = await query("SELECT * FROM chat_history ORDER BY id DESC");
    for (const h of histories) {
      h.pesan = await query(
        "SELECT role, text FROM chat_messages WHERE history_id = ? ORDER BY id",
        [h.id]
      );
    }
    return histories;
  },

  // Simpan satu sesi percakapan
  create: async (topik, messages) => {
    const [result] = await query(
      "INSERT INTO chat_history (topik) VALUES (?)",
      [topik || "Percakapan"]
    );
    const historyId = result.insertId;
    for (const m of messages) {
      await query(
        "INSERT INTO chat_messages (history_id, role, text) VALUES (?, ?, ?)",
        [historyId, m.role, m.text]
      );
    }
    return historyId;
  },

  delete: (id) =>
    query("DELETE FROM chat_history WHERE id = ?", [id]),
};

module.exports = ChatHistory;
