"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

let cachedCities: string[] | null = null;

async function loadCities(): Promise<string[]> {
  if (cachedCities) return cachedCities;
  const res = await fetch("/api/v1/cities");
  const data = await res.json();
  cachedCities = data.cities as string[];
  return cachedCities;
}

interface CityAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CityAutocomplete({ label, value, onChange, placeholder }: CityAutocompleteProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCities().then(setCities);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = cities
    .filter((c) => c.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "Shaharni tanlang..."}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3.5 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="scrollbar-thin absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-white/10 bg-base-raised/95 p-1.5 shadow-glass backdrop-blur-xl">
          {filtered.map((city) => (
            <button
              type="button"
              key={city}
              onClick={() => {
                onChange(city);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-white/10"
            >
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
