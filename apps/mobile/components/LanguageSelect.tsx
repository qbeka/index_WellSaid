import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../lib/colors";
import { SUPPORTED_LANGUAGES } from "../lib/translations";

interface Props {
  selectedCode: string;
  onSelect: (code: string) => void;
  light?: boolean;
}

export default function LanguageSelect({ selectedCode, onSelect, light }: Props) {
  return (
    <View style={styles.grid}>
      {SUPPORTED_LANGUAGES.map((lang) => {
        const active = lang.code === selectedCode;
        return (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.item,
              active && styles.itemActive,
              light && styles.itemLight,
              active && light && styles.itemActiveLight,
            ]}
            onPress={() => onSelect(lang.code)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={lang.label}
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.label,
                active && styles.labelActive,
                light && styles.labelLight,
                active && light && styles.labelActiveLight,
              ]}
            >
              {lang.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  itemActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  itemLight: {
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  itemActiveLight: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderColor: "#fff",
  },
  label: { fontSize: 13, fontFamily: "DMSans_500Medium", color: Colors.foreground },
  labelActive: { color: Colors.accentForeground },
  labelLight: { color: "rgba(255,255,255,0.8)" },
  labelActiveLight: { color: "#fff" },
});
