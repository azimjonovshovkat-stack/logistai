"use client";

import { useState } from "react";
import { Check, X, Phone, Truck, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import type { PendingDriver } from "@/lib/types";

export function PendingDriverCard({
  driver,
  onDecision,
}: {
  driver: PendingDriver;
  onDecision: (id: number, decision: "approved" | "rejected") => Promise<void>;
}) {
  const [loadingDecision, setLoadingDecision] = useState<"approved" | "rejected" | null>(null);

  async function handle(decision: "approved" | "rejected") {
    setLoadingDecision(decision);
    try {
      await onDecision(driver.id, decision);
    } finally {
      setLoadingDecision(null);
    }
  }

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={driver.driver_profile.car_photo_url}
                alt="Mashina"
                className="h-20 w-20 rounded-xl border border-white/10 object-cover"
              />
              {driver.driver_profile.license_photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={driver.driver_profile.license_photo_url}
                  alt="Texpasport"
                  className="h-20 w-20 rounded-xl border border-white/10 object-cover"
                />
              )}
            </div>
            <div>
              <p className="font-bold text-white">{driver.full_name}</p>
              <p className="flex items-center gap-1.5 text-sm text-slate-400">
                <Phone className="h-3.5 w-3.5" /> {driver.phone}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                <Truck className="h-3.5 w-3.5" /> {driver.driver_profile.car_name} ·{" "}
                {driver.driver_profile.car_number} · {driver.driver_profile.capacity_tons} tonna
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <FileText className="h-3 w-3" /> {driver.driver_profile.car_year}-yil
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="emerald"
              onClick={() => handle("approved")}
              loading={loadingDecision === "approved"}
              disabled={loadingDecision !== null}
            >
              <Check className="h-4 w-4" /> Tasdiqlash
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handle("rejected")}
              loading={loadingDecision === "rejected"}
              disabled={loadingDecision !== null}
            >
              <X className="h-4 w-4" /> Bekor qilish
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
