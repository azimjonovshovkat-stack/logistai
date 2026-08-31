# LogistAI — Bepul hosting'ga deploy qilish yo'riqnomasi

Uch qism alohida joylashtiriladi: **Neon** (baza) → **Render** (backend) →
**Vercel** (frontend). Har birida "Siz qilasiz" va "Men yordam beraman"
qadamlari aniq ajratilgan.

---

## 0-qadam: Loyihani GitHub'ga yuklash

**Siz qilasiz:**
1. https://github.com/new saytida yangi **bo'sh** (README'siz) repository
   yarating, masalan `logistai`.
2. Yaratilgan repo manzilini (masalan `https://github.com/username/logistai.git`)
   menga yuboring.

**Men qilaman:** manzilni olgach, lokal repo'ni shu manzilga bog'lab, kodni
push qilaman (avval sizga nima push qilinishini ko'rsataman).

> Agar GitHub CLI (`gh`) o'rnatilgan va tizimga kirgan bo'lsangiz, buni ham
> o'zim orqali bajarishim mumkin — aytsangiz tekshirib ko'raman.

---

## 1-qadam: Baza — Neon (bepul PostgreSQL)

**Siz qilasiz:**
1. https://neon.tech → **Sign up** (GitHub orqali kirish eng tez yo'l).
2. **New Project** → nom bering (masalan `logistai`) → yarating.
3. Loyiha ochilgach, **Connection string**ni nusxalang — u shunday ko'rinadi:
   ```
   postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Shu qatorni menga yuboring (yoki keyingi qadamda to'g'ridan-to'g'ri
   Render'ga qo'ying — pastga qarang).

Backend kodi (`app/db/pool.py`) birinchi ishga tushganda jadvallarni
(`schema.sql`) va admin hisobini avtomatik yaratadi — qo'lda migratsiya
qilish shart emas.

---

## 2-qadam: Backend — Render

**Siz qilasiz:**
1. https://render.com → **Sign up** (GitHub orqali).
2. **New** → **Blueprint** → GitHub repo'ingizni tanlang (`logistai`).
   Render repo ildizidagi `render.yaml` faylini avtomatik topadi va
   `logistai-backend` xizmatini taklif qiladi.
3. **Apply**ni bosishdan oldin so'raladigan qiymatlarni kiriting:
   - `DATABASE_URL` → Neon'dan olgan connection string
   - `BOOTSTRAP_ADMIN_PASSWORD` → o'zingiz xohlagan kuchli parol
     (repo'dagi standart `admin12345`ni **ishlatmang**)
4. Deploy tugagach, Render sizga manzil beradi, masalan:
   `https://logistai-backend.onrender.com`. Shu manzilni saqlab qo'ying.
5. Tekshirish: brauzerda `https://logistai-backend.onrender.com/health`
   ochib, `{"status":"ok"}` chiqishini ko'ring.

> **Eslatma:** Render bepul tarifida xizmat 15 daqiqa foydalanilmasa
> "uxlaydi" — keyingi so'rov 30-50 soniya kutadi. Investor namoyishidan
> 5 daqiqa oldin shu manzilni ochib, "uyg'otib" qo'ying.

---

## 3-qadam: Frontend — Vercel

**Siz qilasiz:**
1. https://vercel.com → **Sign up** (GitHub orqali).
2. **Add New** → **Project** → `logistai` repo'ni import qiling.
3. **Configure Project** oynasida:
   - **Root Directory** → `frontend` ni tanlang (bu muhim — aks holda
     Vercel loyihani topa olmaydi).
   - **Environment Variables** bo'limiga qo'shing:
     - `NEXT_PUBLIC_API_URL` = 2-qadamda olingan Render manzili
       (masalan `https://logistai-backend.onrender.com`)
4. **Deploy**ni bosing. Bir necha daqiqada Vercel sizga ochiq manzil beradi,
   masalan: `https://logistai.vercel.app`.

---

## 4-qadam: CORS'ni yangilash (muhim!)

Backend hozircha faqat `http://localhost:3000`dan kelgan so'rovlarga ruxsat
beradi. Vercel manzilingiz tayyor bo'lgach:

**Siz qilasiz:**
1. Render dashboard → `logistai-backend` → **Environment**.
2. `ALLOWED_ORIGINS` qiymatini Vercel manzilingizga o'zgartiring:
   `https://logistai.vercel.app`
   (bir nechta manzil kerak bo'lsa, vergul bilan ajrating).
3. Saqlang — Render avtomatik qayta deploy qiladi (1-2 daqiqa).

Shundan keyin sayt to'liq ishga tushadi: `https://logistai.vercel.app`.

---

## 5-qadam (ixtiyoriy): Demo ma'lumotlarni to'ldirish

Investorlarga bo'sh sayt emas, **jonli** platformani ko'rsatish uchun:

1. Menga Neon connection string'ni bering (yoki `.env`ga qo'ying).
2. Men lokal `seed_demo_data.py` skriptini shu masofaviy bazaga qarshi
   ishga tushiraman — 17 haydovchi, 6 yuk beruvchi, ~24 buyurtma va sharh
   qo'shiladi (batafsil: `README.md` → "Demo ma'lumotlar" bo'limi).

---

## Xarajat va cheklovlar xulosasi

| Xizmat | Bepul limit | Asosiy xavf |
|---|---|---|
| Vercel | Amaliy jihatdan cheksiz (shaxsiy loyiha uchun) | Yo'q, ishonchli |
| Render (backend) | 750 soat/oy | 15 daqiqa uyqu rejimi (sovuq start) |
| Neon (baza) | 0.5 GB, avtomatik "uyg'onadi" | Juda katta ma'lumot uchun yetarli emas |

Bular hoziroq bepul, lekin har bir xizmatning aniq shartlari vaqt o'tishi
bilan o'zgarishi mumkin — ro'yxatdan o'tishda joriy shartlarni tekshiring.

**Rasm yuklash haqida**: haydovchi mashina/texpasport rasmlari hozir
serverning lokal diskida saqlanadi. Render bepul tarifida bu disk **doimiy
emas** — xizmat qayta ishga tushsa (masalan, yangi deploy qilinsa), oldin
yuklangan rasmlar yo'qoladi. Demo uchun muammo emas (sessiya davomida
saqlanadi), lekin uzoq muddatli foydalanish uchun Cloudinary yoki shunga
o'xshash bepul rasm xizmatiga o'tish tavsiya etiladi — xohlasangiz shu ham
qilib beraman.
