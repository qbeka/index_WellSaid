import { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Text } from "../../components/AccessibleText";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Camera,
  ImageIcon,
  Loader2,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Colors } from "../../lib/colors";
import { useI18n } from "../../lib/i18n";
import { supabase } from "../../lib/supabase";
import { callOpenAI } from "../../lib/openai";
import { fetchWithCache } from "../../lib/cache";

type Document = {
  id: string;
  title: string;
  summary: string;
  document_type: string | null;
  created_at: string;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function DocumentsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await fetchWithCache("documents", () =>
      supabase
        .from("documents")
        .select("id, title, summary, document_type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then((r) => r.data ?? [])
    );
    setDocuments(data);
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const processImage = async (uri: string) => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const raw = await callOpenAI([
        {
          role: "system",
          content: `You are a medical document scanner. Analyze the image and extract information. Return JSON:
{
  "title": "document title",
  "summary": "brief summary of the document",
  "document_type": "lab_result|prescription|insurance|referral|other",
  "key_findings": ["finding 1", "finding 2"],
  "medications": ["med 1", "med 2"]
}
If fields are not applicable, use empty arrays or null.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Please analyze this medical document." },
            { type: "image_url", image_url: { url: dataUrl } },
          ] as any,
        },
      ], { type: "json_object" });

      const parsed = JSON.parse(raw);

      await supabase.from("documents").insert({
        user_id: user.id,
        title: parsed.title || "Scanned Document",
        summary: parsed.summary || "",
        document_type: parsed.document_type || "other",
        key_findings: parsed.key_findings || [],
        medications: parsed.medications || [],
        image_url: dataUrl,
      });

      await fetchData();
    } catch {
      Alert.alert(t("common.error"), t("documents.scanFailed"));
    } finally {
      setProcessing(false);
    }
  };

  const handleCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("documents.permissionTitle"),
        t("documents.cameraPermission")
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("documents.permissionTitle"),
        t("documents.galleryPermission")
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.screenTitle}>{t("documents.title")}</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleCamera}
          disabled={processing}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t("documents.scanCamera")}
        >
          <Camera size={20} color={Colors.accent} />
          <Text style={styles.actionBtnText}>{t("documents.camera")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleGallery}
          disabled={processing}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t("documents.uploadGallery")}
        >
          <ImageIcon size={20} color={Colors.accent} />
          <Text style={styles.actionBtnText}>{t("documents.gallery")}</Text>
        </TouchableOpacity>
      </View>

      {processing && (
        <View style={styles.processingBanner}>
          <ActivityIndicator size="small" color={Colors.accent} />
          <Text style={styles.processingText}>{t("documents.processing")}</Text>
        </View>
      )}

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t("documents.noDocuments")}</Text>
            <Text style={styles.emptySubtext}>
              {t("documents.emptySubtext")}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/document/${item.id}`); }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.document_type && (
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {item.document_type}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSummary} numberOfLines={2}>
                {item.summary}
              </Text>
              <Text style={styles.metaText}>
                {formatDate(item.created_at)}
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.muted} />
          </TouchableOpacity>
        )}
      />
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
  actionRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.foreground,
  },
  processingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.accentSoft,
  },
  processingText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.accent,
  },
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
  typeBadge: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: "DMSans_500Medium",
    color: Colors.accent,
    textTransform: "uppercase",
  },
  cardSummary: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    lineHeight: 18,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    marginTop: 2,
  },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 6 },
  emptyText: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    color: Colors.foreground,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    textAlign: "center",
    maxWidth: 240,
  },
});
