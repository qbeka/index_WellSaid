import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GradientColors } from "../lib/colors";

interface Props {
  children: React.ReactNode;
}

export default function GradientBackground({ children }: Props) {
  return (
    <LinearGradient
      colors={[...GradientColors.authBg]}
      style={styles.gradient}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
