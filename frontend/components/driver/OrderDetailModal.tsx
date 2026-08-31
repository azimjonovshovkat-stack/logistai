"use client";

import { Phone, MapPin, ArrowRight, Weight, Package, Star, Calendar, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Order } from "@/lib/types";

const STATUS_META: Record<string, { label: string; tone: any }> = {
  pending: { label: "Yangi so'rov", tone: "amber" },
  accepted: { label: "Qabul qilindi", tone: "blue" },
  in_transit: { label: "Yo'lda", tone: "blue" },
  completed: { label: "Yakunlandi", tone: "emerald" },
  cancelled: { label: "Bekor qilindi", tone: "red" },
};

export function OrderDetailModal({
  order,
  onClose,
  onAccept,
  onComplete,
  acting,
}: {
  order: Order | null;
  onClose: () => void;
  onAccept: () => void;
  onComplete: () => void;
  acting: boolean;
}) {
  return (
    <Modal open={order !== null} onClose={onClose} title="Buyurtma tafsilotlari">
      {order && (
        <div className="space-y-5 p-5">
          <div className="flex items-center justify-between">
            <Badge tone={STATUS_META[order.status]?.tone ?? "gray"}>
              {STATUS_META[order.status]?.label ?? order.status}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(order.created_at).toLocaleString("uz-UZ")}
            </span>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-base font-semibold text-white">
              <MapPin className="h-4 w-4 text-emerald-400" />
              {order.from_location}
              <ArrowRight className="h-4 w-4 text-slate-500" />
              {order.to_location}
            </div>
            {order.weight_tons && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-400">
                <Weight className="h-3.5 w-3.5" /> {order.weight_tons} tonna
              </p>
            )}
            {order.cargo_description && (
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-slate-400">
                <Package className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {order.cargo_description}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Yuk egasi</p>
            <p className="font-medium text-white">{order.shipper_name ?? "Noma'lum"}</p>
            {order.shipper_phone && (order.status === "accepted" || order.status === "in_transit" || order.status === "completed") ? (
              <a
                href={`tel:${order.shipper_phone}`}
                className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <Phone className="h-3.5 w-3.5" /> {order.shipper_phone}
              </a>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Aloqa ma'lumotlari buyurtmani qabul qilgach ochiladi
              </p>
            )}
          </div>

          {order.rating && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Yuk egasi bahosi
              </p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < order.rating! ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} />
                ))}
              </div>
              {order.rating_comment && <p className="mt-1.5 text-sm text-slate-400">{order.rating_comment}</p>}
            </div>
          )}

          {order.status === "pending" && (
            <Button className="w-full" size="lg" variant="emerald" onClick={onAccept} loading={acting}>
              Buyurtmani oldim
            </Button>
          )}
          {order.status === "accepted" && (
            <Button className="w-full" size="lg" onClick={onComplete} loading={acting}>
              <CheckCircle2 className="h-4 w-4" /> Yetkazib berdim
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}
