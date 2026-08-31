"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Zap,
  Ban,
  Truck,
  UserCheck,
  Wallet,
  Bot,
  MapPin,
  Star,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { VoiceSearchBar } from "@/components/VoiceSearchBar";
import { LiveMapWidget } from "@/components/LiveMapWidget";
import { Card, CardBody } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  function handleSearch(query: string) {
    if (!user) {
      router.push(`/register?role=shipper&q=${encodeURIComponent(query)}`);
      return;
    }
    if (user.role === "shipper") {
      router.push(`/shipper/dashboard?q=${encodeURIComponent(query)}`);
    } else {
      router.push(user.role === "driver" ? "/driver/dashboard" : "/admin/dashboard");
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-grid-glow" />
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-emerald-300"
          >
            <Bot className="h-3.5 w-3.5" />
            AI Failover Engine · GPT-4o &amp; DeepSeek bilan ishlaydi
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl"
          >
            Yukingiz uchun{" "}
            <span className="bg-gradient-to-r from-accent-400 via-accent-500 to-emerald-400 bg-clip-text text-transparent animate-gradient-x">
              mos haydovchini
            </span>{" "}
            3 soniyada toping
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg"
          >
            Gapiring yoki yozing — sun'iy intellekt so'rovingizni tahlil qiladi va
            ma'lumotlar bazasidagi haqiqiy, bo'sh haydovchilarni bir zumda topib beradi.
            Hech qanday o'ylab topilgan mashina yo'q — faqat tasdiqlangan haydovchilar.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-10 max-w-2xl"
          >
            <VoiceSearchBar onSubmit={handleSearch} />
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500"
          >
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-emerald-400" /> Maksimal 3 soniya javob
            </span>
            <span className="flex items-center gap-1.5">
              <Ban className="h-3.5 w-3.5 text-danger-400" /> Zero Hallucination
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-400" /> JWT + HTTPS xavfsizlik
            </span>
          </motion.div>
        </div>
      </section>

      {/* LIVE MAP */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <LiveMapWidget />
        </motion.div>
      </section>

      {/* WORKFLOW */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">LogistAI qanday ishlaydi</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            4 bosqichli avtomatlashtirilgan sikl — kiritishdan yakuniy reytinggacha
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Bot,
              step: "1",
              title: "So'rov va tahlil",
              desc: "Yuk egasi yozadi yoki gapiradi — AI matndan yo'nalish, tonna va yuk turini ajratib oladi.",
              tone: "accent",
            },
            {
              icon: MapPin,
              step: "2",
              title: "Bazadan saralash",
              desc: "Faqat 'bo'sh' statusdagi, mos yo'nalish va sig'imga ega haqiqiy haydovchilar tanlanadi.",
              tone: "emerald",
            },
            {
              icon: UserCheck,
              step: "3",
              title: "Aloqa va band qilish",
              desc: "Yuk egasi bog'lanadi, haydovchi 'Buyurtmani oldim' tugmasini bosadi — status avtomatik 'band'ga o'tadi.",
              tone: "accent",
            },
            {
              icon: Star,
              step: "4",
              title: "Yakunlash va reyting",
              desc: "'Yetkazib berdim' bosilgach, yuk egasi 1-5 yulduzli baho qoldiradi.",
              tone: "emerald",
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Card className="h-full">
                <CardBody>
                  <div
                    className={clsxTone(item.tone)}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="mb-1 text-xs font-bold text-slate-500">BOSQICH {item.step}</div>
                  <h3 className="mb-2 text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{item.desc}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MODULES */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Uch xil kabinet, bitta platforma</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <ModuleCard
            icon={Truck}
            tone="emerald"
            title="Haydovchi kabineti"
            items={[
              "Bo'shman / Yo'ldaman / Dam olish — bitta bosishda status",
              "Shahar autocomplete bilan yo'nalish kiritish",
              "Buyurtmalar tarixi va olingan reytinglar",
            ]}
            href="/register?role=driver"
            cta="Haydovchi sifatida qo'shilish"
          />
          <ModuleCard
            icon={Wallet}
            tone="accent"
            title="Yuk egasi kabineti"
            items={[
              "Ovozli yoki matnli AI qidiruv",
              "3 soniya ichida mos haydovchilar",
              "Obuna orqali to'liq kontaktlarni ochish",
            ]}
            href="/register?role=shipper"
            cta="Yuk beruvchi sifatida qo'shilish"
          />
          <ModuleCard
            icon={ShieldCheck}
            tone="accent"
            title="Admin panel"
            items={[
              "Haydovchilarni bir bosishda tasdiqlash",
              "Balansni qo'lda to'ldirish",
              "OpenAI/DeepSeek failover boshqaruvi",
            ]}
            href="/login"
            cta="Admin sifatida kirish"
          />
        </div>
      </section>

      <footer className="border-t border-white/5 py-10 text-center text-sm text-slate-500">
        <p>
          Logist<span className="text-accent-500 font-semibold">AI</span> &copy;{" "}
          {new Date().getFullYear()} — O'zbekiston bo'ylab AI-powered logistika platformasi
        </p>
      </footer>
    </div>
  );
}

function clsxTone(tone: string) {
  const base =
    "mb-4 flex h-10 w-10 items-center justify-center rounded-xl border";
  if (tone === "emerald") return `${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-400`;
  return `${base} border-accent-500/30 bg-accent-500/10 text-accent-400`;
}

function ModuleCard({
  icon: Icon,
  tone,
  title,
  items,
  href,
  cta,
}: {
  icon: any;
  tone: "emerald" | "accent";
  title: string;
  items: string[];
  href: string;
  cta: string;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardBody className="flex flex-1 flex-col">
        <div className={clsxTone(tone)}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mb-4 text-xl font-bold text-white">{title}</h3>
        <ul className="mb-6 flex-1 space-y-2.5">
          {items.map((it) => (
            <li key={it} className="flex items-start gap-2 text-sm text-slate-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
              {it}
            </li>
          ))}
        </ul>
        <a
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-400 hover:text-accent-300"
        >
          {cta} <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </CardBody>
    </Card>
  );
}
