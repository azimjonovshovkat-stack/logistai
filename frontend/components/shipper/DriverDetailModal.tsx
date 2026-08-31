"use client";

import { useEffect, useState } from "react";
import { Star, Truck, Weight, Hash, BadgeCheck, MessageSquareOff } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import type { DriverReviewsResponse } from "@/lib/types";

export function DriverDetailModal({
  driverId,
  onClose,
  onBook,
  booking,
}: {
  driverId: number | null;
  onClose: () => void;
  onBook: () => void;
  booking: boolean;
}) {
  const [data, setData] = useState<DriverReviewsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (driverId === null) {
      setData(null);
      return;
    }
    setLoading(true);
    api
      .get<DriverReviewsResponse>(`/shippers/drivers/${driverId}/reviews`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [driverId]);

  return (
    <Modal open={driverId !== null} onClose={onClose} title="Haydovchi profili">
      <div className="p-5">
        {loading || !data ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500/30 to-emerald-500/30 text-white">
                <Truck className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-lg font-bold text-white">{data.full_name}</p>
                  <BadgeCheck className="h-4 w-4 text-accent-400" />
                </div>
                <div className="flex items-center gap-1 text-sm text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  {Number(data.rating).toFixed(1)}
                  <span className="text-slate-500">({data.total_reviews} ta sharh)</span>
                </div>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <Truck className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                <p className="text-xs font-medium text-white">{data.car_name}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <Weight className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                <p className="text-xs font-medium text-white">{data.capacity_tons} tonna</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <Hash className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                <p className="text-xs font-medium text-white">{data.car_number}</p>
              </div>
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mijozlar sharhlari
            </p>
            {data.reviews.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.02] py-8 text-center text-slate-500">
                <MessageSquareOff className="h-6 w-6" />
                <p className="text-sm">Hali sharhlar yo'q</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.reviews.map((r, i) => (
                  <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-200">{r.reviewer_name}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`h-3 w-3 ${idx < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-slate-400">{r.comment}</p>}
                    <p className="mt-1 text-xs text-slate-600">
                      {new Date(r.created_at).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Button className="mt-5 w-full" size="lg" onClick={onBook} loading={booking}>
              Band qilish
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
