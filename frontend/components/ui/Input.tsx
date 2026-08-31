import clsx from "clsx";
import { InputHTMLAttributes, LabelHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            "w-full rounded-xl border bg-white/5 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500",
            "focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20",
            error ? "border-danger-400" : "border-white/10",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export function FieldLabel(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="mb-1.5 block text-sm font-medium text-slate-300" {...props} />;
}
