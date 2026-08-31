import clsx from "clsx";
import { HTMLAttributes } from "react";

type Tone = "emerald" | "amber" | "red" | "gray" | "blue";

const toneClasses: Record<Tone, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  red: "bg-danger-500/10 text-danger-400 border-danger-500/30",
  gray: "bg-white/5 text-slate-400 border-white/10",
  blue: "bg-accent-500/10 text-accent-400 border-accent-500/30",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "gray", ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
