"use client";

import { useEffect, useState } from "react";
import { Bot, Plus, Trash2, AlertTriangle, Power } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api, ApiError } from "@/lib/api";
import type { AIConfig } from "@/lib/types";

export function AIConfigPanel() {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const [provider, setProvider] = useState<"openai" | "deepseek">("openai");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [priority, setPriority] = useState("0");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<AIConfig[]>("/admin/ai-configs");
      setConfigs(res);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (apiKey.trim().length < 8) {
      setError("API kalit juda qisqa");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await api.post("/admin/ai-configs", {
        provider,
        api_key: apiKey.trim(),
        label: label || undefined,
        priority: Number(priority) || 0,
        is_active: true,
      });
      setApiKey("");
      setLabel("");
      setPriority("0");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(cfg: AIConfig) {
    await api.patch(`/admin/ai-configs/${cfg.id}`, { is_active: !cfg.is_active });
    await load();
  }

  async function remove(cfg: AIConfig) {
    await api.delete(`/admin/ai-configs/${cfg.id}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-4 w-4 text-accent-400" />
          <h3 className="font-semibold text-white">Yangi AI provider qo'shish</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as "openai" | "deepseek")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
            >
              <option value="openai" className="bg-base">
                OpenAI (GPT-4o)
              </option>
              <option value="deepseek" className="bg-base">
                DeepSeek
              </option>
            </select>
          </div>
          <Input
            label="Ustuvorlik (0 = birinchi urinib ko'riladi)"
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
          <Input
            label="API kalit"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="sm:col-span-2"
          />
          <Input
            label="Nom (ixtiyoriy)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Asosiy OpenAI kalit"
            className="sm:col-span-2"
          />
        </div>
        {error && <p className="mt-3 text-sm text-danger-400">{error}</p>}
        <Button className="mt-4" onClick={handleCreate} loading={creating}>
          <Plus className="h-4 w-4" /> Qo'shish
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Yuklanmoqda...</p>
        ) : configs.length === 0 ? (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
            Hech qanday AI provider sozlanmagan. Ushbu holatda qidiruv avtomatik ravishda kalit so'z
            asosidagi zaxira (fallback) tahlilga o'tadi.
          </p>
        ) : (
          configs.map((cfg) => (
            <div
              key={cfg.id}
              className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white">{cfg.label || cfg.provider}</p>
                  <Badge tone={cfg.provider === "openai" ? "blue" : "emerald"}>{cfg.provider}</Badge>
                  <Badge tone="gray">ustuvorlik {cfg.priority}</Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-500">{cfg.masked_key}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {cfg.usage_count} marta ishlatilgan
                  {cfg.last_used_at && ` · oxirgi: ${new Date(cfg.last_used_at).toLocaleString("uz-UZ")}`}
                </p>
                {cfg.last_error && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-danger-400">
                    <AlertTriangle className="h-3 w-3" /> {cfg.last_error}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant={cfg.is_active ? "outline" : "emerald"} onClick={() => toggleActive(cfg)}>
                  <Power className="h-3.5 w-3.5" /> {cfg.is_active ? "Faol" : "Nofaol"}
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(cfg)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
