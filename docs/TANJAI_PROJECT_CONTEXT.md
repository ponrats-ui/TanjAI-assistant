# TanjAI — Project Context

> **TanjAI (น้องแทนใจ)** — A 3D Virtual AI Companion for Desktop
> Chrome Extension (Manifest V3, Three.js, Gemini 1.5 Flash, Web Speech API)

## Overview

TanjAI is a voice-driven, gamified AI girl companion that lives in the browser as a
fixed overlay (bottom-right). She combines a realtime 3D avatar, Thai voice
commanding, browser automation, and a spooky-smart intent router in one package.

## Tech Stack

| Layer | Technology |
|---|---|
| Extension | Chrome Manifest V3 (service worker `background.js`, content script `content.js`, `overlay.css`, `options.html/js`, `welcome.html/js`) |
| 3D | Three.js (WebGL), GLTFLoader, Canvas-generated anime eye textures, PCFSoft shadows, ACES Filmic tone mapping |
| Materials | `MeshPhysicalMaterial` PBR (sheen/clearcoat, SSS-approx transmission for the `realistic` style) |
| AI Brain | Google Gemini 1.5 Flash (`generateContent`, `responseMimeType: application/json`) + offline local intent fallback |
| Voice | Web Speech API — `webkitSpeechRecognition` (th-TH, continuous) + `speechSynthesis` TTS (th-TH, interruptible) |
| Lighting/Aura | State-driven Base Glow `PointLight`: listening = cyan `0x00e5ff`, thinking = orange `0xffaa00`, speaking = pink `0xff7ab8`, browsing = green `0x00ff88`, idle = per-character preset |

## Core Features

1. **Wake-word "แทนใจ / TanjAI"** with an Always-On Standby listener (continuous STT
   auto-restart) and a **30-second Active Window** — after the wake word, follow-up
   commands are accepted without repeating the name; the window timer is cleared and
   reset on every new command.
2. **Interruptible TTS** — saying "หยุด / พอแล้ว / เงียบ" while TanjAI speaks cancels
   `speechSynthesis` instantly (echo-guarded, ≤15-char utterances only).
3. **Smart Intent Router (Gemini)** — every utterance is classified into
   `CHAT` | `BROWSER_CONTROL` | `WEB_SEARCH` | `EXPLAIN_TOPIC` and returned as strict
   JSON (`intent`, `action`, `response_text`, `parameters`, `animation_state`,
   `new_fact_to_remember`).
4. **Browser control actions** — OPEN_TAB, CLOSE_TAB, SCROLL, SEARCH, PLAY_MUSIC,
   SUMMARIZE_PAGE (page text → Gemini summary with a graceful offline fallback).
5. **3D avatar system** — 4 styles (`orange_mascot`, `anime_girl`/twintails,
   `cyber_redhair`, `realistic`) with procedural fallback if GLB assets are missing,
   mouse head-tracking/eye contact, blinking, lip-sync morphs, and full GPU dispose on
   style switches.
6. **Gamification** — Affection Level (❤️, EXP = level×100), Usage Level (⭐, 600
   min/level) unlocking costumes & dance styles; health/eye-rest alarms.
7. **Live Subtitle** — `.tanjai-subtitle` box under the character mirrors the current
   state with `pointer-events: none` so the host page stays clickable.

## Related Workspaces

- **Extension code (this repo):** `manifest.json`, `content.js`, `background.js`,
  `overlay.css`, `options.*`, `welcome.*`, `assets/` (three.min.js, GLTFLoader.js,
  icons, models/).
- **3D asset pipeline:** `C:\TanjAI-3D\` — Blender production file
  `blender/tanjai_production_v1.blend` (P03 body blockout, verified 272 KB),
  reference notes in `references/notes/TanjAI_Character_Blueprint.md` and
  `TanjAI_Turnaround_Spec.md`.
