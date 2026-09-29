/**
 * ============================================================================
 * TanjAI (น้องแทนใจ) - Options & Avatar Selector Controller (v2)
 * Features:
 *  1. 3-Avatar Style Selector + Costume Switcher (Locked/Unlocked State)
 *  2. Usage Level Progress Bar (600 min/level)
 *  3. Affection EXP Progress Bar
 *  4. Unlocked Dance Styles Visualization
 *  5. 4-Stat Dashboard (Continuous Min, Total Min, Commands, User Level)
 *  6. Gemini API Key & Long-Term Memory Settings
 *  7. Companion Behavior Preferences (Idle Dance, Eye-Rest Interval)
 *  8. Dynamic Eye-Rest Alarm Update on Save
 * ============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM References ---
  const avatarCards = document.querySelectorAll(".avatar-card");
  const selectDanceTimeout = document.getElementById("select-dance-timeout");
  const selectEyeRest = document.getElementById("select-eye-rest");
  const inputGeminiKey = document.getElementById("input-gemini-key");
  const btnSave = document.getElementById("btn-save-settings");
  const saveToast = document.getElementById("save-toast");

  // Stats
  const statMinutes = document.getElementById("stat-minutes");
  const statTotalMinutes = document.getElementById("stat-total-minutes");
  const statCommands = document.getElementById("stat-commands");
  const statUserLevel = document.getElementById("stat-user-level");

  // Affection DOM
  const affectionLevelText = document.getElementById("affection-level-text");
  const affectionExpText = document.getElementById("affection-exp-text");
  const affectionProgressFill = document.getElementById("affection-progress-fill");

  // Usage Level DOM
  const usageLevelNum = document.getElementById("usage-level-num");
  const usageLevelTitle = document.getElementById("usage-level-title");
  const usageLevelSubtitle = document.getElementById("usage-level-subtitle");
  const usageProgressText = document.getElementById("usage-progress-text");
  const usageBarFill = document.getElementById("usage-bar-fill");

  let currentSelectedStyle = "orange_mascot";
  let currentSelectedCostume = "default";

  // ============================================================================
  // 1. ดึงข้อมูลจาก Background Service Worker
  // ============================================================================
  chrome.runtime.sendMessage({ action: "GET_STATS_AND_SETTINGS" }, (res) => {
    if (chrome.runtime.lastError || !res) {
      console.warn("[TanjAI Options] Failed to fetch settings:", chrome.runtime.lastError);
      return;
    }

    const {
      preferences,
      memory,
      usageMinutes,
      totalUsageMinutes,
      continuousUsageMinutes,
      totalCommands,
      affection_level,
      affection_exp,
      userLevel,
      unlockedCostumes,
      unlockedDances
    } = res;

    // ============= สถิติ =============
    const continuous = continuousUsageMinutes || 0;
    const totalMin = totalUsageMinutes || usageMinutes || 0;
    const lvl = userLevel || 1;

    if (statMinutes) statMinutes.textContent = continuous;
    if (statTotalMinutes) statTotalMinutes.textContent = totalMin;
    if (statCommands) statCommands.textContent = totalCommands || 0;
    if (statUserLevel) statUserLevel.textContent = lvl;

    // ============= Usage Level Progress =============
    const minPerLevel = 600;
    const progressInCurrentLevel = totalMin % minPerLevel;
    const progressPercent = Math.min(100, Math.round((progressInCurrentLevel / minPerLevel) * 100));

    if (usageLevelNum) usageLevelNum.textContent = lvl;
    if (usageLevelTitle) usageLevelTitle.textContent = `\u2b50 Usage Level ${lvl}`;
    if (usageLevelSubtitle) usageLevelSubtitle.textContent = `\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19\u0e23\u0e48\u0e27\u0e21\u0e01\u0e31\u0e19 ${totalMin} \u0e19\u0e32\u0e17\u0e35 | \u0e40\u0e25\u0e40\u0e27\u0e25\u0e2b\u0e19\u0e49\u0e32: ${lvl * minPerLevel} \u0e19\u0e32\u0e17\u0e35`;
    if (usageProgressText) usageProgressText.textContent = `${progressInCurrentLevel} / ${minPerLevel} \u0e19\u0e32\u0e17\u0e35`;
    if (usageBarFill) {
      setTimeout(() => { usageBarFill.style.width = `${progressPercent}%`; }, 150);
    }

    // ============= Affection EXP =============
    const affLvl = affection_level || 1;
    const affExp = affection_exp || 0;
    const expNeeded = affLvl * 100;
    const affPct = Math.min(100, Math.round((affExp / expNeeded) * 100));

    if (affectionLevelText) affectionLevelText.textContent = `\u0e04\u0e27\u0e32\u0e21\u0e2a\u0e19\u0e34\u0e17\u0e23\u0e30\u0e14\u0e31\u0e1a: Level ${affLvl}`;
    if (affectionExpText) affectionExpText.textContent = `${affExp} / ${expNeeded} (${affPct}%)`;
    if (affectionProgressFill) {
      setTimeout(() => { affectionProgressFill.style.width = `${affPct}%`; }, 300);
    }

    // ============= Preferences =============
    if (preferences) {
      if (preferences.avatarStyle) {
        currentSelectedStyle = preferences.avatarStyle;
        updateAvatarCardUI(currentSelectedStyle);
      }
      if (preferences.costume) {
        currentSelectedCostume = preferences.costume;
        updateCostumeCardUI(currentSelectedCostume);
      }
      if (preferences.geminiApiKey && inputGeminiKey) {
        inputGeminiKey.value = preferences.geminiApiKey;
      }
      if (preferences.idleDanceSeconds && selectDanceTimeout) {
        selectDanceTimeout.value = preferences.idleDanceSeconds.toString();
      }
      if (preferences.eyeRestInterval && selectEyeRest) {
        selectEyeRest.value = preferences.eyeRestInterval.toString();
      }
    }

    // ============= Long-Term Memory =============
    const inputUserName = document.getElementById("input-user-name");
    const memoryFactsList = document.getElementById("memory-facts-list");

    if (memory) {
      if (inputUserName && memory.userName) {
        inputUserName.value = memory.userName;
      }
      if (memoryFactsList && memory.facts && memory.facts.length > 0) {
        memoryFactsList.innerHTML = memory.facts
          .map(
            (f) => `
          <li style="font-size: 12.5px; color: #334155; background: #F8FAFC; padding: 8px 12px; border-radius: 8px; border: 1px solid #E2E8F0; display: flex; align-items: center; gap: 8px;">
            <span>\ud83d\udca1</span> <span>${f}</span>
          </li>`
          )
          .join("");
      } else if (memoryFactsList) {
        memoryFactsList.innerHTML = `
          <li style="font-size: 12.5px; color: #64748B; background: #F8FAFC; padding: 8px 12px; border-radius: 8px; border: 1px solid #E2E8F0;">
            \u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e04\u0e27\u0e32\u0e21\u0e17\u0e23\u0e07\u0e08\u0e33\u0e17\u0e35\u0e48\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e44\u0e27\u0e49 \u0e25\u0e2d\u0e07\u0e04\u0e38\u0e22\u0e2b\u0e23\u0e37\u0e2d\u0e1a\u0e2d\u0e01\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e01\u0e31\u0e1a\u0e19\u0e49\u0e2d\u0e07\u0e41\u0e17\u0e19\u0e43\u0e08\u0e44\u0e14\u0e49\u0e40\u0e25\u0e22\u0e04\u0e48\u0e30 \u2728
          </li>`;
      }
    }

    // ============= ตรวจสอบสิทธิ์ไมโครโฟน + Unlocked States =============
    chrome.storage.local.get(["mic_permission_granted"], (storageRes) => {
      // Mic Permission Badge
      const badge = document.getElementById("mic-status-badge");
      if (badge) {
        if (storageRes && storageRes.mic_permission_granted) {
          badge.textContent = "\u0e2d\u0e19\u0e38\u0e0d\u0e32\u0e15\u0e41\u0e25\u0e49\u0e27 \u2713";
          badge.style.background = "#ECFDF5";
          badge.style.color = "#059669";
          badge.style.borderColor = "#A7F3D0";
        } else {
          badge.textContent = "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c \u2715";
          badge.style.background = "#FEF2F2";
          badge.style.color = "#DC2626";
          badge.style.borderColor = "#FECACA";
        }
      }

      // ============= Costume Unlock States =============
      const unlocked = unlockedCostumes || ["default"];

      const applyUnlock = (tagId, unlockText) => {
        const tag = document.getElementById(tagId);
        if (tag) {
          tag.textContent = unlockText;
          tag.style.color = "#059669";
          tag.style.background = "#ECFDF5";
        }
      };

      if (lvl >= 2 || unlocked.includes("cyber_neon")) {
        applyUnlock("tag-costume-cyber_neon", "\u0e1b\u0e25\u0e14\u0e25\u0e47\u0e2d\u0e01\u0e41\u0e25\u0e49\u0e27 (Lv.2)");
      }
      if (lvl >= 3 || unlocked.includes("idol_dress")) {
        applyUnlock("tag-costume-idol_dress", "\u0e1b\u0e25\u0e14\u0e25\u0e47\u0e2d\u0e01\u0e41\u0e25\u0e49\u0e27 (Lv.3)");
      }
      if (lvl >= 5 || unlocked.includes("angel_wings")) {
        applyUnlock("tag-costume-angel_wings", "\u0e1b\u0e25\u0e14\u0e25\u0e47\u0e2d\u0e01\u0e41\u0e25\u0e49\u0e27 (Lv.5)");
      }

      // ============= Dance Style Unlock States =============
      const unlockedD = unlockedDances || ["kpop_idol"];

      const applyDanceUnlock = (id, tagId, label) => {
        const chip = document.getElementById(id);
        const tag = document.getElementById(tagId);
        if (chip) chip.classList.remove("locked");
        if (tag) {
          tag.textContent = label;
          tag.style.color = "#059669";
        }
      };

      if (lvl >= 2 || unlockedD.includes("chinese_club")) {
        applyDanceUnlock("dance-chinese_club", "tag-dance-chinese_club", "\u2713 \u0e1b\u0e25\u0e14\u0e25\u0e47\u0e2d\u0e01\u0e41\u0e25\u0e49\u0e27 (Lv.2)");
      }
      if (lvl >= 3 || unlockedD.includes("thai_coyote")) {
        applyDanceUnlock("dance-thai_coyote", "tag-dance-thai_coyote", "\u2713 \u0e1b\u0e25\u0e14\u0e25\u0e47\u0e2d\u0e01\u0e41\u0e25\u0e49\u0e27 (Lv.3)");
      }
      if (lvl >= 4 || unlockedD.includes("viral_tiktok")) {
        applyDanceUnlock("dance-viral_tiktok", "tag-dance-viral_tiktok", "\u2713 \u0e1b\u0e25\u0e14\u0e25\u0e47\u0e2d\u0e01\u0e41\u0e25\u0e49\u0e27 (Lv.4)");
      }
    });

    // Re-open Welcome Page
    const btnReopen = document.getElementById("btn-reopen-welcome");
    if (btnReopen) {
      btnReopen.addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
      });
    }
  });

  // ============================================================================
  // 2. Avatar Card Click Selection
  // ============================================================================
  avatarCards.forEach((card) => {
    card.addEventListener("click", () => {
      const style = card.getAttribute("data-style");
      if (style) {
        currentSelectedStyle = style;
        updateAvatarCardUI(currentSelectedStyle);
      }
    });
  });

  function updateAvatarCardUI(style) {
    avatarCards.forEach((c) => {
      if (c.getAttribute("data-style") === style) {
        c.classList.add("active");
      } else {
        c.classList.remove("active");
      }
    });
  }

  // ============================================================================
  // 3. Costume Card Click Selection
  // ============================================================================
  const costumeCards = document.querySelectorAll("#costume-grid .avatar-card");

  costumeCards.forEach((card) => {
    card.addEventListener("click", () => {
      const costumeName = card.getAttribute("data-costume");
      if (costumeName) {
        currentSelectedCostume = costumeName;
        updateCostumeCardUI(currentSelectedCostume);
      }
    });
  });

  function updateCostumeCardUI(costume) {
    costumeCards.forEach((c) => {
      if (c.getAttribute("data-costume") === costume) {
        c.classList.add("active");
      } else {
        c.classList.remove("active");
      }
    });
  }

  // ============================================================================
  // 4. Save Settings Button
  // ============================================================================
  btnSave.addEventListener("click", () => {
    const updatedPreferences = {
      avatarStyle: currentSelectedStyle,
      costume: currentSelectedCostume,
      geminiApiKey: (inputGeminiKey ? inputGeminiKey.value : "").trim(),
      idleDanceSeconds: parseInt(selectDanceTimeout.value, 10) || 3,
      eyeRestInterval: parseInt(selectEyeRest.value, 10) || 60,
      voiceFeedback: true
    };

    chrome.runtime.sendMessage(
      { action: "SAVE_SETTINGS", preferences: updatedPreferences },
      (res) => {
        if (res && res.success) {
          // บันทึกชื่อผู้ใช้ลงใน user_memory
          const inputUserName = document.getElementById("input-user-name");
          if (inputUserName) {
            chrome.storage.local.get(["user_memory"], (memRes) => {
              const memory = memRes.user_memory || {};
              memory.userName = inputUserName.value.trim() || "\u0e1e\u0e35\u0e48\u0e04\u0e19\u0e40\u0e01\u0e48\u0e07";
              chrome.storage.local.set({ user_memory: memory });
            });
          }
          showSaveToast();
        }
      }
    );
  });

  // ============================================================================
  // 5. Toast Notification
  // ============================================================================
  function showSaveToast() {
    saveToast.style.display = "flex";
    setTimeout(() => {
      saveToast.style.display = "none";
    }, 2800);
  }
});


