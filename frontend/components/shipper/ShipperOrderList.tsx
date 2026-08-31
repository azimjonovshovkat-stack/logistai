"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star, Repeat2, Ban, Package, MessageSquare } from "lucide-react";
import clsx from "clsx";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";
import type { Order, OrderStatus } from "@/lib/types";

type Tab = "all" | "active" | "completed" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "Hammasi" },
  { key: "active", label: "Faol" },
  { key: "completed", label: "Yakunlangan" },
  { key: "cancelled", label: "Bekor qilingan" },
];

const STATUS_META: Record<OrderStatus, { label: string; tone: any }> = {
  pending: { label: "Kutilmoqda", tone: "amber" },
  accepted: { label: "Qabul qilindi", tone: "blue" },
  in_transit: { label: "Yo'lda", tone: "blue" },
  completed: { label: "Yakunlandi", tone: "emerald" },
  cancelled: { label: "Bekor qilindi", tone: "red" },
};

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "accepted", "in_transit"];

interface ShipperOrderListProps {
  orders: Order[];
  loading: boolean;
  onRate: (orderId: number, rating: number, comment?: string) => Promise<void>;
  onCancel: (orderId: number) => Promise<void>;
  onRepeat: (order: Order) => void;
}

export function ShipperOrderList({ orders, loading, onRate, onCancel, onRepeat }: ShipperOrderListProps) {
  const [tab, setTab] = useState<Tab>("all");

  const counts = useMemo(
    () => ({
      all: orders.length,
      active: orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
      completed: orders.filter((o) => o.status === "completed").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }),
    [orders]
  );

  const filtered = useMemo(() => {
    if (tab === "all") return orders;
    if (tab === "active") return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
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
                tab === t.key ? "bg-white/20" : "bg-white/10"
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
          <Package className="h-8 w-8" />
          <p className="text-sm">Bu bo'limda buyurtmalar yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderRow key={order.id} order={order} onRate={onRate} onCancel={onCancel} onRepeat={onRepeat} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  onRate,
  onCancel,
  onRepeat,
}: {
  order: Order;
  onRate: (orderId: number, rating: number, comment?: string) => Promise<void>;
  onCancel: (orderId: number) => Promise<void>;
  onRepeat: (order: Order) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const meta = STATUS_META[order.status];

  async function submitRating(value: number) {
    setRating(value);
    if (!showCommentBox) {
      setShowCommentBox(true);
      return;
    }
    setSubmitting(true);
    try {
      await onRate(order.id, value, comment || undefined);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await onCancel(order.id);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-white">
            {order.from_location} → {order.to_location}
          </p>
          <p className="text-xs text-slate-500">
            {new Date(order.created_at).toLocaleDateString("uz-UZ")}
            {order.weight_tons ? ` · ${order.weight_tons} tonna` : ""}
          </p>
          {order.cargo_description && (
            <p className="mt-1 text-xs text-slate-400">{order.cargo_description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {order.status === "pending" && (
            <Button size="sm" variant="ghost" onClick={handleCancel} loading={cancelling}>
              <Ban className="h-3.5 w-3.5" /> Bekor qilish
            </Button>
          )}
          {order.status === "completed" && (
            <Button size="sm" variant="outline" onClick={() => onRepeat(order)}>
              <Repeat2 className="h-3.5 w-3.5" /> Qayta
            </Button>
          )}
        </div>
      </div>

      {order.status === "completed" && !order.rating && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Baholang:</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} disabled={submitting} onClick={() => submitRating(v)} className="disabled:opacity-50">
                  <Star className={`h-4.5 w-4.5 ${v <= rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
                </button>
              ))}
            </div>
          </div>
          {showCommentBox && (
            <div className="mt-2 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Izoh qoldiring (ixtiyoriy)..."
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-accent-500"
              />
              <Button size="sm" onClick={() => submitRating(rating)} loading={submitting} disabled={rating === 0}>
                Yuborish
              </Button>
            </div>
          )}
        </div>
      )}

      {order.rating && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < order.rating! ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
            ))}
          </div>
          {order.rating_comment && (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-400">
              <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
              {order.rating_comment}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
