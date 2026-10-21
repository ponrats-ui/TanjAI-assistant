
/**
 * ============================================================================
 * TanjAI (น้องแทนใจ) - Content Script v1.1 (Optimized for UAT)
 * Features:
 *  1. Three.js 3D Canvas with PBR Skin (MeshPhysicalMaterial) + Studio Soft Lighting
 *     & Soft Shadows (PCFSoft) + ACES Filmic Tone Mapping + Anime Eyes (Iris Texture/Eyelashes)
 *  2. 3-Avatar Styles (orange_mascot, anime_girl, cyber_redhair)
 *  3. Unlockable Costumes (default, cyber_neon, idol_dress, angel_wings)
 *  4. YouTube Audio & Beat-Sync Dance Engine (K-Pop, Club DJ, Coyote, TikTok)
 *  5. Web Speech API (STT th-TH) & window.speechSynthesis (TTS th-TH)
 *  6. Real-time Lip-Sync Engine & Natural Mouse Head-Tracking
 *  7. Gamification Level Up Celebrations & Health Rest Alerts
 *  8. [OPT] Tab Visibility API - RAF paused when tab is unfocused
 *  9. [OPT] Three.js Geometry/Material/Texture Dispose on Avatar Switch
 * 10. [SEC] No eval(), no inline scripts - CSP compliant
 * ============================================================================
 */

(function initTanjAIAssistant() {
  if (window.__tanjai_initialized) return;
  window.__tanjai_initialized = true;

  const T_TAG = "[TanjAI]"; // Debug prefix
  console.log(
    "%c☘️ TanjAI nāōng Thaēnjai%c v1.1 — 3D Companion + Beat-Sync + Gamification Online!",
    "background:#FF7A1A;color:#fff;padding:3px 10px;border-radius:6px;font-weight:bold;",
    "color:#FF7A1A;font-weight:bold;"
  );
  console.log(`${T_TAG} [System] Content script initialized on: ${location.hostname || "(local)"}`);

  // ==========================================
  // [1] State Machine & Variables
  // ==========================================
  const ANIM_STATES = {
    IDLE_DANCE: "dance",
    LISTENING: "listening",
    TALKING: "talking",
    HAPPY: "happy",
    THINKING: "thinking",
    BLUSHING: "blushing"
  };

  const DANCE_STYLES = {
    KPOP_IDOL: "kpop_idol",
    CHINESE_CLUB: "chinese_club",
    THAI_COYOTE: "thai_coyote",
    VIRAL_TIKTOK: "viral_tiktok"
  };

  // ==========================================================================
  // [1.1] Style Color Presets — โทนแสงและ Glow ฐานแยกตามสไตล์ตัวละคร
  //       (โทนหลัก: ส้ม-ชมพู-นีออน ตามแบรนด์ TanjAI)
  // ==========================================================================
  const LIGHT_PRESETS = {
    // น้องแทนใจสายส้มอบอุ่น — Golden Sunset
    orange_mascot: {
      cssClass: "tanjai-glow-sunset",
      rimA: { color: 0xff7a00, intensity: 1.8 },  // ส้มไซเบอร์
      rimB: { color: 0x00e5ff, intensity: 1.2 },  // ฟ้าสว่าง
      cuteFill: { color: 0xffd9e8, intensity: 0.6 },
      baseGlow: 0xff7a1a // [Aura] สีไฟใต้ฐาน idle — Tangerine
    },
    // น้องทวินเทลสายคาวาอี้ — Sakura Neon
    anime_girl: {
      cssClass: "tanjai-glow-sakura",
      rimA: { color: 0xff7a00, intensity: 1.6 },
      rimB: { color: 0xff4fa3, intensity: 1.5 },  // ชมพูนีออน
      cuteFill: { color: 0xffe3f0, intensity: 0.75 },
      baseGlow: 0xff6aa8 // [Aura] สีไฟใต้ฐาน idle — Sakura Pink
    },
    // น้องไซเบอร์สายเกมเมอร์ — Neon Arcade
    cyber_redhair: {
      cssClass: "tanjai-glow-neon",
      rimA: { color: 0xff7a00, intensity: 2.1 },
      rimB: { color: 0x00e5ff, intensity: 1.7 },
      cuteFill: { color: 0xd9f6ff, intensity: 0.7 },
      baseGlow: 0x00e5ff // [Aura] สีไฟใต้ฐาน idle — Cyber Cyan
    },
    // น้องคนเสมือนจริง — Cinematic Portrait (แสงนุ่มสมจริง น้อยลง เน้นมิติบนใบหน้า)
    realistic: {
      cssClass: "tanjai-glow-cinematic",
      rimA: { color: 0xffb27a, intensity: 1.1 },  // ส้มอุ่นแบบแสงสตูดิโอ
      rimB: { color: 0xbfd9ff, intensity: 0.9 },   // ฟ้านวลแบบแสงเงาลิปส์
      cuteFill: { color: 0xffe8e0, intensity: 0.5 },
      baseGlow: 0xffb27a // [Aura] สีไฟใต้ฐาน idle — Warm Studio
    }
  };
  // โทน Glow ฐานของทุกสไตล์ (CSS) — ส้ม-ชมพู-นีออน
  const DEFAULT_PRESET_KEY = "anime_girl";
  // สไตล์โมเดลคนเสมือนจริง (Photorealistic) — ใช้ชุดไฟ Cinematic + ผิวหนัง SSS-approx
  const REALISTIC_STYLE_KEY = "realistic";
  const REALISTIC_SKIN_PARAMS = {
    roughness: 0.4,
    metalness: 0.0,
    transmission: 0.1,   // จำลองแสงสะท้อนใต้ผิวหนัง (SSS approximation) — three.js r128+ รองรับ
    thickness: 0.5,      // ความหนาผิว (ทำงานบน three.js r132+; r128 ข้ามค่านี้อย่างปลอดภัย)
    clearcoat: 0.1       // ผิวชุ่มชื้นเป็นธรรมชาติ
  };
  // ตรวจครั้งเดียวว่า three.js รุ่นนี้มี property "thickness" ไหม (r128 ไม่มี — ใส่แล้ว console warning)
  const SUPPORTS_THICKNESS = (() => {
    try { const m = new THREE.MeshPhysicalMaterial(); const has = "thickness" in m; m.dispose(); return has; }
    catch (e) { return false; }
  })();

  // โทนแสงตามอารมณ์ (Mood Rim) — ความเข้ม/สีเปลี่ยนตาม Animation State
  const MOOD_RIMS = {
    dance:    { rimA: 1.0, rimB: 1.0, fill: 1.0, pulse: 0.9,  cssClass: null },                 // เต้น: นีออนเต็มสูบ + พัลส์ตามบีท
    listening:{ rimA: 0.55, rimB: 1.35, fill: 0.7, pulse: 0, cssClass: "tanjai-mood-listen" }, // ฟัง: ฟ้าเย็นประหยัด นิ่งๆ
    talking:  { rimA: 0.9, rimB: 0.75, fill: 1.15, pulse: 0, cssClass: null },                 // พูด: อบอุ่นสดใส
    happy:    { rimA: 1.3, rimB: 1.15, fill: 1.35, pulse: 0.6, cssClass: "tanjai-mood-happy" },// ดีใจ: ส้มลุกๆ
    thinking: { rimA: 0.45, rimB: 0.6, fill: 0.55, pulse: 0, cssClass: "tanjai-mood-think" },  // คิด: หรี่ลงเบาๆ
    blushing: { rimA: 0.7, rimB: 1.6, fill: 1.6, pulse: 0.35, cssClass: "tanjai-mood-blush" }  // เขิน: ชมพูนีออนล้น
  };

  // [STATE AURA] สีแสง Base Glow (PointLight ใต้ฐานโมเดล) ตามสถานะการทำงาน — เปลี่ยนผ่าน updateTanjAIState()
  // idle = null → คืนสีเดิมตามสไตล์ตัวละคร (ฟิลด์ baseGlow ใน LIGHT_PRESETS)
  const STATE_AURA_COLORS = {
    listening: 0x00e5ff, // ฟ้า — กำลังฟังคำสั่ง
    thinking:  0xffaa00, // ส้ม — ประมวลผลคำสั่ง
    speaking:  0xff7ab8, // ชมพูสว่าง — กำลังพูดตอบ
    browsing:  0x00ff88, // เขียว — กำลังควบคุมเบราว์เซอร์/ค้นเว็บ
    idle:      null
  };
  const AURA_STATE_KEYS = Object.keys(STATE_AURA_COLORS);
  let currentAuraState = "idle";

  const state = {
    avatarStyle: "anime_girl", // [DEFAULT] Anime Twin-Tails เป็นตัวหลัก ('orange_mascot' | 'anime_girl' | 'cyber_redhair')
    costume: "default",          // 'default' | 'cyber_neon' | 'idol_dress' | 'angel_wings'
    danceStyle: DANCE_STYLES.KPOP_IDOL,
    userLevel: 1,
    currentAnimState: ANIM_STATES.IDLE_DANCE,
    idleDanceSeconds: 3,
    lastInteractionTime: Date.now(),
    isDancing: false,
    isListening: false,
    isSpeaking: false,
    isBeatSyncing: false,
    micPermissionGranted: false,
    beatEnergy: 0,
    estimatedBPM: 128,
    affectionLevel: 1,
    affectionExp: 0,
    mousePos: { x: 0, y: 0 },
    targetHeadRot: { x: 0, y: 0, z: 0 },
    currentHeadRot: { x: 0, y: 0, z: 0 },
    userPreferences: {}
  };

  // Blinking State (กะพริบตาทุก 3-5 วินาที)
  let lastBlinkTime = Date.now();
  let nextBlinkInterval = 3200;
  let isBlinking = false;
  let blinkStartTime = 0;
  const BLINK_DURATION = 140;

  // Audio SFX Throttle
  let lastHoverSFXTime = 0;

  // [LIGHT PRESETS] สถานะแสงปัจจุบัน + เป้าหมาย (สำหรับ Lerp นุ่มๆ)
  const moodLight = {
    activePreset: DEFAULT_PRESET_KEY,
    currentMood: "dance",
    target: { rimA: 1.0, rimB: 1.0, fill: 1.0 },
    current: { rimA: 1.0, rimB: 1.0, fill: 1.0 },
    pulsePhase: 0,
    targetExposure: null // [CINEMATIC] exposure เป้าหมายต่อสไตล์ (null = ไม่ต้อง lerp)
  };
  let rimLightA = null, rimLightB = null, cuteFillLightRef = null;
  let hemiLightRef = null, keyLightRef = null, baseGlowLight = null;
  // [RACE FIX] เก็บสไตล์/ชุดที่โหลดจริงล่าสุด เทียบกับ storage callback ที่มาช้า
  let loadedAvatarStyle = null, loadedCostume = null;
  let moodBaseA = 1.8, moodBaseB = 1.2, moodBaseFill = 0.6;

  // ==========================================================================
  // [PERF] Tab Visibility API — หยุด Render Loop อัตโนมัติเมื่อ Tab ไม่ได้สนใจ
  // ==========================================================================
  let isPageVisible = !document.hidden;
  let rafId = null; // เก็บไว้เพื่อสามารถ Cancel ได้

  document.addEventListener("visibilitychange", () => {
    isPageVisible = !document.hidden;
    if (isPageVisible) {
      // [SAFETY] กัน Race: visibilitychange อาจยิงก่อน initThreeScene สร้าง scene/clock เสร็จ
      if (!scene || !renderer || !clock) return;
      console.log(`${T_TAG} [Render] Tab กลับมา Active — เริ่ม Render Loop ใหม่`);
      clock.getDelta(); // flush stuck delta
      if (!rafId) renderLoop();
    } else {
      console.log(`${T_TAG} [Render] Tab เป็น Inactive — หยุด Render Loop เพื่อประหยัด CPU/GPU`);
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }
  }, { passive: true });


  // โหลดค่าการตั้งค่าจาก storage
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(
      ["user_preferences", "affection_level", "affection_exp", "mic_permission_granted", "userLevel", "totalUsageMinutes"],
      (res) => {
        if (chrome.runtime.lastError) {
          console.warn(`${T_TAG} [Storage] ไม่สามารถโหลด Preferences:`, chrome.runtime.lastError);
          return;
        }
        if (res && res.user_preferences) {
          state.userPreferences = res.user_preferences;
          if (res.user_preferences.avatarStyle) {
            const prevStyle = state.avatarStyle;
            state.avatarStyle = res.user_preferences.avatarStyle;
            // [RACE FIX] storage callback อาจมาช้ากว่า initThreeScene (async) —
            // ถ้า scene เริ่มทำงานไปแล้วและสไตล์เปลี่ยน ต้อง reload โมเดลทันที
            if (scene && renderer && state.avatarStyle !== loadedAvatarStyle) {
              console.log(`${T_TAG} [Storage] สไตล์เปลี่ยน ${prevStyle} -> ${state.avatarStyle} (late callback) — reload model`);
              loadAvatarModel(state.avatarStyle, state.costume);
            }
          }
          if (res.user_preferences.costume) {
            const prevCostume = state.costume;
            state.costume = res.user_preferences.costume;
            if (scene && renderer && state.costume !== loadedCostume) {
              loadAvatarModel(state.avatarStyle, state.costume);
            }
          }
          if (res.user_preferences.idleDanceSeconds) state.idleDanceSeconds = res.user_preferences.idleDanceSeconds;
          console.log(`${T_TAG} [Storage] Loaded preferences: avatar=${state.avatarStyle}, costume=${state.costume}, idleDelay=${state.idleDanceSeconds}s`);
        }
        if (res && res.affection_level) state.affectionLevel = res.affection_level;
        if (res && res.affection_exp) state.affectionExp = res.affection_exp;
        if (res && res.userLevel) state.userLevel = res.userLevel;
        if (res && res.mic_permission_granted) {
          state.micPermissionGranted = true;
          console.log(`${T_TAG} [Mic] สิทธิ์ไมโครโฟน: อนุญาตแล้ว`);
          // [WAKE-WORD] เคยอนุญาตไมค์แล้ว → เปิดโหมดฟังตลอดเวลาอัตโนมัติ (พูด "แทนใจ" เรียกได้เลย)
          if (recognition && SpeechRecognition) {
            wakeWordEnabled = true;
            setTimeout(() => startWakeListening(), 1500); // รอ UI/scene พร้อมก่อน
          }
        } else {
          console.log(`${T_TAG} [Mic] สิทธิ์ไมโครโฟน: ยังไม่ได้รับ`);
        }
        updateAffectionUI();
      }
    );

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local") {
        if (changes.mic_permission_granted) {
          state.micPermissionGranted = !!changes.mic_permission_granted.newValue;
          console.log(`${T_TAG} [Mic] สิทธิ์ไมโครโฟนเปลี่ยน: ${state.micPermissionGranted}`);
        }
        if (changes.userLevel) {
          state.userLevel = changes.userLevel.newValue || 1;
          console.log(`${T_TAG} [Level] User Level เปลี่ยนเป็น: Lv.${state.userLevel}`);
          updateAffectionUI();
        }
      }
    });
  }

  // ==========================================
  // [2] DOM Construction (สร้าง UI Overlay)
  // ==========================================
  const root = document.createElement("div");
  root.id = "tanjai-root";

  root.innerHTML = `
    <!-- Speech Bubble (บอลลูนคำพูด) -->
    <div id="tanjai-speech-bubble">
      <div class="tanjai-bubble-header">
        <div class="tanjai-name-tag">
          <span class="tanjai-status-dot" id="tanjai-status-dot"></span>
          <span>น้องแทนใจ</span>
          <span class="tanjai-affection-badge" id="tanjai-affection-badge">❤️ Lv.1</span>
        </div>
        <button class="tanjai-close-btn" id="tanjai-toggle-bubble-btn" title="ซ่อน/แสดงข้อความ">✕</button>
      </div>

      <!-- Work-Life Balance Health Alert Banner -->
      <div class="tanjai-health-banner" id="tanjai-health-banner">
        <span>💧👀 ทำงานต่อเนื่องครบ 1 ชม. แล้วน้า พักสายตาและจิบน้ำนะคะ!</span>
      </div>

      <!-- Beat-Sync Banner -->
      <div class="tanjai-beat-sync-bar" id="tanjai-beat-sync-bar">
        <span>🎵 Beat-Sync: <span id="tanjai-bpm-label">128 BPM</span></span>
        <div class="tanjai-bpm-meter">
          <div class="tanjai-bpm-bar" id="bpm-bar-1"></div>
          <div class="tanjai-bpm-bar" id="bpm-bar-2"></div>
          <div class="tanjai-bpm-bar" id="bpm-bar-3"></div>
        </div>
      </div>

      <!-- YouTube URL Input Box & Dance Styles Selector -->
      <div class="tanjai-yt-box" id="tanjai-yt-box">
        <div class="tanjai-yt-input-row">
          <input type="text" id="tanjai-yt-url-input" class="tanjai-yt-input" placeholder="วางลิงก์ YouTube (เช่น https://youtu.be/...)">
          <button type="button" id="tanjai-yt-play-btn" class="tanjai-yt-btn">▶ ซิงก์เพลง</button>
        </div>
        <div class="tanjai-dance-style-row" id="tanjai-dance-style-row">
          <span class="tanjai-dance-chip active" data-style="kpop_idol">💃 K-Pop Idol</span>
          <span class="tanjai-dance-chip" data-style="chinese_club">🎧 Club DJ</span>
          <span class="tanjai-dance-chip" data-style="thai_coyote">💃 Coyote</span>
          <span class="tanjai-dance-chip" data-style="viral_tiktok">📱 TikTok</span>
        </div>
      </div>

      <div id="tanjai-speech-text">สวัสดีค่ะพี่! มีอะไรให้น้องแทนใจช่วยไหมคะ? ✨</div>

      <!-- Quick Action Chips -->
      <div class="tanjai-quick-actions">
        <span class="tanjai-chip" data-cmd="เปิด youtube">🎬 YouTube</span>
        <span class="tanjai-chip" data-cmd="เปิด facebook">💙 Facebook</span>
        <span class="tanjai-chip" data-cmd="ช่วยสรุปหน้าเว็บนี้ให้หน่อย">📑 สรุปหน้านี้</span>
        <span class="tanjai-chip sync-chip" id="tanjai-btn-beatsync" title="ใส่ลิงก์ YouTube หรือดึงเสียงเพื่อเต้นตามจังหวะเพลง">🎵 Beat-Sync</span>
        <span class="tanjai-chip" data-cmd="เลื่อนลง">📜 เลื่อนลง</span>
        <span class="tanjai-chip" data-cmd="เต้นหน่อย">💃 เต้น</span>
        <span class="tanjai-chip" data-cmd="พักสายตา">🌿 พักสายตา</span>
      </div>

      <!-- Voice Recognition Bar -->
      <div class="tanjai-voice-bar">
        <span class="tanjai-voice-status" id="tanjai-voice-status">คลิกปุ่มไมค์หรือคลิกที่ตัวน้องเพื่อพูด</span>
        <div class="tanjai-wave-container" id="tanjai-wave-box">
          <div class="tanjai-wave-bar"></div>
          <div class="tanjai-wave-bar"></div>
          <div class="tanjai-wave-bar"></div>
          <div class="tanjai-wave-bar"></div>
        </div>
        <button id="tanjai-mic-btn" title="กดเพื่อสั่งการด้วยเสียงภาษาไทย">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
            <line x1="8" y1="22" x2="16" y2="22"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- 3D Character Canvas Area -->
    <div id="tanjai-canvas-wrapper" title="คลิกเพื่อสั่งการด้วยเสียง หรือลูบหัวน้องเล่นได้นะ!">
      <div class="tanjai-musical-notes" id="tanjai-dance-notes">♪ ♫ ♬</div>
      <canvas id="tanjai-three-canvas"></canvas>
    </div>

    <!-- Live Subtitle Box (สถานะ + ข้อความสั้น ใต้ฐานตัวละคร) -->
    <div class="tanjai-subtitle" id="tanjai-subtitle" aria-live="polite"></div>

    <!-- Direct Text Command (Chatbox) — พิมพ์สั่งได้เลยโดยไม่ต้องใช้เสียง -->
    <input type="text" id="tanjai-chat-input" class="tanjai-chat-input" placeholder="พิมพ์สั่งแทนใจตรงนี้..." autocomplete="off">
  `;

  document.body.appendChild(root);

  // References
  const speechBubble = document.getElementById("tanjai-speech-bubble");
  const speechText = document.getElementById("tanjai-speech-text");
  const voiceStatus = document.getElementById("tanjai-voice-status");
  const statusDot = document.getElementById("tanjai-status-dot");
  const waveBox = document.getElementById("tanjai-wave-box");
  const micBtn = document.getElementById("tanjai-mic-btn");
  const danceNotes = document.getElementById("tanjai-dance-notes");
  const canvasWrapper = document.getElementById("tanjai-canvas-wrapper");
  const subtitleBox = document.getElementById("tanjai-subtitle");
  const chatInput = document.getElementById("tanjai-chat-input");
  const toggleBubbleBtn = document.getElementById("tanjai-toggle-bubble-btn");
  const affectionBadge = document.getElementById("tanjai-affection-badge");
  const beatSyncBar = document.getElementById("tanjai-beat-sync-bar");
  const bpmLabel = document.getElementById("tanjai-bpm-label");
  const btnBeatSync = document.getElementById("tanjai-btn-beatsync");
  const ytBox = document.getElementById("tanjai-yt-box");
  const ytUrlInput = document.getElementById("tanjai-yt-url-input");
  const ytPlayBtn = document.getElementById("tanjai-yt-play-btn");
  const healthBanner = document.getElementById("tanjai-health-banner");
  const bpmBars = [
    document.getElementById("bpm-bar-1"),
    document.getElementById("bpm-bar-2"),
    document.getElementById("bpm-bar-3")
  ];

  function updateAffectionUI() {
    if (affectionBadge) {
      affectionBadge.textContent = `⭐ Lv.${state.userLevel} (❤️ ${state.affectionLevel})`;
    }
  }

  function showFloatingCelebration(text = "LEVEL UP! 🎉") {
    const floatEl = document.createElement("div");
    floatEl.className = "tanjai-floating-exp";
    floatEl.style.fontSize = "14px";
    floatEl.style.color = "#FFD700";
    floatEl.textContent = text;
    canvasWrapper.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1600);
  }

  // ==========================================
  // [3] Three.js 3D Scene & Lighting Setup
  // ==========================================
  let scene, camera, renderer, clock;
  let characterRoot = null;
  let headBone = null;
  let loadedMixer = null;
  let animationsMap = {};
  let currentAction = null;
  let isProceduralModel = true;

  // Procedural Meshes & Accessories
  let procEyes = [];
  let procMouth = null;
  let blushMaterial = null;
  let procBody = null;
  let procArmL = null;
  let procArmR = null;
  let procFloatingHeart = null;
  let procWings = [];
  let glbMorphMeshes = [];

  // Procedural Poses
  const currentPose = {
    armLZ: 0.1, armLX: 0,
    armRZ: -0.1, armRX: 0,
    headTiltZ: 0, headTiltX: 0,
    blushOpacity: 0.65,
    bounceAmp: 0.12
  };

  const targetPose = {
    armLZ: 0.1, armLX: 0,
    armRZ: -0.1, armRX: 0,
    headTiltZ: 0, headTiltX: 0,
    blushOpacity: 0.65,
    bounceAmp: 0.12
  };

  function initThreeScene() {
    const canvas = document.getElementById("tanjai-three-canvas");
    const width = canvasWrapper.clientWidth || 260;
    const height = canvasWrapper.clientHeight || 300;

    scene = new THREE.Scene();

    // [Camera] Tall-Body Framing — จับสัดส่วนตัวละครทรงสูงแบบน่ารัก พอดีกรอบ ไม่โดนตัดขอบ
    camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
    camera.position.set(0, 1.1, 2.3);
    camera.lookAt(0, 0.9, 0);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    // [CINEMATIC] ACES Filmic — โทนสมจริง ไฮไลต์ไม่เผือก เงามีรายละเอียด
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 0.6 = จุดที่สีสันอิ่มตัวสวย (ผิวครีมไม่ดำ / ผมส้มไม่ซีดเป็นเหลือง) กับชุดไฟ Studio นี้
    // (สไตล์ realistic จะจูน exposure ของตัวเองที่ applyLightingPreset)
    renderer.toneMappingExposure = 0.6;
    renderer.outputEncoding = THREE.sRGBEncoding;
    // [Studio] Soft Shadows (PCFSoft) — เงาขอบนุ่มใต้ชายผม / ใต้คาง
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ==========================================================
    // [3.1] Studio Soft Lighting (แสงนุ่มแบบสตูดิโอถ่ายตัวละคร)
    // ==========================================================
    // 1) Ambient โทนอุ่นสดใส — ผิวไม่ดำตาย ไม่แข็งเป็นก้อน
    const ambientLight = new THREE.AmbientLight(0xfff3e6, 1.3);
    scene.add(ambientLight);

    // 2) Key Light ส่องเข้าหน้าตัวละคร — เน้นรายละเอียดใบหน้า/ดวงตาชัดเจน + Soft Shadows
    //    [CINEMATIC] สไตล์ realistic จะสลับเป็น Key Light มุมเฉียง 45° (Cinematic Portrait) ผ่าน preset
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(0.9, 2.7, 3.6);
    keyLight.target.position.set(0, 1.0, 0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 12;
    keyLight.shadow.camera.left = -2.2;
    keyLight.shadow.camera.right = 2.2;
    keyLight.shadow.camera.top = 2.8;
    keyLight.shadow.camera.bottom = -1.2;
    keyLight.shadow.bias = -0.0006;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.radius = 4; // ขอบเงานุ่ม (PCFSoft)
    scene.add(keyLight);
    scene.add(keyLight.target);

    // 3) Cyber Rim Light สองจุดด้านหลัง — ไฮไลต์เส้นผมสไตล์ Cyber-Idol
    //    (สี/ความเข้มถูกขับด้วย Style Color Presets + Mood ตามอารมณ์)
    const cyberRimLight = new THREE.PointLight(0xff7a00, 1.8, 9); // ส้มไซเบอร์
    cyberRimLight.position.set(-1.7, 2.1, -1.9);
    scene.add(cyberRimLight);

    const cyberRimLight2 = new THREE.PointLight(0x00e5ff, 1.2, 9); // ฟ้าสว่าง
    cyberRimLight2.position.set(1.8, 1.4, -1.6);
    scene.add(cyberRimLight2);

    // 4) ชมพูอ่อนด้านหน้า — Bounce Light เสริมความคาวาอี้
    const cuteFillLight = new THREE.PointLight(0xffd9e8, 0.6, 8);
    cuteFillLight.position.set(0, 1.5, 2.4);
    scene.add(cuteFillLight);

    // 5) Base Glow Aura — PointLight ใต้ฐานโมเดล (เปลี่ยนสีตามสถานะ: ฟ้า/ส้ม/ชมพู/เขียว ผ่าน updateTanjAIState)
    //    ตำแหน่งต่ำเหนือพื้นเล็กน้อย + เยื้องหน้า ให้แสงลามขึ้นชายเสื้อเหมือนแท่นเรืองแสง
    const baseGlowAuraLight = new THREE.PointLight(0xff6aa8, 0.9, 4.5);
    baseGlowAuraLight.position.set(0, 0.12, 0.7);
    scene.add(baseGlowAuraLight);
    baseGlowLight = baseGlowAuraLight;

    // [CINEMATIC] Hemisphere Sky/Ground — ลดความกระด้างของเงา ให้เปลี่ยนสีอย่างนุ่มนวล
    // (สไตล์ realistic จะถูก preset จูน intensity เป็น 0.75 / สไตล์อนิเมะใช้ 0.25)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.25);
    hemiLight.position.set(0, 4, 0);
    scene.add(hemiLight);

    // [PRESET] ผูก refs + ปรับโทนตามสไตล์ตัวละครที่ใช้อยู่
    rimLightA = cyberRimLight;
    rimLightB = cyberRimLight2;
    cuteFillLightRef = cuteFillLight;
    hemiLightRef = hemiLight;
    keyLightRef = keyLight;
    applyLightingPreset(state.avatarStyle, true);

    clock = new THREE.Clock();
    console.log(`${T_TAG} [Three.js] Scene initialized. Renderer: ${renderer.getContext().getParameter(renderer.getContext().RENDERER) || "WebGL"}`);

    loadAvatarModel(state.avatarStyle, state.costume);
    renderLoop();
  }

  // ==========================================================================
  // [3.2] Style Color Presets Engine — โทนแสง + Glow ตามสไตล์ และ Mood ตามอารมณ์
  // ==========================================================================

  /**
   * ปรับโทนแสง Rim/Fill และ CSS Glow ฐานตามสไตล์ตัวละคร
   * (ส้ม-ชมพู-นีออน: sunset / sakura / neon + สมจริง: cinematic)
   */
  function applyLightingPreset(styleName, immediate = false) {
    const preset = LIGHT_PRESETS[styleName] || LIGHT_PRESETS[DEFAULT_PRESET_KEY];
    moodLight.activePreset = LIGHT_PRESETS[styleName] ? styleName : DEFAULT_PRESET_KEY;

    moodBaseA = preset.rimA.intensity;
    moodBaseB = preset.rimB.intensity;
    moodBaseFill = preset.cuteFill.intensity;

    if (rimLightA) {
      rimLightA.color.setHex(preset.rimA.color);
      if (immediate) rimLightA.intensity = preset.rimA.intensity;
    }
    if (rimLightB) {
      rimLightB.color.setHex(preset.rimB.color);
      if (immediate) rimLightB.intensity = preset.rimB.intensity;
    }
    if (cuteFillLightRef) {
      cuteFillLightRef.color.setHex(preset.cuteFill.color);
      if (immediate) cuteFillLightRef.intensity = preset.cuteFill.intensity;
    }

    // [STATE AURA] โหมด idle ให้ไฟใต้ฐานเปลี่ยนตามสี preset ของสไตล์ใหม่
    // (สถานะอื่นเช่น listening/thinking ให้ updateTanjAIState เป็นผู้จัดการเอง)
    if (baseGlowLight && currentAuraState === "idle") {
      baseGlowLight.color.setHex(preset.baseGlow || 0xff7a1a);
    }

    // [CINEMATIC] สไตล์ realistic: Key Light มุมเฉียง 45° + Hemisphere ลดความกระด้างของเงา
    // สไตล์อนิเมะ: คืนค่า Studio Soft Lighting เดิม
    const isRealistic = moodLight.activePreset === REALISTIC_STYLE_KEY;
    if (keyLightRef) {
      if (isRealistic) {
        // Key Light เฉียง 45° ทั้งแนวข้างและแนวสูง — สร้างมิติเงาบนใบหน้าแบบ Cinematic Portrait
        keyLightRef.position.set(2.55, 2.55, 2.55); // azimuth 45° / elevation 45°
        keyLightRef.intensity = 1.35;               // ลดลงเล็กน้อย เพราะมี Hemisphere เสริม
      } else {
        keyLightRef.position.set(0.9, 2.7, 3.6);
        keyLightRef.intensity = 1.5;
      }
      keyLightRef.target.position.set(0, 1.0, 0);
      if (keyLightRef.target.updateMatrixWorld) keyLightRef.target.updateMatrixWorld();
    }
    if (hemiLightRef) hemiLightRef.intensity = isRealistic ? 0.75 : 0.25;

    // [TONE MAPPING] exposure ต่อสไตล์: realistic = 1.0 ตามสเปก Cinematic, อนิเมะ = 0.6 สีสันอิ่มตัว
    if (renderer) {
      const targetExposure = isRealistic ? 1.0 : 0.6;
      if (immediate) {
        renderer.toneMappingExposure = targetExposure;
      } else {
        moodLight.targetExposure = targetExposure; // ให้ renderLoop lerp นุ่มๆ
      }
    }

    // CSS Glow ฐานใต้ตัวละคร สลับโทนตามสไตล์
    if (canvasWrapper) {
      canvasWrapper.classList.remove("tanjai-glow-sunset", "tanjai-glow-sakura", "tanjai-glow-neon", "tanjai-glow-cinematic",
        "tanjai-mood-listen", "tanjai-mood-happy", "tanjai-mood-think", "tanjai-mood-blush");
      canvasWrapper.classList.add(preset.cssClass);
    }

    // โหลด Mood ปัจจุบันซ้ำบนโทนใหม่ (คงอารมณ์เดิมไว้)
    applyMoodLighting(moodLight.currentMood, immediate);
    console.log(`${T_TAG} [LightPreset] ${moodLight.activePreset} — rims (${preset.rimA.intensity}/${preset.rimB.intensity}) fill ${preset.cuteFill.intensity}`);
  }

  /**
   * ปรับความเข้ม/โทน Rim Light ตามอารมณ์จาก Animation State
   * (เขิน/ดีใจ/เต้น/ฟัง/คิด) — เรียกอัตโนมัติจาก playAnimation
   */
  function applyMoodLighting(animState, immediate = false) {
    const mood = MOOD_RIMS[animState] || MOOD_RIMS.dance;
    moodLight.currentMood = MOOD_RIMS[animState] ? animState : "dance";
    moodLight.target = { rimA: moodBaseA * mood.rimA, rimB: moodBaseB * mood.rimB, fill: moodBaseFill * mood.fill };
    // เปลี่ยนอารมณ์กระชากๆ: เริ่ม lerp จากค่าฐานจริงปัจจุบัน (กันกระโดด)
    if (rimLightA && rimLightB && cuteFillLightRef) {
      moodLight.current.rimA = rimLightA.intensity;
      moodLight.current.rimB = rimLightB.intensity;
      moodLight.current.fill = cuteFillLightRef.intensity;
    }

    if (immediate && rimLightA && rimLightB && cuteFillLightRef) {
      rimLightA.intensity = moodLight.target.rimA;
      rimLightB.intensity = moodLight.target.rimB;
      cuteFillLightRef.intensity = moodLight.target.fill;
    }

    // CSS Glow ประกอบอารมณ์ (สลับ class ทับ mood เดิม คง base preset ไว้)
    if (canvasWrapper) {
      canvasWrapper.classList.remove("tanjai-mood-listen", "tanjai-mood-happy", "tanjai-mood-think", "tanjai-mood-blush");
      if (mood.cssClass) canvasWrapper.classList.add(mood.cssClass);
    }
  }

  // ==========================================================================
  // [3.3] State Aura Engine — Live Subtitle Box + ไฟใต้ฐานเปลี่ยนสีตามสถานะ
  //       listening ฟ้า / thinking ส้ม / speaking ชมพู / browsing เขียว / idle สีเดิม
  // ==========================================================================

  let subtitleHideTimer = null;

  /**
   * อัปเดตสถานะการทำงานของน้องแทนใจ:
   *  1) แสดงข้อความใน Live Subtitle Box ใต้ฐานตัวละคร (+ ขอบเรืองแสงตามสถานะ)
   *  2) เปลี่ยนสี PointLight (Base Glow) ใต้ฐานโมเดล 3D ตามสถานะ
   * @param {string} newState 'listening' | 'thinking' | 'speaking' | 'browsing' | 'idle'
   * @param {string} [message] ข้อความสั้นๆ ที่จะแสดงในกล่อง subtitle
   */
  function updateTanjAIState(newState, message) {
    // หมายเหตุ: พารามิเตอร์ตั้งชื่อ newState (ไม่ใช่ state) เพื่อไม่ทับ object `state` ของโมดูล
    // กันชื่อสถานะผิด → ตกไป idle (สีเดิมตามสไตล์)
    currentAuraState = AURA_STATE_KEYS.indexOf(newState) !== -1 ? newState : "idle";

    // [1] Subtitle Box — ข้อความ + ขอบสีตามสถานะ
    if (subtitleBox) {
      if (subtitleHideTimer) { clearTimeout(subtitleHideTimer); subtitleHideTimer = null; }
      AURA_STATE_KEYS.forEach((key) => subtitleBox.classList.remove(`state-${key}`));
      subtitleBox.classList.add(`state-${currentAuraState}`);
      if (message) subtitleBox.textContent = message;
      subtitleBox.classList.add("visible");

      // โหมด idle แสดงค้างไว้ 4 วิ แล้วค่อยๆ จางหาย (สถานะอื่นค้างไว้จนกว่าสถานะจะเปลี่ยน)
      if (currentAuraState === "idle") {
        subtitleHideTimer = setTimeout(() => {
          subtitleBox.classList.remove("visible");
          subtitleHideTimer = null;
        }, message ? 4000 : 0);
      }
    }

    // [2] Base Glow PointLight ใต้ฐานโมเดล 3D
    if (baseGlowLight) {
      const auraColor = STATE_AURA_COLORS[currentAuraState];
      if (auraColor != null) {
        baseGlowLight.color.setHex(auraColor);
        baseGlowLight.intensity = 1.35;
      } else {
        // idle → สีเดิมตาม preset ของสไตล์ตัวละคร
        const preset = LIGHT_PRESETS[moodLight.activePreset] || LIGHT_PRESETS[DEFAULT_PRESET_KEY];
        baseGlowLight.color.setHex(preset.baseGlow || 0xff7a1a);
        baseGlowLight.intensity = 0.9;
      }
    }

    console.log(`${T_TAG} [Aura] state=${currentAuraState}${message ? ` — ${message}` : ""}`);
  }

  // คำสั่งที่เป็น "งานเบราว์เซอร์" → ไฟใต้ฐานเขียว (Executing/Browsing)
  const BROWSER_AURA_ACTIONS = new Set(["OPEN_TAB", "CLOSE_TAB", "SCROLL", "SEARCH", "PLAY_MUSIC", "SUMMARIZE_PAGE", "WEB_SEARCH"]);

  /** ตรวจว่า response จาก background เป็นงานควบคุมเบราว์เซอร์หรือไม่ (ดูทั้ง intent ใหม่และ action แบบ legacy) */
  function isBrowserActionResponse(response) {
    if (!response) return false;
    const intent = String(response.intent || "").toUpperCase();
    if (intent === "BROWSER_CONTROL" || intent === "WEB_SEARCH") return true;
    return BROWSER_AURA_ACTIONS.has(String(response.action || "").toUpperCase());
  }

  /**
   * [OPT] disposeCharacterRoot — Properly dispose all Three.js objects to prevent memory leaks
   * คืนคืน GPU Memory พร้อม Geometries + Materials + Textures ทุกครั้งที่มีการสลับ Avatar
   */
  function disposeCharacterRoot() {
    if (!characterRoot) return;

    let geoCount = 0, matCount = 0, texCount = 0;

    characterRoot.traverse((obj) => {
      if (obj.geometry) {
        obj.geometry.dispose();
        geoCount++;
      }
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          // Dispose แต่ละ Texture map ที่อาจมี
          const texKeys = ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap", "envMap"];
          texKeys.forEach((key) => {
            if (mat[key]) { mat[key].dispose(); texCount++; }
          });
          mat.dispose();
          matCount++;
        });
      }
    });

    if (scene) scene.remove(characterRoot);
    characterRoot = null;
    headBone = null;
    loadedMixer = null;
    animationsMap = {};
    currentAction = null;
    procEyes = [];
    procWings = [];
    procMouth = null;
    blushMaterial = null;
    procBody = null;
    procArmL = null;
    procArmR = null;
    procFloatingHeart = null;
    glbMorphMeshes = [];
    expressionTargetsMap.clear(); // [EMOTION] ระงับพวก morph ที่ถูก dispose

    console.log(`${T_TAG} [Dispose] คืนคืน GPU Memory: ${geoCount} geo, ${matCount} mat, ${texCount} tex`);
  }

  // ==========================================================================
  // [3.2] Anime-Girl Material / Anime Eye / Soft-Shadow Helpers
  // ==========================================================================
  const SKIN_KEYWORDS = ["skin", "face", "body", "head", "neck", "arm", "leg", "hand"];
  const EYE_KEYWORDS = ["eye", "iris", "pupil", "sclera"];
  const LASH_KEYWORDS = ["lash", "brow", "eyebrow", "eyelid"];
  const HAIR_KEYWORDS = ["hair", "bang", "tail"];

  function matchesKeyword(name, keys) {
    return keys.some((k) => name.indexOf(k) !== -1);
  }

  /**
   * [ANIME EYE] สร้าง Eye Texture ด้วย Canvas: ม่านตา (Iris) ไล่เฉดสี + เส้นใย + Highlight วิบวับ
   * ทำให้ดวงตากลมโตมีชีวิตชีวาแบบอนิเมะ ไม่จมเป็นรูโหว่หรือแข็งเป็นก้อน
   */
  function createAnimeEyeTexture(irisColor, highlightColor) {
    const size = 256;
    const cvs = document.createElement("canvas");
    cvs.width = size;
    cvs.height = size;
    const ctx = cvs.getContext("2d");
    if (!ctx) return null;

    const hex = (c) => "#" + new THREE.Color(c).getHexString();
    const mixWhite = (c, t) => hex(new THREE.Color(c).lerp(new THREE.Color(0xFFFFFF), t).getHex());
    const mixBlack = (c, t) => hex(new THREE.Color(c).lerp(new THREE.Color(0x000000), t).getHex());
    const cxx = size / 2;
    const cyy = size / 2;
    const r = size * 0.44;              // รัศมีม่านตา (เผื่อขอบเข้มรอบนอก)
    const OUTLINE = mixBlack(irisColor, 0.82);

    // 0) พื้นหลังเข้มเต็มใบ -> ทำหน้าที่เป็น "ขอบตาดำ" ไม่เหลือเป็นรูโหว่สีดำสนิท
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(0, 0, size, size);

    // 1) ม่านตาไล่เฉด: สว่างกลางตา -> สีม่านตา -> เข้มที่ขอบ
    const grad = ctx.createRadialGradient(cxx, cyy, r * 0.05, cxx, cyy, r);
    grad.addColorStop(0.0, mixWhite(irisColor, 0.62));
    grad.addColorStop(0.45, hex(irisColor));
    grad.addColorStop(0.85, mixBlack(irisColor, 0.45));
    grad.addColorStop(1.0, OUTLINE);
    ctx.beginPath();
    ctx.arc(cxx, cyy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // 2) เส้นใยในม่านตา (Radial Streaks)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cxx, cyy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cxx + Math.cos(a) * r * 0.34, cyy + Math.sin(a) * r * 0.34);
      ctx.lineTo(cxx + Math.cos(a) * r, cyy + Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.restore();

    // 3) รูม่านตา (Pupil)
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(cxx, cyy, r * 0.33, 0, Math.PI * 2);
    ctx.fillStyle = "#180A1E";
    ctx.fill();

    // 4) ขอบตา/อายไลเนอร์เข้ม
    ctx.beginPath();
    ctx.arc(cxx, cyy, r * 0.99, 0, Math.PI * 2);
    ctx.lineWidth = size * 0.05;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // 5) Highlight วิบวับ 2 จุดแบบอนิเมะ
    ctx.fillStyle = hex(highlightColor || 0xFFFFFF);
    ctx.beginPath();
    ctx.arc(cxx - r * 0.36, cyy - r * 0.42, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cxx + r * 0.34, cyy + r * 0.36, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(cvs);
    tex.anisotropy = 4;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  /**
   * [ANIME EYE] สร้างดวงตาอนิเมะ 1 ข้าง: ตาขาว + Iris Texture + ขอบตา/ขนตา (Eyelashes)
   * คืนค่าเป็น Group ที่ scale.y ได้ตอนกะพริบตา
   */
  function buildAnimeEye(side, irisColor) {
    const group = new THREE.Group();

    // ตาขาว (Sclera)
    const whiteGeo = new THREE.SphereGeometry(0.082, 20, 20);
    whiteGeo.scale(0.9, 1.15, 0.35);
    const white = new THREE.Mesh(
      whiteGeo,
      new THREE.MeshStandardMaterial({ color: 0xFFFDFB, roughness: 0.24, metalness: 0.0 })
    );

    // Iris: ใช้ Mesh Texture ('Eyes') ให้ดวงตามีมิติ
    const irisGeo = new THREE.CircleGeometry(0.066, 28);
    irisGeo.scale(1.0, 1.16, 1.0);
    const iris = new THREE.Mesh(
      irisGeo,
      new THREE.MeshStandardMaterial({
        map: createAnimeEyeTexture(irisColor, 0xFFFFFF),
        color: 0xFFFFFF,
        roughness: 0.08,
        metalness: 0.0,
        emissive: new THREE.Color(irisColor),
        emissiveIntensity: 0.16,
        side: THREE.DoubleSide
      })
    );
    iris.position.set(0, 0.004, 0.033);

    // ขอบตา/ขนตา (Eyelashes)
    const lashMat = new THREE.MeshStandardMaterial({ color: 0x2A1A2E, roughness: 0.45, metalness: 0.05 });
    const upperLash = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.012, 8, 22, Math.PI), lashMat);
    upperLash.position.set(0, 0.012, 0.031);
    upperLash.rotation.z = side < 0 ? -0.1 : 0.1;

    const lowerLash = new THREE.Mesh(new THREE.TorusGeometry(0.073, 0.006, 6, 16, Math.PI * 0.7), lashMat);
    lowerLash.position.set(0, -0.004, 0.031);
    lowerLash.rotation.z = Math.PI * 1.15;

    group.add(white, iris, upperLash, lowerLash);
    group.traverse((m) => { if (m.isMesh) m.userData.noShadow = true; });
    return group;
  }

  /**
   * [STUDIO] เปิด castShadow/receiveShadow ให้ Mesh หลักของตัวละคร
   * Mesh รายละเอียดใบหน้า (ดวงตา/แก้ม/ปาก) จะถูกข้ามเพื่อกันเงาเข้มผิดธรรมชาติ
   */
  function applySoftShadowFlags(root) {
    if (!root) return;
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.userData && obj.userData.noShadow) {
        obj.castShadow = false;
        obj.receiveShadow = false;
        return;
      }
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
  }

  /**
   * [REALISTIC] พารามิเตอร์ผิวหนังมนุษย์สำหรับ MeshPhysicalMaterial
   * transmission จำลองแสงใต้ผิว (SSS-approx) — r128 รองรับ / thickness ทำงานบน r132+
   */
  function applyRealisticSkinParams(mat) {
    if (!mat || !mat.isMeshPhysicalMaterial) return;
    mat.roughness = REALISTIC_SKIN_PARAMS.roughness;
    mat.metalness = REALISTIC_SKIN_PARAMS.metalness;
    mat.transmission = REALISTIC_SKIN_PARAMS.transmission;
    // [r128] thickness มีเฉพาะ r132+ — กัน console warning ด้วยการเช็ค property ก่อน set
    if (SUPPORTS_THICKNESS) mat.thickness = REALISTIC_SKIN_PARAMS.thickness;
    mat.clearcoat = REALISTIC_SKIN_PARAMS.clearcoat;
    mat.clearcoatRoughness = 0.35;
    mat.needsUpdate = true;
  }

  /**
   * [PBR] ยกระดับ Material ของ GLB จาก MeshBasic/MeshLambert/MeshToon ขึ้นเป็น MeshPhysical/MeshStandard
   * พร้อมตั้ง roughness 0.3 / metalness 0.1 ให้ผิวดูนุ่มเนียน ไม่แข็งเป็นก้อน
   * opts.realisticSkin = ใช้พารามิเตอร์ผิวมนุษย์ (สไตล์ realistic)
   */
  function upgradeGLBMaterials(root, opts = {}) {
    const realisticSkin = !!opts.realisticSkin;
    if (!root) return;
    root.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const nodeName = ((child.name || "") + " " + mats.map((m) => (m && m.name) || "").join(" ")).toLowerCase();

      const isSkin = matchesKeyword(nodeName, SKIN_KEYWORDS);
      const isEye = matchesKeyword(nodeName, EYE_KEYWORDS);
      const isLash = matchesKeyword(nodeName, LASH_KEYWORDS);
      const isHair = matchesKeyword(nodeName, HAIR_KEYWORDS);

      const upgraded = mats.map((mat) => {
        if (!mat) return mat;

        // กรณีเป็น MeshPhysicalMaterial อยู่แล้ว -> จูนค่าสู่อนิเมะพรีเมียมทันที
        if (mat.isMeshPhysicalMaterial) {
          if (isSkin && !isEye && !isLash) {
            mat.roughness = 0.25; mat.metalness = 0.15;
            mat.clearcoat = 0.25; mat.clearcoatRoughness = 0.5;
            // [r128] sheen ต้องเป็น THREE.Color เสมอ (renderer เช็ค .isColor ก่อนใช้งาน)
            if (mat.sheen && mat.sheen.isColor) mat.sheen.set(0xffb27a);
            else mat.sheen = new THREE.Color(0xffb27a);
            // [REALISTIC] สไตล์ realistic: ทับด้วยพารามิเตอร์ผิวมนุษย์ (SSS-approx)
            if (realisticSkin) applyRealisticSkinParams(mat);
          } else if (isEye) {
            mat.roughness = 0.08; mat.metalness = 0.0;
          } else if (isHair) {
            mat.roughness = 0.25; mat.metalness = 0.15;
            if (mat.sheen && mat.sheen.isColor) mat.sheen.set(0xff85a1);
            else mat.sheen = new THREE.Color(0xff85a1);
          }
          mat.needsUpdate = true;
          return mat;
        }

        // MeshStandardMaterial: ตา/ขนตา คงค่าพิเศษไว้ (เปียกวาว 0.08) — ที่เหลือแปลงเป็น Physical ทั้งหมด
        if (mat.isMeshStandardMaterial && (isEye || isLash)) {
          if (isEye) { mat.roughness = 0.08; mat.metalness = 0.0; }
          mat.needsUpdate = true;
          return mat;
        }

        // ยกระดับจาก Material เก่า (Basic / Lambert / Toon / Phong) — ผิวหนังบังคับใช้ MeshPhysicalMaterial
        const useSkin = isSkin && !isEye && !isLash;
        const Ctor = THREE.MeshPhysicalMaterial; // [SPEC] ทุกส่วนของโมเดลใช้ Physical (ยกเว้นตา/ขนตา)
        const params = {
          color: mat.color ? mat.color.clone() : new THREE.Color(0xffffff),
          map: mat.map || null,
          roughness: isEye ? 0.08 : (isLash ? 0.5 : 0.25),
          metalness: isEye || isLash ? 0.0 : 0.15,
          transparent: !!mat.transparent,
          opacity: mat.opacity !== undefined ? mat.opacity : 1,
          alphaTest: mat.alphaTest || 0,
          side: mat.side !== undefined ? mat.side : THREE.FrontSide,
          vertexColors: !!mat.vertexColors,
          emissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000),
          emissiveMap: mat.emissiveMap || null
        };
        // [PREMIUM ANIME] Sheen โทนส้ม/ชมพู — ไฮไลต์ขอบผิวนุ่มนวลทั้ง "ผิวหนัง" และ "เส้นผม"
        if (useSkin) {
          params.clearcoat = 0.25;
          params.clearcoatRoughness = 0.5;
          params.sheen = new THREE.Color(0xffb27a);  // ส้มพีช — [r128] ต้องเป็น Color instance
          // [REALISTIC] สไตล์ realistic: ทับด้วยพารามิเตอร์ผิวมนุษย์ (SSS-approx)
          if (realisticSkin) {
            Object.assign(params, REALISTIC_SKIN_PARAMS);
            // [r128] thickness ไม่มีใน constructor — ตัดออกกัน console warning (ทำงานบน r132+)
            if (!SUPPORTS_THICKNESS) delete params.thickness;
          }
        } else if (isHair) {
          params.sheen = new THREE.Color(0xff85a1);  // ชมพูอนิเมะ (ไฮไลต์เส้นผม)
        }

        const next = new Ctor(params);
        next.name = mat.name || "";
        if (mat.normalMap) { next.normalMap = mat.normalMap; if (mat.normalScale) next.normalScale = mat.normalScale.clone(); }
        if (mat.aoMap) next.aoMap = mat.aoMap;
        if (mat.roughnessMap) next.roughnessMap = mat.roughnessMap;
        if (mat.metalnessMap) next.metalnessMap = mat.metalnessMap;
        if (mat.alphaMap) next.alphaMap = mat.alphaMap;
        next.needsUpdate = true;
        if (typeof mat.dispose === "function") mat.dispose();
        return next;
      });

      child.material = Array.isArray(child.material) ? upgraded : upgraded[0];
    });
  }

  /**
   * [EYES] ตรวจสอบ Node ดวงตา/ขนตาแล้วบังคับให้เรนเดอร์ครบถ้วน
   * แก้ปัญหาดวงตาจมเป็นรูโหว่: เปิด visible + Mesh Texture + จัดการ alpha ของขนตา
   */
  function ensureEyesAndEyelashesRender(root, irisColor) {
    if (!root) return;
    const fallbackIrisTex = createAnimeEyeTexture(irisColor, 0xFFFFFF);

    root.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const nodeName = ((child.name || "") + " " + mats.map((m) => (m && m.name) || "").join(" ")).toLowerCase();

      const isEye = matchesKeyword(nodeName, EYE_KEYWORDS);
      const isLash = matchesKeyword(nodeName, LASH_KEYWORDS);
      if (!isEye && !isLash) return;

      child.visible = true;
      child.frustumCulled = false; // กันดวงตาหายตอนตัวละครขยับ/หันหัว

      mats.forEach((mat) => {
        if (!mat) return;
        mat.visible = true;
        mat.side = THREE.DoubleSide;
        mat.depthWrite = true;
        mat.depthTest = true;

        if (isLash && mat.map) {
          // ขนตามักเป็น Texture โปร่งใส -> เปิด alpha ตัดขอบให้สวย
          mat.transparent = true;
          mat.alphaTest = Math.max(mat.alphaTest || 0, 0.35);
        }

        if (isEye) {
          if (!mat.map && fallbackIrisTex) {
            // ดวงตาไม่มี Eye Texture -> ใส่ Iris Texture สำรองให้ดูมีชีวิต
            mat.map = fallbackIrisTex;
            mat.color = new THREE.Color(0xffffff);
            mat.needsUpdate = true;
          }
          if (mat.emissive && mat.emissive.getHex() === 0) {
            mat.emissive = new THREE.Color(irisColor);
            mat.emissiveIntensity = 0.25;
            mat.needsUpdate = true;
          }
        }
      });
    });
  }

  /**
   * สร้างโมเดล Procedural 3D Chibi Model (รองรับ 3-Avatar Styles & Costumes)
   */
  function createProceduralTanjAI(style = "orange_mascot", costume = "default") {
    disposeCharacterRoot(); // [OPT] คืน Memory ก่อนสร้างใหม่

    characterRoot = new THREE.Group();
    characterRoot.position.set(0, 0, 0);
    // [FRAMING] สเกลให้พอดีกรอบกล้องใหม่ (0, 1.1, 2.3) -> lookAt (0, 0.9, 0):
    // ยอดจุกผม + จังหวะกระโดดเต้นต้องไม่ล้นขอบบน และชายกระโปรงต้องไม่ล้นขอบล่าง
    // (วัดจริง: จุกข้าง/หูฟังแกว่งสุด x≈±0.44 ขณะเต้น — 0.78 ให้ margin รอบด้านพอดี)
    characterRoot.scale.setScalar(0.78);
    procEyes = [];
    procWings = [];
    glbMorphMeshes = [];
    expressionTargetsMap.clear();

    // 1. กำหนด Color Palette ตาม Avatar Style
    let skinColor = 0xFFF5EE;
    let hairColor = 0xFF7A1A; // 1. orange_mascot (3D Clay Model)
    let clothColor = 0xFFFFFF;
    let accentColor = 0xFF5500;

    if (style === "anime_girl" || style === "anime_twintails") {
      hairColor = 0xFF85A1; // 2. anime_girl (Live2D / Anime style)
      accentColor = 0x845EC2;
    } else if (style === "cyber_redhair") {
      hairColor = 0xE0115F; // 3. cyber_redhair (3D Cyber Model)
      clothColor = 0x1E1E2E;
      accentColor = 0x00F2FE;
    } else if (style === REALISTIC_STYLE_KEY) {
      // 4. realistic (Photorealistic Human) — โทนธรรมชาติสมจริง
      skinColor = 0xE8B59A;   // ผิวมนุษย์อบอุ่น (ยังไม่รวม SSS — จะถูก applyRealisticSkinParams จูนเพิ่ม)
      hairColor = 0x2C1810;   // น้ำตาลเข้มธรรมชาติ
      clothColor = 0xF5F0EA;
      accentColor = 0x8A4B2F;
    }

    // 2. ปรับแต่งตาม Costume ที่เลือก
    if (costume === "cyber_neon") {
      clothColor = 0x181824;
      accentColor = 0x00F2FE;
    } else if (costume === "idol_dress") {
      clothColor = 0xFFE6F2;
      accentColor = 0xFA709A;
    }

    // [PBR] ผิวหนัง MeshPhysicalMaterial นุ่มสว่างแบบพรีเมียม (roughness 0.25 / metalness 0.15) + Sheen ส้มพีช
    const skinMat = new THREE.MeshPhysicalMaterial({
      color: skinColor,
      roughness: 0.25,
      metalness: 0.15,
      clearcoat: 0.25,
      clearcoatRoughness: 0.5,
      sheen: new THREE.Color(0xffb27a)
    });
    // [REALISTIC] โหมดคนเสมือนจริง: ทับด้วยพารามิเตอร์ผิวมนุษย์ (SSS-approx)
    if (style === REALISTIC_STYLE_KEY) applyRealisticSkinParams(skinMat);
    // ผมเงางามแบบอนิเมะ — Physical + Sheen ชมพู ให้เส้นผมมีไฮไลต์นุ่มนวล
    const hairMat = new THREE.MeshPhysicalMaterial({
      color: hairColor,
      roughness: 0.25,
      metalness: 0.15,
      sheen: new THREE.Color(0xff85a1),
      emissive: hairColor,
      emissiveIntensity: 0.06
    });
    const clothMat = new THREE.MeshPhysicalMaterial({
      color: clothColor,
      roughness: 0.25,
      metalness: 0.15,
      sheen: new THREE.Color(0xffb27a)
    });
    const accentMat = new THREE.MeshPhysicalMaterial({
      color: accentColor,
      roughness: 0.25,
      metalness: 0.15,
      emissive: costume === "cyber_neon" ? 0x00F2FE : 0x000000,
      emissiveIntensity: costume === "cyber_neon" ? 0.6 : 0
    });

    // --- ก. Head & Neck ---
    headBone = new THREE.Group();
    headBone.position.set(0, 1.25, 0);

    const headGeo = new THREE.SphereGeometry(0.38, 32, 32);
    headGeo.scale(1.05, 0.98, 1);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0.2, 0);
    headBone.add(headMesh);

    // ---- ดวงตาอนิเมะ (Anime Eyes): ตาขาว + Iris Texture + ขนตา (Eyelashes) ----
    // NOTE: z = 0.35 ให้ "ตานูน" พ้นผิวหน้า (ผิวหัวที่ z≈0.354) — ถ้าจมกว่าจะโดนผิวบังจนดูไร้ดวงตา
    const eyeLGroup = buildAnimeEye(-1, accentColor);
    eyeLGroup.position.set(-0.145, 0.20, 0.35);
    headBone.add(eyeLGroup);
    procEyes.push(eyeLGroup);

    const eyeRGroup = buildAnimeEye(1, accentColor);
    eyeRGroup.position.set(0.145, 0.20, 0.35);
    headBone.add(eyeRGroup);
    procEyes.push(eyeRGroup);

    // คิ้ว (Eyebrows) — แยกออกจากกลุ่มตาเพื่อไม่ให้หุบตอนกะพริบ
    const browGeo = new THREE.BoxGeometry(0.11, 0.015, 0.012);
    const browMat = new THREE.MeshStandardMaterial({ color: 0x6B3A2E, roughness: 0.6, metalness: 0.0 });
    const browL = new THREE.Mesh(browGeo, browMat);
    browL.position.set(-0.145, 0.325, 0.352);
    browL.rotation.z = 0.16;
    browL.userData.noShadow = true;
    const browR = new THREE.Mesh(browGeo, browMat);
    browR.position.set(0.145, 0.325, 0.352);
    browR.rotation.z = -0.16;
    browR.userData.noShadow = true;
    headBone.add(browL, browR);

    // แก้มชมพู (Blush)
    const blushGeo = new THREE.CircleGeometry(0.05, 16);
    blushMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF7A99,
      roughness: 0.6,
      metalness: 0.0,
      emissive: 0xFF5C88,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.65
    });
    const blushL = new THREE.Mesh(blushGeo, blushMaterial); blushL.position.set(-0.19, 0.13, 0.345);
    const blushR = new THREE.Mesh(blushGeo, blushMaterial); blushR.position.set(0.19, 0.13, 0.345);
    blushL.userData.noShadow = true;
    blushR.userData.noShadow = true;
    headBone.add(blushL, blushR);

    // ปากสำหรับ Lip-Sync
    const mouthGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16);
    mouthGeo.scale(1.2, 0.4, 0.5);
    procMouth = new THREE.Mesh(mouthGeo, new THREE.MeshStandardMaterial({ color: 0xC2365C, roughness: 0.35, metalness: 0.0 }));
    procMouth.position.set(0, 0.09, 0.375);
    procMouth.rotation.x = Math.PI / 2;
    procMouth.userData.noShadow = true;
    headBone.add(procMouth);

    // ผมด้านบน (Hair Cap) — ฝาครอบเฉพาะส่วนบนของศีรษะ "เปิดหน้า" ไว้ ไม่ปิดดวงตา
    // (สำคัวมาก: ทรงกลมเต็มใบจะคลุมใบหน้าจนดวงตาจมเป็นรูโหว่)
    // rim อยู่ที่ y≈0.348 (เหนือดวงตา) + เปลือกหุ้มชิดผิวหัว ทำให้ไม่มีชายผมยื่นมาบังตา/คิ้ว
    const hairCapGeo = new THREE.SphereGeometry(0.40, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.375);
    hairCapGeo.scale(1.04, 0.97, 1.0);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.set(0, 0.20, 0);
    headBone.add(hairCap);

    // ผมด้านหลัง/ท้ายทอย (Back Hair) — เพิ่มปริมาตรด้านหลัง ไม่ให้เห็นหนังหัว
    const backHairGeo = new THREE.SphereGeometry(0.37, 22, 18);
    backHairGeo.scale(1.06, 1.0, 1.0);
    const backHair = new THREE.Mesh(backHairGeo, hairMat);
    backHair.position.set(0, 0.16, -0.07);
    headBone.add(backHair);

    // หน้าม้า (Fringe) — ลอยอยู่ "เหนือดวงตา" ไม่บังดวงตา
    for (let i = -2; i <= 2; i++) {
      const bangGeo = new THREE.ConeGeometry(0.085, 0.18, 12);
      const bang = new THREE.Mesh(bangGeo, hairMat);
      bang.position.set(i * 0.075, 0.44, 0.30);
      bang.rotation.x = Math.PI * 0.88;
      bang.rotation.z = -i * 0.12;
      headBone.add(bang);
    }

    const bunGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const bunL = new THREE.Mesh(bunGeo, hairMat); bunL.position.set(-0.355, 0.42, 0);
    const bunR = new THREE.Mesh(bunGeo, hairMat); bunR.position.set(0.355, 0.42, 0);
    headBone.add(bunL, bunR);

    const ribbonGeo = new THREE.BoxGeometry(0.14, 0.07, 0.06);
    const ribbonL = new THREE.Mesh(ribbonGeo, accentMat); ribbonL.position.set(-0.33, 0.45, 0.1);
    const ribbonR = new THREE.Mesh(ribbonGeo, accentMat); ribbonR.position.set(0.33, 0.45, 0.1);
    headBone.add(ribbonL, ribbonR);

    // หูฟังไซเบอร์
    const earPadGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 16);
    const earPadL = new THREE.Mesh(earPadGeo, accentMat); earPadL.position.set(-0.385, 0.26, 0); earPadL.rotation.z = Math.PI / 2;
    const earPadR = new THREE.Mesh(earPadGeo, accentMat); earPadR.position.set(0.385, 0.26, 0); earPadR.rotation.z = Math.PI / 2;
    headBone.add(earPadL, earPadR);

    characterRoot.add(headBone);

    // --- ข. ลำตัวและกระโปรง ---
    procBody = new THREE.Group();
    procBody.position.set(0, 0.75, 0);

    // คอ (Neck) — เชื่อมหัวกับลำตัว ไม่ให้เป็น "หัวลอย" มีช่องว่างเห็นพื้นหลัง
    const neckGeo = new THREE.CylinderGeometry(0.095, 0.115, 0.22, 14);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, 0.24, 0);
    neck.userData.noShadow = true;
    procBody.add(neck);

    // บ่า (Shoulder Caps) — ไล่รอยต่อคอ-ลำตัวให้เนียนขึ้น
    const shoulderGeo = new THREE.SphereGeometry(0.075, 14, 12);
    const shoulderL = new THREE.Mesh(shoulderGeo, clothMat);
    shoulderL.position.set(-0.21, 0.14, 0);
    shoulderL.scale.set(1.15, 0.8, 1);
    const shoulderR = new THREE.Mesh(shoulderGeo, clothMat);
    shoulderR.position.set(0.21, 0.14, 0);
    shoulderR.scale.set(1.15, 0.8, 1);
    procBody.add(shoulderL, shoulderR);

    const torsoGeo = new THREE.CylinderGeometry(0.18, 0.23, 0.45, 18);
    const torso = new THREE.Mesh(torsoGeo, clothMat);
    procBody.add(torso);

    const skirtGeo = new THREE.ConeGeometry(0.38, 0.35, 24, 1, true);
    const skirt = new THREE.Mesh(skirtGeo, accentMat);
    skirt.position.set(0, -0.22, 0);
    skirt.rotation.x = Math.PI;
    procBody.add(skirt);

    // แขนซ้าย/ขวา
    procArmL = new THREE.Group();
    procArmL.position.set(-0.25, 0.16, 0);
    const armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 12), skinMat);
    armLMesh.position.set(0, -0.15, 0);
    procArmL.add(armLMesh);
    procBody.add(procArmL);

    procArmR = new THREE.Group();
    procArmR.position.set(0.25, 0.16, 0);
    const armRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 12), skinMat);
    armRMesh.position.set(0, -0.15, 0);
    procArmR.add(armRMesh);
    procBody.add(procArmR);

    characterRoot.add(procBody);

    // --- ค. Golden Angel Wings (Costume ปลดล็อก Lv.5) ---
    if (costume === "angel_wings") {
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.bezierCurveTo(0.1, 0.2, 0.3, 0.45, 0.45, 0.35);
      wingShape.bezierCurveTo(0.4, 0.1, 0.2, -0.1, 0, -0.2);
      const wingGeo = new THREE.ShapeGeometry(wingShape);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        emissive: 0xF59F00,
        emissiveIntensity: 0.65,
        side: THREE.DoubleSide
      });

      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.position.set(-0.16, 0.95, -0.18);
      wingL.scale.set(0.9, 0.9, 0.9);

      const wingR = new THREE.Mesh(wingGeo, wingMat);
      wingR.position.set(0.16, 0.95, -0.18);
      wingR.scale.set(-0.9, 0.9, 0.9);

      wingL.userData.noShadow = true;
      wingR.userData.noShadow = true;
      procWings = [wingL, wingR];
      characterRoot.add(wingL, wingR);
    }

    // หัวใจไซเบอร์ลอยข้างตัว
    procFloatingHeart = new THREE.Group();
    const heartGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const heartMat = new THREE.MeshStandardMaterial({ color: 0xFF3366, emissive: 0xFF1144, emissiveIntensity: 0.5 });
    procFloatingHeart.add(new THREE.Mesh(heartGeo, heartMat));
    // [FRAMING] x=0.37 — เผื่อจังหวะเต้นสวิงสะโพก (position.x ±0.14) ไม่ให้หัวใจลอยแตะขอบขวา
    procFloatingHeart.position.set(0.37, 1.45, 0.2);
    characterRoot.add(procFloatingHeart);

    // [STUDIO] เปิด Soft Shadow ให้โครงตัวหลัก (รายละเอียดใบหน้าเว้นไว้กันเงาเข้ม)
    applySoftShadowFlags(characterRoot);

    scene.add(characterRoot);
    isProceduralModel = true;
    // [PRESET] Fallback ก็ต้องเปลี่ยนโทนแสง/Glow ตามสไตล์ด้วย (ไม่งั้นสลับสไตล์แล้วไฟค้างค่าเดิม)
    applyLightingPreset(style);
    playAnimation(ANIM_STATES.IDLE_DANCE, 0.1);
  }

  function loadAvatarModel(styleName, costumeName) {
    loadedAvatarStyle = styleName;
    loadedCostume = costumeName || "default";
    // [ASSETS] ไฟล์โมเดลแนว Anime Girl 3D (มีดวงตา + Eye Texture + Morph Targets ชัดเจน)
    // [DEFAULT] Anime Twin-Tails เป็นโมเดลหลัก: anime_twintails.glb -> anime_girl.glb -> anime_girl_eyes.glb
    const animeGirlFiles = ["anime_twintails.glb", "anime_girl.glb", "anime_girl_eyes.glb"];
    // [REALISTIC] โมเดลคนเสมือนจริง (Photorealistic Human) — เป้าหมายหลักของสไตล์ realistic
    const realisticFiles = ["realistic_tanjai.glb"];

    const styleFiles = {
      orange_mascot: ["orange_mascot.glb"],
      anime_girl: animeGirlFiles,
      anime_twintails: animeGirlFiles,
      cyber_redhair: ["cyber_redhair.glb"],
      realistic: realisticFiles
    };

    // [SEC] Whitelist avatar filenames — ไม่อนุญาตค่านอกเหนือ Whitelist (ค่าเริ่มต้น = ทวินเทล)
    const candidates = styleFiles[styleName] || animeGirlFiles;
    const irisColor = styleName === "cyber_redhair" ? 0x00F2FE : (styleName === "orange_mascot" ? 0xFF7A1A : (styleName === REALISTIC_STYLE_KEY ? 0x5B3A29 : 0x845EC2));

    console.log(`${T_TAG} [Avatar] โหลด Avatar: ${styleName} -> ${candidates.join(" | ")}`);

    if (!(window.THREE && THREE.GLTFLoader)) {
      console.log(`${T_TAG} [Avatar] THREE.GLTFLoader ไม่พร้อม — ใช้ Procedural Anime-Girl Model`);
      createProceduralTanjAI(styleName, costumeName);
      return;
    }

    const loader = new THREE.GLTFLoader();

    const tryLoad = (index) => {
      if (index >= candidates.length) {
        console.warn(`${T_TAG} [Avatar] ไม่พบไฟล์ GLB ใดๆ ในโฟลเดอร์ assets/models — ใช้ Procedural Anime-Girl Model แทน`);
        createProceduralTanjAI(styleName, costumeName);
        return;
      }

      const targetFile = candidates[index];
      const modelUrl = chrome.runtime.getURL(`assets/models/${targetFile}`);

      loader.load(
        modelUrl,
        (gltf) => {
          console.log(`${T_TAG} [Avatar] GLB โหลดสำเร็จ: ${targetFile} (${gltf.animations?.length || 0} animations)`);
          disposeCharacterRoot(); // [OPT] Dispose ก่อนแทนโมเดลใหม่

          // [PBR] ยกระดับ Material -> MeshPhysicalMaterial + Sheen ส้ม/ชมพู (roughness 0.25 / metalness 0.15)
          upgradeGLBMaterials(gltf.scene, { realisticSkin: styleName === REALISTIC_STYLE_KEY });
          // [EYES] บังคับดวงตา/ขนตาให้เรนเดอร์ครบ (กันดวงตาจมเป็นรูโหว่)
          ensureEyesAndEyelashesRender(gltf.scene, irisColor);
          // [STUDIO] ให้โมเดลรับ/ทอดเงา Soft Shadow
          applySoftShadowFlags(gltf.scene);

          characterRoot = gltf.scene;
          characterRoot.position.set(0, 0, 0);
          glbMorphMeshes = [];
          expressionTargetsMap.clear(); // [EMOTION] ล้างเป้าหมายเก่าก่อนเก็บ morph ของโมเดลใหม่

          characterRoot.traverse((child) => {
            if (child.isBone || child.isMesh) {
              const name = (child.name || "").toLowerCase();
              if (!headBone && (name.includes("head") || name.includes("neck"))) {
                headBone = child;
                console.log(`${T_TAG} [Avatar] Head bone found: ${child.name}`);
              }
            }
            if (child.isMesh && child.morphTargetDictionary) {
              glbMorphMeshes.push(child);
            }
          });

          const morphNames = new Set();
          glbMorphMeshes.forEach((m) => Object.keys(m.morphTargetDictionary || {}).forEach((k) => morphNames.add(k)));
          if (morphNames.size > 0) {
            console.log(`${T_TAG} [Avatar] Morph targets: ${Array.from(morphNames).join(", ")}`);
          }

          if (gltf.animations && gltf.animations.length > 0) {
            loadedMixer = new THREE.AnimationMixer(characterRoot);
            animationsMap = {};
            gltf.animations.forEach((clip) => {
              animationsMap[clip.name.toLowerCase()] = loadedMixer.clipAction(clip);
            });
            console.log(`${T_TAG} [Avatar] Animation clips:`, Object.keys(animationsMap));
          }

          scene.add(characterRoot);
          isProceduralModel = false;
          playAnimation(ANIM_STATES.IDLE_DANCE, 0.2);
          // [PRESET] โทนแสง/Glow ตามสไตล์โมเดลที่เพิ่งโหลด
          applyLightingPreset(styleName);
        },
        () => {
          // ไม่ log ทุก frame เพื่อไม่รก console
        },
        (err) => {
          console.warn(`${T_TAG} [Avatar] โหลด GLB "${targetFile}" ไม่สำเร็จ — ลองไฟล์ถัดไป:`, err?.message || err);
          tryLoad(index + 1);
        }
      );
    };

    tryLoad(0);
  }

  // ==========================================
  // [4] Animation State Machine & Transitions
  // ==========================================
  function playAnimation(stateName, crossFadeDuration = 0.3) {
    if (state.currentAnimState === stateName && currentAction && currentAction.isRunning()) return;

    const prevState = state.currentAnimState;
    state.currentAnimState = stateName;
    console.log(`${T_TAG} [Anim] ${prevState} -> ${stateName}`);

    if (loadedMixer && animationsMap) {
      let nextAction = animationsMap[stateName];
      if (!nextAction) {
        if (stateName === ANIM_STATES.IDLE_DANCE) {
          nextAction = animationsMap["dance"] || animationsMap["idle"] || Object.values(animationsMap)[0];
        } else if (stateName === ANIM_STATES.LISTENING) {
          nextAction = animationsMap["listen"] || animationsMap["wave"] || animationsMap["idle"];
        } else if (stateName === ANIM_STATES.TALKING) {
          nextAction = animationsMap["talk"] || animationsMap["speak"] || animationsMap["nod"];
        } else if (stateName === ANIM_STATES.HAPPY) {
          nextAction = animationsMap["happy"] || animationsMap["dance"] || animationsMap["wave"];
        } else if (stateName === ANIM_STATES.THINKING) {
          nextAction = animationsMap["think"] || animationsMap["idle"];
        } else if (stateName === ANIM_STATES.BLUSHING) {
          nextAction = animationsMap["blush"] || animationsMap["shy"] || animationsMap["happy"];
        }
      }

      if (nextAction && nextAction !== currentAction) {
        nextAction.reset();
        nextAction.fadeIn(crossFadeDuration);
        nextAction.play();
        if (currentAction) currentAction.fadeOut(crossFadeDuration);
        currentAction = nextAction;
      }
    }

    // Procedural Poses
    if (stateName === ANIM_STATES.IDLE_DANCE) {
      targetPose.bounceAmp = 0.12;
      targetPose.headTiltZ = 0;
      targetPose.headTiltX = 0;
      targetPose.blushOpacity = 0.65;
      state.isDancing = true;
      danceNotes.className = "tanjai-musical-notes active";
      statusDot.className = "tanjai-status-dot dancing";
    } else if (stateName === ANIM_STATES.LISTENING) {
      targetPose.bounceAmp = 0;
      targetPose.headTiltZ = 0.16;
      targetPose.headTiltX = -0.05;
      targetPose.armRZ = -1.6;
      targetPose.armRX = 0.6;
      targetPose.armLZ = 0.15;
      targetPose.armLX = 0;
      targetPose.blushOpacity = 0.65;
      state.isDancing = false;
      danceNotes.className = "tanjai-musical-notes";
      statusDot.className = "tanjai-status-dot listening";
    } else if (stateName === ANIM_STATES.TALKING) {
      targetPose.bounceAmp = 0.02;
      targetPose.headTiltZ = 0;
      targetPose.headTiltX = 0.06;
      targetPose.armLZ = 0.35;
      targetPose.armRZ = -0.35;
      targetPose.armLX = 0.2;
      targetPose.armRX = 0.2;
      targetPose.blushOpacity = 0.65;
      state.isDancing = false;
      danceNotes.className = "tanjai-musical-notes";
      statusDot.className = "tanjai-status-dot";
    } else if (stateName === ANIM_STATES.HAPPY) {
      targetPose.bounceAmp = 0.08;
      targetPose.headTiltZ = 0.08;
      targetPose.headTiltX = -0.05;
      targetPose.armLZ = 0.5;
      targetPose.armRZ = -0.5;
      targetPose.blushOpacity = 0.75;
      state.isDancing = false;
      danceNotes.className = "tanjai-musical-notes active";
      statusDot.className = "tanjai-status-dot";
      showFloatingCelebration("+10 EXP ❤️");
    } else if (stateName === ANIM_STATES.THINKING) {
      targetPose.bounceAmp = 0;
      targetPose.headTiltZ = 0.12;
      targetPose.headTiltX = -0.15;
      targetPose.armRZ = -1.25;
      targetPose.armRX = 0.65;
      targetPose.armLZ = 0.1;
      targetPose.armLX = 0;
      targetPose.blushOpacity = 0.65;
      state.isDancing = false;
      danceNotes.className = "tanjai-musical-notes";
      statusDot.className = "tanjai-status-dot";
    } else if (stateName === ANIM_STATES.BLUSHING) {
      targetPose.bounceAmp = 0.01;
      targetPose.headTiltX = 0.22;
      targetPose.headTiltZ = -0.12;
      targetPose.armLZ = 0.65;
      targetPose.armRZ = -0.65;
      targetPose.blushOpacity = 1.0;
      state.isDancing = false;
      danceNotes.className = "tanjai-musical-notes";
      statusDot.className = "tanjai-status-dot";
      showFloatingCelebration("+20 EXP ❤️");
    }

    // [MOOD LIGHT] โทนแสงเปลี่ยนตามอารมณ์ของ TanjAI อัตโนมัติ
    applyMoodLighting(stateName);
  }

  // ==========================================
  // [5] Mouse Head-Tracking & Eye Blinking
  // ==========================================
  function handleMouseMove(e) {
    state.lastInteractionTime = Date.now();
    state.mousePos.x = e.clientX;
    state.mousePos.y = e.clientY;

    const rect = canvasWrapper.getBoundingClientRect();
    const charScreenX = rect.left + rect.width / 2;
    const charScreenY = rect.top + rect.height * 0.35;

    const deltaX = (e.clientX - charScreenX) / (window.innerWidth / 1.5);
    const deltaY = (e.clientY - charScreenY) / (window.innerHeight / 1.5);

    const maxAngleY = 0.55;
    const maxAngleX = 0.35;

    // [EYE-CONTACT] หันหน้า "เข้าหาเคอร์เซอร์" — เคอร์เซอร์ซ้าย = หน้าหันซ้าย (มุมบวก = หันไปทาง +x = ขวาจอ)
    state.targetHeadRot.y = THREE.MathUtils.clamp(deltaX * 0.85, -maxAngleY, maxAngleY);
    state.targetHeadRot.x = THREE.MathUtils.clamp(deltaY * 0.6, -maxAngleX, maxAngleX);
  }

  window.addEventListener("mousemove", handleMouseMove, { passive: true });

  function updateEyeBlinking() {
    const now = Date.now();

    if (!isBlinking && now - lastBlinkTime > nextBlinkInterval) {
      isBlinking = true;
      blinkStartTime = now;
    }

    if (isBlinking) {
      const elapsed = now - blinkStartTime;
      if (elapsed < BLINK_DURATION) {
        const progress = Math.sin((elapsed / BLINK_DURATION) * Math.PI);
        const scaleY = THREE.MathUtils.lerp(1.0, 0.05, progress);

        procEyes.forEach((eye) => { eye.scale.y = scaleY; });
        glbMorphMeshes.forEach((mesh) => {
          const dict = mesh.morphTargetDictionary;
          const influences = mesh.morphTargetInfluences;
          if (dict && influences) {
            ["blink", "eye_blink", "blink_left", "blink_right", "eyeblink", "eyes_closed", "eyesclose", "eye_close", "blink_l", "blink_r", "wink"].forEach((k) => {
              if (dict[k] !== undefined) influences[dict[k]] = progress;
            });
          }
        });
      } else {
        isBlinking = false;
        lastBlinkTime = now;
        nextBlinkInterval = 3000 + Math.random() * 2000;
        procEyes.forEach((eye) => { eye.scale.y = 1.0; });
        glbMorphMeshes.forEach((mesh) => {
          const dict = mesh.morphTargetDictionary;
          if (dict && mesh.morphTargetInfluences) {
            ["blink", "eye_blink", "blink_left", "blink_right", "eyeblink", "eyes_closed", "eyesclose", "eye_close", "blink_l", "blink_r", "wink"].forEach((k) => {
              if (dict[k] !== undefined) mesh.morphTargetInfluences[dict[k]] = 0;
            });
          }
        });
      }
    }
  }

  // ==========================================
  // [6] Render Animation Loop with 4 Dance Styles & Lip-Sync
  // ==========================================
  function renderLoop() {
    // [PERF] หยุดหาก Tab ไม่ได้สนใจ (document.hidden) — ประหยัด CPU/GPU
    if (!isPageVisible) {
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(renderLoop);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    updateEyeBlinking();
    updateBeatAnalysis();
    updateExpressionSmoothing(); // [EMOTION] smooth อิทธิพล blendshape ทุกเฟรม

    // ตรวจสอบ Idle State > 3s
    const idleDuration = (Date.now() - state.lastInteractionTime) / 1000;
    if (
      idleDuration >= state.idleDanceSeconds &&
      state.currentAnimState !== ANIM_STATES.IDLE_DANCE &&
      !state.isListening &&
      !state.isSpeaking
    ) {
      playAnimation(ANIM_STATES.IDLE_DANCE, 0.35);
    }

    // GLB Animation Mixer timeScale Sync
    if (loadedMixer) {
      if (state.isBeatSyncing && currentAction) {
        currentAction.timeScale = 1.0 + state.beatEnergy * 1.2;
      }
      loadedMixer.update(delta);
    }

    // Smooth Head-Tracking Lerp
    const lerpSpeed = 0.08;
    state.currentHeadRot.x = THREE.MathUtils.lerp(state.currentHeadRot.x, state.targetHeadRot.x, lerpSpeed);
    state.currentHeadRot.y = THREE.MathUtils.lerp(state.currentHeadRot.y, state.targetHeadRot.y, lerpSpeed);

    // Smooth Pose Lerp
    const poseLerp = 0.1;
    currentPose.armLZ = THREE.MathUtils.lerp(currentPose.armLZ, targetPose.armLZ, poseLerp);
    currentPose.armLX = THREE.MathUtils.lerp(currentPose.armLX, targetPose.armLX, poseLerp);
    currentPose.armRZ = THREE.MathUtils.lerp(currentPose.armRZ, targetPose.armRZ, poseLerp);
    currentPose.armRX = THREE.MathUtils.lerp(currentPose.armRX, targetPose.armRX, poseLerp);
    currentPose.headTiltZ = THREE.MathUtils.lerp(currentPose.headTiltZ, targetPose.headTiltZ, poseLerp);
    currentPose.headTiltX = THREE.MathUtils.lerp(currentPose.headTiltX, targetPose.headTiltX, poseLerp);
    currentPose.blushOpacity = THREE.MathUtils.lerp(currentPose.blushOpacity, targetPose.blushOpacity, poseLerp);
    currentPose.bounceAmp = THREE.MathUtils.lerp(currentPose.bounceAmp, targetPose.bounceAmp, poseLerp);

    if (blushMaterial) blushMaterial.opacity = currentPose.blushOpacity;

    // [MOOD LIGHT] Lerp "ค่าฐาน" แยกไว้ แล้วคำนวณ intensity สดจากฐานทุกเฟรม
    // (สำคัญ: ห้ามคูณพัลส์ลงบนค่าเดิมของไฟ — จะทวีคูณจน Infinity ตามที่เคยเจอ)
    if (rimLightA && rimLightB && cuteFillLightRef) {
      const mood = MOOD_RIMS[moodLight.currentMood] || MOOD_RIMS.dance;
      const lightLerp = 0.06;
      const beat = THREE.MathUtils.clamp(state.beatEnergy || 0, 0, 1);

      moodLight.current.rimA = THREE.MathUtils.lerp(moodLight.current.rimA, moodLight.target.rimA, lightLerp);
      moodLight.current.rimB = THREE.MathUtils.lerp(moodLight.current.rimB, moodLight.target.rimB, lightLerp);
      moodLight.current.fill = THREE.MathUtils.lerp(moodLight.current.fill, moodLight.target.fill, lightLerp);

      let pulseK = 0;
      if (mood.pulse > 0) {
        // พัลส์ช้าๆ ของอารมณ์ + เร่งตาม beatEnergy เมื่อเปิด Beat-Sync
        moodLight.pulsePhase += Math.min(delta || 0, 0.1) * (2 + beat * 6);
        pulseK = (Math.sin(moodLight.pulsePhase) * 0.5 + 0.5) * mood.pulse * (1 + beat * 1.5);
      }

      rimLightA.intensity = moodLight.current.rimA * (1 + pulseK * 0.45);
      rimLightB.intensity = moodLight.current.rimB * (1 + pulseK * 0.3);
      cuteFillLightRef.intensity = moodLight.current.fill;
    }

    // [CINEMATIC] lerp toneMappingExposure นุ่มๆ เมื่อสลับสไตล์ anime <-> realistic
    if (renderer && moodLight.targetExposure != null) {
      renderer.toneMappingExposure = THREE.MathUtils.lerp(
        renderer.toneMappingExposure, moodLight.targetExposure, 0.04);
      // snap เมื่อใกล้เป้าหมาย แล้วปิดการ lerp
      if (Math.abs(renderer.toneMappingExposure - moodLight.targetExposure) < 0.005) {
        renderer.toneMappingExposure = moodLight.targetExposure;
        moodLight.targetExposure = null;
      }
    }

    if (headBone) {
      headBone.rotation.x = state.currentHeadRot.x + currentPose.headTiltX;
      headBone.rotation.y = state.currentHeadRot.y;
      headBone.rotation.z = currentPose.headTiltZ;

      if (state.currentAnimState === ANIM_STATES.IDLE_DANCE) {
        const danceSpeed = (state.estimatedBPM / 60) * 4;
        headBone.rotation.x += Math.sin(elapsedTime * danceSpeed) * 0.08;
        headBone.rotation.y += Math.cos(elapsedTime * (danceSpeed * 0.6)) * 0.1;
      }
    }

    // Lip-Sync
    if (state.isSpeaking) {
      const mouthScaleY = 0.4 + Math.abs(Math.sin(elapsedTime * 15)) * 1.5;
      const mouthScaleX = 0.8 + Math.abs(Math.cos(elapsedTime * 11)) * 0.35;
      if (procMouth) procMouth.scale.set(mouthScaleX, mouthScaleY, 1);
      glbMorphMeshes.forEach((mesh) => {
        const dict = mesh.morphTargetDictionary;
        if (dict && mesh.morphTargetInfluences) {
          ["mouth_open", "mouthopen", "mouth_a", "mouth_o", "viseme_aa", "jawopen", "jaw_open", "open_mouth"].forEach((k) => {
            if (dict[k] !== undefined) mesh.morphTargetInfluences[dict[k]] = Math.abs(Math.sin(elapsedTime * 15)) * 0.85;
          });
        }
      });
    } else {
      if (procMouth) procMouth.scale.set(0.8, 0.25, 1);
      glbMorphMeshes.forEach((mesh) => {
        const dict = mesh.morphTargetDictionary;
        if (dict && mesh.morphTargetInfluences) {
          ["mouth_open", "mouthopen", "mouth_a", "mouth_o", "viseme_aa", "jawopen", "jaw_open", "open_mouth"].forEach((k) => {
            if (dict[k] !== undefined) mesh.morphTargetInfluences[dict[k]] = 0;
          });
        }
      });
    }

    // 4 Distinct Dance Styles Engine (K-Pop, Chinese Club, Coyote, TikTok)
    if (isProceduralModel && characterRoot) {
      if (state.currentAnimState === ANIM_STATES.IDLE_DANCE) {
        const bpmFreq = (state.estimatedBPM / 60) * Math.PI * 2;
        const bounce = currentPose.bounceAmp + state.beatEnergy * 0.14;

        if (state.danceStyle === DANCE_STYLES.KPOP_IDOL) {
          // 1. K-Pop Idol: จังหวะกระฉับกระเฉง แขนชี้สลับโพสสุดปัง
          const jumpY = Math.abs(Math.sin(elapsedTime * bpmFreq)) * bounce;
          characterRoot.position.y = jumpY;
          characterRoot.position.x = 0;
          characterRoot.rotation.z = Math.sin(elapsedTime * (bpmFreq * 0.5)) * 0.08;

          if (procArmL) procArmL.rotation.z = Math.sin(elapsedTime * bpmFreq) * 0.5 + 0.4;
          if (procArmR) procArmR.rotation.z = -Math.sin(elapsedTime * bpmFreq) * 0.5 - 0.4;
        } else if (state.danceStyle === DANCE_STYLES.CHINESE_CLUB) {
          // 2. Chinese Club DJ: จังหวะเรฟเร็ว เต้นยกมือสองข้างโยกหัวมันส์ๆ
          const fastFreq = bpmFreq * 1.25;
          const jumpY = Math.abs(Math.sin(elapsedTime * fastFreq)) * (bounce * 1.2);
          characterRoot.position.y = jumpY;
          characterRoot.position.x = 0;
          characterRoot.rotation.z = Math.sin(elapsedTime * fastFreq) * 0.05;

          if (procArmL) procArmL.rotation.z = 1.4 + Math.sin(elapsedTime * fastFreq) * 0.35;
          if (procArmR) procArmR.rotation.z = -1.4 - Math.sin(elapsedTime * fastFreq) * 0.35;
          if (headBone) headBone.rotation.x += Math.sin(elapsedTime * fastFreq) * 0.14;
        } else if (state.danceStyle === DANCE_STYLES.THAI_COYOTE) {
          // 3. Thai Coyote: ส่ายสะโพกโค้งเว้าเป็นเลข 8 ควงแขนคลื่นน้ำ
          const swayFreq = bpmFreq * 0.6;
          characterRoot.position.x = Math.sin(elapsedTime * swayFreq) * 0.14;
          characterRoot.position.y = Math.abs(Math.sin(elapsedTime * bpmFreq)) * (bounce * 0.7);
          characterRoot.rotation.z = Math.cos(elapsedTime * swayFreq) * 0.12;

          if (procArmL) procArmL.rotation.z = Math.sin(elapsedTime * swayFreq) * 0.4 + 0.2;
          if (procArmR) procArmR.rotation.z = Math.cos(elapsedTime * swayFreq) * 0.4 - 0.2;
        } else if (state.danceStyle === DANCE_STYLES.VIRAL_TIKTOK) {
          // 4. Viral TikTok: แตะข้อมือ โยกไหล่และเอียงคอตามจังหวะไวรัล
          const jumpY = Math.abs(Math.sin(elapsedTime * bpmFreq)) * (bounce * 0.85);
          characterRoot.position.y = jumpY;
          characterRoot.position.x = 0;
          characterRoot.rotation.y = Math.sin(elapsedTime * (bpmFreq * 0.5)) * 0.14;

          if (procArmL) {
            procArmL.rotation.x = 0.75;
            procArmL.rotation.z = 0.35 + Math.sin(elapsedTime * bpmFreq) * 0.25;
          }
          if (procArmR) {
            procArmR.rotation.x = 0.75;
            procArmR.rotation.z = -0.35 - Math.sin(elapsedTime * bpmFreq) * 0.25;
          }
        }
      } else {
        // Natural Breathing
        const breathe = Math.sin(elapsedTime * 2.2) * 0.018;
        characterRoot.position.y = breathe;
        characterRoot.position.x = 0;
        characterRoot.rotation.z = 0;
        characterRoot.rotation.y = 0;

        if (procArmL) {
          procArmL.rotation.z = currentPose.armLZ;
          procArmL.rotation.x = currentPose.armLX;
        }
        if (procArmR) {
          procArmR.rotation.z = currentPose.armRZ;
          procArmR.rotation.x = currentPose.armRX;
        }
      }

      // ปีก Golden Angel Wings ขยับเบาๆ
      if (procWings.length === 2) {
        const wingFlap = Math.sin(elapsedTime * 4) * 0.22;
        procWings[0].rotation.y = -0.3 + wingFlap;
        procWings[1].rotation.y = 0.3 - wingFlap;
      }

      if (procFloatingHeart) {
        procFloatingHeart.position.y = 1.45 + Math.sin(elapsedTime * 3) * 0.06;
        procFloatingHeart.rotation.y = elapsedTime * 1.5;
      }
    }

    renderer.render(scene, camera);
  }

  // ==========================================
  // [7] Web Audio SFX on Hover
  // ==========================================
  function playHoverPopSFX() {
    const nowTime = Date.now();
    if (nowTime - lastHoverSFXTime < 1200) return;
    lastHoverSFXTime = nowTime;

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.09);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  canvasWrapper.addEventListener("mouseenter", () => {
    playHoverPopSFX();
  });

  canvasWrapper.addEventListener("click", () => {
    state.lastInteractionTime = Date.now();
    playAnimation(ANIM_STATES.LISTENING, 0.25);
    setTanjAISpeech("TanjAI กำลังฟังอยู่นะคะ... พูดคำสั่งได้เลยค่ะ 🎙️");
    triggerSpeechRecognition();
  });

  // ==========================================
  // [8] Text-to-Speech (TTS Engine - th-TH)
  // ==========================================
  // [CUTE FEMALE TTS] Thai female voice selector — หาเสียงหญิงไทยที่น่ารักที่สุด
  // หมายเหตุ: Chrome อาจยังไม่ preload รายชื่อเสียงจนกว่าจะเรียก getVoices() ครั้งแรก
  // → cache เสียงที่เลือกไว้ และรีเฟรช cache อัตโนมัติหลัง onvoiceschanged
  const TTS_VOICE_PRIORITY = ["premwadee", "pattara", "google", "female", "หญิง"];
  let cachedThaiVoice = null;

  function pickThaiFemaleVoice() {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    const thVoices = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("th"));
    if (!thVoices.length) return null;
    // 1) คัดลำดับตามชื่อเสียงที่ตั้งไว้: Premwadee / Pattara / Google (เสียงไทย default ของ Google)
    for (const key of TTS_VOICE_PRIORITY) {
      const hit = thVoices.find((v) => (v.name || "").toLowerCase().includes(key));
      if (hit) return hit;
    }
    // 2) ถ้าจับชื่อเสมาไม่ได้ ใช้เสียงแรกของ locale ไทย
    return thVoices[0];
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedThaiVoice = pickThaiFemaleVoice();
    };
  }

  /**
   * [8] speakTanjAI — TTS น้องแทนใจแบบ cute/energetic (th-TH)
   *  - เลือกเสียงหญิงไทยอัตโนมัติ (cache ไว้ เลือกใหม่เมื่อ voices เปล่ยน)
   *  - pitch 1.35 + rate 1.1 = เสียงน่ารักเรียงเงาเร็วเมาส์
   *  - ผูก State-Aura: กำลังพูด → "speaking", พูดจบ → กลับ "listening" (ถ้า 30s Active Window เปิด) หรือ "idle"
   *    (ข้อยกเว้น: ถ้าผู้เรียกส่ง onStart/onEnd มา = ผู้เรียกจัดการ Aura เอง — ไม่ต้องแทรก)
   * @param {string} text ข้อความที่จะให้น้องแทนใจพูด
   * @param {function} [onStart] callback ตอนเริ่มพูด (จัดการ aura เองถ้าส่งมา)
   * @param {function} [onEnd] callback ตอนพูดเสร็จ/เกิด error
   */
  function speakTanjAI(text, onStart, onEnd) {
    if (!window.speechSynthesis) {
      if (onStart) onStart();
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = (text || "")
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}*~#_]/gu, "")
      .trim();

    if (!cleanText) {
      if (onStart) onStart();
      if (onEnd) onEnd();
      return;
    }

    if (!cachedThaiVoice) cachedThaiVoice = pickThaiFemaleVoice();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "th-TH";
    // [CUTE] เสียงน่ารักสดใส — pitch สูงขึ้นแบบเสียงเด็ก + rate เร็วแบบ energetic
    utterance.pitch = 1.35;
    utterance.rate = 1.1;
    if (cachedThaiVoice) {
      utterance.voice = cachedThaiVoice;
    }

    // [STATE-AURA] ผู้เรียกส่ง onStart/onEnd มาครบ = เค้าจัดการ state เอง (เช่น sendCommandToBackground)
    const callerManagesAura = !!(onStart && onEnd);

    utterance.onstart = () => {
      state.isSpeaking = true;
      if (!callerManagesAura) {
        updateTanjAIState("speaking", cleanText);
      }
      if (onStart) onStart();
    };

    utterance.onend = () => {
      state.isSpeaking = false;
      if (!callerManagesAura) {
        // กลับไปโหมดฟังถ้า 30s Active Window ยังเปิด ไม่งั้นกลับ idle
        updateTanjAIState(isActiveMode ? "listening" : "idle");
      }
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      state.isSpeaking = false;
      if (!callerManagesAura) {
        updateTanjAIState(isActiveMode ? "listening" : "idle");
      }
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  // [LEGACY ALIAS] เรียกชื่อเดิมจากทุกจุดที่ใช้มาก่อน — พฤติกรรมเดียวกับ speakTanjAI
  function speakThaiText(text, onStart, onEnd) {
    speakTanjAI(text, onStart, onEnd);
  }

  // ==========================================
  // [9] Speech-to-Text (STT) & Typewriter
  // ==========================================
  let typewriterTimer = null;

  function setTanjAISpeech(text, htmlSuffix = "") {
    if (!speechText) return;
    if (typewriterTimer) clearInterval(typewriterTimer);

    speechBubble.style.display = "flex";
    speechText.innerHTML = "";
    let index = 0;

    typewriterTimer = setInterval(() => {
      if (index < text.length) {
        speechText.textContent += text.charAt(index);
        index++;
      } else {
        clearInterval(typewriterTimer);
        if (htmlSuffix) {
          speechText.innerHTML += htmlSuffix;
          const grantBtn = document.getElementById("tanjai-grant-mic-inline");
          if (grantBtn) {
            grantBtn.addEventListener("click", () => {
              chrome.runtime.sendMessage({ action: "OPEN_WELCOME_PAGE" });
            });
          }
        }
      }
    }, 24);
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  // [WAKE-WORD] ระบบเรียกชื่อ "แทนใจ" — ฟังตลอดเวลา (Always-On Standby)
  // wakeWordEnabled   = โหมดฟังตลอดเวลาเปิดอยู่
  // isActiveMode    = [30s Active Window] เปิดอยู่ — พูดคำสั่งต่อได้โดยไม่ต้องเรียกชื่อซ้ำ
  const WAKE_WORD_PATTERN = /แทนใจ|ทานใจ|ทานจาย|tanjai|tan\s?jai/i;
  // [INTERRUPTIBLE TTS] คำสั่งหยุดเสียงขณะ AI กำลังพูด — ตรวจเฉพาะประโยคสั้นๆ (≤15 ตัวอักษร)
  // เพื่อกัน echo ของประโยค TTS เองที่บังเอิญมีคำว่า "หยุด" แทรกอยู่
  const TTS_STOP_PATTERN = /หยุด|พอแล้ว|พอก่อน|เงียบ|หยุดพูด/i;
  const WAKE_ACKS = ["คะ?", "ว่าไงคะ?", "คะ ให้แทนใจช่วยอะไรดีคะ"]; 
  let wakeWordEnabled = false;
  let skipWakeRestart = false;
  let lastTtsEndTime = 0; // กัน echo: ไมค์ได้ยินเสียง TTS ของตัวเอง

  // [30s ACTIVE WINDOW] คุยต่อเนื่องได้ 30 วินาทีหลังเรียก "แทนใจ" — ทุกคำสั่งที่ส่งเข้ามา
  // จะต่อเวลาใหม่ เงียบครบ 30 วิ จึงกลับโหมด Standby เอง
  const ACTIVE_WINDOW_MS = 30000;
  let isActiveMode = false;
  let activeTimer = null;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "th-TH";
    // [WAKE-WORD] Always-On: ฟังต่อเนื่อง + interim result เพื่อจับคำเรียกได้ไว
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      // โหมด Standby ไม่ถือว่า "กำลังฟังคำสั่ง" — กันบล็อก idle-dance และไม่เล่นท่าฟังตลอดเวลา
      const activeListening = !wakeWordEnabled || isActiveMode;
      state.isListening = activeListening;
      if (activeListening) {
        state.lastInteractionTime = Date.now();
        playAnimation(ANIM_STATES.LISTENING, 0.25);
        voiceStatus.textContent = "ได้ยินเรียกแล้วค่ะ พูดคำสั่งได้เลย~";
        updateTanjAIState("listening", "ฟังอยู่นะคะ พูดคำสั่งได้เลยค่ะ~");
      } else {
        voiceStatus.textContent = "พูดว่า \"แทนใจ\" เพื่อเรียกน้องได้เลยค่ะ";
        updateTanjAIState("idle", 'Standby — พูดว่า "แทนใจ" เพื่อเรียกน้อง');
      }
      micBtn.classList.add("active");
      waveBox.classList.add("listening");
      console.log(`${T_TAG} [STT] เริ่มฟังเสียง (th-TH) — Wake-Word: ${wakeWordEnabled ? "ON" : "OFF"}`);
    };

    recognition.onresult = (event) => {
      // [WAKE-WORD] รวมผลทั้งหมดใน event (continuous จะได้ยินหลายประโยคติดกัน)
      let finalText = "", interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = (event.results[i][0] && event.results[i][0].transcript) || "";
        if (event.results[i].isFinal) finalText += " " + t;
        else interimText += " " + t;
      }
      const heard = (finalText || interimText || "").trim();
      if (!heard) return;
      const confidence = event.results[0] && event.results[0][0] ? (event.results[0][0].confidence * 100).toFixed(1) : "N/A";
      console.log(`${T_TAG} [STT] ได้ยิน: "${heard}" (Confidence: ${confidence}%)`);
      voiceStatus.textContent = `ได้ยิน: "${heard}"`;
      handleWakeWordText(heard);
    };

    recognition.onerror = (event) => {
      console.warn(`${T_TAG} [Mic] Error: ${event.error}`);

      if (event.error === "not-allowed" || event.error === "permission-denied") {
        state.micPermissionGranted = false;
        wakeWordEnabled = false;
        if (chrome && chrome.storage) chrome.storage.local.set({ mic_permission_granted: false });
        voiceStatus.textContent = "ยังไม่ได้รับสิทธิ์ไมโครโฟน";
        setTanjAISpeech(
          "เบราว์เซอร์ยังไม่ได้รับสิทธิ์ไมโครโฟนค่ะ กรุณากดปุ่มด้านล่างเพื่ออนุญาตสิทธิ์นะคะ 🎙️",
          '<br><button class="tanjai-inline-btn" id="tanjai-grant-mic-inline">🎙️ เปิดหน้าอนุญาตสิทธิ์ไมค์</button>'
        );
      } else if (event.error === "aborted" || event.error === "service-not-allowed") {
        // [WAKE-WORD] abort แบบปกติ (restart เอง) หรือ service ปิด — ไม่ต้องแจ้งผู้ใช้ทุกครั้ง
        console.log(`${T_TAG} [STT] ${event.error} — จะลองเริ่มฟังใหม่อัตโนมัติ`);
      } else if (event.error === "audio-capture" || event.error === "no-speech") {
        // เสียงไม่ชัด หรือไม่ได้ยินเสียง (โหมด Standby ไม่ต้องแจ้งเสียงเวียน)
        if (!wakeWordEnabled) {
          voiceStatus.textContent = "ไม่ได้ยินเสียง ลองพูดให้ดังขึ้นหน่อยนะคะ";
          setTanjAISpeech("อเอ~ ไม่ได้ยินเสียงพี่เลยค่ะ ลองพูดให้ดังขึ้นหน่อยแล้วกดปุ่มไมค์อีกครั้งนะคะ 🎙️");
        }
      } else if (event.error === "network") {
        // Speech Recognition ต้องการ Internet
        voiceStatus.textContent = "เน็ตไม่ต่องอาจมีปัญหา";
        setTanjAISpeech("อุ๊ย~ เหมือนเน็ตขดๆ น้องแทนใจอาจยังไม่ได้ยินเลยนะคะ ลองใหม่อีกทีใด้เลยค่ะ! 🜲");
      } else {
        voiceStatus.textContent = `ไมค์: ${event.error}`;
        setTanjAISpeech("ไมค์มีปัญหานิดหน่อยนะคะ ลองกดปุ่มไมค์แล้วพูดใหม่อีกครั้งนะคะ~ 🎙️");
      }
      resetSpeechUI();
    };

    recognition.onend = () => {
      resetSpeechUI();
      // [WAKE-WORD] Always-On: หมดเซสชันเมื่อไหร่ ให้เริ่มฟังใหม่ทันที (Chrome ตัด session ทุก ~60 วิ)
      if (wakeWordEnabled && !skipWakeRestart) {
        setTimeout(() => startWakeListening(), 350);
      }
      skipWakeRestart = false;
    };
  }

  function resetSpeechUI() {
    // [WAKE-WORD] โหมด Standby คงสถานะฟังอยู่เบื้องหลัง (ไม่ถือว่ากำลังฟังคำสั่ง)
    const activeListening = wakeWordEnabled && isActiveMode;
    state.isListening = activeListening;
    if (!wakeWordEnabled) {
      micBtn.classList.remove("active");
      waveBox.classList.remove("listening");
    }
    setTimeout(() => {
      if (!state.isListening && !wakeWordEnabled) voiceStatus.textContent = "คลิกปุ่มไมค์หรือคลิกที่ตัวน้องเพื่อพูด";
    }, 2500);
  }

  function triggerSpeechRecognition() {
    if (!recognition) {
      setTanjAISpeech("ขออภัยค่ะ เบราว์เซอร์ของคุณยังไม่รองรับ Web Speech API");
      return;
    }

    chrome.storage.local.get(["mic_permission_granted"], (res) => {
      if (!res?.mic_permission_granted) {
        setTanjAISpeech(
          "กรุณาอนุญาตสิทธิ์ไมโครโฟนก่อนนะคะ เพื่อให้น้องแทนใจฟังคำสั่งเสียงภาษาไทยได้ค่ะ 🎙️",
          '<br><button class="tanjai-inline-btn" id="tanjai-grant-mic-inline">🎙️ เปิดหน้าอนุญาตสิทธิ์ไมค์</button>'
        );
        return;
      }

      // [WAKE-WORD] ปุ่มไมค์ = toggle โหมดฟังตลอดเวลา (ครั้งแรกเปิด Standby เรียก "แทนใจ" ได้เลย)
      if (wakeWordEnabled) {
        stopWakeListening();
        setTanjAISpeech("ปิดโหมดฟังตลอดเวลาแล้วค่ะ กดปุ่มไมค์เมื่อไหร่เรียกได้อีกนะคะ 🎙️");
      } else {
        wakeWordEnabled = true;
        startWakeListening();
      }
    });
  }

  // [WAKE-WORD] เริ่ม/หยุดเซสชันฟัง (start ตรงๆ อาจ throw ถ้าซ้อน — ปิดด้วย try/catch เสมอ)
  function startWakeListening() {
    if (!recognition) return;
    try { recognition.start(); }
    catch (err) { console.warn(`${T_TAG} [STT] start() ซ้อนอยู่แล้ว — รอ onend restart:`, err?.message || err); }
  }

  function stopWakeListening() {
    wakeWordEnabled = false;
    deactivateActiveWindow(); // [30s ACTIVE WINDOW] ปิดหน้าต่างฟังด้วย (ข้างในมี updateTanjAIState("idle") แล้ว)
    skipWakeRestart = true; // หยุดแบบตั้งใจ — ห้าม onend ดึงกลับขึ้นมา
    try { recognition.stop(); } catch (err) {}
    micBtn.classList.remove("active");
    waveBox.classList.remove("listening");
  }

  // [WAKE-WORD] สมองกลางตีความเสียงที่ได้ยิน: เรียกชื่อ → เปิด Active Window → ส่งคำสั่งต่อ
  function handleWakeWordText(heard) {
    const now = Date.now();

    // [INTERRUPTIBLE TTS] พูดแทรก "หยุด/พอแล้ว" ขณะ AI กำลังพูด → speechSynthesis.cancel() ทันที
    // (ตรวจก่อน echo-guard เสมอ — ไม่งั้นเสียงที่ AI กำลังพูดจะบล็อกคำสั่งหยุดไปซะเอง)
    const isSpeakingNow = state.isSpeaking || (window.speechSynthesis && window.speechSynthesis.speaking);
    if (isSpeakingNow) {
      if (heard.length <= 15 && TTS_STOP_PATTERN.test(heard)) {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        state.isSpeaking = false;
        if (isActiveMode) resetActiveWindowTimer(); // หยุดก็นับเป็นอินเทอแอกชัน — ต่อเวลา Active Window
        voiceStatus.textContent = "หยุดให้แล้วค่ะ 🤫 พูดต่อได้เลยนะคะ";
        console.log(`${T_TAG} [TTS] Interrupted by user: "${heard}"`);
      }
      return; // กำลังพูดอยู่ (ไม่ใช่คำสั่งหยุด) — ไม่ตีความเสียง กัน echo ของ TTS
    }
    // กัน echo: เพิ่งหยุดพูด TTS ไม่นาน อย่าเพิ่งตีความเสียงตัวเอง
    if (now - lastTtsEndTime < 1200) return;

    const hasWake = WAKE_WORD_PATTERN.test(heard);

    // กรณี 1: นอก Active Window — ต้องเรียกชื่อ "แทนใจ" ก่อนเสมอ
    if (!isActiveMode) {
      if (!hasWake) return; // เงียบๆ ไม่ตอบสนองเสียงรอบข้าง
      state.lastInteractionTime = now;
      activateActiveWindow(); // [30s ACTIVE WINDOW] เรียกชื่อ → เปิดหน้าต่างฟัง 30 วินาที
      playAnimation(ANIM_STATES.LISTENING, 0.3);

      // ตัดคำเรียกออก — เหลือคำสั่งที่พูดต่อทันทีในประโยคเดียว (เช่น "แทนใจ เปิด YouTube")
      const remainder = heard.replace(WAKE_WORD_PATTERN, "").replace(/^[\s,.;:!?]+|[\s,.;:!?]+$/g, "").trim();

      if (remainder.length >= 4) {
        // พูดคำสั่งมาพร้อมชื่อเลย → ส่งต่อทันที ไม่ต้องถามกลับ
        const ack = WAKE_ACKS[Math.floor(Math.random() * 2)];
        setTanjAISpeech(`${ack} (กำลังทำ: "${remainder}")`);
        speakThaiText(ack, null, () => { lastTtsEndTime = Date.now(); sendCommandToBackground(remainder); });
        return;
      }

      // เรียกชื่อเปล่าๆ → ตอบรับ "คะ?" แล้วรอฟังคำสั่งภายใน Active Window (30 วิ)
      const ack = WAKE_ACKS[Math.floor(Math.random() * WAKE_ACKS.length)];
      setTanjAISpeech(ack);
      voiceStatus.textContent = "ได้ยินเรียกแล้วค่ะ พูดคำสั่งได้เลย~";
      speakThaiText(ack, null, () => { lastTtsEndTime = Date.now(); });
      return;
    }

    // กรณี 2: Active Window เปิดอยู่ — พูดคำสั่งต่อได้เลยโดยไม่ต้องเรียกชื่อ
    state.lastInteractionTime = now;
    resetActiveWindowTimer(); // มีคำสั่งเข้ามา → ต่อเวลา 30 วิ ใหม่

    const commandText = (hasWake ? heard.replace(WAKE_WORD_PATTERN, " ") : heard)
      .replace(/^[\s,.;:!?]+|[\s,.;:!?]+$/g, "").trim();
    if (!commandText) {
      setTanjAISpeech("ยังไม่ได้ยินคำสั่งเลยค่ะ พูดใหม่ได้เลยนะคะ 🌸");
      return;
    }
    sendCommandToBackground(commandText);
  }

  // [30s ACTIVE WINDOW] เปิดหน้าต่างฟัง 30 วินาที — หลังเรียก "แทนใจ" พูดคำสั่งต่อเนื่องได้
  // โดยไม่ต้องมี wake word; ทุกคำสั่งจะ reset จับเวลา เงียบครบ 30 วิ จึงกลับ Standby เอง
  function activateActiveWindow() {
    isActiveMode = true;
    updateTanjAIState("listening", "ฟังอยู่นะคะ...");
    resetActiveWindowTimer();
    console.log(`${T_TAG} [ActiveWindow] OPEN — เริ่มนับถอยหลัง ${ACTIVE_WINDOW_MS / 1000} วิ`);
  }

  function resetActiveWindowTimer() {
    if (activeTimer) { clearTimeout(activeTimer); activeTimer = null; }
    activeTimer = setTimeout(deactivateActiveWindow, ACTIVE_WINDOW_MS);
  }

  function deactivateActiveWindow() {
    if (activeTimer) { clearTimeout(activeTimer); activeTimer = null; }
    isActiveMode = false;
    updateTanjAIState("idle");
    voiceStatus.textContent = "พูดว่า \"แทนใจ\" เพื่อเรียกน้องได้เลยค่ะ";
    console.log(`${T_TAG} [ActiveWindow] CLOSE — เงียบครบ 30 วิ กลับโหมด Standby`);
  }

  /**
   * [SCREEN AWARENESS] getPageContext — ดึงบริบทหน้าเว็บที่ผู้ใช้กำลังดูอยู่
   * document.title + เนื้อหาข้อความ 1000 ตัวอักษรแรกของ body (clean ช่องว่างซ้ำ)
   * ครอบ try/catch กันหน้าที่ DOM เข้าถึงไม่ได้ (sandbox/iframe)
   * @returns {{ title: string, text: string } | null} null ถ้า extract ไม่ได้
   */
  function getPageContext() {
    try {
      const title = (document.title || "").trim();
      const rawText = (document.body ? document.body.innerText : "") || "";
      const cleaned = rawText.replace(/\s+/g, " ").trim().slice(0, 1000);
      if (!title && !cleaned) return null;
      return { title, text: cleaned };
    } catch (e) {
      console.warn(`${T_TAG} [Screen] getPageContext เกิดข้อผิดพลาด:`, e?.message || e);
      return null;
    }
  }

  // ==========================================================================
  // [EMOTION ENGINE] Gemini emotion_state -> VRM/ARKit blendshapes (morph targets)
  // ==========================================================================
  // alias ใช้ตรง (normalized: lowercase ตัดสัญลักษณ์) กับชื่อ morph จริง — รองรับทั้ง VRM (joy/sorrow/fun),
  // ARKit (mouthSmileLeft, browInnerUp...) และชื่อกลางอนิเมะ (smile, smirk, sad)
  const EMOTION_BLENDSHAPES = {
    happy:      ["smile", "joy", "fun", "cheekraise"],
    empathetic: ["sad", "sorrow", "concern", "frown", "innerbrowraise", "browinnerup"],
    teasing:    ["smirk", "smug", "squint", "smileleft", "winkleft"],
    thinking:   ["browdown", "browfurrow", "browquizzical", "browinnerup"],
    blushing:   ["blush", "rood"],
    idle:       []
  };
  // keys เฝ้าระวัง (normalized exact match) — มาทำโดย engine กระพริบตา/lip-sync ไม่ให้ expression ขัดกัน
  const PROTECTED_MORPH_KEYS = [
    "blink", "eyeblink", "blinkleft", "blinkright", "wink",
    "a", "i", "u", "e", "o", "aa", "ih", "ee", "oh", "ou",
    "mouthopen", "moutha", "moutho", "jawopen", "openmouth"
  ];
  // แผนงานหัวเรื่อง: mesh -> [{ idx, target }] — อัปเดตโดย setTanjAIExpression และทำ smooth ใน renderLoop
  let expressionTargetsMap = new Map();

  const normMorph = (k) => String(k || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  /**
   * setTanjAIExpression(emotion) — เปลี่ยนสีหน้าตามอารมณ์จาก Gemini
   * - reset อิทธิพล morph ทุกค่าเป็นเป้าหมาย 0 (ยกเว้น keys ที่ engine นั้นใช้)
   * - ตั้ง เป้าหมาย 1 ให้ morph ที่จับคู่ alias ของ emotion นั้น (lerp ช้าๆ ใน renderLoop)
   * - รองรับ Procedural model (ไม่มี morph) ด้วยปรับความเฉียบแววใน targetPose
   * @param {string} emotion "happy" | "empathetic" | "teasing" | "thinking" | "blushing" | null | "idle"
   */
  function setTanjAIExpression(emotion) {
    const emoKey = EMOTION_BLENDSHAPES[emotion] ? emotion : "idle";
    const aliases = EMOTION_BLENDSHAPES[emoKey].map(normMorph);

    // Procedural fallback: ไม่มี morph targets -> ใช้ความเข้ม blush ของโมดูลแทน (ตั้งและปลดล็อคทันทีได้)
    if (!glbMorphMeshes.length) {
      targetPose.blushOpacity = emoKey === "blushing" ? 1.0 : 0.65;
      return;
    }

    const nextMap = new Map();
    glbMorphMeshes.forEach((mesh) => {
      const dict = mesh.morphTargetDictionary;
      if (!dict || !mesh.morphTargetInfluences) return;
      const entries = [];
      Object.keys(dict).forEach((key) => {
        const nk = normMorph(key);
        if (PROTECTED_MORPH_KEYS.includes(nk)) return; // ยกเว้น: engines อื่น
        const hit = aliases.some((al) => nk.includes(al));
        entries.push({ idx: dict[key], target: hit ? 1 : 0 });
      });
      if (entries.length) nextMap.set(mesh, entries);
    });
    expressionTargetsMap = nextMap;

    // blush ทิศทางโปรดเซียนก็อัปเดตตาม (เห้นการเปลี่ยนบนโมดูล เล่าเป็นเลเยอร์บนสุด)
    targetPose.blushOpacity = emoKey === "blushing" ? 1.0 : 0.65;
    console.log(`${T_TAG} [Emotion] ${emotion || "idle"} -> ${emoKey}`);
  }

  /** [SMOOTH] ดัน influence เข้าเป้าหมายเบาๆ ขอบทุกเฟรม (เรียกจาก renderLoop) */
  function updateExpressionSmoothing() {
    if (!expressionTargetsMap.size) return;
    expressionTargetsMap.forEach((entries, mesh) => {
      const inf = mesh.morphTargetInfluences;
      if (!inf) return;
      for (const { idx, target } of entries) {
        const cur = inf[idx];
        if (cur === undefined) continue;
        const next = cur + (target - cur) * 0.14;
        inf[idx] = Math.abs(target - next) < 0.01 ? target : next;
      }
    });
  }

  // ส่งคำสั่งไป background.js ประมวลผล (Gemini / Local Intent) แล้วอ่านออกเสียงคำตอบ
  // statusMsg = ข้อความช่วง "คิด" ที่ขึ้นบนกล่อง subtitle (default ใช้กับเสียง / chatbox ส่งข้อความตัวเองมา)
  function sendCommandToBackground(command, statusMsg = "กำลังคิดอยู่ค่ะ... 🤔") {
    updateTanjAIState("thinking", statusMsg);
    // ตรวจสอบว่าในคำสั่งมีลิงก์ YouTube หรือไม่
    const ytId = extractYouTubeId(command);
    if (ytId) {
      console.log(`${T_TAG} [STT] พบ YouTube ID: ${ytId}`);
      playYouTubeAudio(ytId);
    }

    chrome.runtime.sendMessage(
      { action: "EXECUTE_VOICE_COMMAND", command, pageContext: getPageContext() },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(`${T_TAG} [BG] ส่งคำสั่งไม่สำเร็จ:`, chrome.runtime.lastError.message);
          setTanjAISpeech("ขอโทษนะคะพี่ TanjAI มึนหัวนิดหน่อย ลองสั่งอีกทีน้า~ 🌸");
          playAnimation(ANIM_STATES.THINKING, 0.25);
          return;
        }
        if (response && response.reply) {
          console.log(`${T_TAG} [BG] ตอบกลับ: action=${response.action}, anim=${response.animation}, intent=${response.intent || "legacy"}`);
          setTanjAISpeech(response.reply);

          const targetAnim = response.animation || ANIM_STATES.TALKING;
          playAnimation(targetAnim, 0.25);

          // [STATE AURA] งานเบราว์เซอร์ → เขียว, คุย/อธิบาย → ชมพู (ตอนเริ่มพูด)
          if (isBrowserActionResponse(response)) {
            updateTanjAIState("browsing", "กำลังทำงานให้ค่ะ... 🌐");
          }

          // [EMOTION] ขยับ blendshape หน้าตาม emotion_state ก่อนเริ่มพูด (null/generic → กลับ neutral)
          setTanjAIExpression(response.emotion);

          speakThaiText(response.reply, () => {
            updateTanjAIState("speaking", response.reply);
            playAnimation(targetAnim, 0.2);
          }, () => {
            // [EMOTION] พูดจบ → คืนหน้า neutral
            setTanjAIExpression("idle");
            lastTtsEndTime = Date.now(); // [WAKE-WORD] ให้ echo-guard รู้ว่าเพิ่งพูดจบ
            // [30s ACTIVE WINDOW] หน้าต่างยังเปิด → กลับโหมดฟัง (คุยต่อได้) แทน idle
            if (isActiveMode) {
              updateTanjAIState("listening", "ฟังอยู่นะคะ พูดต่อได้เลยค่ะ~");
            } else {
              updateTanjAIState("idle");
            }
            setTimeout(() => {
              if (!state.isSpeaking && !state.isListening) {
                playAnimation(ANIM_STATES.IDLE_DANCE, 0.4);
              }
            }, 1200);
          });

          if (response.affection) {
            state.affectionLevel = response.affection.level;
            updateAffectionUI();
          }
        } else {
          // ไม่มี response - fallback
          setTanjAISpeech("อ่า~ ไม่ได้ยินชัดเลยค่ะ ลองสั่งอีกครั้งนะคะพี่! 🌸");
        }
      }
    );
  }

  micBtn.addEventListener("click", () => {
    state.lastInteractionTime = Date.now();
    triggerSpeechRecognition();
  });

  // [DIRECT TEXT COMMAND] Chatbox — พิมพ์สั่งแทนใจโดยไม่ต้องใช้เสียง
  // Enter → ใช้ข้อความ + เคลียร์ช่องทันที → updateTanjAIState('thinking') →
  // ดึง pageContext ปัจจุบัน → ส่งโครงสร้าง payload เดียวกับเส้นทาง STT (EXECUTE_VOICE_COMMAND)
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation(); // กัน hotkey ของหน้าเว็บถูกเรียกจากการพิมพ์ในช่องของเรา
      const command = chatInput.value.trim();
      if (!command) return; // ช่องว่าง: ไม่ส่ง ไม่ขยับสถานะ
      chatInput.value = "";
      chatInput.blur();
      state.lastInteractionTime = Date.now();
      updateTanjAIState("thinking", "กำลังคิดน้า...");
      // sendCommandToBackground ส่ง { action: "EXECUTE_VOICE_COMMAND", command, pageContext: getPageContext() }
      // = payload โครงสร้างเดียวกับผลลัพธ์ Speech-to-Text พอดี
      sendCommandToBackground(command, "กำลังคิดน้า...");
    });
  }

  // Action Chips Click
  document.querySelectorAll(".tanjai-chip[data-cmd]").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      const cmd = e.target.getAttribute("data-cmd");
      state.lastInteractionTime = Date.now();
      playAnimation(ANIM_STATES.TALKING, 0.25);
      updateTanjAIState("thinking", "กำลังทำตามคำสั่งค่ะ...");

      chrome.runtime.sendMessage(
        { action: "EXECUTE_VOICE_COMMAND", command: cmd, pageContext: getPageContext() },
        (res) => {
          if (res?.reply) {
            setTanjAISpeech(res.reply);
            const targetAnim = res.animation || ANIM_STATES.TALKING;
            playAnimation(targetAnim, 0.25);

            if (isBrowserActionResponse(res)) {
              updateTanjAIState("browsing", "กำลังทำงานให้ค่ะ... 🌐");
            }

            // [EMOTION] ขยับ blendshape หน้าตาม emotion ของ chip ก่อนพูด (res.emotion)
            setTanjAIExpression(res.emotion);

            speakThaiText(res.reply, () => {
              updateTanjAIState("speaking", res.reply);
              playAnimation(targetAnim, 0.2);
            }, () => {
              setTanjAIExpression("idle"); // [EMOTION] พูดจบ → คืนหน้า neutral
              if (isActiveMode) {
                updateTanjAIState("listening", "ฟังอยู่นะคะ พูดต่อได้เลยค่ะ~");
              } else {
                updateTanjAIState("idle");
              }
              setTimeout(() => {
                if (!state.isSpeaking && !state.isListening) {
                  playAnimation(ANIM_STATES.IDLE_DANCE, 0.4);
                }
              }, 1200);
            });

            if (res.affection) {
              state.affectionLevel = res.affection.level;
              updateAffectionUI();
            }
          }
        }
      );
    });
  });

  // ==========================================
  // [10] YouTube Audio & Beat-Sync Dance Engine
  // ==========================================
  let audioContext = null;
  let audioAnalyser = null;
  let audioSourceNode = null;
  let frequencyData = null;

  function extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : (url.trim().length === 11 ? url.trim() : null);
  }

  function playYouTubeAudio(urlOrId) {
    const videoId = extractYouTubeId(urlOrId);
    if (!videoId) {
      setTanjAISpeech("กรุณาใส่ลิงก์ YouTube ที่ถูกต้องนะคะ เช่น https://youtu.be/...");
      return;
    }

    // สร้าง Hidden Iframe สำหรับเล่นเพลง YouTube Background
    let ytIframe = document.getElementById("tanjai-hidden-yt-iframe");
    if (!ytIframe) {
      ytIframe = document.createElement("iframe");
      ytIframe.id = "tanjai-hidden-yt-iframe";
      ytIframe.style.display = "none";
      ytIframe.allow = "autoplay";
      document.body.appendChild(ytIframe);
    }
    ytIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;

    activateBeatSync();
    const startMsg = "กำลังเล่นเพลงและซิงก์จังหวะเต้นให้แล้วค่า! สนุกไปด้วยกันนะ~ 🎵💃";
    setTanjAISpeech(startMsg);
    speakThaiText(startMsg);
  }

  async function activateBeatSync() {
    try {
      const mediaEl = document.querySelector("video") || document.querySelector("audio");

      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      if (mediaEl && !audioSourceNode) {
        try {
          audioSourceNode = audioContext.createMediaElementSource(mediaEl);
          audioAnalyser = audioContext.createAnalyser();
          audioAnalyser.fftSize = 64;
          audioSourceNode.connect(audioAnalyser);
          audioAnalyser.connect(audioContext.destination);
          frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
        } catch (corsErr) {
          state.estimatedBPM = getBPMForStyle(state.danceStyle);
          bpmLabel.textContent = `${state.estimatedBPM} BPM`;
        }
      } else if (!audioAnalyser) {
        state.estimatedBPM = getBPMForStyle(state.danceStyle);
        bpmLabel.textContent = `${state.estimatedBPM} BPM`;
      }

      state.isBeatSyncing = true;
      playAnimation(ANIM_STATES.IDLE_DANCE, 0.3);
      beatSyncBar.classList.add("active");
    } catch (err) {
      console.warn("[TanjAI Beat-Sync Error]:", err);
      state.isBeatSyncing = true;
      playAnimation(ANIM_STATES.IDLE_DANCE, 0.3);
      beatSyncBar.classList.add("active");
    }
  }

  function getBPMForStyle(danceStyle) {
    if (danceStyle === DANCE_STYLES.CHINESE_CLUB) return 146;
    if (danceStyle === DANCE_STYLES.THAI_COYOTE) return 118;
    if (danceStyle === DANCE_STYLES.VIRAL_TIKTOK) return 124;
    return 128; // K-Pop Idol
  }

  function updateBeatAnalysis() {
    if (!state.isBeatSyncing) return;

    if (audioAnalyser && frequencyData) {
      audioAnalyser.getByteFrequencyData(frequencyData);
      const bassEnergy = (frequencyData[1] + frequencyData[2] + frequencyData[3]) / 3;
      state.beatEnergy = bassEnergy / 255;

      bpmBars.forEach((bar, idx) => {
        const val = frequencyData[idx + 1] || 0;
        bar.style.height = `${Math.max(4, (val / 255) * 16)}px`;
      });
    } else {
      const time = clock.getElapsedTime();
      const pulse = Math.abs(Math.sin(time * (state.estimatedBPM / 60) * Math.PI));
      state.beatEnergy = pulse > 0.5 ? pulse : 0.2;

      bpmBars.forEach((bar, idx) => {
        bar.style.height = `${Math.max(4, state.beatEnergy * 14 * (idx + 1) * 0.4)}px`;
      });
    }
  }

  // Toggle YouTube Box & Beat-Sync Button
  btnBeatSync.addEventListener("click", () => {
    state.lastInteractionTime = Date.now();
    ytBox.classList.toggle("active");
    if (!state.isBeatSyncing) {
      activateBeatSync();
    }
  });

  // ปุ่มกดซิงก์เพลงจาก Input Box
  ytPlayBtn.addEventListener("click", () => {
    state.lastInteractionTime = Date.now();
    const url = ytUrlInput.value.trim();
    if (url) {
      playYouTubeAudio(url);
    }
  });

  // เลือก 4 สไตล์ท่าเต้น (K-Pop Idol, Chinese Club DJ, Thai Coyote, Viral TikTok)
  document.querySelectorAll(".tanjai-dance-chip").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      document.querySelectorAll(".tanjai-dance-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");

      state.danceStyle = chip.getAttribute("data-style");
      state.estimatedBPM = getBPMForStyle(state.danceStyle);
      bpmLabel.textContent = `${state.estimatedBPM} BPM`;

      playAnimation(ANIM_STATES.IDLE_DANCE, 0.2);
      const styleName = chip.textContent.trim();
      setTanjAISpeech(`เปลี่ยนสไตล์เต้นเป็น "${styleName}" แล้วค่า! แดนซ์กระจายไปเลย~ 🎶💃`);
    });
  });

  toggleBubbleBtn.addEventListener("click", () => {
    speechBubble.style.display = speechBubble.style.display === "none" ? "flex" : "none";
  });

  // ==========================================
  // [11] Background Message Listener
  // ==========================================
  chrome.runtime.onMessage.addListener((request) => {
    // 1. แจ้งเตือนพักสายตาและจิบน้ำ (Work-Life Balance)
    if (request.action === "HEALTH_REST_ALERT" || request.action === "EYE_REST_REMINDER") {
      healthBanner.classList.add("active");
      setTanjAISpeech(request.message);
      playAnimation(ANIM_STATES.THINKING, 0.25);
      speakThaiText(request.message);
      setTimeout(() => { healthBanner.classList.remove("active"); }, 12000);
    }

    // 2. แจ้งเตือน Level Up
    if (request.action === "LEVEL_UP") {
      state.userLevel = request.newLevel;
      updateAffectionUI();
      showFloatingCelebration(`LEVEL UP! (Lv.${request.newLevel}) 🌟`);
      setTanjAISpeech(request.message);
      playAnimation(ANIM_STATES.HAPPY, 0.25);
      speakThaiText(request.message);
    }

    // 3. ปรับเปลี่ยนการตั้งค่าแบบ Real-time
    // [TEST HOOK] รองรับ harness สำหรับทดสอบ/เดโม (ไม่มีผลใน production — ต้องส่งเองจากหน้าเว็บ)
    if (request.action === "TANJAI_TEST_SET_STYLE" && request.style) {
      state.avatarStyle = request.style;
      loadAvatarModel(state.avatarStyle, state.costume);
    }

    if (request.action === "SETTINGS_UPDATED") {
      if (request.preferences) {
        state.userPreferences = request.preferences;
        let needReloadModel = false;

        if (request.preferences.avatarStyle && request.preferences.avatarStyle !== state.avatarStyle) {
          state.avatarStyle = request.preferences.avatarStyle;
          needReloadModel = true;
        }
        if (request.preferences.costume && request.preferences.costume !== state.costume) {
          state.costume = request.preferences.costume;
          needReloadModel = true;
        }
        if (needReloadModel) {
          loadAvatarModel(state.avatarStyle, state.costume);
          const switchMsg = "เปลี่ยนสไตล์และชุดใหม่ให้น้องแทนใจเรียบร้อยแล้วค่า สวยถูกใจไหมคะ? ✨";
          setTanjAISpeech(switchMsg);
          speakThaiText(switchMsg);
        }
        if (request.preferences.idleDanceSeconds) {
          state.idleDanceSeconds = request.preferences.idleDanceSeconds;
        }
      }
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThreeScene);
  } else {
    initThreeScene();
  }

  // ==========================================================================
  // [CLEANUP] ล้าง Three.js + AudioContext เมื่อผู้ใช้เปลี่ยน Page (SPA Navigation)
  // ==========================================================================
  window.addEventListener("beforeunload", () => {
    console.log(`${T_TAG} [Cleanup] Page unloading — disposing Three.js resources...`);
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    disposeCharacterRoot();
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
    }
    if (audioContext) {
      audioContext.close().catch(() => {});
    }
    if (recognition) {
      stopWakeListening(); // [WAKE-WORD] ปิดโหมดฟังตลอดเวลาก่อน teardown
      try { recognition.abort(); } catch (e) {}
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    console.log(`${T_TAG} [Cleanup] ล้างทรัพยากรเรียบร้อย`);
  });

  console.log(`${T_TAG} [System] ทุก Listener และ Event ลงทะเบียนเรียบร้อย — TanjAI v1.1 พร้อมใช้งาน! 🐖🎊`);
})();
