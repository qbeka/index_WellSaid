import { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Text } from "../../components/AccessibleText";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Calendar,
  Clock,
  User,
  MapPin,
  ListChecks,
  CheckCircle2,
  FileText,
  Plus,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "../../lib/colors";
import { useI18n } from "../../lib/i18n";
import { supabase } from "../../lib/supabase";
import { fetchWithCache } from "../../lib/cache";
import SegmentedControl from "../../components/SegmentedControl";
import TravelProfile from "../../components/TravelProfile";
import NearbyProviders from "../../components/NearbyProviders";

type Appointment = {
  id: string;
  title: string;
  provider_name: string | null;
  location: string | null;
  date: string;
  time: string | null;
  status: "upcoming" | "completed" | "cancelled";
};

type HealthNote = {
  id: string;
  title: string;
  action_items: string[] | null;
  created_at: string;
};

type Session = {
  id: string;
  title: string;
  summary: string | null;
  key_topics: string[] | null;
  created_at: string;
};

type ActionItem = { text: string; source: string; sourceId: string; date: string };

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  return `${h % 12 || 12}:${minutes} ${h >= 12 ? "PM" : "AM"}`;
};

const formatCreatedDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  upcoming: { bg: Colors.accentSoft, text: Colors.accent },
  completed: { bg: "rgba(76,175,125,0.1)", text: Colors.success },
  cancelled: { bg: Colors.border, text: Colors.muted },
};

export default function HealthScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<HealthNote[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [apptRes, notesRes, sessionsRes] = await Promise.all([
      fetchWithCache("all-appointments", () =>
        supabase
          .from("appointments")
          .select("id, title, provider_name, location, date, time, status")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .then((r) => r.data ?? [])
      ),
      fetchWithCache("all-health-notes", () =>
        supabase
          .from("health_notes")
          .select("id, title, action_items, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .then((r) => r.data ?? [])
      ),
      fetchWithCache("all-sessions", () =>
        supabase
          .from("sessions")
          .select("id, title, summary, key_topics, action_items, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .then((r) => r.data ?? [])
      ),
    ]);

    setAppointments(apptRes.data);
    setNotes(notesRes.data);
    setSessions(sessionsRes.data);

    const noteActions = (notesRes.data as HealthNote[]).flatMap((n) =>
      (n.action_items ?? []).map((item) => ({
        text: item,
        source: n.title,
        sourceId: n.id,
        date: n.created_at,
      }))
    );
    const sessionActionItems = (sessionsRes.data as any[]).flatMap((s: any) =>
      (Array.isArray(s.action_items) ? s.action_items : []).map(
        (item: string) => ({
          text: item,
          source: s.title,
          sourceId: s.id,
          date: s.created_at,
        })
      )
    );
    const all = [...noteActions, ...sessionActionItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setActionItems(all);
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const upcoming = appointments.filter((a) => a.status === "upcoming");
  const past = appointments.filter((a) => a.status !== "upcoming");

  const TABS = [t("health.appointments"), t("health.notes"), t("health.sessions"), t("health.actions"), t("health.travel")];

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const statusStyle = STATUS_STYLES[item.status] ?? STATUS_STYLES.upcoming;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/appointment/${item.id}`); }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                {t(`health.${item.status}`)}
              </Text>
            </View>
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Calendar size={11} color={Colors.muted} />
              <Text style={styles.metaText}>{formatDate(item.date)}</Text>
            </View>
            {item.time && (
              <View style={styles.metaItem}>
                <Clock size={11} color={Colors.muted} />
                <Text style={styles.metaText}>{formatTime(item.time)}</Text>
              </View>
            )}
            {item.provider_name && (
              <View style={styles.metaItem}>
                <User size={11} color={Colors.muted} />
                <Text style={styles.metaText}>{item.provider_name}</Text>
              </View>
            )}
          </View>
        </View>
        <ChevronRight size={18} color={Colors.muted} />
      </TouchableOpacity>
    );
  };

  const renderNote = ({ item }: { item: HealthNote }) => {
    const actionCount = Array.isArray(item.action_items)
      ? item.action_items.length
      : 0;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/health-note/${item.id}`); }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={styles.metaText}>
              {formatCreatedDate(item.created_at)}
            </Text>
            {actionCount > 0 && (
              <View style={styles.metaItem}>
                <ListChecks size={12} color={Colors.accent} />
                <Text style={[styles.metaText, { color: Colors.accent }]}>
                  {actionCount} {actionCount === 1 ? t("health.action") : t("health.actions_plural")}
                </Text>
              </View>
            )}
          </View>
        </View>
        <ChevronRight size={18} color={Colors.muted} />
      </TouchableOpacity>
    );
  };

  const renderSession = ({ item }: { item: Session }) => {
    const topics = (item.key_topics as string[]) ?? [];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/session/${item.id}`); }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.summary && (
            <Text style={styles.cardSummary} numberOfLines={2}>
              {item.summary}
            </Text>
          )}
          <View style={styles.cardMeta}>
            <Text style={styles.metaText}>
              {formatCreatedDate(item.created_at)}
            </Text>
            {topics.slice(0, 3).map((topic) => (
              <View key={topic} style={styles.topicPill}>
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            ))}
          </View>
        </View>
        <ChevronRight size={18} color={Colors.muted} />
      </TouchableOpacity>
    );
  };

  const renderActionItem = ({
    item,
    index,
  }: {
    item: ActionItem;
    index: number;
  }) => (
    <View style={styles.card}>
      <CheckCircle2 size={16} color={Colors.accent} style={{ marginTop: 2 }} />
      <View style={styles.cardBody}>
        <Text style={styles.actionText}>{item.text}</Text>
        <Text style={styles.metaText}>
          {item.source} · {formatCreatedDate(item.date)}
        </Text>
      </View>
    </View>
  );

  const renderEmpty = (emptyKey: string) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{t(emptyKey)}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.screenTitle}>{t("health.title")}</Text>
      <View style={styles.segmentWrapper}>
        <SegmentedControl tabs={TABS} active={tab} onChange={(i) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(i); }} />
      </View>

      {tab === 0 && (
        <>
          <FlatList
            data={[...upcoming, ...past]}
            keyExtractor={(item) => item.id}
            renderItem={renderAppointment}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => renderEmpty("health.noAppointments")}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.accent}
              />
            }
          />
          <TouchableOpacity
            style={styles.fab}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/schedule-call"); }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Schedule appointment"
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {tab === 1 && (
        <>
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={renderNote}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => renderEmpty("health.noNotes")}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.accent}
              />
            }
          />
          <TouchableOpacity
            style={styles.fab}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/record-note"); }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Record health note"
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {tab === 2 && (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSession}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => renderEmpty("health.noSessions")}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accent}
            />
          }
        />
      )}

      {tab === 3 && (
        <FlatList
          data={actionItems}
          keyExtractor={(item, i) => `${item.sourceId}-${i}`}
          renderItem={renderActionItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => renderEmpty("health.noActions")}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accent}
            />
          }
        />
      )}

      {tab === 4 && (
        <View style={{ flex: 1 }}>
          <TravelProfile />
          <View style={{ paddingHorizontal: 16, paddingBottom: 100 }}>
            <NearbyProviders />
          </View>
        </View>
      )}
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
  segmentWrapper: { paddingHorizontal: 16, paddingVertical: 10 },
  listContent: { padding: 16, gap: 10, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cardBody: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    color: Colors.foreground,
    flex: 1,
  },
  cardSummary: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontFamily: "DMSans_500Medium" },
  topicPill: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  topicText: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    color: Colors.accent,
  },
  actionText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 20,
  },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 6 },
  emptyText: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});
