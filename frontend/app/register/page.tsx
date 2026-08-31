"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Truck, Wallet, UserPlus } from "lucide-react";
import clsx from "clsx";
import { Navbar } from "@/components/Navbar";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/ImageUploadField";
import { useAuth } from "@/lib/auth-context";
import { api, setToken, ApiError } from "@/lib/api";
import type { Me, Role } from "@/lib/types";

function RegisterForm() {
  const params = useSearchParams();
  const initialRole = (params.get("role") as Role) || "shipper";
  const [role, setRole] = useState<Role>(initialRole === "driver" ? "driver" : "shipper");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [carName, setCarName] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [carYear, setCarYear] = useState("");
  const [capacityTons, setCapacityTons] = useState("");
  const [carPhotoUrl, setCarPhotoUrl] = useState<string | null>(null);
  const [licensePhotoUrl, setLicensePhotoUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Parollar mos kelmadi");
      return;
    }
    if (role === "driver" && (!carPhotoUrl || !carName || !carNumber || !carYear || !capacityTons)) {
      setError("Haydovchi uchun barcha mashina ma'lumotlari va rasm shart");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        full_name: fullName,
        phone,
        password,
        role,
      };
      if (role === "driver") {
        Object.assign(payload, {
          car_name: carName,
          car_number: carNumber,
          car_year: Number(carYear),
          capacity_tons: Number(capacityTons),
          car_photo_url: carPhotoUrl,
          license_photo_url: licensePhotoUrl,
        });
      }

      const res = await api.post<{ access_token: string; user: Me }>("/auth/register", payload);
      setToken(res.access_token);
      await refresh();
      const pendingQuery = params.get("q");
      if (role === "shipper" && pendingQuery) {
        router.push(`/shipper/dashboard?q=${encodeURIComponent(pendingQuery)}`);
      } else {
        router.push(role === "driver" ? "/driver/dashboard" : "/shipper/dashboard");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ro'yxatdan o'tishda xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-emerald-500 shadow-glow-blue">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Ro'yxatdan o'tish</h1>
            <p className="mt-1 text-sm text-slate-400">LogistAI platformasiga qo'shiling</p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl glass p-1.5">
            <button
              type="button"
              onClick={() => setRole("shipper")}
              className={clsx(
                "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                role === "shipper" ? "bg-accent-500 text-white shadow-glow-blue" : "text-slate-400 hover:text-white"
              )}
            >
              <Wallet className="h-4 w-4" /> Yuk beruvchi
            </button>
            <button
              type="button"
              onClick={() => setRole("driver")}
              className={clsx(
                "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                role === "driver" ? "bg-emerald-500 text-white shadow-glow-emerald" : "text-slate-400 hover:text-white"
              )}
            >
              <Truck className="h-4 w-4" /> Haydovchi
            </button>
          </div>

          <Card>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="To'liq ism"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tojiqulov Xasan"
                  required
                />
                <Input
                  label="Telefon raqam"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Parol"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <Input
                    label="Parolni tasdiqlang"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>

                {role === "driver" && (
                  <div className="space-y-4 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                      Mashina ma'lumotlari
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Mashina markasi"
                        value={carName}
                        onChange={(e) => setCarName(e.target.value)}
                        placeholder="MAN TGX"
                        required
                      />
                      <Input
                        label="Davlat raqami"
                        value={carNumber}
                        onChange={(e) => setCarNumber(e.target.value)}
                        placeholder="01 A 123 BC"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Ishlab chiqarilgan yili"
                        type="number"
                        value={carYear}
                        onChange={(e) => setCarYear(e.target.value)}
                        placeholder="2019"
                        required
                      />
                      <Input
                        label="Sig'imi (tonna)"
                        type="number"
                        step="0.1"
                        value={capacityTons}
                        onChange={(e) => setCapacityTons(e.target.value)}
                        placeholder="20"
                        required
                      />
                    </div>
                    <ImageUploadField
                      label="Mashina rasmi"
                      value={carPhotoUrl}
                      onChange={setCarPhotoUrl}
                      required
                    />
                    <ImageUploadField
                      label="Texpasport rasmi"
                      value={licensePhotoUrl}
                      onChange={setLicensePhotoUrl}
                    />
                    <p className="text-xs text-slate-500">
                      Ro'yxatdan o'tgach, admin hujjatlaringizni tekshirib tasdiqlaydi.
                    </p>
                  </div>
                )}

                {error && (
                  <p className="rounded-lg border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  variant={role === "driver" ? "emerald" : "primary"}
                  loading={loading}
                >
                  Ro'yxatdan o'tish
                </Button>
              </form>
            </CardBody>
          </Card>

          <p className="mt-6 text-center text-sm text-slate-400">
            Hisobingiz bormi?{" "}
            <Link href="/login" className="font-semibold text-accent-400 hover:text-accent-300">
              Kirish
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
