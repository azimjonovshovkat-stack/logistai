# LogistAI

AI-powered logistika marketplace — O'zbekiston bo'ylab yuk beruvchilar (shipper) va
haydovchilarni sun'iy intellekt yordamida bir zumda bog'laydigan platforma.

Texnik topshiriqqa muvofiq qurilgan: Next.js 14 (App Router) + Tailwind CSS +
Framer Motion frontend, Python FastAPI + asyncpg backend, PostgreSQL baza,
Dark Mode Glassmorphism dizayn tizimi, ovozli/matnli AI qidiruv va
OpenAI/DeepSeek failover engine.

> **Bepul hosting'ga (Vercel + Render + Neon) deploy qilmoqchimisiz?**
> To'liq qadam-baqadam yo'riqnoma: [`DEPLOYMENT.md`](./DEPLOYMENT.md)

## Tezkor ishga tushirish (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000 (Swagger: http://localhost:8000/docs)
- Postgres: localhost:5432

Birinchi ishga tushishda backend avtomatik ravishda `schema.sql`ni ishga
tushiradi va bitta admin hisobini yaratadi:

- Telefon: `+998900000000`
- Parol: `admin12345`

**Production'ga chiqarishdan oldin albatta shu parolni almashtiring** (admin
panelidan boshqa admin yaratish funksiyasi yo'q — hozircha bevosita bazada
yangilang yoki `.env`dagi `BOOTSTRAP_ADMIN_*` qiymatlarini o'zgartirib qayta
deploy qiling).

## Demo ma'lumotlar (investor/stakeholder namoyishi uchun)

Bo'sh baza bilan platforma "jonsiz" ko'rinadi (0 haydovchi, 0 buyurtma). Buni
tuzatish uchun realistik demo-ma'lumotlarni bir buyruq bilan to'ldiring:

```bash
cd backend
.venv/Scripts/python.exe scripts/seed_demo_data.py   # Windows
# yoki: .venv/bin/python scripts/seed_demo_data.py   # macOS/Linux
```

Bu skript qo'shadi:
- 17 ta tasdiqlangan haydovchi, O'zbekistonning turli shaharlariga tarqalgan
  (jonli xarita widgeti to'lib ko'rinishi uchun), 3 ta esa admin tasdiqlashi
  uchun **kutilayotgan** holatda qoldiriladi.
- 6 ta yuk beruvchi, ikkitasida faol obuna (to'liq kontakt bilan qidiruvni
  ko'rsatish uchun).
- ~24 ta buyurtma — aksariyati real izohlar va 4-5 yulduzli baholar bilan
  yakunlangan (har bir haydovchi profilida kamida 2 ta sharh bo'ladi), bir
  nechtasi esa "kutilmoqda/qabul qilingan" holatda (ish jarayonini
  ko'rsatish uchun).

Barcha demo hisoblar paroli: **`demo12345`** (masalan, `+998900100101` —
Bekzod Yusupov, haydovchi; `+998900100301` — Kamronbek Yusupov, faol obunali
yuk beruvchi). Skript xavfsiz qayta ishga tushiriladi — foydalanuvchilarni
yangilaydi, buyurtmalar jadvalini esa har safar yangi tasodifiy to'plam bilan
qayta yaratadi (chunki bu jadval faqat demo-maqsadlar uchun).

**Investor namoyishidan oldin tekshiring:**
1. AI qidiruv hozircha kalit-so'z fallback orqali ishlaydi (tez va bepul, lekin
   haqiqiy GPT-4o/DeepSeek javobi emas). Chinakam AI javobini ko'rsatish uchun
   admin panel → AI Engine bo'limidan OpenAI yoki DeepSeek API kalitini
   qo'shing.
2. Bootstrap admin parolini production/demo muhitida almashtiring.
3. Agar jamoat oldida (jonli internetda) ko'rsatmoqchi bo'lsangiz, loyihani
   `docker compose up --build` bilan biror hosting'ga (Railway va h.k.) deploy
   qiling — hozirgi holatda faqat local muhitda ishlaydi.

## Qo'lda ishga tushirish

### Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows
# yoki: source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp .env.example .env          # va DATABASE_URL ni to'g'rilang
uvicorn app.main:app --reload
```

Postgres mahalliy ishlashi kerak (yoki Railway/Neon kabi xizmatdan
`DATABASE_URL` oling).

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Arxitektura

```
backend/
  app/
    core/       - config, JWT/bcrypt xavfsizlik, auth dependencylar
    db/         - PostgreSQL schema.sql va connection pool
    schemas/    - Pydantic V2 request/response modellari
    api/v1/     - auth, drivers, shippers, admin, public, uploads routerlari
    services/   - AI failover engine, DB matching, shaharlar ro'yxati
frontend/
  app/          - Next.js App Router sahifalari (landing, login, register,
                  driver/shipper/admin dashboardlar)
  components/   - qayta ishlatiladigan UI va domen komponentlari
  lib/          - API client, auth context, tiplar, shahar koordinatalari
```

### AI qidiruv va Zero Hallucination

`services/ai_engine.py` — OpenAI/DeepSeek'ga so'rov yuboradi, lekin **faqat**
foydalanuvchi matnini `{origin, destination, min_capacity_tons, cargo_type}`
strukturaga o'giradi. Haydovchilar ro'yxatini AI hech qachon o'zi yaratmaydi —
`services/matching.py` doim haqiqiy SQL so'rov orqali `driver_daily_status`
jadvalidan qidiradi. Shu tufayli AI mavjud bo'lmagan mashinani "o'ylab
topa olmaydi": u yoki bazadagi haqiqiy natijani qaytaradi, yoki aniq rad
javobi beriladi.

Agar barcha AI providerlar ishlamasa (limit tugagan, tarmoq xatosi va h.k.),
tizim avtomatik ravishda kalit-so'z asosidagi deterministik parserga
(`_fallback_parse`) o'tadi — bu ham faqat ma'lum shaharlar ro'yxatidan
foydalanadi, hech narsani o'ylab topmaydi. 3 soniyalik AI timeout +
fallback shu tarzda "maksimal 3 soniya javob" talabini kafolatlaydi.

### Failover AI Engine

`ai_configs` jadvalida bir nechta provider kaliti saqlanadi (`priority`
bo'yicha tartiblangan). Har bir so'rovda tizim eng past `priority`dagi faol
kalitdan boshlaydi; xato bo'lsa (`timeout`, `http_429` va h.k.) shu kalitga
`last_error` yozadi va navbatdagi kalitga o'tadi — bu **haqiqiy runtime
failover**, admin panelidan (AI Engine bo'limi) to'liq boshqariladi.

## Texnik topshiriqdan tashqari qo'shilgan qismlar

Hujjatda tasvirlangan funksiyalarni ishlaydigan holga keltirish uchun bir
nechta jadval/maydon qo'shildi (bazaviy 5 ta jadval o'zgarishsiz qoldi):

- **`cargo_orders`** — "Buyurtmalar tarixi" va reyting oqimi (BOSQICH 3-4)
  uchun zarur bo'lgan buyurtma/band qilish jadvali.
- **`balance_transactions`** — admin balans to'ldirishlari uchun audit trail.
- **`driver_profiles.license_photo_url`** — admin tasdiqlash oynasida
  ko'rsatiladigan texpasport rasmi.
- **`ai_configs.priority` / `label` / `last_error` / `last_used_at`** —
  failover tartibi va kuzatuv uchun.
- **Obuna to'lovi** — "Obunasi faol bo'lgan yuk egasiga... ko'rsatiladi"
  talabini ishlatish uchun ichki balansdan obuna sotib olish oqimi
  qo'shildi (`subscription_price_monthly`, standart 300 000 so'm/oy —
  `backend/app/core/config.py`da o'zgartirilishi mumkin). Obunasi yo'q
  shipper qidiruv natijalarini ko'radi, lekin haydovchi telefon raqami
  qisman yashiriladi.
- **`/public/live-map`** — bosh sahifadagi jonli tarmoq widgeti uchun,
  bugungi 'bo'sh' statusdagi haydovchilarni shahar bo'yicha guruhlaydigan
  ochiq (auth talab qilmaydigan) endpoint. Xarita — GPS emas, shahar
  markazlari taxminiy koordinatalari asosida qurilgan stilizatsiya
  qilingan vizualizatsiya.

## Xavfsizlik

- Parollar `bcrypt` bilan xeshlanadi, hech qachon oddiy matnda saqlanmaydi.
- JWT (HS256) autentifikatsiya, rol asosidagi ruxsat tekshiruvi
  (`require_role`, `require_approved`).
- Barcha SQL so'rovlar `asyncpg`ning parametrlangan so'rovlari orqali
  bajariladi (`$1, $2, ...`) — SQL-injection imkonsiz.
- HTTPS — deploy darajasida (Railway/reverse proxy) ta'minlanadi.

## Bilingan cheklovlar

- Bu muhitda Docker/PostgreSQL ishga tushirilmagani sababli to'liq
  end-to-end (haqiqiy baza bilan) sinov o'tkazilmadi. Tekshirilgan
  qismlar: barcha Python fayllar sintaksisi va FastAPI ilovasi muvaffaqiyatli
  import qilinishi (30 ta route to'g'ri ro'yxatdan o'tdi), frontend esa
  to'liq `tsc --noEmit` va `next build` orqali xatosiz o'tdi.
- Ovozli qidiruv brauzerning `SpeechRecognition` API'siga tayanadi (Chrome'da
  ishlaydi, Firefox/Safari'da qo'llab-quvvatlanmasligi mumkin — bunday holda
  mikrofon tugmasi ko'rsatilmaydi, matnli qidiruv doim ishlaydi).
- Rasm yuklash serverning `uploads/` papkasida saqlanadi (Railway-da
  persistent volume kerak); katta miqyosda S3/Cloudinary'ga o'tish tavsiya
  etiladi.
