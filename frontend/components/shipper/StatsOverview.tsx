"use client";

import { motion } from "framer-motion";
import { Package, Clock, CheckCircle2, Star } from "lucide-react";
import type { Order } from "@/lib/types";

function computeStats(orders: Order[]) {
  const total = orders.length;
  const active = orders.filter((o) => o.status === "pending" || o.status === "accepted" || o.status === "in_transit").length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const rated = orders.filter((o) => o.rating !== null);
  const avgRating = rated.length
    ? rated.reduce((sum, o) => sum + (o.rating ?? 0), 0) / rated.length
    : null;
  return { total, active, completed, avgRating };
}

const CARDS = [
  { key: "total", label: "Jami buyurtmalar", icon: Package, tone: "text-accent-400 bg-accent-500/10 border-accent-500/20" },
  { key: "active", label: "Faol buyurtmalar", icon: Clock, tone: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { key: "completed", label: "Yakunlangan", icon: CheckCircle2, tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { key: "avgRating", label: "O'rtacha bahoyingiz", icon: Star, tone: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
] as const;

export function StatsOverview({ orders }: { orders: Order[] }) {
  const stats = computeStats(orders);
  const values: Record<string, string> = {
    total: String(stats.total),
    active: String(stats.active),
    completed: String(stats.completed),
    avgRating: stats.avgRating !== null ? stats.avgRating.toFixed(1) : "—",
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map((card, i) => (
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
          <div className="text-2xl font-bold text-white">{values[card.key]}</div>
          <div className="mt-0.5 text-xs text-slate-500">{card.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
