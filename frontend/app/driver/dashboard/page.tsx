"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star, ShieldAlert, UserCog } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StatusSwitcher } from "@/components/StatusSwitcher";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { DriverStatsOverview } from "@/components/driver/DriverStatsOverview";
import { ActivityHistoryStrip } from "@/components/driver/ActivityHistoryStrip";
import { DriverOrderList } from "@/components/driver/DriverOrderList";
import { OrderDetailModal } from "@/components/driver/OrderDetailModal";
import { ProfileModal } from "@/components/ProfileModal";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { api, ApiError } from "@/lib/api";
import type { DailyStatus, DriverStatus, Order } from "@/lib/types";

const POLL_INTERVAL_MS = 20000;

function DriverDashboardContent() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<DriverStatus>("available");
  const [current, setCurrent] = useState("");
  const [destination, setDestination] = useState("");
  const [saving, setSaving] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [actingOrderId, setActingOrderId] = useState<number | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const pendingCountRef = useRef<number | null>(null);

  const loadOrders = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setOrdersLoading(true);
    try {
      const res = await api.get<Order[]>("/drivers/orders");
      const pendingCount = res.filter((o) => o.status === "pending").length;
      if (pendingCountRef.current !== null && pendingCount > pendingCountRef.current) {
        toast("Yangi buyurtma so'rovi keldi!", "info");
      }
      pendingCountRef.current = pendingCount;
      setOrders(res);
      setDetailOrder((prev) => (prev ? res.find((o) => o.id === prev.id) ?? prev : prev));
    } finally {
      if (!opts?.silent) setOrdersLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.get<DailyStatus | null>("/drivers/status/today").then((s) => {
      if (s) {
        setStatus(s.status as DriverStatus);
        setCurrent(s.current_location);
        setDestination(s.destination_location);
      }
    });
    loadOrders();

    const interval = setInterval(() => loadOrders({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadOrders]);

  async function saveStatus() {
    if (!current || !destination) {
      toast("Iltimos, hozirgi va ketish shaharlarini kiriting", "error");
      return;
    }
    setSaving(true);
    try {
      await api.put("/drivers/status", { status, current_location: current, destination_location: destination });
      toast("Status muvaffaqiyatli yangilandi", "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Xatolik yuz berdi", "error");
    } finally {
      setSaving(false);
    }
  }

  async function acceptOrder(orderId: number) {
    setActingOrderId(orderId);
    try {
      await api.patch(`/drivers/orders/${orderId}/status`, { status: "accepted" });
      toast("Buyurtma qabul qilindi. Statusingiz 'Band'ga o'tkazildi.", "success");
      await loadOrders();
      const s = await api.get<DailyStatus | null>("/drivers/status/today");
      if (s) setStatus(s.status as DriverStatus);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Xatolik yuz berdi", "error");
    } finally {
      setActingOrderId(null);
    }
  }

  async function completeOrder(orderId: number) {
    setActingOrderId(orderId);
    try {
      await api.patch(`/drivers/orders/${orderId}/status`, { status: "completed" });
      toast("Buyurtma yakunlandi. Rahmat!", "success");
      await loadOrders();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Xatolik yuz berdi", "error");
    } finally {
      setActingOrderId(null);
    }
  }

  if (!user) return null;

  if (user.status === "pending") {
    return <PendingScreen />;
  }
  if (user.status === "rejected") {
    return <RejectedScreen />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Salom, {user.full_name.split(" ")[0]}</h1>
              <p className="mt-1 text-sm text-slate-400">Bugungi statusingizni boshqaring</p>
            </div>
            <div className="flex items-center gap-2">
              {user.driver_profile && (
                <div className="flex items-center gap-2 rounded-full glass px-4 py-2">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-white">{Number(user.driver_profile.rating).toFixed(1)}</span>
                  <span className="text-sm text-slate-400">reyting</span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => setProfileOpen(true)}>
                <UserCog className="h-4 w-4" /> Profil
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <DriverStatsOverview orders={orders} rating={Number(user.driver_profile?.rating ?? 0)} />
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-white">Hozirgi status</h2>
              </CardHeader>
              <CardBody className="space-y-5">
                <StatusSwitcher value={status} onChange={setStatus} disabled={saving} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <CityAutocomplete label="Hozirgi shahar" value={current} onChange={setCurrent} />
                  <CityAutocomplete label="Ketish shahri" value={destination} onChange={setDestination} />
                </div>
                <Button onClick={saveStatus} loading={saving} size="lg" className="w-full">
                  Statusni saqlash
                </Button>
              </CardBody>
            </Card>

            <ActivityHistoryStrip />
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-white">Buyurtmalar</h2>
            </CardHeader>
            <CardBody>
              <DriverOrderList
                orders={orders}
                loading={ordersLoading}
                acting={actingOrderId}
                onAccept={acceptOrder}
                onComplete={completeOrder}
                onOpenDetails={setDetailOrder}
              />
            </CardBody>
          </Card>
        </motion.div>
      </main>

      <OrderDetailModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        acting={detailOrder !== null && actingOrderId === detailOrder.id}
        onAccept={() => detailOrder && acceptOrder(detailOrder.id)}
        onComplete={() => detailOrder && completeOrder(detailOrder.id)}
      />

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

function PendingScreen() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">Tekshiruvdan o'tmoqda</h1>
        <p className="text-slate-400">
          Hujjatlaringiz admin tomonidan ko'rib chiqilmoqda. Tasdiqlangach, kabinetingiz to'liq faollashadi.
        </p>
      </div>
    </div>
  );
}

function RejectedScreen() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-500/10 text-danger-400">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">Ro'yxatdan o'tish rad etildi</h1>
        <p className="text-slate-400">
          Hujjatlaringiz tasdiqlanmadi. Qo'shimcha ma'lumot uchun administrator bilan bog'laning.
        </p>
      </div>
    </div>
  );
}

export default function DriverDashboardPage() {
  return (
    <ProtectedRoute allow={["driver"]}>
      <DriverDashboardContent />
    </ProtectedRoute>
  );
}
