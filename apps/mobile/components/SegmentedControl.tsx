import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../lib/colors";

interface Props {
  tabs: string[];
  active: number;
  onChange: (index: number) => void;
}

export default function SegmentedControl({ tabs, active, onChange }: Props) {
  return (
    <View style={styles.container}>
      {tabs.map((label, i) => (
        <TouchableOpacity
          key={label}
          style={[styles.tab, active === i && styles.tabActive]}
          onPress={() => onChange(i)}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === i }}
        >
          <Text style={[styles.label, active === i && styles.labelActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { fontSize: 12, fontFamily: "DMSans_500Medium", color: Colors.muted },
  labelActive: { color: Colors.foreground, fontFamily: "DMSans_600SemiBold" },
});
