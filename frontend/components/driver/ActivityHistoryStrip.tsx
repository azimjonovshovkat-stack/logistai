"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import type { DailyStatus } from "@/lib/types";

const WEEKDAYS = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

const STATUS_COLOR: Record<string, string> = {
  available: "bg-emerald-500",
  busy: "bg-danger-500",
  day_off: "bg-amber-500",
};

function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function ActivityHistoryStrip() {
  const [history, setHistory] = useState<DailyStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DailyStatus[]>("/drivers/status/history?days=7")
      .then(setHistory)
      .finally(() => setLoading(false));
  }, []);

  const days = lastNDays(7);
  const byDate = new Map(history.map((h) => [h.date, h]));

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <CalendarDays className="h-3.5 w-3.5" />
        So'nggi 7 kunlik faollik
      </div>
      <div className="flex justify-between gap-1.5">
        {days.map((dateStr, i) => {
          const entry = byDate.get(dateStr);
          const date = new Date(dateStr);
          const isToday = i === days.length - 1;
          return (
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex flex-1 flex-col items-center gap-1.5"
              title={
                entry
                  ? `${date.toLocaleDateString("uz-UZ")} — ${entry.current_location} → ${entry.destination_location}`
                  : `${date.toLocaleDateString("uz-UZ")} — ma'lumot yo'q`
              }
            >
              <span className="text-[10px] text-slate-500">{WEEKDAYS[date.getDay()]}</span>
              <div
                className={`h-8 w-full rounded-lg ${
                  loading
                    ? "animate-pulse bg-white/5"
                    : entry
                      ? STATUS_COLOR[entry.status]
                      : "bg-white/5"
                } ${isToday ? "ring-2 ring-white/40" : ""}`}
              />
            </motion.div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Bo'shman
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-danger-500" /> Yo'ldaman
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Dam olish
        </span>
      </div>
    </div>
  );
}
