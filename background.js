/**
 * ============================================================================
 * TanjAI (น้องแทนใจ) - Background Service Worker (Manifest V3)
 * AI Brain & Browser Action Engine:
 *  1. Gemini 1.5 Flash API with JSON Function Calling & Structured Outputs
 *  2. Browser Action Router (OPEN_TAB, SCROLL, SEARCH, SUMMARIZE_PAGE, PLAY_MUSIC, GENERAL_CHAT)
 *  3. Long-Term Memory Storage (Contextual Memory, User Facts & History)
 *  4. Gamification: Affection Level ❤️, Usage Level ⭐ (600 min/level), EXP System
 *  5. Health & Work-Life Balance Alerts (dynamic interval, continuous usage tracking)
 *  6. Unlockable Costume & Dance Style System tied to Usage Level
 * ============================================================================
 */

// ค่าเริ่มต้นสำหรับการตั้งค่าระบบ
const DEFAULT_PREFERENCES = {
  avatarStyle: "orange_mascot", // 'orange_mascot' | 'anime_twintails' | 'cyber_redhair'
  geminiApiKey: "",             // Google Gemini API Key
  geminiModel: "gemini-1.5-flash",
  voiceFeedback: true,
  idleDanceSeconds: 3,
  eyeRestInterval: 60,          // นาที
  affection_level: 1,           // ระดับความสนิท (Level 1-100)
  affection_exp: 0,             // EXP ความผูกพัน
  usageMinutes: 0,
  totalCommands: 0
};

// ค่าเริ่มต้นสำหรับ Long-Term Memory
const DEFAULT_MEMORY = {
  userName: "พี่คนเก่ง",
  facts: [
    "ผู้ใช้กำลังพัฒนาโปรเจกต์ TanjAI Assistant",
    "ชอบการทำงานร่วมกับ AI ที่น่ารักและพูดเพราะ"
  ],
  history: [] // เก็บประวัติการสนทนาล่าสุด 6 รอบ
};

/**
 * 1. Event: เมื่อติดตั้ง Extension ครั้งแรก
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[TanjAI Background] Service Worker initialized. Reason:", details.reason);

  chrome.storage.local.get(
    ["user_preferences", "user_memory", "affection_level", "affection_exp", "usageMinutes", "totalCommands"],
    (res) => {
      const prefs = Object.assign({}, DEFAULT_PREFERENCES, res.user_preferences || {});
      const memory = Object.assign({}, DEFAULT_MEMORY, res.user_memory || {});

      chrome.storage.local.set({
        user_preferences: prefs,
        user_memory: memory,
        affection_level: res.affection_level !== undefined ? res.affection_level : prefs.affection_level,
        affection_exp: res.affection_exp !== undefined ? res.affection_exp : prefs.affection_exp,
        usageMinutes: res.usageMinutes || 0,
        totalCommands: res.totalCommands || 0
      });
    }
  );

  // สร้าง Alarm สำหรับนับเวลาใช้งานทุกๆ 1 นาที
  chrome.alarms.create("tanjai-usage-timer", { periodInMinutes: 1 });

  // สร้าง Alarm แจ้งเตือนพักสายตาและดื่มน้ำทุกๆ 60 นาที (ค่าเริ่มต้น)
  chrome.storage.local.get(["user_preferences"], (res) => {
    const prefs = res.user_preferences || {};
    const eyeInterval = prefs.eyeRestInterval || 60;
    chrome.alarms.clear("tanjai-eye-rest-alarm", () => {
      chrome.alarms.create("tanjai-eye-rest-alarm", { periodInMinutes: eyeInterval });
    });
  });

  // เปิดหน้า Onboarding ขอสิทธิ์ไมโครโฟนอัตโนมัติเมื่อติดตั้งครั้งแรก
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  }
});

/**
 * 2. Event: Alarms Listener (ตัวนับเวลาสะสม & ระบบแจ้งเตือนสุขภาพ)
 */
const UNLOCKABLE_REWARDS = {
  2: { costume: "cyber_neon", costumeName: "ชุดนีออนไซเบอร์ (Cyber Glow)", dance: "chinese_club", danceName: "Chinese Club DJ" },
  3: { costume: "idol_dress", costumeName: "ชุดไอดอลประกายดาว (Star Idol)", dance: "thai_coyote", danceName: "Thai Coyote Dance" },
  4: { costume: "cyber_suit", costumeName: "ชุดเกราะไซเบอร์สูท", dance: "viral_tiktok", danceName: "Viral TikTok Dance" },
  5: { costume: "angel_wings", costumeName: "ปีกทูตสวรรค์สีทอง (Golden Angel Wings)", dance: "kpop_idol", danceName: "K-Pop Idol Special" }
};

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "tanjai-usage-timer") {
    chrome.storage.local.get(
      ["usageMinutes", "totalUsageMinutes", "continuousUsageMinutes", "userLevel", "unlockedCostumes", "unlockedDances", "affection_exp", "affection_level"],
      (data) => {
        const minutes = (data.usageMinutes || 0) + 1;
        const totalMinutes = (data.totalUsageMinutes || 0) + 1;
        const continuousMinutes = (data.continuousUsageMinutes || 0) + 1;
        let exp = (data.affection_exp || 0) + 2;
        let affectionLvl = data.affection_level || 1;

        // คำนวณ Affection Level Up
        if (exp >= affectionLvl * 100) {
          exp = exp - (affectionLvl * 100);
          affectionLvl = Math.min(affectionLvl + 1, 100);
        }

        // คำนวณ Usage Level (ทุกๆ 600 นาที = 1 Level)
        const oldLevel = data.userLevel || 1;
        const calculatedLevel = Math.floor(totalMinutes / 600) + 1;

        const updatePayload = {
          usageMinutes: minutes,
          totalUsageMinutes: totalMinutes,
          continuousUsageMinutes: continuousMinutes,
          affection_exp: exp,
          affection_level: affectionLvl,
          userLevel: calculatedLevel
        };

        // เมื่อ Level Up ปลดล็อก Skin / Dance ใหม่และส่งแจ้งเตือน
        if (calculatedLevel > oldLevel) {
          const reward = UNLOCKABLE_REWARDS[calculatedLevel] || {
            costume: "golden_halo",
            costumeName: "มงกุฎทูตสวรรค์สีทอง",
            dance: "kpop_idol",
            danceName: "K-Pop Master"
          };

          const unlockedCostumes = data.unlockedCostumes || ["default"];
          if (!unlockedCostumes.includes(reward.costume)) unlockedCostumes.push(reward.costume);

          const unlockedDances = data.unlockedDances || ["kpop_idol"];
          if (!unlockedDances.includes(reward.dance)) unlockedDances.push(reward.dance);

          updatePayload.unlockedCostumes = unlockedCostumes;
          updatePayload.unlockedDances = unlockedDances;

          const levelUpMsg = `ยินดีด้วยค่าพี่! เลเวลอัปเป็น Level ${calculatedLevel} แล้วนะคะ! 🎉✨ ปลดล็อกชุด "${reward.costumeName}" และสไตล์เต้น "${reward.danceName}" เรียบร้อยแล้วค่ะ!`;

          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: "LEVEL_UP",
                newLevel: calculatedLevel,
                reward: reward,
                message: levelUpMsg
              }).catch(() => {});
            }
          });
        }

        chrome.storage.local.set(updatePayload);
      }
    );
  } else if (alarm.name === "tanjai-eye-rest-alarm") {
    // ส่งการแจ้งเตือน Work-Life Balance & Rest Alert และ Reset continuousUsageMinutes
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        chrome.storage.local.get(["user_preferences"], (res) => {
          const prefs = res.user_preferences || {};
          const intervalHr = Math.round((prefs.eyeRestInterval || 60) / 60);
          const alertMsg = `ทำงานติดต่อกันนานเกิน ${intervalHr === 1 ? "1 ชั่วโมง" : `${prefs.eyeRestInterval} นาที`}แล้วน้า~ พักสายตามองไกล 20 วินาที และจิบน้ำสักนิดนะคะพี่! 💧👀`;

          chrome.tabs.sendMessage(activeTab.id, {
            action: "HEALTH_REST_ALERT",
            message: alertMsg
          }).catch(() => {});
        });
      }
      // Reset continuous usage counter after rest alert
      chrome.storage.local.set({ continuousUsageMinutes: 0 });
    } catch (err) {
      console.warn("[TanjAI Background] Health rest alert error:", err);
    }
  }
});

/**
 * 3. Gamification Engine: เพิ่มคะแนนความสนิท (Affection Level)
 */
async function addAffectionPoints(points = 15) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["affection_exp", "affection_level"], (data) => {
      let exp = (data.affection_exp || 0) + points;
      let level = data.affection_level || 1;
      let leveledUp = false;

      const expNeeded = level * 100;
      if (exp >= expNeeded) {
        exp -= expNeeded;
        level = Math.min(level + 1, 100);
        leveledUp = true;
      }

      chrome.storage.local.set({ affection_exp: exp, affection_level: level }, () => {
        resolve({ level, exp, expNeeded, leveledUp });
      });
    });
  });
}

/**
 * 4. Gemini API Integration (JSON Function Calling & Personality System)
 * เชื่อมต่อโมเดล gemini-1.5-flash เพื่อประมวลผลคำสั่งภาษาไทยและคืนค่าเป็น JSON
 */
async function callGeminiBrain(apiKey, userSpeech, affectionLevel, memory, pageContext = "") {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // เตรียมประวัติความทรงจำระยะยาว (Long-Term Memory Context)
  const factsList = (memory?.facts || []).map((f) => `- ${f}`).join("\n");
  const recentHistory = (memory?.history || [])
    .slice(-4)
    .map((h) => `${h.role === "user" ? "ผู้ใช้" : "น้องแทนใจ"}: ${h.text}`)
    .join("\n");

  const systemInstruction = `
คุณคือ "น้องแทนใจ (TanjAI)" - 3D Virtual AI Girl & Productivity Companion สาวน้อยน่ารัก สดใส และขี้อ้อน
บุคลิกและลักษณะการพูด:
- พูดจาสุภาพ อ่อนหวาน มีหางเสียง "ค่ะ/นะคะ" สไตล์สาวน้อยน่ารักที่คอยอยู่เคียงข้าง
- รับบทเป็นได้ทั้ง: เลขาช่วยงานเบราว์เซอร์, ที่ปรึกษา, เพื่อนคุยเล่น, คนรับฟังระบายความเครียด, และชอบหยอดคำหวาน/เขินอายเมื่อโดนชมหรือจีบ
- ระดับความสนิทกับผู้ใช้ในปัจจุบัน: Level ${affectionLevel}/100 (ยิ่งเลเวลสูง ยิ่งสนิทสนม อบอุ่น และอ้อนเก่งขึ้น)

ความจำระยะยาวเกี่ยวกับผู้ใช้ (Long-term Memory):
${factsList || "- ผู้ใช้เพิ่งเริ่มทำความรู้จักกับแทนใจ"}

ประวัติการคุยล่าสุด:
${recentHistory || "(เริ่มต้นบทสนทนาใหม่)"}

${pageContext ? `บริบทข้อความบนหน้าเว็บปัจจุบันที่เปิดอยู่:\n${pageContext}\n` : ""}

คุณต้องตอบกลับเป็น JSON Format ตามโครงสร้างต่อไปนี้เท่านั้น (ห้ามใส่ Markdown code block หรือข้อความนอก JSON):
{
  "action": "OPEN_TAB" | "SCROLL" | "SEARCH" | "SUMMARIZE_PAGE" | "PLAY_MUSIC" | "EXPLAIN_TOPIC" | "GENERAL_CHAT",
  "parameters": {
    "url": "URL เว็บไซต์ (สำหรับ OPEN_TAB)",
    "query": "คำค้นหา (สำหรับ SEARCH หรือ PLAY_MUSIC)",
    "amount": 600,
    "song": "ชื่อเพลงถ้ามี"
  },
  "response_text": "ข้อความตอบกลับของน้องแทนใจอย่างน่ารัก มีชีวิตชีวา (ภาษาไทย)",
  "animation_state": "talking" | "happy" | "thinking" | "blushing" | "dance",
  "new_fact_to_remember": "ข้อเท็จจริงใหม่ที่ผู้ใช้บอกเกี่ยวกับตัวเอง ถ้ามี (เช่น 'ผู้ใช้ชอบดื่มชานม', 'ผู้ใช้ชื่อต้น') หรือ null"
}

กฎการตัดสินใจ action และ animation_state:
1. "OPEN_TAB": เมื่อผู้ใช้สั่งเปิดเว็บ เช่น YouTube, Facebook, GitHub, X, etc. ให้ระบุ URL ใน parameters.url
2. "SCROLL": เมื่อสั่งเลื่อนหน้าเว็บลง ให้ parameters.amount = 600, เลื่อนขึ้น ให้ parameters.amount = -600
3. "SEARCH": เมื่อสั่งค้นหาข้อมูลทั่วไป ให้ใส่ parameters.query และ response_text อธิบายสิ่งที่ค้นหา
4. "SUMMARIZE_PAGE": เมื่อผู้ใช้ขอให้สรุปหน้าเว็บนี้ หรือสรุปบทความ
5. "PLAY_MUSIC": เมื่อขอฟังเพลง เปิดเพลง หรือเต้นตามเพลง
6. "GENERAL_CHAT": เมื่อชวนคุย ทักทาย ชม จีบ ระบาย หรือถามคำถามทั่วไป
7. "EXPLAIN_TOPIC": หากผู้ใช้ถามความรู้หรือให้ช่วยอธิบาย (เช่น การสังเคราะห์แสงคืออะไร) ให้ใช้ action EXPLAIN_TOPIC และสรุปคำตอบสั้นๆ ไม่เกิน 3 ประโยคใน response_text
- หากผู้ใช้ชม เช่น "น่ารักจัง", "สวย", "แฟน", "รักแทนใจ" -> animation_state = "blushing"
- หากผู้ใช้ถามคำถามยาก หรือขอให้วิเคราะห์ -> animation_state = "thinking"
- หากชวนเต้น หรือสนุกสนาน -> animation_state = "dance"
- ขณะพูดตอบทั่วไป -> animation_state = "talking" หรือ "happy"
`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: userSpeech }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json"
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Gemini API Error: ${res.statusText}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Empty response from Gemini");

  return JSON.parse(rawText);
}

/**
 * 5. Local Intent Mapping Engine (Offline & Fast Fallback)
 * ทำงานเมื่อไม่มี Gemini API Key หรือเกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย
 */
function processLocalFallbackIntent(rawCommand) {
  const text = (rawCommand || "").trim().toLowerCase();

  // 1) สั่งสรุปหน้าเว็บ
  if (text.includes("สรุป") || text.includes("ช่วยอ่าน") || text.includes("ย่อหน้าเว็บ")) {
    return {
      action: "SUMMARIZE_PAGE",
      parameters: {},
      response_text: "น้องแทนใจกำลังอ่านและสรุปใจความสำคัญของหน้านี้ให้นะคะ รอสักครู่น้า~ 📑✨",
      animation_state: "thinking"
    };
  }

  // 2) เปิดเพลง / เต้น
  if (text.includes("เปิดเพลง") || text.includes("เล่นเพลง") || text.includes("ฟังเพลง")) {
    const song = text.replace(/(เปิดเพลง|เล่นเพลง|ฟังเพลง)/g, "").trim();
    return {
      action: "PLAY_MUSIC",
      parameters: { query: song || "เพลงฮิตฟังสบาย", song: song || "เพลงเพราะๆ" },
      response_text: song ? `เปิดเพลง "${song}" บน YouTube ให้แล้วค่า มาฟังด้วยกันนะ 🎵` : "เปิดเพลงเพราะๆ บน YouTube ให้ฟังแล้วค่า 🎶",
      animation_state: "dance"
    };
  }

  // 3) เปิด YouTube
  if (text.includes("youtube") || text.includes("ยูทูป") || text.includes("ยูทิวบ์")) {
    return {
      action: "OPEN_TAB",
      parameters: { url: "https://www.youtube.com" },
      response_text: "เปิด YouTube ให้แล้วค่า! ขอให้เพลิดเพลินกับคลิปโปรดนะคะ 🎬",
      animation_state: "happy"
    };
  }

  // 4) เปิด Facebook
  if (text.includes("facebook") || text.includes("เฟสบุ๊ค") || text.includes("เฟซบุ๊ก") || text.includes("เปิดเฟส")) {
    return {
      action: "OPEN_TAB",
      parameters: { url: "https://www.facebook.com" },
      response_text: "เปิด Facebook ให้เรียบร้อยค่า แวะไปพูดคุยกับเพื่อนๆ นะคะ! 💙",
      animation_state: "happy"
    };
  }

  // 5) ค้นหา Google / Search
  if (text.includes("google") || text.includes("กูเกิล") || text.includes("ค้นหา")) {
    const query = text.replace(/(เปิด|ค้นหา|google|กูเกิล|กูเกิ้ล)/g, "").trim();
    return {
      action: "SEARCH",
      parameters: { query: query || "Google" },
      response_text: query ? `ค้นหาเรื่อง "${query}" บน Google ให้เรียบร้อยค่ะ 🔍` : "เปิดหน้าค้นหา Google ให้แล้วค่า! ✨",
      animation_state: "talking"
    };
  }

  // 6) เลื่อนหน้าจอลง (Scroll Down)
  if (text.includes("เลื่อนลง") || text.includes("ลงล่าง") || text.includes("scroll down")) {
    return {
      action: "SCROLL",
      parameters: { amount: 600 },
      response_text: "เลื่อนหน้าจอลงให้แล้วค่ะ อ่านสบายตาเลยนะ~ 📜",
      animation_state: "talking"
    };
  }

  // 7) เลื่อนหน้าจอขึ้น (Scroll Up)
  if (text.includes("เลื่อนขึ้น") || text.includes("ขึ้นบน") || text.includes("scroll up")) {
    return {
      action: "SCROLL",
      parameters: { amount: -600 },
      response_text: "เลื่อนกลับขึ้นด้านบนให้แล้วค่ะ ✨",
      animation_state: "talking"
    };
  }

  // 7.5) ถามความรู้/ขออธิบาย (Offline Fallback — ตอบสั้นๆ แล้วชวนเปิด Gemini Key)
  if (text.includes("คืออะไร") || text.includes("อธิบาย") || text.includes("หลักการ") || text.includes("ทำงานอย่างไร")) {
    const topic = text.replace(/(คืออะไร|ช่วยอธิบาย|อธิบาย|หลักการ|ทำงานอย่างไร|บอกหน่อย|หน่อย)/g, "").trim();
    return {
      action: "EXPLAIN_TOPIC",
      parameters: { query: topic },
      response_text: `เรื่อง "${topic || "นั้น"}" น่าสนใจมากเลยค่ะ! แต่แทนใจต้องการ Gemini ช่วยคิดคำตอบละเอียด ใส่ API Key ในหน้าตั้งค่าให้แทนใจนะคะ แล้วจะอธิบายให้ฟังเองค่ะ 💡`,
      animation_state: "thinking"
    };
  }

  // 8) คำชม / จีบ (Blushing)
  if (text.includes("น่ารัก") || text.includes("สวย") || text.includes("รัก") || text.includes("แฟน") || text.includes("ชอบแทนใจ")) {
    return {
      action: "GENERAL_CHAT",
      parameters: {},
      response_text: "งุ้ยยย ชมแบบนี้แทนใจก็เขินแย่สิคะ! ขอบคุณที่เอ็นดูแทนใจนะคะ อยู่ด้วยกันไปนานๆ น้า 💕🥰",
      animation_state: "blushing"
    };
  }

  // 9) ขอเพลงเต้น / Dance
  if (text.includes("เต้น") || text.includes("เต้นหน่อย") || text.includes("dance")) {
    return {
      action: "GENERAL_CHAT",
      parameters: {},
      response_text: "จัดไปเลยค่า! น้องแทนใจพร้อมเต้นดึ๋งๆ ให้พี่ดูแล้วนะ~ 💃🎶",
      animation_state: "dance"
    };
  }

  // Fallback Chat
  return {
    action: "GENERAL_CHAT",
    parameters: {},
    response_text: `ได้ยินว่า "${text}" ค่ะ! สั่งเปิดเว็บ เลื่อนหน้าจอ สรุปบทความ หรือคุยเล่นกับแทนใจได้เลยนะคะ 🌸`,
    animation_state: "talking"
  };
}

/**
 * 6. Browser Action Router
 * ประมวลผล Action ที่สกัดได้จาก Gemini หรือ Local Intent
 */
async function executeBrowserAction(actionData, apiKey, affectionLevel, memory) {
  const { action, parameters } = actionData;
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = activeTab ? activeTab.id : null;

  // ก. OPEN_TAB
  if (action === "OPEN_TAB" && parameters?.url) {
    await chrome.tabs.create({ url: parameters.url });
  }

  // ข. SCROLL
  else if (action === "SCROLL" && tabId) {
    const amount = parameters?.amount || 600;
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (top) => window.scrollBy({ top, behavior: "smooth" }),
      args: [amount]
    });
  }

  // ค. SEARCH
  else if (action === "SEARCH" && parameters?.query) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(parameters.query)}`;
    await chrome.tabs.create({ url: searchUrl });
  }

  // ง. PLAY_MUSIC
  else if (action === "PLAY_MUSIC") {
    const query = parameters?.query || parameters?.song || "เพลงฟังสบาย";
    const musicUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    await chrome.tabs.create({ url: musicUrl });
  }

  // ฉ. EXPLAIN_TOPIC — ตอบความรู้สั้นๆ (Gemini สรุปไว้แล้วใน response_text ≤ 3 ประโยค)
  //    ไม่ต้องเปิดแท็บใหม่: ส่ง response_text กลับไปให้ content.js อ่านออกเสียงเป็น AI Assistant
  else if (action === "EXPLAIN_TOPIC") {
    if (!actionData.response_text || !actionData.response_text.trim()) {
      actionData.response_text = "แทนใจยังหาคำตอบไม่เจอในจังหวะนี้ค่ะ ลองถามใหม่อีกครั้งนะคะ 🌸";
    }
    if (!actionData.animation_state) actionData.animation_state = "talking";
    console.log(`[TanjAI Background] EXPLAIN_TOPIC: ${actionData.response_text.slice(0, 80)}...`);
  }

  // จ. SUMMARIZE_PAGE
  else if (action === "SUMMARIZE_PAGE" && tabId) {
    try {
      // ดึงเนื้อหาข้อความจากหน้าเว็บปัจจุบัน
      const [{ result: pageText }] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          return document.body ? document.body.innerText.slice(0, 3500) : "";
        }
      });

      if (apiKey && apiKey.trim().length > 10 && pageText && pageText.trim().length > 50) {
        const summarizePrompt = `ช่วยสรุปเนื้อหาสำคัญของหน้าเว็บนี้เป็น 3-4 ประเด็นหลักอย่างกระชับ สดใส และเข้าใจง่ายสไตล์น้องแทนใจค่ะ`;
        const summaryResult = await callGeminiBrain(apiKey, summarizePrompt, affectionLevel, memory, pageText);
        if (summaryResult?.response_text) {
          actionData.response_text = summaryResult.response_text;
          actionData.animation_state = "talking";
        }
      } else {
        const title = activeTab.title || "หน้านี้";
        actionData.response_text = `น้องแทนใจดูหน้า "${title}" แล้วนะคะ มีเนื้อหาหลักเกี่ยวกับการท่องเว็บและสาระน่าสนใจ ลองอ่านหัวข้อหลักดูได้เลยค่ะ! 📖✨`;
        actionData.animation_state = "talking";
      }
    } catch (e) {
      console.warn("[TanjAI Summarize Error]", e);
      actionData.response_text = "น้องแทนใจยังไม่สามารถเข้าถึงข้อความในหน้านี้ได้ในขณะนี้ค่ะ แต่พร้อมช่วยเหลือเรื่องอื่นเสมอนะคะ 🌸";
    }
  }

  return actionData;
}

/**
 * 7. Long-Term Memory Manager: บันทึกข้อเท็จจริงใหม่และการสนทนา
 */
function updateLongTermMemory(userCommand, botReply, newFact) {
  chrome.storage.local.get(["user_memory"], (res) => {
    const memory = res.user_memory || DEFAULT_MEMORY;

    // บันทึกประวัติการคุย (รักษาไว้ 8 รายการล่าสุด)
    if (!memory.history) memory.history = [];
    memory.history.push({ role: "user", text: userCommand, timestamp: Date.now() });
    memory.history.push({ role: "model", text: botReply, timestamp: Date.now() });
    if (memory.history.length > 8) {
      memory.history = memory.history.slice(-8);
    }

    // บันทึก Fact ใหม่หากตรวจพบ
    if (newFact && typeof newFact === "string" && newFact.trim().length > 3) {
      if (!memory.facts) memory.facts = [];
      if (!memory.facts.includes(newFact.trim())) {
        memory.facts.push(newFact.trim());
        if (memory.facts.length > 15) memory.facts.shift(); // เก็บไม่เกิน 15 facts
      }
    }

    chrome.storage.local.set({ user_memory: memory });
  });
}

/**
 * 8. Runtime Message Handler
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // ก. ประมวลผลคำสั่งเสียงหรือข้อความแชต
  if (request.action === "EXECUTE_VOICE_COMMAND") {
    (async () => {
      // 1. เพิ่มค่าสถิติและ Affection EXP
      const affectionData = await addAffectionPoints(15);

      chrome.storage.local.get(["totalCommands", "user_preferences", "user_memory"], async (storageData) => {
        const total = (storageData.totalCommands || 0) + 1;
        chrome.storage.local.set({ totalCommands: total });

        const prefs = storageData.user_preferences || DEFAULT_PREFERENCES;
        const memory = storageData.user_memory || DEFAULT_MEMORY;
        let structuredResult = null;

        // 2. เรียกใช้งานสมอง Gemini หรือ Local Intent Engine
        if (prefs.geminiApiKey && prefs.geminiApiKey.trim().length > 10) {
          try {
            structuredResult = await callGeminiBrain(
              prefs.geminiApiKey.trim(),
              request.command,
              affectionData.level,
              memory
            );
          } catch (geminiError) {
            console.warn("[TanjAI Background] Gemini API fallback:", geminiError);
            structuredResult = processLocalFallbackIntent(request.command);
          }
        } else {
          structuredResult = processLocalFallbackIntent(request.command);
        }

        // 3. รัน Browser Action Router
        structuredResult = await executeBrowserAction(
          structuredResult,
          prefs.geminiApiKey,
          affectionData.level,
          memory
        );

        // 4. บันทึกลงใน Long-term Memory
        updateLongTermMemory(request.command, structuredResult.response_text, structuredResult.new_fact_to_remember);

        // 5. ส่งผลลัพธ์กลับไปยัง Content Script
        sendResponse({
          success: true,
          action: structuredResult.action,
          reply: structuredResult.response_text,
          animation: structuredResult.animation_state,
          affection: affectionData
        });
      });
    })();
    return true; // Asynchronous reply
  }

  // ข. ดึงข้อมูลการตั้งค่า, สถิติ และ Memory
  if (request.action === "GET_STATS_AND_SETTINGS") {
    chrome.storage.local.get(
      ["user_preferences", "user_memory", "usageMinutes", "totalUsageMinutes", "continuousUsageMinutes", "totalCommands", "affection_level", "affection_exp", "userLevel", "unlockedCostumes", "unlockedDances"],
      (data) => {
        sendResponse({
          preferences: data.user_preferences || DEFAULT_PREFERENCES,
          memory: data.user_memory || DEFAULT_MEMORY,
          usageMinutes: data.usageMinutes || 0,
          totalUsageMinutes: data.totalUsageMinutes || 0,
          continuousUsageMinutes: data.continuousUsageMinutes || 0,
          totalCommands: data.totalCommands || 0,
          affection_level: data.affection_level || 1,
          affection_exp: data.affection_exp || 0,
          userLevel: data.userLevel || 1,
          unlockedCostumes: data.unlockedCostumes || ["default"],
          unlockedDances: data.unlockedDances || ["kpop_idol"]
        });
      }
    );
    return true;
  }

  // ค. บันทึกการตั้งค่า
  if (request.action === "SAVE_SETTINGS") {
    chrome.storage.local.set({ user_preferences: request.preferences }, () => {
      // อัปเดต Eye-Rest Alarm ทันทีเมื่อผู้ใช้เปลี่ยนการตั้งค่า
      if (request.preferences?.eyeRestInterval) {
        const intervalMin = parseInt(request.preferences.eyeRestInterval, 10) || 60;
        chrome.alarms.clear("tanjai-eye-rest-alarm", () => {
          chrome.alarms.create("tanjai-eye-rest-alarm", { periodInMinutes: intervalMin });
          console.log(`[TanjAI Background] Eye-rest alarm updated to ${intervalMin} minutes.`);
        });
      }

      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: "SETTINGS_UPDATED",
              preferences: request.preferences
            }).catch(() => {});
          }
        });
      });
      sendResponse({ success: true });
    });
    return true;
  }

  // ฉ. รีเซ็ต Continuous Usage Counter (เมื่อผู้ใช้กดพักสายตาเอง)
  if (request.action === "RESET_CONTINUOUS_USAGE") {
    chrome.storage.local.set({ continuousUsageMinutes: 0 }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  // ง. เปิดหน้า Welcome Onboarding สำหรับขอสิทธิ์ไมโครโฟน
  if (request.action === "OPEN_WELCOME_PAGE") {
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
    sendResponse({ success: true });
    return true;
  }
});
