import { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text } from "../components/AccessibleText";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  CheckCircle,
  Calendar,
  Clock,
  User,
  MapPin,
  ArrowLeft,
} from "lucide-react-native";
import { Colors } from "../lib/colors";
import { supabase } from "../lib/supabase";
import { useI18n } from "../lib/i18n";

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  return `${h % 12 || 12}:${minutes} ${h >= 12 ? "PM" : "AM"}`;
};

export default function ScheduleCallScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [phase, setPhase] = useState<"idle" | "saving" | "done">("idle");
  const [reason, setReason] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    if (!reason.trim()) {
      Alert.alert("Required", "Please enter a reason for the visit.");
      return;
    }
    if (!preferredDate.trim()) {
      Alert.alert("Required", "Please enter a date (YYYY-MM-DD).");
      return;
    }

    setPhase("saving");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("appointments").insert({
        user_id: user.id,
        title: reason.trim(),
        provider_name: doctorName.trim() || null,
        date: preferredDate.trim(),
        time: preferredTime.trim() || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
        status: "upcoming",
      });

      if (error) throw error;
      setPhase("done");
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message || t("schedule.failed"));
      setPhase("idle");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("schedule.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {phase === "done" ? (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <CheckCircle size={18} color={Colors.success} />
                <Text style={styles.resultTitle}>{t("common.saved")}</Text>
              </View>
              <View style={styles.resultDetails}>
                <View style={styles.resultRow}>
                  <Calendar size={14} color={Colors.muted} />
                  <Text style={styles.resultText}>
                    {formatDate(preferredDate)}
                  </Text>
                </View>
                {preferredTime ? (
                  <View style={styles.resultRow}>
                    <Clock size={14} color={Colors.muted} />
                    <Text style={styles.resultText}>
                      {formatTime(preferredTime)}
                    </Text>
                  </View>
                ) : null}
                {doctorName ? (
                  <View style={styles.resultRow}>
                    <User size={14} color={Colors.muted} />
                    <Text style={styles.resultText}>{doctorName}</Text>
                  </View>
                ) : null}
                {location ? (
                  <View style={styles.resultRow}>
                    <MapPin size={14} color={Colors.muted} />
                    <Text style={styles.resultText}>{location}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t("schedule.reason")} *</Text>
                <TextInput
                  style={styles.input}
                  value={reason}
                  onChangeText={setReason}
                  placeholder={t("schedule.reasonPlaceholder")}
                  placeholderTextColor={Colors.muted}
                  accessibilityLabel="Reason for visit"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t("schedule.doctor")}</Text>
                <TextInput
                  style={styles.input}
                  value={doctorName}
                  onChangeText={setDoctorName}
                  placeholder={t("schedule.doctorPlaceholder")}
                  placeholderTextColor={Colors.muted}
                  accessibilityLabel="Doctor name"
                />
              </View>
              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>{t("schedule.date")} *</Text>
                  <TextInput
                    style={styles.input}
                    value={preferredDate}
                    onChangeText={setPreferredDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.muted}
                    accessibilityLabel="Appointment date"
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>{t("schedule.time")}</Text>
                  <TextInput
                    style={styles.input}
                    value={preferredTime}
                    onChangeText={setPreferredTime}
                    placeholder="HH:MM"
                    placeholderTextColor={Colors.muted}
                    accessibilityLabel="Appointment time"
                  />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t("schedule.location")}</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder={t("schedule.locationPlaceholder")}
                  placeholderTextColor={Colors.muted}
                  accessibilityLabel="Location"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t("schedule.notes")}</Text>
                <TextInput
                  style={[styles.input, { height: 80, paddingTop: 12 }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t("schedule.notesPlaceholder")}
                  placeholderTextColor={Colors.muted}
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel="Additional notes"
                />
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.bottomActions}>
          {phase === "idle" && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSave}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Save appointment"
            >
              <Calendar size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>{t("schedule.submit")}</Text>
            </TouchableOpacity>
          )}
          {phase === "saving" && (
            <View style={[styles.primaryBtn, { opacity: 0.7 }]}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.primaryBtnText}>{t("common.saving")}</Text>
            </View>
          )}
          {phase === "done" && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.back()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "DMSans_600SemiBold", color: Colors.foreground },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 100 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13, fontFamily: "DMSans_500Medium", color: Colors.foreground },
  input: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: 16, fontSize: 15, fontFamily: "DMSans_400Regular", color: Colors.foreground },
  row: { flexDirection: "row", gap: 10 },
  resultCard: { borderRadius: 16, borderWidth: 1, borderColor: "rgba(76,175,125,0.3)", backgroundColor: "rgba(76,175,125,0.05)", padding: 16, gap: 12 },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  resultTitle: { fontSize: 14, fontFamily: "DMSans_600SemiBold", color: Colors.foreground },
  resultDetails: { gap: 8 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  resultText: { fontSize: 14, fontFamily: "DMSans_400Regular", color: Colors.foreground },
  bottomActions: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
  primaryBtn: { height: 52, borderRadius: 16, backgroundColor: Colors.accent, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  primaryBtnText: { fontSize: 16, fontFamily: "DMSans_600SemiBold", color: "#fff" },
});
