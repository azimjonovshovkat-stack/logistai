"use client";

import { useState } from "react";
import { User as UserIcon, Lock, Truck, Star, ShieldCheck, ShieldAlert, ShieldX, Wallet } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImageUploadField } from "@/components/ImageUploadField";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { api, ApiError } from "@/lib/api";

const STATUS_META: Record<string, { label: string; tone: any; icon: any }> = {
  approved: { label: "Tasdiqlangan", tone: "emerald", icon: ShieldCheck },
  pending: { label: "Kutilmoqda", tone: "amber", icon: ShieldAlert },
  rejected: { label: "Rad etilgan", tone: "red", icon: ShieldX },
};

export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, refresh } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [carName, setCarName] = useState(user?.driver_profile?.car_name ?? "");
  const [carNumber, setCarNumber] = useState(user?.driver_profile?.car_number ?? "");
  const [carYear, setCarYear] = useState(String(user?.driver_profile?.car_year ?? ""));
  const [capacityTons, setCapacityTons] = useState(String(user?.driver_profile?.capacity_tons ?? ""));
  const [carPhotoUrl, setCarPhotoUrl] = useState<string | null>(user?.driver_profile?.car_photo_url ?? null);
  const [licensePhotoUrl, setLicensePhotoUrl] = useState<string | null>(
    user?.driver_profile?.license_photo_url ?? null
  );
  const [savingCar, setSavingCar] = useState(false);

  if (!user) return null;

  async function saveProfile() {
    setSavingProfile(true);
    try {
      await api.patch("/auth/me", { full_name: fullName, phone });
      await refresh();
      toast("Profil ma'lumotlari yangilandi", "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Xatolik yuz berdi", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (newPassword.length < 6) {
      toast("Yangi parol kamida 6 belgidan iborat bo'lishi kerak", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("Yangi parollar mos kelmadi", "error");
      return;
    }
    setChangingPassword(true);
    try {
      await api.post("/auth/change-password", { current_password: currentPassword, new_password: newPassword });
      toast("Parol muvaffaqiyatli almashtirildi", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Xatolik yuz berdi", "error");
    } finally {
      setChangingPassword(false);
    }
  }

  async function saveCarProfile() {
    setSavingCar(true);
    try {
      await api.patch("/drivers/profile", {
        car_name: carName,
        car_number: carNumber,
        car_year: Number(carYear),
        capacity_tons: Number(capacityTons),
        car_photo_url: carPhotoUrl,
        license_photo_url: licensePhotoUrl,
      });
      await refresh();
      toast("Mashina ma'lumotlari yangilandi", "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Xatolik yuz berdi", "error");
    } finally {
      setSavingCar(false);
    }
  }

  const statusMeta = user.role === "driver" ? STATUS_META[user.status] : null;

  return (
    <Modal open={open} onClose={onClose} title="Profil">
      <div className="space-y-6 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500/30 to-emerald-500/30 text-white">
            <UserIcon className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-white">{user.full_name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone={user.role === "admin" ? "blue" : user.role === "driver" ? "emerald" : "amber"}>
                {user.role === "admin" ? "Admin" : user.role === "driver" ? "Haydovchi" : "Yuk beruvchi"}
              </Badge>
              {statusMeta && (
                <Badge tone={statusMeta.tone}>
                  <statusMeta.icon className="h-3 w-3" /> {statusMeta.label}
                </Badge>
              )}
              {user.driver_profile && (
                <Badge tone="gray">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {Number(user.driver_profile.rating).toFixed(1)}
                </Badge>
              )}
              <Badge tone="gray">
                <Wallet className="h-3 w-3" /> {Number(user.balance).toLocaleString("uz-UZ")} so'm
              </Badge>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <UserIcon className="h-3.5 w-3.5" /> Shaxsiy ma'lumotlar
          </div>
          <div className="space-y-3">
            <Input label="To'liq ism" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input label="Telefon raqam" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button onClick={saveProfile} loading={savingProfile} size="sm">
              Saqlash
            </Button>
          </div>
        </section>

        <section className="border-t border-white/5 pt-5">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Lock className="h-3.5 w-3.5" /> Parolni almashtirish
          </div>
          <div className="space-y-3">
            <Input
              label="Joriy parol"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Yangi parol"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label="Tasdiqlash"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={changePassword}
              loading={changingPassword}
              size="sm"
              variant="outline"
              disabled={!currentPassword || !newPassword}
            >
              Parolni yangilash
            </Button>
          </div>
        </section>

        {user.role === "driver" && (
          <section className="border-t border-white/5 pt-5">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Truck className="h-3.5 w-3.5" /> Mashina ma'lumotlari
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Mashina markasi" value={carName} onChange={(e) => setCarName(e.target.value)} />
                <Input label="Davlat raqami" value={carNumber} onChange={(e) => setCarNumber(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Ishlab chiqarilgan yili"
                  type="number"
                  value={carYear}
                  onChange={(e) => setCarYear(e.target.value)}
                />
                <Input
                  label="Sig'imi (tonna)"
                  type="number"
                  step="0.1"
                  value={capacityTons}
                  onChange={(e) => setCapacityTons(e.target.value)}
                />
              </div>
              <ImageUploadField label="Mashina rasmi" value={carPhotoUrl} onChange={setCarPhotoUrl} required />
              <ImageUploadField label="Texpasport rasmi" value={licensePhotoUrl} onChange={setLicensePhotoUrl} />
              <Button onClick={saveCarProfile} loading={savingCar} size="sm" variant="emerald">
                Saqlash
              </Button>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
