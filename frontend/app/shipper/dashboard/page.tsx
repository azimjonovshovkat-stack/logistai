"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Bot, Keyboard, PackageSearch, Send, UserCog } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { VoiceSearchBar } from "@/components/VoiceSearchBar";
import { SubscriptionWidget } from "@/components/SubscriptionWidget";
import { DriverMatchCard } from "@/components/DriverMatchCard";
import { StatsOverview } from "@/components/shipper/StatsOverview";
import { SearchSuggestions } from "@/components/shipper/SearchSuggestions";
import { ShipperOrderList } from "@/components/shipper/ShipperOrderList";
import { DriverDetailModal } from "@/components/shipper/DriverDetailModal";
import { ProfileModal } from "@/components/ProfileModal";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DriverCardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { api, ApiError } from "@/lib/api";
import { pushRecentSearch } from "@/lib/search-history";
import type { Order, SearchResponse, Subscription } from "@/lib/types";

function ShipperDashboardContent() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [detailDriverId, setDetailDriverId] = useState<number | null>(null);
  const [searchHistoryTick, setSearchHistoryTick] = useState(0);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const lastQueryRef = useRef("");

  useEffect(() => {
    loadSubscription();
    loadOrders();
    const q = searchParams.get("q");
    if (q) runSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSubscription() {
    const sub = await api.get<Subscription>("/shippers/subscription");
    setSubscription(sub);
  }

  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const res = await api.get<Order[]>("/shippers/orders");
      setOrders(res);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function handlePurchase() {
    setPurchasing(true);
    try {
      await api.post("/shippers/subscription/purchase");
      await Promise.all([loadSubscription(), refresh()]);
      toast("Obuna muvaffaqiyatli faollashtirildi!", "success");
      if (lastQueryRef.current) await runSearch(lastQueryRef.current);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Xatolik yuz berdi", "error");
    } finally {
      setPurchasing(false);
    }
  }

  async function runSearch(query: string) {
    if (!query || query.trim().length < 3) return;
    lastQueryRef.current = query;
    setSearching(true);
    try {
      const res = await api.post<SearchResponse>("/shippers/search", { query });
      setResult(res);
      pushRecentSearch(query);
      setSearchHistoryTick((t) => t + 1);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Qidiruvda xatolik yuz berdi", "error");
    } finally {
      setSearching(false);
    }
  }

  async function bookDriver(driverId: number, from: string, to: string) {
    setBookingId(driverId);
    try {
      await api.post("/shippers/book", {
        driver_id: driverId,
        from_location: from,
        to_location: to,
        cargo_description: result?.parsed_query?.cargo_type ?? null,
        weight_tons: result?.parsed_query?.min_capacity_tons ?? null,
      });
      toast("Buyurtma yuborildi! Haydovchi tasdiqlashini kuting.", "success");
      setDetailDriverId(null);
      await loadOrders();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Band qilishda xatolik yuz berdi", "error");
    } finally {
      setBookingId(null);
    }
  }

  async function rateOrder(orderId: number, rating: number, comment?: string) {
    try {
      await api.post(`/shippers/orders/${orderId}/rate`, { rating, comment });
      toast("Bahoyingiz uchun rahmat!", "success");
      await loadOrders();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Baho qo'yishda xatolik", "error");
    }
  }

  async function cancelOrder(orderId: number) {
    try {
      await api.post(`/shippers/orders/${orderId}/cancel`);
      toast("Buyurtma bekor qilindi", "info");
      await loadOrders();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Bekor qilishda xatolik", "error");
    }
  }

  function repeatOrder(order: Order) {
    const query = `${order.from_location}dan ${order.to_location}ga${
      order.weight_tons ? ` ${order.weight_tons} tonna` : ""
    } yuk tashish kerak`;
    runSearch(query);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!user) return null;

  const detailDriver = result?.matches.find((m) => m.driver_id === detailDriverId) ?? null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Salom, {user.full_name.split(" ")[0]}</h1>
              <p className="mt-1 text-sm text-slate-400">Yukingiz uchun mos haydovchini toping</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setProfileOpen(true)}>
              <UserCog className="h-4 w-4" /> Profil
            </Button>
          </div>

          <div className="mb-6">
            <StatsOverview orders={orders} />
          </div>

          <div className="mb-6">
            <SubscriptionWidget subscription={subscription} onPurchase={handlePurchase} purchasing={purchasing} />
          </div>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-accent-400" />
                <h2 className="text-lg font-bold text-white">AI Smart Qidiruv</h2>
              </div>
            </CardHeader>
            <CardBody>
              <VoiceSearchBar onSubmit={runSearch} loading={searching} />

              <div className="mt-4">
                <SearchSuggestions onSelect={runSearch} refreshKey={searchHistoryTick} />
              </div>

              <AnimatePresence mode="wait">
                {searching ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 grid gap-4 sm:grid-cols-2"
                  >
                    <DriverCardSkeleton />
                    <DriverCardSkeleton />
                  </motion.div>
                ) : (
                  result && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-6"
                    >
                      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <Badge tone={result.source === "ai" ? "blue" : "amber"}>
                          {result.source === "ai" ? (
                            <>
                              <Bot className="h-3 w-3" /> AI tahlili
                            </>
                          ) : (
                            <>
                              <Keyboard className="h-3 w-3" /> Kalit so'z tahlili
                            </>
                          )}
                        </Badge>
                        <Badge tone="emerald">
                          <Zap className="h-3 w-3" /> {result.elapsed_ms} ms
                        </Badge>
                        {result.parsed_query.origin && <Badge>Qayerdan: {result.parsed_query.origin}</Badge>}
                        {result.parsed_query.destination && (
                          <Badge>Qayerga: {result.parsed_query.destination}</Badge>
                        )}
                        {result.parsed_query.min_capacity_tons && (
                          <Badge>Min {result.parsed_query.min_capacity_tons} tonna</Badge>
                        )}
                      </div>

                      {result.matches.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
                          <PackageSearch className="h-8 w-8" />
                          <p className="text-sm">{result.message ?? "Mos haydovchi topilmadi"}</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {result.matches.map((driver) => (
                            <DriverMatchCard
                              key={driver.driver_id}
                              driver={driver}
                              subscriptionActive={result.subscription_active}
                              booking={bookingId === driver.driver_id}
                              onBook={() =>
                                bookDriver(driver.driver_id, driver.current_location, driver.destination_location)
                              }
                              onRequireSubscription={handlePurchase}
                              onOpenDetails={() => setDetailDriverId(driver.driver_id)}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-accent-400" />
                <h2 className="text-lg font-bold text-white">Mening buyurtmalarim</h2>
              </div>
            </CardHeader>
            <CardBody>
              <ShipperOrderList
                orders={orders}
                loading={ordersLoading}
                onRate={rateOrder}
                onCancel={cancelOrder}
                onRepeat={repeatOrder}
              />
            </CardBody>
          </Card>
        </motion.div>
      </main>

      <DriverDetailModal
        driverId={detailDriverId}
        onClose={() => setDetailDriverId(null)}
        booking={bookingId === detailDriverId}
        onBook={() => {
          if (detailDriver) {
            bookDriver(detailDriver.driver_id, detailDriver.current_location, detailDriver.destination_location);
          }
        }}
      />

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

export default function ShipperDashboardPage() {
  return (
    <ProtectedRoute allow={["shipper"]}>
      <Suspense fallback={<Spinner />}>
        <ShipperDashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
