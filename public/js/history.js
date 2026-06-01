// Load & display history from localStorage
const container = document.getElementById("historyContainer");
const btnClear = document.getElementById("btnClearHistory");

function renderHistory() {
  const stored = JSON.parse(localStorage.getItem("chatRiwayat") || "[]");

  if (stored.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <i class="fas fa-inbox"></i>
        <p>Belum ada riwayat yang disimpan.</p>
        <p>Pergi ke <a href="/">halaman Chatbot</a> dan klik <strong>Simpan</strong> untuk menyimpan percakapan.</p>
      </div>`;
    return;
  }

  container.innerHTML = "";
  // Show newest first
  [...stored].reverse().forEach((session) => {
    const div = document.createElement("div");
    div.className = "history-session";

    const msgs = session.messages
      .map(
        (m) => `
      <div class="hist-msg ${m.role}">
        <span class="hist-badge ${m.role}">${m.role === "user" ? "Anda" : "Bot"}</span>
        <div class="hist-text">${m.role === "user" ? m.text : stripHTML(m.text)}</div>
      </div>
    `,
      )
      .join("");

    div.innerHTML = `
      <div class="session-header">
        <span class="session-date"><i class="fas fa-calendar-alt"></i> ${session.date}</span>
        <span class="session-count">${session.messages.length} pesan</span>
      </div>
      <div class="session-messages">${msgs}</div>
    `;
    container.appendChild(div);
  });
}

function stripHTML(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || html;
}

btnClear &&
  btnClear.addEventListener("click", () => {
    if (!confirm("Hapus semua riwayat chat?")) return;
    localStorage.removeItem("chatRiwayat");
    renderHistory();
    showToast("🗑️ Semua riwayat dihapus.", "");
  });

renderHistory();
