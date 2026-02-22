import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Text } from "./AccessibleText";
import {
  Heart,
  Plus,
  Trash2,
  Languages,
  ChevronDown,
  Check,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "../lib/colors";
import { supabase } from "../lib/supabase";
import { callOpenAI } from "../lib/openai";
import { useI18n } from "../lib/i18n";
import { SUPPORTED_LANGUAGES } from "../lib/translations";

type Medication = { name: string; dosage: string; frequency: string };

type TravelProfileData = {
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

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const emptyProfile: TravelProfileData = {
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

const buildProfileText = (p: TravelProfileData): string => {
  const lines: string[] = ["=== PATIENT MEDICAL PROFILE ==="];
  if (p.blood_type) lines.push(`Blood Type: ${p.blood_type}`);
  if (p.allergies) lines.push(`Allergies: ${p.allergies}`);
  if (p.conditions) lines.push(`Medical Conditions: ${p.conditions}`);
  const meds = p.medications.filter((m) => m.name.trim());
  if (meds.length > 0) {
    lines.push("Medications:");
    meds.forEach((m) => {
      lines.push(`  - ${m.name}${m.dosage ? ` (${m.dosage})` : ""}${m.frequency ? ` - ${m.frequency}` : ""}`);
    });
  }
  if (p.emergency_contact_name || p.emergency_contact_phone) {
    lines.push(`Emergency Contact: ${p.emergency_contact_name || "N/A"} - ${p.emergency_contact_phone || "N/A"}`);
  }
  if (p.insurance_provider) {
    lines.push(`Insurance: ${p.insurance_provider}${p.insurance_id ? ` (ID: ${p.insurance_id})` : ""}`);
  }
  if (p.notes) lines.push(`Additional Notes: ${p.notes}`);
  return lines.join("\n");
};

export default function TravelProfile() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<TravelProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [translateLang, setTranslateLang] = useState("es");
  const [translatedProfile, setTranslatedProfile] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [bloodPickerOpen, setBloodPickerOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("travel_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          blood_type: data.blood_type || "",
          allergies: Array.isArray(data.allergies) ? data.allergies.join(", ") : data.allergies || "",
          medications: Array.isArray(data.medications) && data.medications.length > 0
            ? data.medications
            : [{ name: "", dosage: "", frequency: "" }],
          conditions: Array.isArray(data.conditions) ? data.conditions.join(", ") : data.conditions || "",
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

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const allergiesArr = profile.allergies.split(",").map((s) => s.trim()).filter(Boolean);
      const conditionsArr = profile.conditions.split(",").map((s) => s.trim()).filter(Boolean);
      const medsArr = profile.medications.filter((m) => m.name.trim());

      await supabase.from("travel_profiles").upsert({
        user_id: user.id,
        blood_type: profile.blood_type || null,
        allergies: allergiesArr,
        medications: medsArr,
        conditions: conditionsArr,
        emergency_contact_name: profile.emergency_contact_name.trim() || null,
        emergency_contact_phone: profile.emergency_contact_phone.trim() || null,
        insurance_provider: profile.insurance_provider.trim() || null,
        insurance_id: profile.insurance_id.trim() || null,
        notes: profile.notes.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      Alert.alert(t("common.error"), t("travel.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleTranslate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTranslating(true);
    setTranslatedProfile(null);
    try {
      const targetLabel = SUPPORTED_LANGUAGES.find((l) => l.code === translateLang)?.label || translateLang;
      const profileText = buildProfileText(profile);

      const result = await callOpenAI([
        {
          role: "system",
          content: `You are a medical translator. Translate the following patient medical profile into ${targetLabel}. Keep the formatting clean and structured with clear section headers. Use medical terminology appropriate for healthcare professionals.`,
        },
        { role: "user", content: profileText },
      ]);

      setTranslatedProfile(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(t("common.error"), t("travel.translateFailed"));
    } finally {
      setTranslating(false);
    }
  };

  const handleAddMedication = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfile((p) => ({
      ...p,
      medications: [...p.medications, { name: "", dosage: "", frequency: "" }],
    }));
  };

  const handleRemoveMedication = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfile((p) => ({
      ...p,
      medications: p.medications.filter((_, i) => i !== index),
    }));
  };

  const handleMedicationChange = (index: number, field: keyof Medication, value: string) => {
    setProfile((p) => ({
      ...p,
      medications: p.medications.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.sectionHeader}>
        <Heart size={16} color={Colors.accent} />
        <Text style={styles.sectionTitle}>{t("travel.profileTitle")}</Text>
      </View>
      <Text style={styles.sectionDesc}>{t("travel.profileDesc")}</Text>

      {/* Blood Type */}
      <View style={styles.field}>
        <Text style={styles.label}>{t("travel.bloodType")}</Text>
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBloodPickerOpen(!bloodPickerOpen); }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t("travel.bloodType")}
        >
          <Text style={[styles.pickerBtnText, !profile.blood_type && { color: Colors.muted }]}>
            {profile.blood_type || t("travel.selectBloodType")}
          </Text>
          <ChevronDown size={14} color={Colors.muted} style={bloodPickerOpen ? { transform: [{ rotate: "180deg" }] } : undefined} />
        </TouchableOpacity>
        {bloodPickerOpen && (
          <View style={styles.dropdown}>
            {BLOOD_TYPES.map((bt) => (
              <TouchableOpacity
                key={bt}
                style={[styles.dropdownItem, profile.blood_type === bt && styles.dropdownItemActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setProfile((p) => ({ ...p, blood_type: bt })); setBloodPickerOpen(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownText, profile.blood_type === bt && { color: Colors.accent }]}>{bt}</Text>
                {profile.blood_type === bt && <Check size={14} color={Colors.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Allergies */}
      <View style={styles.field}>
        <Text style={styles.label}>{t("travel.allergies")}</Text>
        <TextInput
          style={styles.input}
          value={profile.allergies}
          onChangeText={(v) => setProfile((p) => ({ ...p, allergies: v }))}
          placeholder={t("travel.allergiesPlaceholder")}
          placeholderTextColor={Colors.muted}
          accessibilityLabel={t("travel.allergies")}
        />
      </View>

      {/* Conditions */}
      <View style={styles.field}>
        <Text style={styles.label}>{t("travel.conditions")}</Text>
        <TextInput
          style={styles.input}
          value={profile.conditions}
          onChangeText={(v) => setProfile((p) => ({ ...p, conditions: v }))}
          placeholder={t("travel.conditionsPlaceholder")}
          placeholderTextColor={Colors.muted}
          accessibilityLabel={t("travel.conditions")}
        />
      </View>

      {/* Medications */}
      <View style={styles.field}>
        <Text style={styles.label}>{t("travel.medications")}</Text>
        {profile.medications.map((med, i) => (
          <View key={i} style={styles.medRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={med.name}
              onChangeText={(v) => handleMedicationChange(i, "name", v)}
              placeholder={t("travel.medName")}
              placeholderTextColor={Colors.muted}
            />
            <TextInput
              style={[styles.input, { width: 80 }]}
              value={med.dosage}
              onChangeText={(v) => handleMedicationChange(i, "dosage", v)}
              placeholder={t("travel.medDosage")}
              placeholderTextColor={Colors.muted}
            />
            {profile.medications.length > 1 && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveMedication(i)}
                accessibilityRole="button"
                accessibilityLabel="Remove medication"
              >
                <Trash2 size={16} color={Colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleAddMedication}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t("travel.addMedication")}
        >
          <Plus size={16} color={Colors.muted} />
          <Text style={styles.addBtnText}>{t("travel.addMedication")}</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Contact */}
      <View style={styles.field}>
        <Text style={styles.label}>{t("travel.emergencyContact")}</Text>
        <TextInput
          style={styles.input}
          value={profile.emergency_contact_name}
          onChangeText={(v) => setProfile((p) => ({ ...p, emergency_contact_name: v }))}
          placeholder={t("travel.contactName")}
          placeholderTextColor={Colors.muted}
        />
        <TextInput
          style={styles.input}
          value={profile.emergency_contact_phone}
          onChangeText={(v) => setProfile((p) => ({ ...p, emergency_contact_phone: v }))}
          placeholder={t("travel.contactPhone")}
          placeholderTextColor={Colors.muted}
          keyboardType="phone-pad"
        />
      </View>

      {/* Insurance */}
      <View style={styles.field}>
        <Text style={styles.label}>{t("travel.insurance")}</Text>
        <TextInput
          style={styles.input}
          value={profile.insurance_provider}
          onChangeText={(v) => setProfile((p) => ({ ...p, insurance_provider: v }))}
          placeholder={t("travel.insuranceProvider")}
          placeholderTextColor={Colors.muted}
        />
        <TextInput
          style={styles.input}
          value={profile.insurance_id}
          onChangeText={(v) => setProfile((p) => ({ ...p, insurance_id: v }))}
          placeholder={t("travel.insuranceId")}
          placeholderTextColor={Colors.muted}
        />
      </View>

      {/* Notes */}
      <View style={styles.field}>
        <Text style={styles.label}>{t("travel.additionalNotes")}</Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
          value={profile.notes}
          onChangeText={(v) => setProfile((p) => ({ ...p, notes: v }))}
          placeholder={t("travel.notesPlaceholder")}
          placeholderTextColor={Colors.muted}
          multiline
        />
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t("common.save")}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>{saved ? t("common.saved") : t("common.save")}</Text>
        )}
      </TouchableOpacity>

      {/* Translate Section */}
      <View style={styles.translateSection}>
        <View style={styles.sectionHeader}>
          <Languages size={16} color={Colors.accent} />
          <Text style={styles.sectionTitle}>{t("travel.translateProfile")}</Text>
        </View>
        <Text style={styles.sectionDesc}>{t("travel.translateDesc")}</Text>

        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLangPickerOpen(!langPickerOpen); }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Select language"
        >
          <Text style={styles.pickerBtnText}>
            {SUPPORTED_LANGUAGES.find((l) => l.code === translateLang)?.label || translateLang}
          </Text>
          <ChevronDown size={14} color={Colors.muted} style={langPickerOpen ? { transform: [{ rotate: "180deg" }] } : undefined} />
        </TouchableOpacity>

        {langPickerOpen && (
          <View style={styles.dropdown}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {SUPPORTED_LANGUAGES.map((l) => (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.dropdownItem, translateLang === l.code && styles.dropdownItemActive]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTranslateLang(l.code); setLangPickerOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownText, translateLang === l.code && { color: Colors.accent }]}>{l.label}</Text>
                  {translateLang === l.code && <Check size={14} color={Colors.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={styles.translateBtn}
          onPress={handleTranslate}
          disabled={translating}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t("travel.translate")}
        >
          {translating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Languages size={16} color="#fff" />
              <Text style={styles.translateBtnText}>{t("travel.translate")}</Text>
            </>
          )}
        </TouchableOpacity>

        {translatedProfile && (
          <View style={styles.translatedCard}>
            <Text style={styles.translatedText}>{translatedProfile}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
  },
  sectionDesc: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    lineHeight: 18,
    marginTop: -8,
  },
  field: { gap: 6 },
  label: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.muted,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
  },
  pickerBtnText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownItemActive: { backgroundColor: Colors.backgroundMuted },
  dropdownText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
  },
  medRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.border,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.muted,
  },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
  translateSection: {
    gap: 12,
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  translateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.accent,
  },
  translateBtnText: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
  translatedCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundMuted,
    padding: 16,
  },
  translatedText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 22,
  },
});
