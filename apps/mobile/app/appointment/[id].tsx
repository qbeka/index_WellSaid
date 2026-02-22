import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Trash2,
} from "lucide-react-native";
import { Colors } from "../../lib/colors";
import { supabase } from "../../lib/supabase";

type AppointmentData = {
  id: string;
  title: string;
  provider_name: string | null;
  location: string | null;
  date: string;
  time: string | null;
  notes: string | null;
  status: "upcoming" | "completed" | "cancelled";
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  upcoming: { bg: Colors.accentSoft, text: Colors.accent },
  completed: { bg: "rgba(76,175,125,0.1)", text: Colors.success },
  cancelled: { bg: Colors.border, text: Colors.muted },
};

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

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointment = async () => {
      const { data } = await supabase
        .from("appointments")
        .select(
          "id, title, provider_name, location, date, time, notes, status"
        )
        .eq("id", id)
        .single();
      setAppointment(data);
      setLoading(false);
    };
    if (id) fetchAppointment();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Appointment",
      "Are you sure you want to delete this appointment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await supabase.from("appointments").delete().eq("id", id);
            router.back();
          },
        },
      ]
    );
  };

  const handleStatusChange = async (
    newStatus: "completed" | "cancelled"
  ) => {
    await supabase
      .from("appointments")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
    setAppointment((prev) => (prev ? { ...prev, status: newStatus } : prev));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Appointment not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusStyle =
    STATUS_STYLES[appointment.status] ?? STATUS_STYLES.upcoming;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Appointment
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Delete appointment"
        >
          <Trash2 size={20} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{appointment.title}</Text>
            <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                {appointment.status.charAt(0).toUpperCase() +
                  appointment.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Calendar size={16} color={Colors.accent} />
            <Text style={styles.detailText}>
              {formatDate(appointment.date)}
            </Text>
          </View>
          {appointment.time && (
            <View style={styles.detailRow}>
              <Clock size={16} color={Colors.accent} />
              <Text style={styles.detailText}>
                {formatTime(appointment.time)}
              </Text>
            </View>
          )}
          {appointment.provider_name && (
            <View style={styles.detailRow}>
              <User size={16} color={Colors.accent} />
              <Text style={styles.detailText}>
                {appointment.provider_name}
              </Text>
            </View>
          )}
          {appointment.location && (
            <View style={styles.detailRow}>
              <MapPin size={16} color={Colors.accent} />
              <Text style={styles.detailText}>{appointment.location}</Text>
            </View>
          )}
          {appointment.notes && (
            <View style={styles.detailRow}>
              <FileText size={16} color={Colors.accent} />
              <Text style={styles.detailText}>{appointment.notes}</Text>
            </View>
          )}
        </View>

        {appointment.status === "upcoming" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => handleStatusChange("completed")}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Mark as completed"
            >
              <Text style={styles.completeBtnText}>Mark Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleStatusChange("cancelled")}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cancel appointment"
            >
              <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
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
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    color: Colors.foreground,
  },
  backLink: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.accent,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
    textAlign: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
  titleSection: { gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: Colors.foreground,
  },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontFamily: "DMSans_500Medium" },
  detailsCard: {
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 14,
  },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  detailText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 22,
  },
  actionButtons: { gap: 10 },
  completeBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  completeBtnText: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
  cancelBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    color: Colors.danger,
  },
});
