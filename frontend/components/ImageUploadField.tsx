"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, CheckCircle2, X } from "lucide-react";
import { uploadImage, ApiError } from "@/lib/api";

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  required?: boolean;
}

export function ImageUploadField({ label, value, onChange, required }: ImageUploadFieldProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // seed the preview from an existing uploaded value (e.g. editing a profile
  // that already has a car photo) so the thumbnail shows immediately
  const [preview, setPreview] = useState<string | null>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yuklashda xatolik");
      onChange(null);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">
        {label} {required && <span className="text-danger-400">*</span>}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/5 p-3 transition-colors hover:border-accent-500/50 hover:bg-white/[0.07]"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-slate-500">
            <ImagePlus className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1 text-sm">
          {loading ? (
            <span className="flex items-center gap-1.5 text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Yuklanmoqda...
            </span>
          ) : value ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Rasm yuklandi
            </span>
          ) : (
            <span className="text-slate-500">Rasm tanlash uchun bosing</span>
          )}
        </div>
        {value && !loading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              setPreview(null);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-danger-400"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger-400">{error}</p>}
    </div>
  );
}
