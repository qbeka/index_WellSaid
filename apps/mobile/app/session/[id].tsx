import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
} from "lucide-react-native";
import { Colors } from "../../lib/colors";
import { supabase } from "../../lib/supabase";

type SessionData = {
  id: string;
  title: string;
  transcript: string | null;
  summary: string | null;
  key_topics: string[];
  action_items: string[];
  created_at: string;
};

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase
        .from("sessions")
        .select("id, title, transcript, summary, key_topics, action_items, created_at")
        .eq("id", id)
        .single();
      setSession(data);
      setLoading(false);
    };
    if (id) fetchSession();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Session not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const date = new Date(session.created_at).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const topics = Array.isArray(session.key_topics) ? session.key_topics : [];
  const actions = Array.isArray(session.action_items) ? session.action_items : [];

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
          Session
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>{session.title}</Text>
          <View style={styles.dateLine}>
            <Clock size={12} color={Colors.muted} />
            <Text style={styles.date}>{date}</Text>
          </View>
        </View>

        {topics.length > 0 && (
          <View style={styles.topicsRow}>
            {topics.map((topic) => (
              <View key={topic} style={styles.topicPill}>
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            ))}
          </View>
        )}

        {session.summary && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Summary</Text>
            <Text style={styles.cardContent}>{session.summary}</Text>
          </View>
        )}

        {actions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Action Items</Text>
            {actions.map((item, i) => (
              <View key={i} style={styles.actionItem}>
                <CheckCircle2 size={16} color={Colors.accent} />
                <Text style={styles.actionText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {session.transcript && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.transcriptToggle}
              onPress={() => setShowTranscript(!showTranscript)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={showTranscript ? "Hide transcript" : "Show transcript"}
            >
              <Text style={styles.transcriptToggleText}>
                {showTranscript ? "Hide Full Transcript" : "Show Full Transcript"}
              </Text>
            </TouchableOpacity>
            {showTranscript && (
              <View style={styles.card}>
                <Text style={styles.transcriptText}>
                  {session.transcript}
                </Text>
              </View>
            )}
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
  title: {
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: Colors.foreground,
  },
  dateLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  date: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  topicsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  topicPill: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  topicText: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.accent,
  },
  card: {
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardContent: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 24,
  },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 20,
  },
  transcriptToggle: {
    paddingVertical: 8,
  },
  transcriptToggleText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.accent,
  },
  transcriptText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 22,
  },
});
