# TanjAI P04 — Animation Pipeline & GLB Export Specification

Goal: export the P03 body blockout (and its animated refinements) from
`C:\TanjAI-3D\blender\tanjai_production_v1.blend` into a `.glb` that
`content.js` loads from `assets/models/` (e.g. `assets/models/anime_twintails.glb`)
and animates with the existing Three.js engine.

## A. Rigging Requirements (Armature)

1. All deformable meshes (body, head, hair, costume) **must be parented to a single
   `Armature` object** with automatic weights — the blockout mesh shells (head/body)
   are joined or parented cleanly; no data-transfer modifiers at export time.
2. Bone naming must contain the rig landmarks `content.js` auto-detects:
   - a bone whose **name includes `head`** (or `neck`) becomes the head-tracking bone
     (mouse eye-contact + dance bob) — `Head` / `Head_Top` are safe;
   - keep the armature as the scene root child so `gltf.scene` needs no manual scaling;
   - author the model at TanjAI's framing height so `characterRoot.scale = 0.78`
     framing in `content.js` remains correct.
3. Animation actions exported as NLA tracks named `dance`, `idle`, `listen`, `talk`,
   `think`, `happy`, `blush` — `playAnimation()` falls back by these lowercase names
   (`animationsMap[clip.name.toLowerCase()]`).
4. Export check: bones ≤ 4 influences/vertex (Three.js default skinning limit).

## B. Facial Expressions — Shape Keys (Morph Targets)

Blendshapes must use names matching the emotion mapping in `content.js`
(`EMOTION_BLENDSHAPES`). Matching is normalized (lowercase, symbols stripped) and
**substring-based**, so any of the following ARKit/VRM-standard names work:

| `emotion_state` | Recommended ARKit/VRM-style shape keys |
|---|---|
| `happy` | `smile`, `mouthSmileLeft`, `mouthSmileRight`, `joy` (VRM), `fun` (VRM) |
| `empathetic` | `sad`, `sorrow` (VRM), `mouthFrown`, `browInnerUp`, `innerBrowRaise` |
| `teasing` | `smirk`, `smug`, `squintLeft`, `squintRight`, `smileLeft` |
| `thinking` | `browDownLeft`, `browDownRight`, `browFurrow`, `browQuizzical` |
| `blushing` | `blush` (optionally as material tint if not a shape key) |
| `idle` | (none — engine resets everything to neutral) |

Do **not** reuse the reserved keys for other engines — `blink`, `blinkLeft`,
`blinkRight`, `wink`, VRM vowels `a/i/u/e/o`, `mouthOpen`, `jawOpen` are owned by the
blink and lip-sync engines in `content.js` and are ignored by the emotion engine.
Name them exactly as above where possible: ideally use `blink`-style keys for the
auto-blink feature (the blink engine probes a long synonym list), and lip-sync
morphs (`a i u e o` / `viseme_aa …`) if the avatar should mouth words.

## C. Materials — MeshPhysicalMaterial compatibility

1. Clean up every mesh material before export: Principled BSDF in Blender maps
   1:1 onto Three.js PBR (`Base Color` → `color.map`, `Roughness`, `Metallic`,
   `Emission`), so author with Principled BSDF only — no toon/lambert-only setups.
2. Baking: bake all procedural textures (strokes, hair strands, AO) into PNG maps
   (`uv = Smart UV Project`); the engine upgrades materials at runtime via
   `upgradeGLBMaterials()` (adds sheen/clearcoat anime polish), so the GLB only
   needs clean base maps.
3. Resolution budget: 1024² per region (face, hair, body, costume) with shared
   atlases where possible; keep the GLB ≤ 5 MB.
4. Backface/double-sided faces only where needed (hair planes, wings) — the
   exporter's material `alpha blend` flags are respected by the loader.

## D. Export Command (Blender 4.x)

```
blender "C:/TanjAI-3D/blender/tanjai_production_v1.blend" --background \
  --python-expr "\
import bpy; bpy.ops.export_scene.gltf(\
filepath='C:/TanjAI-3D/blender/out/tanjai_p04.glb', \
export_format='GLB', export_apply=True, export_animations=True, \
export_image_format='AUTO', export_skinning_shapes=True, \
export_morph=True, export_skins=True)"
```

Then copy the GLB to `assets/models/<style>.glb` in the extension workspace
(`content.js` probes `anime_twintails.glb → anime_girl.glb → anime_girl_eyes.glb`
for the anime style, `realistic_tanjai.glb` for realistic).

## E. Acceptance Checklist (before commit into `assets/models/`)

- [ ] GLB opens in the three.js editor without warnings; ≤ 5 MB.
- [ ] Armature present; `head` bone auto-detected by the loader log line.
- [ ] ≥ 1 blendshape per emotion row in section B, names survive export
      (check `morphTargetDictionary` log output in the browser console).
- [ ] No Ph/displace-only materials; roughness in 0.05–0.8 range.
- [ ] Sphere-check in extension: switch to the style in Options, verify dance anims
      + mouse head-tracking + blink + one emotion per `EMOTION_BLENDSHAPES`.
