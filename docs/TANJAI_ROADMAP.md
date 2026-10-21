# TanjAI — Roadmap

Milestone tracker for the extension + 3D pipeline. Checkboxes reflect
audit-verified status (2026-10-21).

## P0 — Foundations

- [x] **P01 · Blender Setup** — Completed.
  Blender workspace `C:\TanjAI-3D\` established with the Blender MCP bridge
  (`_mcp_bridge_start.py`, RPC runner `_tanjai_rpc.py`), production scene
  initialized, and preflight/inspection scripts in place.

- [x] **P02 · Reference Audit** — Completed.
  Character reference sheets (`references/notes/TanjAI_Character_Blueprint.md`,
  `TanjAI_Turnaround_Spec.md`) reviewed and translated into build parameters;
  turnaround/QA render harness built off the P0 scripts.

- [x] **P03 · Body Blockout** — Completed (tanjai_production_v1.blend verified).
  Production file `C:\TanjAI-3D\blender\tanjai_production_v1.blend`
  (272,472 bytes, last modified 2026-10-08) contains the verified body blockout;
  md5-confirmed unchanged by all subsequent inspection probes.

## P0.1 — Head & Hair Refinement (extension + 3D docs timeline)

- [x] P04–P08.x: face/eye detail passes, skin QA, rim/scarf passes, material A/B
  galleries under `_p08*_` output logs in the 3D workspace.
- [x] P09.1 Rebuild-A hair cap iterations (`_p091_*` diagnostic + rebuild logs),
  preview checkpoints ending at `tanjai_p091_rebuildA_v2_preview.blend`.

## P1 — Extension Core

- [x] MV3 skeleton: `manifest.json`, `background.js` service worker,
  `content.js` overlay, `overlay.css`, options/welcome pages.
- [x] Three.js scene: `MeshPhysicalMaterial` PBR, studio lighting, soft shadows,
  ACES tone mapping, procedural fallback avatar.
- [x] Gemini 1.5 Flash intent router (strict JSON: `intent` / `action` /
  `response_text`) with local offline fallback brain.
- [x] Web Speech: continuous th-TH STT with auto-restart, wake-word
  "แทนใจ/TanjAI", 30-second Active Window, interruptible TTS.
- [x] State aura engine (`updateTanjAIState`): subtitle box + Base Glow
  PointLight color per state; `pointer-events: none` subtitle styling.
- [x] Gamification: affection/usage levels, unlockable costumes & dances,
  health rest alarms.

## P2 — Hardening (open)

- [ ] STT restart-loop backoff/circuit breaker for persistent `network` errors.
- [ ] Per-site mic permission UX (welcome-page grant flag vs. site origins).
- [ ] `OPEN_TAB` URL scheme whitelist (http/https only).
- [ ] Gemini key via `x-goog-api-key` header instead of URL query param.
- [ ] Centralize model name + map quota/auth errors (429/403).

See `TANJAI_CHANGELOG.md` for dated entries.
