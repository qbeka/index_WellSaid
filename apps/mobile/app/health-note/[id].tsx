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
  CheckCircle2,
  Trash2,
} from "lucide-react-native";
import { Colors } from "../../lib/colors";
import { supabase } from "../../lib/supabase";

type Note = {
  id: string;
  title: string;
  content: string;
  action_items: string[];
  created_at: string;
};

export default function HealthNoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      const { data } = await supabase
        .from("health_notes")
        .select("id, title, content, action_items, created_at")
        .eq("id", id)
        .single();
      setNote(data);
      setLoading(false);
    };
    if (id) fetchNote();
  }, [id]);

  const handleDelete = () => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase.from("health_notes").delete().eq("id", id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  if (!note) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Note not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const date = new Date(note.created_at).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const actions = Array.isArray(note.action_items) ? note.action_items : [];

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
          Health Note
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Delete note"
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
          <Text style={styles.title}>{note.title}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.content}>{note.content}</Text>
        </View>

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
  date: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  contentCard: {
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  content: {
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
});
