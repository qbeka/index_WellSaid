import { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Text } from "../components/AccessibleText";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Phone, X } from "lucide-react-native";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Colors } from "../lib/colors";
import { supabase } from "../lib/supabase";
import { transcribeAudio, callOpenAI } from "../lib/openai";
import { useI18n } from "../lib/i18n";

type Phase = "starting" | "recording" | "processing" | "done";

export default function EmergencyScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("starting");
  const [carePhone, setCarePhone] = useState("");
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.back(); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("care_circle_phone")
        .eq("id", user.id)
        .single();

      if (!profile?.care_circle_phone) {
        Alert.alert(t("common.error"), t("emergency.notConfigured"), [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }

      setCarePhone(profile.care_circle_phone);
      await startRecording();
    };
    init();

    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== "recording") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulseAnim]);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { Alert.alert(t("common.error"), "Microphone access required."); router.back(); return; }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setPhase("recording");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      Alert.alert(t("common.error"), "Could not start recording.");
      router.back();
    }
  };

  const handleStop = async () => {
    if (!recordingRef.current) return;

    setPhase("processing");
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("No recording URI");

      const transcript = await transcribeAudio(uri);
      if (!transcript.trim()) throw new Error("Empty transcription");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const raw = await callOpenAI(
        [
          {
            role: "system",
            content: `You are a medical note organizer. Extract a structured note from the emergency recording transcript. Return JSON: { "title": "short title", "content": "summary", "action_items": ["item1"] }`,
          },
          { role: "user", content: transcript },
        ],
        { type: "json_object" }
      );

      const parsed = JSON.parse(raw);

      await supabase.from("health_notes").insert({
        user_id: user.id,
        title: parsed.title || "Emergency Note",
        content: parsed.content || transcript,
        action_items: parsed.action_items || [],
      });

      await supabase.from("care_circle_alerts").insert({
        user_id: user.id,
        phone_number: carePhone,
        transcript: transcript,
        note_title: parsed.title || "Emergency Note",
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase("done");

      Alert.alert(t("emergency.alertSent"), "", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("common.error"), t("emergency.alertFailed"), [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };

  const handleCancel = async () => {
    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
        >
          <X size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("emergency.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.center}>
        {phase === "starting" && (
          <ActivityIndicator size="large" color="#fff" />
        )}

        {phase === "recording" && (
          <TouchableOpacity
            onPress={handleStop}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Stop recording"
          >
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
              <Phone size={48} color="#fff" />
            </Animated.View>
            <Text style={styles.recordingLabel}>{t("emergency.recording")}</Text>
          </TouchableOpacity>
        )}

        {phase === "processing" && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingLabel}>{t("common.processing")}</Text>
          </View>
        )}

        {phase === "done" && (
          <Text style={styles.doneLabel}>{t("emergency.alertSent")}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#c0392b",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  recordingLabel: {
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
    textAlign: "center",
    marginTop: 24,
  },
  processingContainer: {
    alignItems: "center",
    gap: 16,
  },
  processingLabel: {
    fontSize: 16,
    fontFamily: "DMSans_500Medium",
    color: "#fff",
  },
  doneLabel: {
    fontSize: 20,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
    textAlign: "center",
  },
});
