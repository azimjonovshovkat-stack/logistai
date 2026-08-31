"use client";

import { useEffect, useState } from "react";
import { Wallet, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

export function BalanceRefillPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<User[]>("/admin/users").then(setUsers);
  }, []);

  const filtered = users.filter(
    (u) =>
      u.role !== "admin" &&
      (u.full_name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search))
  );

  async function handleRefill() {
    if (!selected || !amount) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await api.post<User>("/admin/balance/refill", {
        user_id: selected.id,
        amount: Number(amount),
        note: note || undefined,
      });
      setMessage(`${updated.full_name} balansi yangilandi: ${updated.balance.toLocaleString("uz-UZ")} so'm`);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setSelected(updated);
      setAmount("");
      setNote("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki telefon bo'yicha qidirish..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3.5 text-sm text-slate-100 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
        <div className="scrollbar-thin max-h-80 space-y-2 overflow-y-auto pr-1">
          {filtered.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u)}
              className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                selected?.id === u.id
                  ? "border-accent-500/50 bg-accent-500/10"
                  : "border-white/5 bg-white/[0.02] hover:bg-white/5"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-white">{u.full_name}</p>
                <p className="text-xs text-slate-500">{u.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={u.role === "driver" ? "emerald" : "amber"}>{u.role}</Badge>
                <span className="text-xs font-medium text-slate-400">
                  {Number(u.balance).toLocaleString("uz-UZ")} so'm
                </span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Topilmadi</p>}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-400" />
          <h3 className="font-semibold text-white">Balansni to'ldirish</h3>
        </div>
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-white/5 p-3 text-sm">
              <p className="font-semibold text-white">{selected.full_name}</p>
              <p className="text-slate-400">{selected.phone}</p>
              <p className="mt-1 text-emerald-400">
                Joriy balans: {Number(selected.balance).toLocaleString("uz-UZ")} so'm
              </p>
            </div>
            <Input
              label="Summa (so'm) — manfiy son yechish uchun"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500000"
            />
            <Input
              label="Izoh (ixtiyoriy)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Naqd to'lov, chek raqami..."
            />
            {message && <p className="text-sm text-emerald-400">{message}</p>}
            {error && <p className="text-sm text-danger-400">{error}</p>}
            <Button variant="emerald" onClick={handleRefill} loading={loading} disabled={!amount}>
              To'ldirish
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Foydalanuvchini tanlang</p>
        )}
      </div>
    </div>
  );
}
