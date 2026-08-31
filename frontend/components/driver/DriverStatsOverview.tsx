"use client";

import { motion } from "framer-motion";
import { Package, Truck, CheckCircle2, Star } from "lucide-react";
import type { Order } from "@/lib/types";

function computeStats(orders: Order[]) {
  const total = orders.length;
  const active = orders.filter((o) => o.status === "accepted" || o.status === "in_transit").length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const completed = orders.filter((o) => o.status === "completed").length;
  return { total, active, pendingCount, completed };
}

export function DriverStatsOverview({ orders, rating }: { orders: Order[]; rating: number }) {
  const stats = computeStats(orders);

  const cards = [
    { key: "total", label: "Jami buyurtmalar", value: String(stats.total), icon: Package, tone: "text-accent-400 bg-accent-500/10 border-accent-500/20" },
    { key: "pending", label: "Yangi so'rovlar", value: String(stats.pendingCount), icon: Truck, tone: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { key: "completed", label: "Yakunlangan", value: String(stats.completed), icon: CheckCircle2, tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { key: "rating", label: "Reyting", value: rating ? rating.toFixed(1) : "—", icon: Star, tone: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="glass rounded-2xl p-4"
        >
          <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg border ${card.tone}`}>
            <card.icon className="h-4.5 w-4.5" />
          </div>
          <div className="text-2xl font-bold text-white">{card.value}</div>
          <div className="mt-0.5 text-xs text-slate-500">{card.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
