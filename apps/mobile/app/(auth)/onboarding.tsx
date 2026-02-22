import { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Text } from "../../components/AccessibleText";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import GradientBackground from "../../components/GradientBackground";
import LanguageSelect from "../../components/LanguageSelect";
import { supabase } from "../../lib/supabase";
import { useI18n } from "../../lib/i18n";

export default function OnboardingScreen() {
  const router = useRouter();
  const { t, setLang } = useI18n();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [language, setLanguage] = useState("en");
  const [hospitalPhone, setHospitalPhone] = useState("");
  const [phoneExtension, setPhoneExtension] = useState("");
  const [genderIdentity, setGenderIdentity] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid =
    step === 0
      ? firstName.trim().length > 0
      : true;

  const handleLanguageSelect = (code: string) => {
    setLanguage(code);
    setLang(code);
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("profiles").upsert({
        id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        preferred_language: language,
        hospital_phone: hospitalPhone.trim(),
        phone_extension: phoneExtension.trim(),
        gender_identity: genderIdentity.trim() || null,
        pronouns: pronouns.trim() || null,
        onboarded: true,
        updated_at: new Date().toISOString(),
      });
      router.replace("/(tabs)");
    } catch (e) {
      console.error("Onboarding error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.progress}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.dot, i <= step && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.content}>
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t("onboarding.nameTitle")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("onboarding.firstName")}
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder={t("onboarding.lastName")}
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          )}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t("onboarding.langTitle")}</Text>
              <Text style={styles.stepSub}>
                {t("onboarding.langSubtitle")}
              </Text>
              <LanguageSelect
                selectedCode={language}
                onSelect={handleLanguageSelect}
                light
              />
            </View>
          )}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t("onboarding.genderTitle")}</Text>
              <Text style={styles.stepSub}>{t("onboarding.genderSubtitle")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("onboarding.genderPlaceholder")}
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={genderIdentity}
                onChangeText={setGenderIdentity}
              />
              <TextInput
                style={styles.input}
                placeholder={t("onboarding.pronounsPlaceholder")}
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={pronouns}
                onChangeText={setPronouns}
              />
            </View>
          )}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t("onboarding.phoneTitle")}</Text>
              <Text style={styles.stepSub}>{t("onboarding.phoneSubtitle")}</Text>
              <TextInput
                style={styles.input}
                placeholder="(555) 555-5555"
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={hospitalPhone}
                onChangeText={setHospitalPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Ext. (optional)"
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={phoneExtension}
                onChangeText={setPhoneExtension}
                keyboardType="number-pad"
              />
            </View>
          )}
        </View>

        <View style={styles.bottom}>
          {step > 0 && (
            <TouchableOpacity
              onPress={() => setStep(step - 1)}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>{t("common.back")}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, !isValid && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!isValid || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#1a2b3c" />
            ) : (
              <Text style={styles.nextText}>
                {step === 3 ? t("common.getStarted") : t("common.next")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progress: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: { backgroundColor: "#fff", width: 24 },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  stepContent: { gap: 12 },
  stepTitle: {
    fontSize: 24,
    fontFamily: "DMSans_700Bold",
    color: "#fff",
  },
  stepSub: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  bottom: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  backBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  backText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
  nextBtn: {
    flex: 2,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: "#1a2b3c",
  },
});
