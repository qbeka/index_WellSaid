"use client";

import { useEffect, useState } from "react";
import {
  Heart,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Languages,
  Navigation,
  Hospital,
  Pill,
  Loader2,
  Check,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/i18n";
import { SUPPORTED_LANGUAGES } from "@wellsaid/shared";

type Medication = { name: string; dosage: string; frequency: string };

type TravelProfile = {
  blood_type: string;
  allergies: string;
  medications: Medication[];
  conditions: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  insurance_provider: string;
  insurance_id: string;
  notes: string;
};

type NearbyPlace = {
  id: number;
  name: string;
  type: string;
  lat: number;
  lon: number;
  distance: number;
  phone?: string;
  address?: string;
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const emptyProfile: TravelProfile = {
  blood_type: "",
  allergies: "",
  medications: [{ name: "", dosage: "", frequency: "" }],
  conditions: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  insurance_provider: "",
  insurance_id: "",
  notes: "",
};

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const TravelContent = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<TravelProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [translateLang, setTranslateLang] = useState("es");
  const [translatedProfile, setTranslatedProfile] = useState<string | null>(
    null
  );
  const [translating, setTranslating] = useState(false);
  const [translateDropdownOpen, setTranslateDropdownOpen] = useState(false);

  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [savedPhone, setSavedPhone] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("travel_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          blood_type: data.blood_type || "",
          allergies: Array.isArray(data.allergies)
            ? data.allergies.join(", ")
            : data.allergies || "",
          medications:
            Array.isArray(data.medications) && data.medications.length > 0
              ? data.medications
              : [{ name: "", dosage: "", frequency: "" }],
          conditions: Array.isArray(data.conditions)
            ? data.conditions.join(", ")
            : data.conditions || "",
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_contact_phone: data.emergency_contact_phone || "",
          insurance_provider: data.insurance_provider || "",
          insurance_id: data.insurance_id || "",
          notes: data.notes || "",
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const buildProfileText = (p: TravelProfile): string => {
    const lines: string[] = [];
    lines.push("=== PATIENT MEDICAL PROFILE ===");
    if (p.blood_type) lines.push(`Blood Type: ${p.blood_type}`);
    if (p.allergies) lines.push(`Allergies: ${p.allergies}`);
    if (p.conditions) lines.push(`Medical Conditions: ${p.conditions}`);
    const meds = p.medications.filter((m) => m.name.trim());
    if (meds.length > 0) {
      lines.push("Medications:");
      meds.forEach((m) => {
        lines.push(
          `  - ${m.name}${m.dosage ? ` (${m.dosage})` : ""}${m.frequency ? ` - ${m.frequency}` : ""}`
        );
      });
    }
    if (p.emergency_contact_name || p.emergency_contact_phone) {
      lines.push(
        `Emergency Contact: ${p.emergency_contact_name || "N/A"} - ${p.emergency_contact_phone || "N/A"}`
      );
    }
    if (p.insurance_provider)
      lines.push(
        `Insurance: ${p.insurance_provider}${p.insurance_id ? ` (ID: ${p.insurance_id})` : ""}`
      );
    if (p.notes) lines.push(`Additional Notes: ${p.notes}`);
    return lines.join("\n");
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const allergiesArr = profile.allergies
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const conditionsArr = profile.conditions
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const medsArr = profile.medications.filter((m) => m.name.trim());

    await supabase.from("travel_profiles").upsert(
      {
        user_id: user.id,
        blood_type: profile.blood_type || null,
        allergies: allergiesArr,
        medications: medsArr,
        conditions: conditionsArr,
        emergency_contact_name:
          profile.emergency_contact_name.trim() || null,
        emergency_contact_phone:
          profile.emergency_contact_phone.trim() || null,
        insurance_provider: profile.insurance_provider.trim() || null,
        insurance_id: profile.insurance_id.trim() || null,
        notes: profile.notes.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTranslate = async () => {
    setTranslating(true);
    setTranslatedProfile(null);
    try {
      const targetLabel =
        SUPPORTED_LANGUAGES.find((l) => l.code === translateLang)?.label ||
        translateLang;
      const profileText = buildProfileText(profile);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a medical translator. Translate the following patient medical profile into ${targetLabel}. Keep the formatting clean and structured with clear section headers. Use medical terminology appropriate for healthcare professionals. Output plain text with clear section headers using === for headers.`,
            },
            { role: "user", content: profileText },
          ],
        }),
      });
      const data = await res.json();
      setTranslatedProfile(
        data.content || data.message || "Translation failed"
      );
    } catch {
      setTranslatedProfile("Translation failed. Please try again.");
    } finally {
      setTranslating(false);
    }
  };

  const handleAddMedication = () => {
    setProfile((p) => ({
      ...p,
      medications: [...p.medications, { name: "", dosage: "", frequency: "" }],
    }));
  };

  const handleRemoveMedication = (index: number) => {
    setProfile((p) => ({
      ...p,
      medications: p.medications.filter((_, i) => i !== index),
    }));
  };

  const handleMedicationChange = (
    index: number,
    field: keyof Medication,
    value: string
  ) => {
    setProfile((p) => ({
      ...p,
      medications: p.medications.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const handleFindNearby = () => {
    setLocating(true);
    setLocationError("");
    setPlaces([]);

    if (!navigator.geolocation) {
      setLocationError(t("travel.locationNotSupported"));
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const query = `[out:json][timeout:10];(node["amenity"~"hospital|clinic|doctors|pharmacy"](around:5000,${latitude},${longitude});way["amenity"~"hospital|clinic|doctors|pharmacy"](around:5000,${latitude},${longitude}););out center body;`;
          const res = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: `data=${encodeURIComponent(query)}`,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });
          const data = await res.json();

          const results: NearbyPlace[] = (data.elements || [])
            .filter((el: Record<string, unknown>) => (el.tags as Record<string, string>)?.name)
            .map((el: Record<string, unknown>) => {
              const tags = el.tags as Record<string, string>;
              const center = el.center as { lat: number; lon: number } | undefined;
              const lat = (el.lat as number) || center?.lat || 0;
              const lon = (el.lon as number) || center?.lon || 0;
              return {
                id: el.id,
                name: tags.name,
                type: tags.amenity,
                lat,
                lon,
                distance: getDistance(latitude, longitude, lat, lon),
                phone:
                  tags.phone || tags["contact:phone"] || undefined,
                address:
                  [
                    tags["addr:street"],
                    tags["addr:housenumber"],
                    tags["addr:city"],
                  ]
                    .filter(Boolean)
                    .join(", ") || undefined,
              };
            })
            .sort((a: NearbyPlace, b: NearbyPlace) => a.distance - b.distance);

          setPlaces(results);
        } catch {
          setLocationError(t("travel.searchFailed"));
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationError(t("travel.locationDenied"));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSavePhone = async (phone: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        hospital_phone: phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSavedPhone(phone);
    setTimeout(() => setSavedPhone(null), 3000);
  };

  const getTypeIcon = (type: string) => {
    if (type === "pharmacy") return Pill;
    return Hospital;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "pharmacy":
        return t("travel.pharmacy");
      case "hospital":
        return t("travel.hospital");
      case "clinic":
        return t("travel.clinic");
      case "doctors":
        return t("travel.doctor");
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2
          size={24}
          className="animate-spin text-[var(--color-accent)]"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Health Profile */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Heart size={20} className="text-[var(--color-accent)]" />
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {t("travel.profileTitle")}
          </h2>
        </div>
        <p className="mb-6 text-sm text-[var(--color-muted)]">
          {t("travel.profileDesc")}
        </p>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)]">
              {t("travel.bloodType")}
            </label>
            <select
              value={profile.blood_type}
              onChange={(e) =>
                setProfile((p) => ({ ...p, blood_type: e.target.value }))
              }
              className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
            >
              <option value="">{t("travel.selectBloodType")}</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)]">
              {t("travel.allergies")}
            </label>
            <input
              type="text"
              value={profile.allergies}
              onChange={(e) =>
                setProfile((p) => ({ ...p, allergies: e.target.value }))
              }
              placeholder={t("travel.allergiesPlaceholder")}
              className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)]">
              {t("travel.conditions")}
            </label>
            <input
              type="text"
              value={profile.conditions}
              onChange={(e) =>
                setProfile((p) => ({ ...p, conditions: e.target.value }))
              }
              placeholder={t("travel.conditionsPlaceholder")}
              className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-[var(--color-muted)]">
              {t("travel.medications")}
            </label>
            {profile.medications.map((med, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={med.name}
                  onChange={(e) =>
                    handleMedicationChange(i, "name", e.target.value)
                  }
                  placeholder={t("travel.medName")}
                  className="h-10 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                />
                <input
                  type="text"
                  value={med.dosage}
                  onChange={(e) =>
                    handleMedicationChange(i, "dosage", e.target.value)
                  }
                  placeholder={t("travel.medDosage")}
                  className="h-10 w-28 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                />
                <input
                  type="text"
                  value={med.frequency}
                  onChange={(e) =>
                    handleMedicationChange(i, "frequency", e.target.value)
                  }
                  placeholder={t("travel.medFrequency")}
                  className="h-10 w-28 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                />
                {profile.medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(i)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-red-500"
                    aria-label="Remove medication"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddMedication}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-[var(--color-foreground)]"
            >
              <Plus size={16} />
              {t("travel.addMedication")}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)]">
              {t("travel.emergencyContact")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={profile.emergency_contact_name}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    emergency_contact_name: e.target.value,
                  }))
                }
                placeholder={t("travel.contactName")}
                className="h-11 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
              />
              <input
                type="tel"
                value={profile.emergency_contact_phone}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    emergency_contact_phone: e.target.value,
                  }))
                }
                placeholder={t("travel.contactPhone")}
                className="h-11 w-44 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)]">
              {t("travel.insurance")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={profile.insurance_provider}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    insurance_provider: e.target.value,
                  }))
                }
                placeholder={t("travel.insuranceProvider")}
                className="h-11 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
              />
              <input
                type="text"
                value={profile.insurance_id}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    insurance_id: e.target.value,
                  }))
                }
                placeholder={t("travel.insuranceId")}
                className="h-11 w-44 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)]">
              {t("travel.additionalNotes")}
            </label>
            <textarea
              value={profile.notes}
              onChange={(e) =>
                setProfile((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder={t("travel.notesPlaceholder")}
              rows={3}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {saving && <Loader2 size={18} className="animate-spin" />}
              {saving
                ? t("common.saving")
                : saved
                  ? t("common.saved")
                  : t("common.save")}
            </button>
          </div>
        </div>
      </section>

      {/* Translate */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Languages size={20} className="text-[var(--color-accent)]" />
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {t("travel.translateProfile")}
          </h2>
        </div>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          {t("travel.translateDesc")}
        </p>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setTranslateDropdownOpen(!translateDropdownOpen)}
              className="flex h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 text-sm font-medium text-[var(--color-foreground)]"
            >
              {SUPPORTED_LANGUAGES.find((l) => l.code === translateLang)
                ?.label || translateLang}
              <ChevronDown
                size={14}
                className={`text-[var(--color-muted)] transition-transform ${translateDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {translateDropdownOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 max-h-60 w-48 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setTranslateLang(l.code);
                      setTranslateDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-[var(--color-background-muted)] ${
                      translateLang === l.code
                        ? "font-medium text-[var(--color-accent)]"
                        : "text-[var(--color-foreground)]"
                    }`}
                  >
                    {l.label}
                    {translateLang === l.code && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleTranslate}
            disabled={translating}
            className="flex h-11 items-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {translating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Languages size={16} />
            )}
            {t("travel.translate")}
          </button>
        </div>

        {translatedProfile && (
          <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-6">
            <pre className="whitespace-pre-wrap font-[family-name:var(--font-dm-sans)] text-sm leading-relaxed text-[var(--color-foreground)]">
              {translatedProfile}
            </pre>
          </div>
        )}
      </section>

      {/* Nearby Providers */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <MapPin size={20} className="text-[var(--color-accent)]" />
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {t("travel.nearbyTitle")}
          </h2>
        </div>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          {t("travel.nearbyDesc")}
        </p>

        <button
          type="button"
          onClick={handleFindNearby}
          disabled={locating}
          className="flex h-12 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background-muted)] disabled:opacity-50"
        >
          {locating ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Navigation size={18} />
          )}
          {locating ? t("travel.searching") : t("travel.findNearby")}
        </button>

        {locationError && (
          <p className="mt-3 text-sm text-red-500">{locationError}</p>
        )}

        {places.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            {places.map((place) => {
              const TypeIcon = getTypeIcon(place.type);
              return (
                <div
                  key={place.id}
                  className="flex items-center gap-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-background-muted)]">
                    <TypeIcon
                      size={20}
                      className="text-[var(--color-accent)]"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium text-[var(--color-foreground)]">
                      {place.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                      <span className="rounded-md bg-[var(--color-background-muted)] px-2 py-0.5 text-[11px] font-medium uppercase text-[var(--color-accent)]">
                        {getTypeLabel(place.type)}
                      </span>
                      <span>{place.distance.toFixed(1)} km</span>
                      {place.address && <span>{place.address}</span>}
                    </div>
                    {place.phone && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                        <Phone size={11} />
                        <span>{place.phone}</span>
                      </div>
                    )}
                  </div>
                  {place.phone && (
                    <button
                      type="button"
                      onClick={() => handleSavePhone(place.phone!)}
                      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${
                        savedPhone === place.phone
                          ? "bg-green-50 text-green-600"
                          : "border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-background-muted)] hover:text-[var(--color-foreground)]"
                      }`}
                      aria-label={`Save ${place.name} phone to settings`}
                    >
                      {savedPhone === place.phone ? (
                        <Check size={14} />
                      ) : (
                        <Phone size={14} />
                      )}
                      {savedPhone === place.phone
                        ? t("common.saved")
                        : t("travel.saveToSettings")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!locating && places.length === 0 && !locationError && (
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            {t("travel.noResultsYet")}
          </p>
        )}
      </section>
    </div>
  );
};
