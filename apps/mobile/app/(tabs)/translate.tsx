import { useState } from "react";
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
import {
  ArrowDownUp,
  Volume2,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react-native";
import { Colors } from "../../lib/colors";
import { apiPost } from "../../lib/api";
import { SUPPORTED_LANGUAGES } from "../../lib/translations";
import * as Speech from "expo-speech";
import * as Clipboard from "expo-clipboard";

type LangOption = { code: string; label: string };

const LanguagePicker = ({
  label,
  selected,
  onSelect,
  languages,
}: {
  label: string;
  selected: string;
  onSelect: (code: string) => void;
  languages: readonly LangOption[];
}) => {
  const [open, setOpen] = useState(false);
  const current = languages.find((l) => l.code === selected);

  return (
    <View>
      <TouchableOpacity
        style={styles.pickerBtn}
        onPress={() => setOpen(!open)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Select ${label}`}
      >
        <Text style={styles.pickerLabel}>{current?.label ?? label}</Text>
        <ChevronDown
          size={14}
          color={Colors.muted}
          style={open ? { transform: [{ rotate: "180deg" }] } : undefined}
        />
      </TouchableOpacity>
      {open && (
        <View style={styles.pickerDropdown}>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.pickerItem,
                  selected === lang.code && styles.pickerItemActive,
                ]}
                onPress={() => {
                  onSelect(lang.code);
                  setOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selected === lang.code && { color: Colors.accent },
                  ]}
                >
                  {lang.label}
                </Text>
                {selected === lang.code && (
                  <Check size={14} color={Colors.accent} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function TranslateScreen() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [detectedLang, setDetectedLang] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const sourceLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === sourceLang)?.label ?? "English";
  const targetLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.label ?? "Spanish";

  const handleTranslate = async () => {
    const text = sourceText.trim();
    if (!text || loading) return;

    setLoading(true);
    setTranslatedText("");
    setDetectedLang("");

    try {
      const data = await apiPost<{
        translatedText: string;
        detectedSourceLanguage: string;
      }>("/api/translate", { text, targetLanguage: targetLabel });
      setTranslatedText(data.translatedText);
      setDetectedLang(data.detectedSourceLanguage);
    } catch {
      Alert.alert("Error", "Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (!text || speaking) return;
    setSpeaking(true);
    Speech.speak(text, {
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    if (!translatedText) return;
    setSourceText(translatedText);
    setTranslatedText("");
    setDetectedLang("");
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.screenTitle}>Translate</Text>
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
          <View style={styles.card}>
            <LanguagePicker
              label="Source language"
              selected={sourceLang}
              onSelect={setSourceLang}
              languages={SUPPORTED_LANGUAGES}
            />
            {detectedLang ? (
              <Text style={styles.detectedText}>
                Detected: {detectedLang}
              </Text>
            ) : null}
            <TextInput
              style={styles.textArea}
              value={sourceText}
              onChangeText={setSourceText}
              placeholder="Enter text to translate..."
              placeholderTextColor={Colors.muted}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Source text"
            />
            {sourceText.trim().length > 0 && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleSpeak(sourceText)}
                disabled={speaking}
                accessibilityRole="button"
                accessibilityLabel="Listen to source text"
              >
                <Volume2 size={16} color={Colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.swapRow}>
            <TouchableOpacity
              style={styles.swapBtn}
              onPress={handleSwap}
              disabled={!translatedText}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Swap languages"
            >
              <ArrowDownUp
                size={18}
                color={translatedText ? Colors.accent : Colors.muted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <LanguagePicker
              label="Target language"
              selected={targetLang}
              onSelect={setTargetLang}
              languages={SUPPORTED_LANGUAGES}
            />
            {loading ? (
              <View style={styles.loadingArea}>
                <ActivityIndicator size="small" color={Colors.accent} />
                <Text style={styles.loadingText}>Translating...</Text>
              </View>
            ) : translatedText ? (
              <>
                <Text style={styles.translatedText}>{translatedText}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleSpeak(translatedText)}
                    disabled={speaking}
                    accessibilityRole="button"
                    accessibilityLabel="Listen to translation"
                  >
                    <Volume2 size={16} color={Colors.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleCopy(translatedText)}
                    accessibilityRole="button"
                    accessibilityLabel="Copy translation"
                  >
                    {copied ? (
                      <Check size={16} color={Colors.success} />
                    ) : (
                      <Copy size={16} color={Colors.muted} />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.placeholderText}>
                Translation will appear here
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.translateBtn,
              (!sourceText.trim() || loading) && styles.translateBtnDisabled,
            ]}
            onPress={handleTranslate}
            disabled={!sourceText.trim() || loading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Translate"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.translateBtnText}>Translate</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  screenTitle: {
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: Colors.foreground,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 100 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 16,
    gap: 8,
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  pickerLabel: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.foreground,
  },
  pickerDropdown: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginTop: 4,
    overflow: "hidden",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pickerItemActive: { backgroundColor: Colors.backgroundMuted },
  pickerItemText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
  },
  detectedText: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  textArea: {
    minHeight: 100,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 22,
  },
  translatedText: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 22,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    paddingVertical: 20,
  },
  loadingArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  actionRow: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  swapRow: { alignItems: "center" },
  swapBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  translateBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  translateBtnDisabled: { opacity: 0.5 },
  translateBtnText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
});
