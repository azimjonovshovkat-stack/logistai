"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Truck } from "lucide-react";
import { CITY_COORDS, MAP_HEIGHT, MAP_WIDTH, outlinePath, project } from "@/lib/cityCoords";

interface LiveMapPoint {
  city: string;
  available_count: number;
}
interface LiveMapResponse {
  points: LiveMapPoint[];
  total_available: number;
  total_verified_drivers: number;
}

export function LiveMapWidget() {
  const [data, setData] = useState<LiveMapResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/v1/public/live-map");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // silently ignore - decorative widget
      }
    }
    load();
    const interval = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const points = data?.points ?? [];
  const maxCount = Math.max(1, ...points.map((p) => p.available_count));

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-6 shadow-glass sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Jonli tarmoq — O'zbekiston bo'ylab
          </h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Truck className="h-4 w-4" />
            <span className="font-bold text-white">{data?.total_available ?? 0}</span>
            <span className="text-slate-400">bo'sh haydovchi</span>
          </div>
          <div className="hidden items-center gap-1.5 text-accent-400 sm:flex">
            <Radio className="h-4 w-4" />
            <span className="font-bold text-white">{data?.total_verified_drivers ?? 0}</span>
            <span className="text-slate-400">tasdiqlangan</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`-4 -4 ${MAP_WIDTH + 8} ${MAP_HEIGHT + 8}`}
          className="w-full"
          style={{ filter: "drop-shadow(0 0 24px rgba(59,130,246,0.15))" }}
        >
          <defs>
            <linearGradient id="countryFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
            </linearGradient>
            <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M 6 0 L 0 0 0 6" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="0.2" />
            </pattern>
          </defs>

          <rect x={-4} y={-4} width={MAP_WIDTH + 8} height={MAP_HEIGHT + 8} fill="url(#grid)" />

          <path
            d={outlinePath()}
            fill="url(#countryFill)"
            stroke="rgba(59,130,246,0.4)"
            strokeWidth="0.4"
            strokeLinejoin="round"
          />

          {Object.entries(CITY_COORDS).map(([city, coord]) => {
            const [x, y] = project(coord);
            const match = points.find((p) => p.city === city);
            const count = match?.available_count ?? 0;
            const isActive = count > 0;
            const r = isActive ? 0.8 + (count / maxCount) * 1.4 : 0.35;
            return (
              <g key={city}>
                {isActive && (
                  <circle cx={x} cy={y} r={r} fill="#10B981" opacity={0.35}>
                    <animate attributeName="r" values={`${r};${r * 2.2};${r}`} dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={isActive ? "#10B981" : "#475569"}
                  className="cursor-pointer"
                >
                  <title>{`${city}${isActive ? ` — ${count} bo'sh haydovchi` : " — hozircha faol emas"}`}</title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>

      <AnimatePresence>
        {points.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex flex-wrap gap-2"
          >
            {points.slice(0, 6).map((p) => (
              <span
                key={p.city}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {p.city} · {p.available_count}
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
