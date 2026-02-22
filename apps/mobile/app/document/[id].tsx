import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Trash2,
  Pill,
  Search,
} from "lucide-react-native";
import { Colors } from "../../lib/colors";
import { supabase } from "../../lib/supabase";

type DocumentData = {
  id: string;
  title: string;
  summary: string;
  image_url: string;
  document_type: string | null;
  key_findings: string[];
  medications: string[];
  created_at: string;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      const { data } = await supabase
        .from("documents")
        .select(
          "id, title, summary, image_url, document_type, key_findings, medications, created_at"
        )
        .eq("id", id)
        .single();
      setDoc(data);
      setLoading(false);
    };
    if (id) fetchDoc();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Document",
      "Are you sure you want to delete this document?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await supabase.from("documents").delete().eq("id", id);
            router.back();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  if (!doc) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Document not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const date = new Date(doc.created_at).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const findings = Array.isArray(doc.key_findings) ? doc.key_findings : [];
  const meds = Array.isArray(doc.medications) ? doc.medications : [];

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
          Document
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Delete document"
        >
          <Trash2 size={20} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {doc.image_url && (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: doc.image_url }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{doc.title}</Text>
            {doc.document_type && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{doc.document_type}</Text>
              </View>
            )}
          </View>
          <Text style={styles.date}>{date}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Summary</Text>
          <Text style={styles.cardContent}>{doc.summary}</Text>
        </View>

        {findings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Search size={14} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Key Findings</Text>
            </View>
            {findings.map((finding, i) => (
              <View key={i} style={styles.findingItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.findingText}>{finding}</Text>
              </View>
            ))}
          </View>
        )}

        {meds.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Pill size={14} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Medications</Text>
            </View>
            {meds.map((med, i) => (
              <View key={i} style={styles.medPill}>
                <Text style={styles.medText}>{med}</Text>
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
  imageWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: SCREEN_WIDTH - 32,
    height: 240,
  },
  titleSection: { gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: Colors.foreground,
  },
  typeBadge: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    color: Colors.accent,
    textTransform: "uppercase",
  },
  date: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
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
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
  },
  findingItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 7,
  },
  findingText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 20,
  },
  medPill: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  medText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.accent,
  },
});
