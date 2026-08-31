"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Crown, Sparkles, ChevronDown, Receipt, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { Subscription, Transaction } from "@/lib/types";

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRing({ fraction }: { fraction: number }) {
  const offset = CIRCUMFERENCE * (1 - fraction);
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
      <circle cx="28" cy="28" r={RADIUS} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="5" />
      <motion.circle
        cx="28"
        cy="28"
        r={RADIUS}
        fill="none"
        stroke="#10B981"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        initial={{ strokeDashoffset: CIRCUMFERENCE }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}

export function SubscriptionWidget({
  subscription,
  onPurchase,
  purchasing,
}: {
  subscription: Subscription | null;
  onPurchase: () => void;
  purchasing: boolean;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function toggleHistory() {
    const next = !showHistory;
    setShowHistory(next);
    if (next && transactions === null) {
      setLoadingHistory(true);
      try {
        const res = await api.get<Transaction[]>("/shippers/transactions");
        setTransactions(res);
      } finally {
        setLoadingHistory(false);
      }
    }
  }

  if (!subscription) return null;

  const fraction = subscription.is_active
    ? Math.min(1, Math.max(0, subscription.days_remaining / subscription.duration_days))
    : 0;

  return (
    <div className="glass overflow-hidden rounded-2xl border border-white/5">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          {subscription.is_active ? (
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <ProgressRing fraction={fraction} />
              <Crown className="absolute h-5 w-5 text-emerald-400" />
            </div>
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="font-semibold text-white">
              {subscription.is_active ? "Obuna faol" : "Obuna faol emas"}
            </p>
            {subscription.is_active ? (
              <p className="flex items-center gap-1 text-sm text-slate-400">
                <CalendarClock className="h-3.5 w-3.5" />
                {subscription.days_remaining} kun qoldi
                {subscription.end_date && (
                  <span className="text-slate-600">
                    · {new Date(subscription.end_date).toLocaleDateString("uz-UZ")} gacha
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                Haydovchilar raqamini ko'rish uchun faollashtiring —{" "}
                {subscription.price_monthly.toLocaleString("uz-UZ")} so'm / {subscription.duration_days} kun
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleHistory}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
          >
            <Receipt className="h-3.5 w-3.5" />
            Tarix
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>
          <Button
            variant={subscription.is_active ? "outline" : "emerald"}
            size="sm"
            onClick={onPurchase}
            loading={purchasing}
          >
            {subscription.is_active ? "Uzaytirish" : "Faollashtirish"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-white/5"
          >
            <div className="scrollbar-thin max-h-56 overflow-y-auto p-4">
              {loadingHistory ? (
                <p className="py-4 text-center text-xs text-slate-500">Yuklanmoqda...</p>
              ) : !transactions || transactions.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">Tranzaksiyalar tarixi bo'sh</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            tx.type === "refill" ? "bg-emerald-500/10 text-emerald-400" : "bg-danger-500/10 text-danger-400"
                          }`}
                        >
                          {tx.type === "refill" ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        </span>
                        <div>
                          <p className="text-slate-200">{tx.note || (tx.type === "refill" ? "Balans to'ldirildi" : "Yechildi")}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(tx.created_at).toLocaleString("uz-UZ")}
                          </p>
                        </div>
                      </div>
                      <span className={tx.type === "refill" ? "text-emerald-400" : "text-danger-400"}>
                        {tx.type === "refill" ? "+" : "-"}
                        {tx.amount.toLocaleString("uz-UZ")} so'm
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
