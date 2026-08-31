"use client";

import { useEffect, useState } from "react";
import { History, TrendingUp, X } from "lucide-react";
import { getRecentSearches } from "@/lib/search-history";

const POPULAR_ROUTES = [
  "Toshkentdan Samarqandga 10 tonna yuk",
  "Samarqanddan Buxoroga 5 tonna mahsulot",
  "Toshkentdan Farg'onaga 15 tonna qurilish materiali",
  "Andijondan Toshkentga 8 tonna yuk",
  "Buxorodan Xivaga 6 tonna yuk",
  "Qarshidan Termizga 12 tonna yuk",
];

interface SearchSuggestionsProps {
  onSelect: (query: string) => void;
  refreshKey?: number;
}

export function SearchSuggestions({ onSelect, refreshKey }: SearchSuggestionsProps) {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(getRecentSearches());
  }, [refreshKey]);

  return (
    <div className="space-y-3">
      {recent.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <History className="h-3.5 w-3.5" />
            So'nggi qidiruvlar
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((q) => (
              <button
                key={q}
                onClick={() => onSelect(q)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-accent-500/40 hover:bg-accent-500/10 hover:text-accent-300"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <TrendingUp className="h-3.5 w-3.5" />
          Mashhur yo'nalishlar
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_ROUTES.map((q) => (
            <button
              key={q}
              onClick={() => onSelect(q)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
