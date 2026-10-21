# TanjAI — Changelog

All notable changes to the TanjAI extension and 3D pipeline.
Format: [date] — summary.

---

## [2026-10-21] — System Audit + Documentation Init

### Documentation
- **Added `docs/` project tracker** (this directory):
  `TANJAI_PROJECT_CONTEXT.md` (tech stack + feature summary),
  `TANJAI_ROADMAP.md` (milestone checklist — P01 Blender Setup **Completed**,
  P02 Reference Audit **Completed**, P03 Body Blockout
  **Completed (`tanjai_production_v1.blend` verified, 272 KB)**),
  and this changelog.

### Audit (read-only, no code changes required)
- Ran a comprehensive system audit across the extension. All J.A.R.V.I.S-style
  core features were confirmed already implemented and verified in code:
  - `overlay.css` `.tanjai-subtitle`: bottom-anchored transparent-black
    (`rgba(0,0,0,.6)`) box, white text, explicit `pointer-events: none`
    (overlay.css:565); root `#tanjai-root` also non-blocking with `auto`
    restored only on interactive children.
  - `content.js` `updateTanjAIState(state, message)` updates `.tanjai-subtitle`
    text/border class and drives the Base Glow `PointLight`
    (`STATE_AURA_COLORS`): listening `0x00e5ff`, thinking `0xffaa00`,
    speaking `0xff7ab8`, browsing `0x00ff88`, idle → character preset.
  - 30-Second Active Window: `ACTIVE_WINDOW_MS = 30000`; wake-word detection
    opens the window, every heard command clears and re-arms the timer
    (`resetActiveWindowTimer`), timeout closes it back to Standby.
  - `background.js` Gemini system prompt strictly returns JSON only
    (`intent` = CHAT | BROWSER_CONTROL | WEB_SEARCH | EXPLAIN_TOPIC,
    `action`, `response_text`) enforced by `responseMimeType: application/json`,
    a no-markdown rule, and the defensive `parseGeminiJsonObject()` fence/brace
    stripper, with `processLocalFallbackIntent()` as the offline brain.
- Verified infrastructure: 4 core files present and MV3-valid;
  `tanjai_production_v1.blend` exists (P03); **no API keys hardcoded** in any
  client-side file.

### Key findings carried to the open roadmap (P2)
- STT restart loop lacks backoff; per-site mic permission mismatch;
  `OPEN_TAB` scheme whitelist; Gemini key in URL query;
  legacy `gemini-1.5-flash` name hardcoded in two places.

---

## [Initial] — Base Extension Setup + 3D Blockout  (pre-tracker milestones)

### Extension v1.0.0 — successful base setup
- **MV3 skeleton shipped:** `background.js` service worker (usage/affection
  alarms, gamification engine, memory manager, message router),
  `content.js` Three.js overlay + Web Speech engines, `overlay.css`,
  `options.html/js` settings + `welcome.html/js` mic onboarding.
- **AI brain wired:** Gemini 1.5 Flash `generateContent` with JSON-only system
  instruction; intent router executes CHAT / BROWSER_CONTROL / WEB_SEARCH /
  EXPLAIN_TOPIC; browser actions OPEN_TAB, CLOSE_TAB, SCROLL, SEARCH,
  PLAY_MUSIC, SUMMARIZE_PAGE; offline local intent fallback when no key or network failure.
- **Voice stack:** continuous th-TH STT (auto-restart), wake-word mode,
  30-second Active Window, interruptible TTS with echo guards.
- **3D avatar:** Three.js scene with `MeshPhysicalMaterial` PBR upgrade path,
  studio lighting (ACES + PCFSoft), procedural fallback model, mouse
  head-tracking, blinking, lip-sync, beat-sync dance engine, GPU dispose on
  style switch, tab-visibility render gating.
- **Security posture:** Gemini key user-supplied (password field in options),
  stored only in `chrome.storage.local`, never hardcoded client-side.

### 3D Pipeline — blockout creation (P0–P03)
- **P01 · Blender Setup** — established `C:\TanjAI-3D\` workspace, Blender MCP
  bridge on port 9876 (`_mcp_bridge_start.py`), RPC code-execution harness
  (`_tanjai_rpc.py`), preflight inspection of the production scene.
- **P02 · Reference Audit** — audited `TanjAI_Character_Blueprint.md` /
  `TanjAI_Turnaround_Spec.md` (proportions, eye placement, turnaround targets)
  and derived numeric build parameters used by the P0.x edit scripts.
- **P03 · Body Blockout** — built and saved
  `C:\TanjAI-3D\blender\tanjai_production_v1.blend`
  (272,472 bytes, 2026-10-08); verified read-only afterward (md5 identity
  across inspection probes). Head/hair refinement iterations continued under
  P0.1 checkpoints (`tanjai_p091_rebuildA_v2_preview.blend`).
