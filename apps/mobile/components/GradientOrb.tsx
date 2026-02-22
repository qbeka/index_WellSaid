import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GradientOrbProps {
  size?: number;
}

export default function GradientOrb({ size = 280 }: GradientOrbProps) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient
        colors={["#d4a574", "#b8937a", "#8ba4b8", "#6b8db5"]}
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    opacity: 0.3,
    overflow: "hidden",
  },
});
