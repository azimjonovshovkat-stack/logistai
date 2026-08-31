"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Search, Loader2 } from "lucide-react";
import clsx from "clsx";

interface VoiceSearchBarProps {
  onSubmit: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  initialValue?: string;
}

// Minimal shape of the Web Speech API we rely on (not in default TS lib.dom).
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

export function VoiceSearchBar({ onSubmit, loading, placeholder, initialValue = "" }: VoiceSearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      setVoiceSupported(true);
      const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor();
      recognition.lang = "uz-UZ";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setQuery(transcript);
          onSubmit(transcript);
        }
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognitionRef.current = recognition;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim().length < 3) return;
    onSubmit(query.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div
        className={clsx(
          "glass relative flex items-center gap-2 rounded-2xl p-2 pl-5 transition-shadow duration-300",
          listening ? "shadow-glow-emerald" : "shadow-glow-blue"
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? "Masalan: 20 tonna un Samarqanddan Toshkentga borishi kerak..."}
          className="w-full flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500 sm:text-base"
        />

        {voiceSupported && (
          <button
            type="button"
            onClick={toggleListening}
            title={listening ? "Yozib olishni to'xtatish" : "Ovozli qidiruv"}
            className={clsx(
              "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
              listening
                ? "bg-gradient-to-br from-accent-500 to-purple-500 text-white"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            )}
          >
            <AnimatePresence>
              {listening && (
                <>
                  <motion.span
                    className="absolute inset-0 rounded-xl bg-purple-500/50"
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.span
                    className="absolute inset-0 rounded-xl bg-accent-500/50"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                  />
                </>
              )}
            </AnimatePresence>
            <Mic className="h-4.5 w-4.5" />
          </button>
        )}

        <button
          type="submit"
          disabled={loading || query.trim().length < 3}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent-500 px-5 text-sm font-semibold text-white shadow-glow-blue transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:bg-accent-900 disabled:text-slate-400 disabled:shadow-none"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Qidirish"}
        </button>
      </div>
      {listening && (
        <p className="mt-2 flex items-center gap-1.5 pl-2 text-xs font-medium text-purple-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
          Tinglanmoqda... gapiring
        </p>
      )}
    </form>
  );
}
