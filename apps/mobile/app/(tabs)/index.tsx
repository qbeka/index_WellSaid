import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
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
import { Text } from "../../components/AccessibleText";
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
  ArrowRight,
  Settings,
  X,
  ShieldAlert,
} from "lucide-react-native";
import { Colors } from "../../lib/colors";
import { useI18n } from "../../lib/i18n";
import { supabase } from "../../lib/supabase";
import { sendChatMessage } from "../../lib/chat";
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

const TypingIndicator = ({ label }: { label: string }) => {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return <Text style={styles.typingText}>{`${label}${".".repeat(dotCount)}`}</Text>;
};

const WORDS_PER_TICK = 2;
const TICK_MS = 30;

const TypewriterText = ({ text, style, onFinish }: { text: string; style: any; onFinish?: () => void }) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const words = useRef(text.split(/(\s+)/)).current;
  const totalParts = words.length;
  const finished = visibleCount >= totalParts;

  useEffect(() => {
    if (finished) {
      onFinish?.();
      return;
    }
    const timer = setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + WORDS_PER_TICK, totalParts));
    }, TICK_MS);
    return () => clearTimeout(timer);
  }, [visibleCount, finished, totalParts, onFinish]);

  return (
    <Text style={style}>
      {words.slice(0, visibleCount).join("")}
      {!finished && <Text style={{ opacity: 0.4 }}>|</Text>}
    </Text>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [firstName, setFirstName] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const QUICK_PROMPTS = [
    t("home.prompt1"),
    t("home.prompt2"),
    t("home.prompt3"),
    t("home.prompt4"),
  ];

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

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % QUICK_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handlePromptClick = (prompt: string) => {
    if (chatLoading) return;
    setInputText("");
    const userMsg: ChatMessage = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    sendChatMessage(
      [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))
    )
      .then((text) => {
        setMessages((prev) => {
          const next = [...prev, { role: "assistant" as const, content: text }];
          setTypingIndex(next.length - 1);
          return next;
        });
      })
      .catch(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Something went wrong. Please try again." },
        ]);
      })
      .finally(() => setChatLoading(false));
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || chatLoading) return;
    setInputText("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const text = await sendChatMessage(
        [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }))
      );
      setMessages((prev) => {
        const next = [...prev, { role: "assistant" as const, content: text }];
        setTypingIndex(next.length - 1);
        return next;
      });
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

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("home.greeting.morning");
    if (h < 17) return t("home.greeting.afternoon");
    return t("home.greeting.evening");
  };
  const greeting = firstName ? `${getGreeting()}, ${firstName}` : getGreeting();

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
              <View style={styles.homeHeader}>
                <View style={{ width: 40 }} />
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={styles.settingsBtn}
                  onPress={() => router.push("/(tabs)/settings")}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Settings"
                >
                  <Settings size={22} color={Colors.muted} />
                </TouchableOpacity>
              </View>
              <View style={styles.greetingSection}>
                <Text style={styles.greeting}>{greeting}</Text>
                <Text style={styles.subtitle}>
                  {t("home.subtitle")}
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
                    {appointments.length} {t("home.upcoming")}{" "}
                    {appointments.length === 1 ? t("home.appointment") : t("home.appointments")}
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
                      <Text style={styles.sectionTitle}>{t("home.actionItems")}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push("/(tabs)/health")}
                      accessibilityRole="button"
                      accessibilityLabel="View all action items"
                    >
                      <Text style={styles.viewAll}>{t("home.viewAll")}</Text>
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
                          {item.source} · {formatActionDate(item.date)}
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
                  <Text style={styles.quickBtnText}>{t("home.recordNote")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => router.push("/schedule-call")}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Schedule appointment"
                >
                  <CalendarPlus size={20} color={Colors.accent} />
                  <Text style={styles.quickBtnText}>{t("home.scheduleVisit")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => router.push("/(tabs)/documents")}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Scan document"
                >
                  <ScanLine size={20} color={Colors.accent} />
                  <Text style={styles.quickBtnText}>{t("home.scanDoc")}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.emergencyBtn}
                onPress={() => router.push("/emergency")}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t("emergency.title")}
              >
                <ShieldAlert size={20} color="#fff" />
                <Text style={styles.emergencyBtnText}>{t("emergency.title")}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.chatMessages}>
              <TouchableOpacity
                style={styles.newChatBtn}
                onPress={() => { setMessages([]); setTypingIndex(null); }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="New conversation"
              >
                <X size={16} color={Colors.muted} />
                <Text style={styles.newChatText}>{t("common.newChat")}</Text>
              </TouchableOpacity>
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                const isTyping = i === typingIndex;

                return (
                  <View
                    key={i}
                    style={[
                      styles.chatBubble,
                      isUser ? styles.chatBubbleUser : styles.chatBubbleAssistant,
                    ]}
                  >
                    <Text style={styles.chatLabel}>
                      {isUser ? t("common.you") : "WellSaid"}
                    </Text>
                    {!isUser && isTyping ? (
                      <TypewriterText
                        text={msg.content}
                        style={styles.chatText}
                        onFinish={() => setTypingIndex(null)}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.chatText,
                          isUser && { color: "#fff" },
                        ]}
                      >
                        {msg.content}
                      </Text>
                    )}
                  </View>
                );
              })}
              {chatLoading && (
                <View style={[styles.chatBubble, styles.chatBubbleAssistant]}>
                  <TypingIndicator label={t("home.thinking")} />
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {messages.length === 0 && (
          <TouchableOpacity
            style={styles.promptSuggestion}
            onPress={() => handlePromptClick(QUICK_PROMPTS[promptIndex])}
            disabled={chatLoading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={QUICK_PROMPTS[promptIndex]}
          >
            <Text style={styles.promptSuggestionText} numberOfLines={1}>
              {QUICK_PROMPTS[promptIndex]}
            </Text>
            <ArrowRight size={14} color={Colors.muted} />
          </TouchableOpacity>
        )}

        <View style={styles.chatBar}>
          <TextInput
            style={styles.chatInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t("home.askPlaceholder")}
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
  homeHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  greetingSection: { alignItems: "center", paddingTop: 20, paddingBottom: 20, gap: 6 },
  greeting: {
    fontSize: 24,
    fontFamily: "DMSans_700Bold",
    color: Colors.foreground,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
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
    borderWidth: 1.5,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 6,
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
    borderRadius: 14,
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
    marginTop: 4,
    marginBottom: 16,
  },
  quickBtn: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  quickBtnText: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.foreground,
  },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginBottom: 4,
  },
  newChatText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.muted,
  },
  chatMessages: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  chatBubble: { borderRadius: 18, padding: 14 },
  chatBubbleUser: {
    backgroundColor: Colors.accent,
    marginLeft: 48,
  },
  chatBubbleAssistant: {
    backgroundColor: Colors.backgroundMuted,
    marginRight: 48,
  },
  chatLabel: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    color: Colors.muted,
    marginBottom: 4,
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  chatText: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 22,
  },
  typingText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.muted,
    letterSpacing: 0.2,
  },
  promptSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundMuted,
    paddingHorizontal: 16,
  },
  promptSuggestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
  },
  chatBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chatInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.3 },
  emergencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#c0392b",
  },
  emergencyBtnText: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
});
