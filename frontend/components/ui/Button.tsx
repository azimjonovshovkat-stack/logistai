"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "emerald";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent-500 text-white hover:bg-accent-600 shadow-glow-blue disabled:bg-accent-900 disabled:shadow-none disabled:text-slate-400",
  emerald:
    "bg-emerald-500 text-white hover:bg-emerald-600 shadow-glow-emerald disabled:bg-emerald-900 disabled:shadow-none disabled:text-slate-400",
  secondary: "bg-slate-100 text-slate-900 hover:bg-white disabled:bg-slate-500 disabled:text-slate-300",
  ghost: "bg-transparent text-slate-300 hover:bg-white/5 hover:text-white",
  outline: "glass text-slate-100 hover:bg-white/10",
  danger: "bg-danger-500 text-white hover:bg-danger-600 shadow-glow-red disabled:bg-danger-700/50",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-base px-6 py-3.5 rounded-2xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
