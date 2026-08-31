"use client";

import { motion } from "framer-motion";
import { CircleCheck, Truck as TruckIcon, Moon } from "lucide-react";
import clsx from "clsx";
import type { DriverStatus } from "@/lib/types";

interface StatusSwitcherProps {
  value: DriverStatus | null;
  onChange: (status: DriverStatus) => void;
  disabled?: boolean;
}

const OPTIONS: {
  value: DriverStatus;
  label: string;
  icon: any;
  activeClass: string;
  glow: string;
}[] = [
  {
    value: "available",
    label: "BO'SHMAN",
    icon: CircleCheck,
    activeClass: "bg-emerald-500 text-white border-emerald-400",
    glow: "shadow-glow-emerald",
  },
  {
    value: "busy",
    label: "YO'LDAMAN",
    icon: TruckIcon,
    activeClass: "bg-danger-500 text-white border-danger-400",
    glow: "shadow-glow-red",
  },
  {
    value: "day_off",
    label: "DAM OLISH",
    icon: Moon,
    activeClass: "bg-amber-500 text-white border-amber-400",
    glow: "shadow-[0_0_0_1px_rgba(245,158,11,0.25),0_0_40px_-8px_rgba(245,158,11,0.55)]",
  },
];

export function StatusSwitcher({ value, onChange, disabled }: StatusSwitcherProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            whileTap={{ scale: 0.97 }}
            className={clsx(
              "flex flex-col items-center justify-center gap-2 rounded-2xl border py-6 font-extrabold tracking-wide transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
              isActive ? clsx(opt.activeClass, opt.glow) : "glass border-white/10 text-slate-400 hover:text-white"
            )}
          >
            <opt.icon className="h-7 w-7" />
            <span className="text-sm sm:text-base">{opt.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
