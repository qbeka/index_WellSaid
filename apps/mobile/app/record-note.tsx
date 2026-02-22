import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  SendHorizonal,
  PenLine,
} from "lucide-react-native";
import { Colors } from "../lib/colors";
import { apiPost } from "../lib/api";
import { supabase } from "../lib/supabase";

type Phase = "ready" | "recording" | "typing" | "processing";

export default function RecordNoteScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("ready");
  const [transcript, setTranscript] = useState("");
  const [typedText, setTypedText] = useState("");
  const [language, setLanguage] = useState("English");

  useEffect(() => {
    const fetchLang = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", user.id)
        .single();
      if (data?.preferred_language) {
        const langMap: Record<string, string> = {
          en: "English",
          es: "Spanish",
          zh: "Mandarin",
          ko: "Korean",
          ja: "Japanese",
          vi: "Vietnamese",
          tl: "Tagalog",
          ar: "Arabic",
          pt: "Portuguese",
          sq: "Albanian",
          fr: "French",
          hi: "Hindi",
          ru: "Russian",
        };
        setLanguage(langMap[data.preferred_language] || "English");
      }
    };
    fetchLang();
  }, []);

  const handleSubmit = async (text: string) => {
    if (text.trim().length < 5) {
      Alert.alert("Too short", "Please provide more detail for your note.");
      return;
    }
    setPhase("processing");
    try {
      await apiPost("/api/extract-note", {
        rawText: text.trim(),
        language,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to process note. Please try again.");
      setPhase("ready");
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
        <Text style={styles.headerTitle}>Record Note</Text>
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
          {phase === "processing" ? (
            <View style={styles.processingState}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.processingText}>
                Processing your note...
              </Text>
            </View>
          ) : phase === "typing" ? (
            <>
              <Text style={styles.sectionLabel}>Write your health note</Text>
              <View style={styles.transcriptCard}>
                <TextInput
                  style={styles.textArea}
                  value={typedText}
                  onChangeText={setTypedText}
                  placeholder="Describe your symptoms, medications, or anything health-related..."
                  placeholderTextColor={Colors.muted}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                  accessibilityLabel="Health note text"
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.description}>
                Record a voice note or type about your health. We'll organize it
                into a structured note with action items.
              </Text>

              <View style={styles.transcriptCard}>
                {transcript ? (
                  <Text style={styles.transcriptText}>{transcript}</Text>
                ) : (
                  <Text style={styles.transcriptPlaceholder}>
                    Your note will appear here
                  </Text>
                )}
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.bottomActions}>
          {phase === "ready" && (
            <>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.recordBtn}
                  onPress={() => {
                    setPhase("typing");
                    setTypedText("");
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Write a note"
                >
                  <PenLine size={22} color={Colors.accent} />
                </TouchableOpacity>
              </View>
              <Text style={styles.actionHint}>Tap to write your note</Text>
            </>
          )}
          {phase === "typing" && (
            <>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  !typedText.trim() && styles.submitBtnDisabled,
                ]}
                onPress={() => handleSubmit(typedText)}
                disabled={!typedText.trim()}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Save note"
              >
                <SendHorizonal size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Save Note</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setPhase("ready");
                  setTypedText("");
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
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
  scrollContent: { padding: 16, gap: 16 },
  description: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    lineHeight: 22,
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.muted,
  },
  transcriptCard: {
    minHeight: 160,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundMuted,
    padding: 16,
  },
  transcriptText: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 22,
  },
  transcriptPlaceholder: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    textAlign: "center",
    paddingTop: 40,
  },
  textArea: {
    flex: 1,
    minHeight: 140,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 22,
  },
  processingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 16,
  },
  processingText: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  bottomActions: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  actionRow: { flexDirection: "row", justifyContent: "center", gap: 16 },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionHint: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    textAlign: "center",
    marginTop: 4,
  },
  submitBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
  cancelBtn: {
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.muted,
  },
});
