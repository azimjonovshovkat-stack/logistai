import { Loader2 } from "lucide-react";
import clsx from "clsx";

export function Spinner({ className }: { className?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className={clsx("h-6 w-6 animate-spin text-accent-500", className)} />
    </div>
  );
}
