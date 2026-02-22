import { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text } from "../components/AccessibleText";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, SendHorizonal, Mic, Square, PenLine } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { Colors } from "../lib/colors";
import { supabase } from "../lib/supabase";
import { callOpenAI, transcribeAudio } from "../lib/openai";
import { useI18n } from "../lib/i18n";

type Phase = "ready" | "recording" | "typing" | "transcribing" | "processing";

const EXTRACT_PROMPT = `You are a medical visit session organizer. Given the user's raw description of a doctor visit or medical appointment, extract a structured session summary.
Return JSON with this exact shape:
{
  "title": "short descriptive title for this visit",
  "summary": "concise paragraph summarizing the visit",
  "key_topics": ["topic1", "topic2"],
  "action_items": ["follow up action 1", "follow up action 2"]
}
If there are no action items or topics, return empty arrays. Be concise and clear.`;

export default function RecordSessionScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("ready");
  const [typedText, setTypedText] = useState("");
  const recordingRef = useRef<Audio.Recording | null>(null);

  const handleSubmit = async (text: string) => {
    if (text.trim().length < 10) {
      Alert.alert("Too short", "Please provide more detail for your session.");
      return;
    }
    setPhase("processing");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const raw = await callOpenAI(
        [
          { role: "system", content: EXTRACT_PROMPT },
          { role: "user", content: text.trim() },
        ],
        { type: "json_object" }
      );

      const parsed = JSON.parse(raw);

      await supabase.from("sessions").insert({
        user_id: user.id,
        title: parsed.title || "Visit Session",
        transcript: text.trim(),
        summary: parsed.summary || null,
        key_topics: parsed.key_topics || [],
        action_items: parsed.action_items || [],
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message || t("record.failed"));
      setPhase("typing");
    }
  };

  const handleStartRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission needed", "Microphone access is required to record.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setPhase("recording");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Alert.alert(t("common.error"), "Could not start recording.");
    }
  };

  const handleStopRecording = async () => {
    if (!recordingRef.current) return;
    setPhase("transcribing");
    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error("No audio file");

      const text = await transcribeAudio(uri);
      if (!text) {
        Alert.alert("No speech detected", "Please try again.");
        setPhase("ready");
        return;
      }
      setTypedText(text);
      setPhase("typing");
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message || "Transcription failed.");
      setPhase("ready");
    }
  };

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

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
        <Text style={styles.headerTitle}>{t("record.title")}</Text>
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
              <Text style={styles.processingText}>{t("record.processing")}</Text>
            </View>
          ) : phase === "transcribing" ? (
            <View style={styles.processingState}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.processingText}>{t("record.transcribing")}</Text>
            </View>
          ) : phase === "typing" ? (
            <>
              <Text style={styles.sectionLabel}>{t("record.ready")}</Text>
              <View style={styles.transcriptCard}>
                <TextInput
                  style={styles.textArea}
                  value={typedText}
                  onChangeText={setTypedText}
                  placeholder={t("record.placeholder")}
                  placeholderTextColor={Colors.muted}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                  accessibilityLabel="Session text"
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.description}>
                {t("record.ready")}
              </Text>
              <View style={styles.transcriptCard}>
                <Text style={styles.transcriptPlaceholder}>
                  {t("record.placeholder")}
                </Text>
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
                  onPress={handleStartRecording}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Record voice"
                >
                  <Mic size={28} color={Colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.recordBtn}
                  onPress={() => { setPhase("typing"); setTypedText(""); }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Type session"
                >
                  <PenLine size={22} color={Colors.accent} />
                </TouchableOpacity>
              </View>
              <Text style={styles.actionHint}>Tap mic to record or pen to type</Text>
            </>
          )}
          {phase === "recording" && (
            <>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.recordBtn, { backgroundColor: Colors.danger, borderColor: Colors.danger }]}
                  onPress={handleStopRecording}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Stop recording"
                >
                  <Square size={22} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.actionHint, { color: Colors.danger }]}>{t("record.recording")}</Text>
            </>
          )}
          {phase === "typing" && (
            <>
              <TouchableOpacity
                style={[styles.submitBtn, !typedText.trim() && styles.submitBtnDisabled]}
                onPress={() => handleSubmit(typedText)}
                disabled={!typedText.trim()}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Save session"
              >
                <SendHorizonal size={18} color="#fff" />
                <Text style={styles.submitBtnText}>{t("record.submit")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setPhase("ready"); setTypedText(""); }}
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "DMSans_600SemiBold", color: Colors.foreground },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  description: { fontSize: 15, fontFamily: "DMSans_400Regular", color: Colors.muted, lineHeight: 22, textAlign: "center" },
  sectionLabel: { fontSize: 13, fontFamily: "DMSans_500Medium", color: Colors.muted },
  transcriptCard: { minHeight: 160, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", borderColor: Colors.border, backgroundColor: Colors.backgroundMuted, padding: 16 },
  transcriptPlaceholder: { fontSize: 15, fontFamily: "DMSans_400Regular", color: Colors.muted, textAlign: "center", paddingTop: 40 },
  textArea: { flex: 1, minHeight: 140, fontSize: 15, fontFamily: "DMSans_400Regular", color: Colors.foreground, lineHeight: 22 },
  processingState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16 },
  processingText: { fontSize: 15, fontFamily: "DMSans_400Regular", color: Colors.muted },
  bottomActions: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  actionRow: { flexDirection: "row", justifyContent: "center", gap: 20 },
  recordBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  actionHint: { fontSize: 14, fontFamily: "DMSans_400Regular", color: Colors.muted, textAlign: "center", marginTop: 4 },
  submitBtn: { height: 52, borderRadius: 16, backgroundColor: Colors.accent, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 16, fontFamily: "DMSans_600SemiBold", color: "#fff" },
  cancelBtn: { height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontFamily: "DMSans_500Medium", color: Colors.muted },
});
