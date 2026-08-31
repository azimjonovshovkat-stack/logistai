"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star, Hourglass, Package } from "lucide-react";
import clsx from "clsx";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";
import type { Order, OrderStatus } from "@/lib/types";

type Tab = "new" | "active" | "completed" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
  { key: "new", label: "Yangi so'rovlar" },
  { key: "active", label: "Faol" },
  { key: "completed", label: "Yakunlangan" },
  { key: "cancelled", label: "Bekor qilingan" },
];

const STATUS_META: Record<OrderStatus, { label: string; tone: any }> = {
  pending: { label: "Yangi so'rov", tone: "amber" },
  accepted: { label: "Qabul qilindi", tone: "blue" },
  in_transit: { label: "Yo'lda", tone: "blue" },
  completed: { label: "Yakunlandi", tone: "emerald" },
  cancelled: { label: "Bekor qilindi", tone: "red" },
};

interface DriverOrderListProps {
  orders: Order[];
  loading: boolean;
  acting: number | null;
  onAccept: (orderId: number) => void;
  onComplete: (orderId: number) => void;
  onOpenDetails: (order: Order) => void;
}

export function DriverOrderList({ orders, loading, acting, onAccept, onComplete, onOpenDetails }: DriverOrderListProps) {
  const [tab, setTab] = useState<Tab>("new");

  const counts = useMemo(
    () => ({
      new: orders.filter((o) => o.status === "pending").length,
      active: orders.filter((o) => o.status === "accepted" || o.status === "in_transit").length,
      completed: orders.filter((o) => o.status === "completed").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }),
    [orders]
  );

  const filtered = useMemo(() => {
    if (tab === "new") return orders.filter((o) => o.status === "pending");
    if (tab === "active") return orders.filter((o) => o.status === "accepted" || o.status === "in_transit");
    if (tab === "completed") return orders.filter((o) => o.status === "completed");
    return orders.filter((o) => o.status === "cancelled");
  }, [orders, tab]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              tab === t.key ? "bg-accent-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            )}
          >
            {t.label}
            <span
              className={clsx(
                "rounded-full px-1.5 text-[10px]",
                tab === t.key ? "bg-white/20" : t.key === "new" && counts.new > 0 ? "bg-danger-500 text-white" : "bg-white/10"
              )}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <OrderRowSkeleton />
          <OrderRowSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
          {tab === "new" ? <Hourglass className="h-8 w-8" /> : <Package className="h-8 w-8" />}
          <p className="text-sm">Bu bo'limda buyurtmalar yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={order.id}
              className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
            >
              <button onClick={() => onOpenDetails(order)} className="flex flex-1 items-start gap-3 text-left">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-400">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {order.from_location} → {order.to_location}
                  </p>
                  <p className="text-xs text-slate-500">
                    {order.shipper_name ?? "Yuk egasi"}
                    {order.weight_tons ? ` · ${order.weight_tons} tonna` : ""}
                  </p>
                  {order.rating && (
                    <div className="mt-1.5 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < order.rating! ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-2">
                <Badge tone={STATUS_META[order.status].tone}>{STATUS_META[order.status].label}</Badge>
                {order.status === "pending" && (
                  <Button size="sm" variant="emerald" onClick={() => onAccept(order.id)} loading={acting === order.id}>
                    Oldim
                  </Button>
                )}
                {order.status === "accepted" && (
                  <Button size="sm" variant="primary" onClick={() => onComplete(order.id)} loading={acting === order.id}>
                    Yetkazdim
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
