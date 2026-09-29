/**
 * ============================================================================
 * TanjAI (น้องแทนใจ) - Welcome & Microphone Onboarding Controller
 * Handles user gesture for navigator.mediaDevices.getUserMedia
 * ============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  const btnAllowMic = document.getElementById("btn-allow-mic");
  const btnContinue = document.getElementById("btn-continue");
  const permissionBox = document.getElementById("permission-box");
  const permissionIcon = document.getElementById("permission-icon");
  const permissionTitle = document.getElementById("permission-title");
  const permissionDesc = document.getElementById("permission-desc");
  const statusMsg = document.getElementById("status-msg");

  // ตรวจสอบว่าเคยอนุญาตสิทธิ์ไปแล้วหรือไม่
  chrome.storage.local.get(["mic_permission_granted"], (res) => {
    if (res && res.mic_permission_granted) {
      showGrantedState();
    }
  });

  // เสียงสังเคราะห์ Chime น่ารักเมื่ออนุญาตสิทธิ์สำเร็จ
  function playSuccessChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Note 1: E5
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2: G#5
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(830.61, now + 0.15);
      gain2.gain.setValueAtTime(0.15, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);

      // Note 3: B5
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(987.77, now + 0.3);
      gain3.gain.setValueAtTime(0.18, now + 0.3);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc3.connect(gain3);
      gain3.connect(audioCtx.destination);
      osc3.start(now + 0.3);
      osc3.stop(now + 0.8);
    } catch (e) {
      console.warn("Audio chime could not play:", e);
    }
  }

  function showGrantedState() {
    permissionBox.classList.add("granted");
    permissionIcon.textContent = "🎉";
    permissionTitle.textContent = "เปิดใช้งานไมโครโฟนเรียบร้อยแล้วค่า!";
    permissionDesc.textContent = "น้องแทนใจพร้อมรับฟังคำสั่งเสียงภาษาไทยจากคุณในทุกหน้าเว็บแล้วค่ะ";
    btnAllowMic.style.display = "none";
    btnContinue.style.display = "inline-flex";
    statusMsg.className = "status-msg success";
    statusMsg.textContent = "✓ บันทึกสิทธิ์การใช้งานไมโครโฟนสำเร็จสมบูรณ์";
  }

  btnAllowMic.addEventListener("click", async () => {
    try {
      btnAllowMic.disabled = true;
      btnAllowMic.textContent = "กำลังขอสิทธิ์จากเบราว์เซอร์...";

      // ขอสิทธิ์ไมโครโฟน
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // ปิด stream ทันทีเมื่อได้รับสิทธิ์ (ไม่เปิดค้างไว้เพื่อความเป็นส่วนตัว)
      stream.getTracks().forEach((track) => track.stop());

      // บันทึกสถานะลงใน chrome.storage.local
      await chrome.storage.local.set({ mic_permission_granted: true });

      // เล่นเสียงยืนยัน
      playSuccessChime();

      // อัปเดต UI
      showGrantedState();
    } catch (err) {
      console.error("[TanjAI Onboarding] Mic Permission Error:", err);
      btnAllowMic.disabled = false;
      btnAllowMic.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="22"></line>
        </svg>
        ลองใหม่อีกครั้ง
      `;
      statusMsg.className = "status-msg error";
      statusMsg.textContent = "⚠️ ไม่ได้รับสิทธิ์ไมโครโฟน กรุณาคลิก Allow ที่แถบแจ้งเตือนของเบราว์เซอร์นะคะ";
    }
  });

  // ปุ่มเปิดหน้าตั้งค่า หรือเริ่มท่องเว็บ
  btnContinue.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
  });
});
