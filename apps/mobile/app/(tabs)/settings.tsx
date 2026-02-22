import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Text } from "../../components/AccessibleText";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogOut, Phone, Globe, Eye, ShieldAlert } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "../../lib/colors";
import { supabase } from "../../lib/supabase";
import LanguageSelect from "../../components/LanguageSelect";
import { useI18n } from "../../lib/i18n";
import { useAccessibility } from "../../lib/accessibility";

export default function SettingsScreen() {
  const router = useRouter();
  const { t, setLang } = useI18n();
  const { setHighLegibility: setGlobalHighLegibility } = useAccessibility();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState("en");
  const [hospitalPhone, setHospitalPhone] = useState("");
  const [phoneExtension, setPhoneExtension] = useState("");
  const [highLegibility, setHighLegibility] = useState(false);
  const [careCirclePhone, setCareCirclePhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const fullName =
        user.user_metadata?.full_name || user.user_metadata?.name || "";
      const avatar =
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
      setName(fullName);
      setAvatarUrl(avatar);

      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_language, hospital_phone, phone_extension, high_legibility, care_circle_phone")
        .eq("id", user.id)
        .single();

      if (profile) {
        setLanguage(profile.preferred_language || "en");
        setHospitalPhone(profile.hospital_phone || "");
        setPhoneExtension(profile.phone_extension || "");
        setHighLegibility(profile.high_legibility || false);
        setCareCirclePhone(profile.care_circle_phone || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({
          preferred_language: language,
          hospital_phone: hospitalPhone.trim() || null,
          phone_extension: phoneExtension.trim() || null,
          high_legibility: highLegibility,
          care_circle_phone: careCirclePhone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      setLang(language);
      setGlobalHighLegibility(highLegibility);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      Alert.alert(t("common.error"), t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t("common.signOut"), t("settings.signOutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.signOut"),
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const initials = name
    ? name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.screenTitle}>{t("settings.title")}</Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <Text style={styles.profileName}>{name || "User"}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={14} color={Colors.muted} />
            <Text style={styles.sectionLabel}>{t("settings.language")}</Text>
          </View>
          <LanguageSelect selectedCode={language} onSelect={setLanguage} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Phone size={14} color={Colors.muted} />
            <Text style={styles.sectionLabel}>{t("settings.hospitalPhone")}</Text>
          </View>
          <TextInput
            style={styles.input}
            value={hospitalPhone}
            onChangeText={setHospitalPhone}
            placeholder="(555) 555-5555"
            placeholderTextColor={Colors.muted}
            keyboardType="phone-pad"
            accessibilityLabel="Hospital phone number"
          />
          <TextInput
            style={styles.input}
            value={phoneExtension}
            onChangeText={setPhoneExtension}
            placeholder="Ext. (optional)"
            placeholderTextColor={Colors.muted}
            keyboardType="number-pad"
            accessibilityLabel="Phone extension"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={14} color={Colors.muted} />
            <Text style={styles.sectionLabel}>{t("settings.highLegibility")}</Text>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleDescription}>{t("settings.highLegibilityDesc")}</Text>
            <Switch
              value={highLegibility}
              onValueChange={(val) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHighLegibility(val); }}
              trackColor={{ false: Colors.border, true: Colors.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Phone size={14} color={Colors.muted} />
            <Text style={styles.sectionLabel}>{t("settings.careCirclePhone")}</Text>
          </View>
          <TextInput
            style={styles.input}
            value={careCirclePhone}
            onChangeText={setCareCirclePhone}
            placeholder={t("settings.careCirclePhonePlaceholder")}
            placeholderTextColor={Colors.muted}
            keyboardType="phone-pad"
            accessibilityLabel={t("settings.careCirclePhone")}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, (saving || saved) && styles.saveBtnActive]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Save settings"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>
              {saved ? t("common.saved") : t("common.save")}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emergencyBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); router.push("/emergency"); }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t("emergency.title")}
        >
          <ShieldAlert size={20} color="#fff" />
          <Text style={styles.emergencyBtnText}>{t("emergency.title")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <LogOut size={20} color={Colors.danger} />
          <Text style={styles.signOutText}>{t("common.signOut")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: Colors.foreground,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 20, paddingBottom: 100 },
  profileSection: { alignItems: "center", gap: 12, paddingVertical: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 24,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
  profileName: {
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
  },
  section: { gap: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.muted,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
  },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnActive: {},
  saveBtnText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  toggleDescription: {
    flex: 1,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    marginRight: 12,
  },
  emergencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#c0392b",
  },
  emergencyBtnText: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    color: Colors.danger,
  },
});
