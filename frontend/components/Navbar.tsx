"use client";

import { useState } from "react";
import Link from "next/link";
import { Truck, LogOut, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/Badge";
import { ProfileModal } from "@/components/ProfileModal";

const dashboardPath: Record<string, string> = {
  driver: "/driver/dashboard",
  shipper: "/shipper/dashboard",
  admin: "/admin/dashboard",
};

export function Navbar() {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-base/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href={user ? dashboardPath[user.role] : "/"} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-emerald-500 text-white shadow-glow-blue">
            <Truck className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Logist<span className="text-accent-500">AI</span>
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 rounded-full glass px-3 py-1.5 text-sm font-medium text-slate-200 sm:flex">
              <Wallet className="h-3.5 w-3.5 text-emerald-400" />
              {Number(user.balance).toLocaleString("uz-UZ")} so'm
            </div>
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 rounded-full px-1.5 py-1 transition-colors hover:bg-white/5"
              title="Profil"
            >
              <Badge tone={user.role === "admin" ? "blue" : user.role === "driver" ? "emerald" : "amber"}>
                {user.role === "admin" ? "Admin" : user.role === "driver" ? "Haydovchi" : "Yuk beruvchi"}
              </Badge>
              <span className="hidden text-sm text-slate-400 sm:inline">{user.full_name}</span>
            </button>
            <button
              onClick={logout}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-danger-400"
              title="Chiqish"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Kirish
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-glow-blue hover:bg-accent-600"
            >
              Ro'yxatdan o'tish
            </Link>
          </div>
        )}
      </div>

      {user && <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />}
    </header>
  );
}
