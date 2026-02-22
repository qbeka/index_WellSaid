import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Phone,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
} from "lucide-react-native";
import { Colors } from "../lib/colors";
import { getAuthHeaders } from "../lib/api";

type StatusEntry = { step: string; message: string; time: string };
type AppointmentResult = {
  appointmentDate: string;
  appointmentTime: string;
  providerName: string;
  location: string;
  confirmationNotes: string;
};

const now = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

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
  const [phase, setPhase] = useState<"idle" | "calling" | "done" | "error">(
    "idle"
  );
  const [reason, setReason] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [phoneExtension, setPhoneExtension] = useState("");
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [result, setResult] = useState<AppointmentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const parseSSE = (text: string) => {
    const lines = text.split("\n");
    let eventType = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7);
      } else if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (eventType === "status") {
            setStatuses((prev) => [...prev, { ...data, time: now() }]);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
          } else if (eventType === "result") {
            setResult(data);
            setPhase("done");
          } else if (eventType === "error") {
            setErrorMsg(data.message);
            setPhase("error");
          }
        } catch {}
      }
    }
  };

  const handleStartCall = async () => {
    setPhase("calling");
    setStatuses([]);
    setResult(null);
    setErrorMsg("");

    try {
      const API_URL =
        process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/schedule-call`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          reason: reason.trim(),
          doctorName: doctorName.trim() || undefined,
          preferredDate: preferredDate || undefined,
          preferredTime: preferredTime || undefined,
          notes: notes.trim() || undefined,
          phoneExtension: phoneExtension.trim() || undefined,
        }),
      });

      if (!res.ok) {
        setErrorMsg("Failed to start scheduling. Please try again.");
        setPhase("error");
        return;
      }

      if (res.body && typeof res.body.getReader === "function") {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          for (const part of parts) parseSSE(part);
        }
        if (buffer.trim()) parseSSE(buffer);
      } else {
        const text = await res.text();
        parseSSE(text);
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setPhase("error");
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
        <Text style={styles.headerTitle}>Schedule Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {phase === "idle" && (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Reason for visit</Text>
                <TextInput
                  style={styles.input}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="e.g. Annual checkup"
                  placeholderTextColor={Colors.muted}
                  accessibilityLabel="Reason for visit"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Doctor name (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={doctorName}
                  onChangeText={setDoctorName}
                  placeholder="e.g. Dr. Smith"
                  placeholderTextColor={Colors.muted}
                  accessibilityLabel="Doctor name"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  Phone extension (optional)
                </Text>
                <TextInput
                  style={styles.input}
                  value={phoneExtension}
                  onChangeText={setPhoneExtension}
                  placeholder="e.g. 4302"
                  placeholderTextColor={Colors.muted}
                  keyboardType="number-pad"
                  accessibilityLabel="Phone extension"
                />
              </View>
              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Preferred date</Text>
                  <TextInput
                    style={styles.input}
                    value={preferredDate}
                    onChangeText={setPreferredDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.muted}
                    accessibilityLabel="Preferred date"
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Preferred time</Text>
                  <TextInput
                    style={styles.input}
                    value={preferredTime}
                    onChangeText={setPreferredTime}
                    placeholder="HH:MM"
                    placeholderTextColor={Colors.muted}
                    accessibilityLabel="Preferred time"
                  />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, { height: 80, paddingTop: 12 }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional information..."
                  placeholderTextColor={Colors.muted}
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel="Additional notes"
                />
              </View>
            </>
          )}

          {phase !== "idle" && (
            <View style={styles.statusFeed}>
              {statuses.length === 0 && phase === "calling" ? (
                <View style={styles.statusLoading}>
                  <ActivityIndicator size="small" color={Colors.accent} />
                  <Text style={styles.statusLoadingText}>
                    Starting call...
                  </Text>
                </View>
              ) : (
                <>
                  {statuses.map((s, i) => (
                    <View key={i} style={styles.statusItem}>
                      {s.step === "confirmed" ? (
                        <CheckCircle size={16} color={Colors.success} />
                      ) : (
                        <View style={styles.statusDot} />
                      )}
                      <View style={styles.statusContent}>
                        <Text style={styles.statusMessage}>{s.message}</Text>
                        <Text style={styles.statusTime}>{s.time}</Text>
                      </View>
                    </View>
                  ))}
                  {phase === "calling" && (
                    <View style={styles.statusItem}>
                      <ActivityIndicator size="small" color={Colors.accent} />
                      <Text style={styles.statusLoadingText}>Working...</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {phase === "done" && result && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <CheckCircle size={18} color={Colors.success} />
                <Text style={styles.resultTitle}>Appointment Confirmed</Text>
              </View>
              <View style={styles.resultDetails}>
                <View style={styles.resultRow}>
                  <Calendar size={14} color={Colors.muted} />
                  <Text style={styles.resultText}>
                    {formatDate(result.appointmentDate)}
                  </Text>
                </View>
                {result.appointmentTime && (
                  <View style={styles.resultRow}>
                    <Clock size={14} color={Colors.muted} />
                    <Text style={styles.resultText}>
                      {formatTime(result.appointmentTime)}
                    </Text>
                  </View>
                )}
                {result.providerName && (
                  <View style={styles.resultRow}>
                    <User size={14} color={Colors.muted} />
                    <Text style={styles.resultText}>
                      {result.providerName}
                    </Text>
                  </View>
                )}
                {result.location && (
                  <View style={styles.resultRow}>
                    <MapPin size={14} color={Colors.muted} />
                    <Text style={styles.resultText}>{result.location}</Text>
                  </View>
                )}
                {result.confirmationNotes && (
                  <Text style={styles.resultNotes}>
                    {result.confirmationNotes}
                  </Text>
                )}
              </View>
            </View>
          )}

          {phase === "error" && (
            <View style={styles.errorCard}>
              <AlertCircle size={18} color={Colors.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomActions}>
          {phase === "idle" && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleStartCall}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Start scheduling"
            >
              <Phone size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Start Scheduling</Text>
            </TouchableOpacity>
          )}
          {phase === "done" && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.back()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="View appointments"
            >
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          )}
          {phase === "error" && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                setPhase("idle");
                setStatuses([]);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <RotateCcw size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 100 },
  field: { gap: 4 },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.foreground,
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
  },
  row: { flexDirection: "row", gap: 10 },
  statusFeed: {
    borderRadius: 16,
    backgroundColor: Colors.backgroundMuted,
    padding: 16,
    gap: 12,
  },
  statusLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 40,
  },
  statusLoadingText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  statusItem: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginTop: 5,
  },
  statusContent: { flex: 1 },
  statusMessage: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
  },
  statusTime: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    marginTop: 2,
  },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(76,175,125,0.3)",
    backgroundColor: "rgba(76,175,125,0.05)",
    padding: 16,
    gap: 12,
  },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  resultTitle: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
  },
  resultDetails: { gap: 8 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  resultText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
  },
  resultNotes: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    lineHeight: 18,
    marginTop: 4,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(217,83,79,0.3)",
    backgroundColor: "rgba(217,83,79,0.05)",
    padding: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
  },
  bottomActions: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
});
