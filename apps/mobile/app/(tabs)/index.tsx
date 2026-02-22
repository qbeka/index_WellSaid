import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Calendar,
  ListChecks,
  NotebookPen,
  CalendarPlus,
  ScanLine,
  Mic,
  SendHorizonal,
  CheckCircle2,
  Square,
  Loader2,
} from "lucide-react-native";
import { Colors } from "../../lib/colors";
import { supabase } from "../../lib/supabase";
import { apiPost } from "../../lib/api";
import { fetchWithCache } from "../../lib/cache";

type ActionItem = { text: string; source: string; date: string };
type Appointment = {
  id: string;
  title: string;
  date: string;
  time: string | null;
  status: string;
};
type ChatMessage = { role: "user" | "assistant"; content: string };

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${minutes} ${ampm}`;
};

const formatActionDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function HomeScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await fetchWithCache("profile", () =>
      supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single()
        .then((r) => r.data)
    );
    setFirstName(profile?.first_name ?? "");

    const { data: appts } = await fetchWithCache("appointments", () =>
      supabase
        .from("appointments")
        .select("id, title, date, time, status")
        .eq("user_id", user.id)
        .eq("status", "upcoming")
        .order("date", { ascending: true })
        .limit(5)
        .then((r) => r.data ?? [])
    );
    setAppointments(appts);

    const [notesRes, sessionsRes] = await Promise.all([
      fetchWithCache("health-notes-actions", () =>
        supabase
          .from("health_notes")
          .select("title, action_items, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .then((r) => r.data ?? [])
      ),
      fetchWithCache("sessions-actions", () =>
        supabase
          .from("sessions")
          .select("title, action_items, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .then((r) => r.data ?? [])
      ),
    ]);

    const noteItems = notesRes.data.flatMap((n: any) =>
      (Array.isArray(n.action_items) ? n.action_items : []).map(
        (item: string) => ({ text: item, source: n.title, date: n.created_at })
      )
    );
    const sessionItems = sessionsRes.data.flatMap((s: any) =>
      (Array.isArray(s.action_items) ? s.action_items : []).map(
        (item: string) => ({ text: item, source: s.title, date: s.created_at })
      )
    );
    const all = [...noteItems, ...sessionItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setActionItems(all.slice(0, 8));
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || chatLoading) return;
    setInputText("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await apiPost<{ text: string }>("/api/chat", {
        messages: [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.text || "Sorry, I could not respond." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  const greeting = firstName
    ? `${getGreeting()}, ${firstName}`
    : getGreeting();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />
          }
          onContentSizeChange={() => {
            if (messages.length > 0) scrollRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {messages.length === 0 ? (
            <>
              <View style={styles.greetingSection}>
                <Text style={styles.greeting}>{greeting}</Text>
                <Text style={styles.subtitle}>
                  Your health assistant is here to help
                </Text>
              </View>

              {appointments.length > 0 && (
                <TouchableOpacity
                  style={styles.appointmentBanner}
                  onPress={() => router.push("/(tabs)/health")}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${appointments.length} upcoming appointments`}
                >
                  <Calendar size={18} color={Colors.accent} />
                  <Text style={styles.appointmentBannerText}>
                    {appointments.length} upcoming{" "}
                    {appointments.length === 1 ? "appointment" : "appointments"}
                  </Text>
                </TouchableOpacity>
              )}

              {appointments.length > 0 && (
                <FlatList
                  horizontal
                  data={appointments}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.appointmentList}
                  renderItem={({ item }) => (
                    <View style={styles.appointmentCard}>
                      <Text style={styles.appointmentTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={styles.appointmentMeta}>
                        <Calendar size={12} color={Colors.muted} />
                        <Text style={styles.appointmentDate}>
                          {formatDate(item.date)}
                        </Text>
                      </View>
                      {item.time && (
                        <Text style={styles.appointmentTime}>
                          {formatTime(item.time)}
                        </Text>
                      )}
                    </View>
                  )}
                />
              )}

              {actionItems.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <ListChecks size={16} color={Colors.accent} />
                      <Text style={styles.sectionTitle}>Action Items</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push("/(tabs)/health")}
                      accessibilityRole="button"
                      accessibilityLabel="View all action items"
                    >
                      <Text style={styles.viewAll}>View all</Text>
                    </TouchableOpacity>
                  </View>
                  {actionItems.map((item, i) => (
                    <View key={`${item.source}-${i}`} style={styles.actionCard}>
                      <CheckCircle2
                        size={16}
                        color={Colors.accent}
                        style={{ marginTop: 2 }}
                      />
                      <View style={styles.actionContent}>
                        <Text style={styles.actionText}>{item.text}</Text>
                        <Text style={styles.actionMeta}>
                          {item.source} -- {formatActionDate(item.date)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => router.push("/record-note")}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Record health note"
                >
                  <NotebookPen size={20} color={Colors.accent} />
                  <Text style={styles.quickBtnText}>Record Note</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => router.push("/schedule-call")}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Schedule appointment"
                >
                  <CalendarPlus size={20} color={Colors.accent} />
                  <Text style={styles.quickBtnText}>Schedule Visit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => router.push("/(tabs)/documents")}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Scan document"
                >
                  <ScanLine size={20} color={Colors.accent} />
                  <Text style={styles.quickBtnText}>Scan Doc</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.chatMessages}>
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.chatBubble,
                    msg.role === "user"
                      ? styles.chatBubbleUser
                      : styles.chatBubbleAssistant,
                  ]}
                >
                  <Text style={styles.chatLabel}>
                    {msg.role === "user" ? "You" : "WellSaid"}
                  </Text>
                  <Text
                    style={[
                      styles.chatText,
                      msg.role === "user" && { color: "#fff" },
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}
              {chatLoading && (
                <View style={[styles.chatBubble, styles.chatBubbleAssistant]}>
                  <ActivityIndicator size="small" color={Colors.muted} />
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.chatBar}>
          <TextInput
            style={styles.chatInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask WellSaid anything..."
            placeholderTextColor={Colors.muted}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!chatLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || chatLoading) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || chatLoading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {chatLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <SendHorizonal size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  greetingSection: { alignItems: "center", paddingTop: 24, paddingBottom: 16, gap: 4 },
  greeting: {
    fontSize: 22,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  appointmentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  appointmentBannerText: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
  },
  appointmentList: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  appointmentCard: {
    width: 160,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  appointmentTitle: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
  },
  appointmentMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  appointmentDate: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  appointmentTime: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  section: { marginHorizontal: 16, marginBottom: 16, gap: 6 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
  },
  viewAll: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.accent,
  },
  actionCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionContent: { flex: 1, gap: 2 },
  actionText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 20,
  },
  actionMeta: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  quickBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  quickBtnText: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.foreground,
  },
  chatMessages: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  chatBubble: { borderRadius: 16, padding: 14 },
  chatBubbleUser: {
    backgroundColor: Colors.accent,
    marginLeft: 40,
  },
  chatBubbleAssistant: {
    backgroundColor: Colors.backgroundMuted,
    marginRight: 40,
  },
  chatLabel: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.muted,
    marginBottom: 4,
    opacity: 0.7,
  },
  chatText: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 22,
  },
  chatBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chatInput: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.3 },
});
