"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Phone, Star, Truck, Weight, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { DriverMatch } from "@/lib/types";

interface DriverMatchCardProps {
  driver: DriverMatch;
  subscriptionActive: boolean;
  onBook: () => void;
  booking: boolean;
  onRequireSubscription: () => void;
  onOpenDetails: () => void;
}

export function DriverMatchCard({
  driver,
  subscriptionActive,
  onBook,
  booking,
  onRequireSubscription,
  onOpenDetails,
}: DriverMatchCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.35 }}
      className="glass relative overflow-hidden rounded-2xl p-5 shadow-glass"
    >
      <button
        onClick={onOpenDetails}
        className="mb-4 flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500/30 to-emerald-500/30 text-white">
            <Truck className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-base bg-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-white hover:text-accent-300">{driver.full_name}</p>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-amber-400">
              <Star className="h-3 w-3 fill-amber-400" />
              {Number(driver.rating).toFixed(1)}
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-accent-500/30 bg-accent-500/10 px-2.5 py-1 text-[11px] font-semibold text-accent-400">
          <BadgeCheck className="h-3.5 w-3.5" /> Verified
        </span>
      </button>

      <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
        <span className="font-medium">{driver.current_location}</span>
        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
        <span className="font-medium">{driver.destination_location}</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-slate-300">
          🚛 {driver.car_name}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-slate-300">
          <Weight className="h-3.5 w-3.5" /> {driver.capacity_tons} tonna
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-slate-300">
          {driver.car_number}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4">
        {subscriptionActive ? (
          <a
            href={`tel:${driver.phone}`}
            className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <Phone className="h-4 w-4" /> {driver.phone}
          </a>
        ) : (
          <button
            onClick={onRequireSubscription}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-300"
          >
            <Lock className="h-3.5 w-3.5" /> {driver.phone}
          </button>
        )}
        <Button size="sm" onClick={onBook} loading={booking}>
          Band qilish
        </Button>
      </div>
    </motion.div>
  );
}
