"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPinOff, Home } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center overflow-hidden px-4 text-center">
        <div className="pointer-events-none absolute inset-0 bg-grid-glow" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-500/30 bg-accent-500/10 text-accent-400">
            <MapPinOff className="h-8 w-8" />
          </div>
          <h1 className="bg-gradient-to-r from-accent-400 to-emerald-400 bg-clip-text text-6xl font-extrabold text-transparent">
            404
          </h1>
          <p className="mt-3 text-lg font-semibold text-white">Bu manzil topilmadi</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
            Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin.
          </p>
          <Link href="/">
            <Button className="mt-8" size="lg">
              <Home className="h-4 w-4" /> Bosh sahifaga qaytish
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
