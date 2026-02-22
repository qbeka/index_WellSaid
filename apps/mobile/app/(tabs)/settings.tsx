import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogOut, Phone, Globe } from "lucide-react-native";
import { Colors } from "../../lib/colors";
import { supabase } from "../../lib/supabase";
import LanguageSelect from "../../components/LanguageSelect";

export default function SettingsScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState("en");
  const [hospitalPhone, setHospitalPhone] = useState("");
  const [phoneExtension, setPhoneExtension] = useState("");
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
        .select("preferred_language, hospital_phone, phone_extension")
        .eq("id", user.id)
        .single();

      if (profile) {
        setLanguage(profile.preferred_language || "en");
        setHospitalPhone(profile.hospital_phone || "");
        setPhoneExtension(profile.phone_extension || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      Alert.alert("Error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
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
      <Text style={styles.screenTitle}>Settings</Text>
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
            <Text style={styles.sectionLabel}>Language</Text>
          </View>
          <LanguageSelect selectedCode={language} onSelect={setLanguage} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Phone size={14} color={Colors.muted} />
            <Text style={styles.sectionLabel}>Hospital Phone</Text>
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
              {saved ? "Saved" : "Save"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <LogOut size={20} color={Colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
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
    paddingTop: 8,
    paddingBottom: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 20, paddingBottom: 100 },
  profileSection: { alignItems: "center", gap: 10, paddingVertical: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    height: 48,
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
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 48,
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
