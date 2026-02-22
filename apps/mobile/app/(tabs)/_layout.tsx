import { Tabs, useRouter } from "expo-router";
import { Platform, TouchableOpacity, View, Text, StyleSheet } from "react-native";
import {
  Home,
  HeartPulse,
  FileText,
  Languages,
  Mic,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "../../lib/colors";
import { useI18n } from "../../lib/i18n";

const TAB_ICON_SIZE = 22;

const RecordButton = () => {
  const router = useRouter();
  const { t } = useI18n();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/record-session");
  };

  return (
    <TouchableOpacity
      style={styles.recordButton}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Record session"
    >
      <View style={styles.recordButtonInner}>
        <Mic size={24} color="#fff" />
      </View>
      <Text style={styles.recordLabel}>{t("nav.record")}</Text>
    </TouchableOpacity>
  );
};

export default function TabLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: {
          fontFamily: "DMSans_500Medium",
          fontSize: 10,
          letterSpacing: 0.1,
        },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 88 : 64,
        },
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          tabBarIcon: ({ color }) => (
            <Home size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: t("nav.health"),
          tabBarIcon: ({ color }) => (
            <HeartPulse size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          tabBarButton: () => <RecordButton />,
        }}
        listeners={{ tabPress: (e) => e.preventDefault() }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: t("nav.documents"),
          tabBarIcon: ({ color }) => (
            <FileText size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="translate"
        options={{
          title: t("nav.translate"),
          tabBarIcon: ({ color }) => (
            <Languages size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  recordButton: {
    alignItems: "center",
    justifyContent: "flex-end",
    top: -12,
    width: 72,
  },
  recordButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recordLabel: {
    fontSize: 10,
    fontFamily: "DMSans_500Medium",
    color: Colors.accent,
    marginTop: 4,
    letterSpacing: 0.1,
  },
});
