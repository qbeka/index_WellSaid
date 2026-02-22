import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import GradientBackground from "../../components/GradientBackground";
import LanguageSelect from "../../components/LanguageSelect";
import { supabase } from "../../lib/supabase";

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [language, setLanguage] = useState("en");
  const [hospitalPhone, setHospitalPhone] = useState("");
  const [phoneExtension, setPhoneExtension] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid =
    step === 0
      ? firstName.trim().length > 0
      : step === 1
        ? true
        : hospitalPhone.trim().length > 0;

  const handleNext = async () => {
    if (step < 2) {
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
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.dot, i <= step && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.content}>
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>What's your name?</Text>
              <TextInput
                style={styles.input}
                placeholder="First name"
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Last name"
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          )}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Preferred language</Text>
              <Text style={styles.stepSub}>
                We'll use this across the app
              </Text>
              <LanguageSelect
                selectedCode={language}
                onSelect={setLanguage}
                light
              />
            </View>
          )}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Hospital phone</Text>
              <Text style={styles.stepSub}>For scheduling appointments</Text>
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
              <Text style={styles.backText}>Back</Text>
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
                {step === 2 ? "Get Started" : "Next"}
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
