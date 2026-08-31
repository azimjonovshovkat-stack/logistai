"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Wallet, Bot, Users2 } from "lucide-react";
import clsx from "clsx";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { PendingDriverCard } from "@/components/admin/PendingDriverCard";
import { BalanceRefillPanel } from "@/components/admin/BalanceRefillPanel";
import { AIConfigPanel } from "@/components/admin/AIConfigPanel";
import { api } from "@/lib/api";
import type { PendingDriver } from "@/lib/types";

type Tab = "verification" | "balance" | "ai";

function AdminDashboardContent() {
  const [tab, setTab] = useState<Tab>("verification");
  const [pending, setPending] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPending();
  }, []);

  async function loadPending() {
    setLoading(true);
    try {
      const res = await api.get<PendingDriver[]>("/admin/drivers/pending");
      setPending(res);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(id: number, decision: "approved" | "rejected") {
    await api.post(`/admin/drivers/${id}/verify`, { decision });
    setPending((prev) => prev.filter((d) => d.id !== id));
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "verification", label: "Tasdiqlash", icon: ShieldCheck },
    { key: "balance", label: "Balans", icon: Wallet },
    { key: "ai", label: "AI Engine", icon: Bot },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Admin panel</h1>
            <p className="mt-1 text-sm text-slate-400">Platformani boshqarish</p>
          </div>

          <div className="mb-6 flex gap-2 rounded-2xl glass p-1.5">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={clsx(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  tab === t.key ? "bg-accent-500 text-white shadow-glow-blue" : "text-slate-400 hover:text-white"
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.key === "verification" && pending.length > 0 && (
                  <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1 text-xs font-bold">
                    {pending.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "verification" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-accent-400" />
                  <h2 className="text-lg font-bold text-white">Tasdiqlanishi kutilayotgan haydovchilar</h2>
                </div>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <Spinner />
                ) : pending.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Hozircha tasdiqlash uchun haydovchilar yo'q
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pending.map((driver) => (
                      <PendingDriverCard key={driver.id} driver={driver} onDecision={handleDecision} />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {tab === "balance" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">Balansni qo'lda to'ldirish</h2>
                </div>
              </CardHeader>
              <CardBody>
                <BalanceRefillPanel />
              </CardBody>
            </Card>
          )}

          {tab === "ai" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-accent-400" />
                  <h2 className="text-lg font-bold text-white">Failover AI Engine</h2>
                </div>
              </CardHeader>
              <CardBody>
                <AIConfigPanel />
              </CardBody>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allow={["admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
