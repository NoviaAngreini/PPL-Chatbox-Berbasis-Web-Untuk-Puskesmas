// =============================================
// CHAT UI — terhubung ke /api/chat
// =============================================
const chatMessages = document.getElementById("chatMessages");
const chatInput    = document.getElementById("chatInput");
const btnSend      = document.getElementById("btnSend");
const btnSave      = document.getElementById("btnSaveHistory");
const btnClear     = document.getElementById("btnClearChat");
const typingEl     = document.getElementById("typingIndicator");
const statusEl     = document.getElementById("chatStatus");

let chatHistory = []; // { role, text }

function getTime() {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendMessage(role, html, time) {
  const wrap = document.createElement("div");
  wrap.className = `message-wrapper ${role}`;
  const avatar = role === "bot"
    ? `<div class="message-avatar"><i class="fas fa-robot"></i></div>`
    : `<div class="message-avatar" style="background:linear-gradient(135deg,#0ea5e9,#38bdf8)"><i class="fas fa-user"></i></div>`;
  wrap.innerHTML = `${avatar}<div class="message-bubble ${role}">${html}</div><span class="message-time">${time}</span>`;
  chatMessages.appendChild(wrap);
  scrollToBottom();
}

function showTyping(show) {
  if (typingEl) typingEl.style.display = show ? "flex" : "none";
  if (statusEl) statusEl.style.display = show ? "none" : "block";
}

// ─── Build HTML dari response bot ────────────────────────────────────────────
function buildBotHTML(response) {
  if (response.type === "jadwal" && response.data) {
    const rows = response.data.map(j => `
      <tr>
        <td>${j.poli}</td><td>${j.dokter}</td><td>${j.hari}</td><td>${j.jam}</td>
        <td><span style="padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;
          background:${j.status==="Buka"?"#dbeafe":"#fee2e2"};
          color:${j.status==="Buka"?"#1d4ed8":"#ef4444"}">${j.status}</span></td>
      </tr>`).join("");
    return `📅 <strong>Jadwal Poli Puskesmas:</strong>
      <div style="overflow-x:auto;margin-top:10px">
        <table class="bot-table"><thead><tr><th>Poli</th><th>Dokter</th><th>Hari</th><th>Jam</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody></table>
      </div>
      <br>🔗 <a href="/jadwal" style="color:#16a34a;font-weight:600">Lihat halaman Jadwal lengkap →</a>`;
  }

  if (response.type === "dokter" && response.data) {
    const items = response.data.map(d => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #e2e8f0;">
        <div style="width:34px;height:34px;background:linear-gradient(135deg,#2563eb,#60a5fa);border-radius:50%;
          display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex-shrink:0">
          <i class="fas fa-user-md"></i>
        </div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:13px">${d.nama}</div>
          <div style="font-size:12px;color:#64748b">${d.spesialis}</div>
        </div>
        <span style="padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;
          background:${d.status==="Tersedia"?"#dbeafe":"#fee2e2"};
          color:${d.status==="Tersedia"?"#1d4ed8":"#ef4444"}">${d.status}</span>
      </div>`).join("");
    return `👨‍⚕️ <strong>Daftar Dokter & Tenaga Medis:</strong>
      <div style="margin-top:10px">${items}</div>
      <br>🔗 <a href="/jadwal" style="color:#16a34a;font-weight:600">Lihat halaman Jadwal lengkap →</a>`;
  }

  return response.text || "Maaf, terjadi kesalahan.";
}

// ─── Kirim pesan ke /api/chat ─────────────────────────────────────────────────
async function sendMessage(text) {
  text = text.trim();
  if (!text) return;

  const time = getTime();
  appendMessage("user", text, time);
  chatHistory.push({ role: "user", text });
  if (chatInput) chatInput.value = "";

  showTyping(true);

  try {
    const res  = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const json = await res.json();
    showTyping(false);

    const html    = json.success ? buildBotHTML(json.data) : "Maaf, terjadi kesalahan server.";
    const botTime = getTime();
    appendMessage("bot", html, botTime);
    chatHistory.push({ role: "bot", text: html });
  } catch {
    showTyping(false);
    appendMessage("bot", "⚠️ Koneksi bermasalah. Silakan coba lagi.", getTime());
  }
}

function sendQuick(q) { sendMessage(q); }

if (btnSend)  btnSend.addEventListener("click",  () => sendMessage(chatInput.value));
if (chatInput) chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(chatInput.value); });

// ─── Simpan riwayat ke DB ─────────────────────────────────────────────────────
function showToast(msg, type = "success") {
  let t = document.getElementById("chatToast");
  if (!t) { t = document.createElement("div"); t.id = "chatToast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.className = "toast"; }, 3000);
}

if (btnSave) {
  btnSave.addEventListener("click", async () => {
    if (chatHistory.length === 0) return showToast("⚠️ Tidak ada percakapan untuk disimpan.", "error");
    try {
      const res = await fetch("/api/riwayat/simpan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topik: "Percakapan", pesan: chatHistory }),
      });
      const json = await res.json();
      showToast(json.success ? "✅ Riwayat berhasil disimpan!" : "❌ Gagal menyimpan.", json.success ? "success" : "error");
    } catch {
      showToast("❌ Gagal menyimpan riwayat.", "error");
    }
  });
}

if (btnClear) {
  btnClear.addEventListener("click", () => {
    const all = chatMessages.querySelectorAll(".message-wrapper");
    all.forEach((el, i) => { if (i > 0) el.remove(); });
    chatHistory = [];
    showToast("🗑️ Chat dibersihkan.");
  });
}
