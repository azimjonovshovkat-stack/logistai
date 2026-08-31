"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Phone, Truck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const roleRedirect: Record<string, string> = {
  driver: "/driver/dashboard",
  shipper: "/shipper/dashboard",
  admin: "/admin/dashboard",
};

export default function LoginPage() {
  const [phone, setPhone] = useState("+998");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const me = await login(phone, password);
      router.push(roleRedirect[me.role] ?? "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kirishda xatolik yuz berdi");
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
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-emerald-500 shadow-glow-blue">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Xush kelibsiz</h1>
            <p className="mt-1 text-sm text-slate-400">LogistAI kabinetingizga kiring</p>
          </div>

          <Card>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Telefon raqam"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  required
                />
                <Input
                  label="Parol"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                {error && (
                  <p className="rounded-lg border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  <Lock className="h-4 w-4" /> Kirish
                </Button>
              </form>
            </CardBody>
          </Card>

          <p className="mt-6 text-center text-sm text-slate-400">
            Hisobingiz yo'qmi?{" "}
            <Link href="/register" className="font-semibold text-accent-400 hover:text-accent-300">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
