# 📚 TanjAI — Reference Assets

โฟลเดอร์นี้เก็บ**ภาพ/วิดีโออ้างอิงดีไซน์**ของโปรเจกต์ TanjAI (น้องแทนใจ) — ใช้เป็น
design bible สำหรับการสร้างโมเดล 3D (`.glb`), UI/UX, และสื่อประชาสัมพันธ์ทั้งหมด

---

## ไฟล์อ้างอิง

| ไฟล์ | ใช้อ้างอิงอะไร |
|---|---|
| **TanjAI_Infographic.png** | ภาพรวมทั้งโปรเจกต์: ระบบ 3-Avatar (Orange Mascot / Anime Twin-Tails / Cyber Redhair), โหมด Chrome Extension + Mobile Hologram, Core AI Features & Gamification — **เอกสารสรุปหลักของทีม** |
| **TanjAI_Original.png** | ต้นแบบน้องส้ม (Orange Mascot) — โมเดล 3D คลายสไตล์: ผิวส้มกลม, ตาโตเงาะ, กระโปรงใบไม้เขียว, ดอกไม้ขาวบนใบ — อ้างอิงสี/สัดส่วนของสไตล์ `orange_mascot` |
| **TanjAI_Anime.jpg** | อ้างอิงสไตล์อนิเมะทวินเทล (`anime_girl`): สัดส่วนตาโต, แปลนผมทวินเทล, โทนสีฟ้า-ขาว, ชุดกระโปรงสั้น — ใช้กำหนดท่ายืน/บุคลิกตัวละครหลัก |
| **TanjAI_3D.jpg** | อ้างอิงการเรนเดอร์ 3D ครึ่งตัวบนเวที: แสงเวที (Rim Light ชมพู-ฟ้า), วัสดุชุดเงาฟุ้ง, รองเท้าผ้าใบ — ใช้กำหนดโทนแสง Studio/Cinematic ของซีน Three.js |
| **TanjAI_MobileVersion.jpg** | อ้างอิงงานสไตล์ Razer Project AVA (แท่นโฮโลแกรม) — แนวทาง Mobile Hologram Mode: ฐานเรืองแสง, ตัวละครลอยในแก้ว, แสง LED รอบฐาน |
| **TanjAI_openDance.mp4** | วิดีโอท่าเต้นอ้างอิง (24 MB) — จังหวะ/ท่าสำหรับ Animation ระบบ Beat-Sync Dance ของน้องแทนใจ |

---

## การใช้งานในโค้ด

สไตล์อวตารทั้งสามถูกกำหนดไว้ใน [content.js](../content.js) ที่ `LIGHT_PRESETS`:

| สไตล์ | ไฟล์ GLB เป้าหมาย | Preset แสง |
|---|---|---|
| `orange_mascot` | `assets/models/orange_mascot.glb` | Golden Sunset |
| `anime_girl` *(ค่าเริ่มต้น)* | `assets/models/anime_twintails.glb` | Sakura Neon |
| `cyber_redhair` | `assets/models/cyber_redhair.glb` | Neon Arcade |
| `realistic` | `assets/models/realistic_tanjai.glb` | Cinematic Portrait |

## หมายเหตุ

- ไฟล์ในโฟลเดอร์นี้เป็น**สื่ออ้างอิงเท่านั้น** — ไม่ถูกโหลดโดยตัว extension
  (ตัว extension ใช้ไฟล์จาก `assets/models/` ตามตารางด้านบน)
- `TanjAI_openDance.mp4` มีขนาด ~24 MB หาก repo เริ่มหนัก พิจารณาย้ายไป
  Git LFS หรือ release attachments แทน
