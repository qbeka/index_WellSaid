import React from "react";
import { Text as RNText, TextProps, TextStyle, StyleSheet } from "react-native";
import { useAccessibility } from "../lib/accessibility";

const FONT_WEIGHT_ORDER = ["100", "200", "300", "400", "500", "600", "700", "800", "900"] as const;

const isHeavier = (a: string, b: string): boolean => {
  const ai = FONT_WEIGHT_ORDER.indexOf(a as (typeof FONT_WEIGHT_ORDER)[number]);
  const bi = FONT_WEIGHT_ORDER.indexOf(b as (typeof FONT_WEIGHT_ORDER)[number]);
  if (ai === -1 || bi === -1) return false;
  return ai > bi;
};

export const Text = React.forwardRef<RNText, TextProps>(({ style, ...props }, ref) => {
  const { highLegibility, fontScale, lineHeightScale, fontWeight, letterSpacing } = useAccessibility();

  if (!highLegibility) {
    return <RNText ref={ref} style={style} {...props} />;
  }

  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const scaled: TextStyle = {};

  if (flat?.fontSize) {
    scaled.fontSize = flat.fontSize * fontScale;
  }

  if (flat?.lineHeight) {
    scaled.lineHeight = flat.lineHeight * lineHeightScale;
  } else if (flat?.fontSize) {
    scaled.lineHeight = (flat.fontSize * fontScale) * lineHeightScale;
  }

  const originalWeight = flat?.fontWeight ?? "400";
  if (!isHeavier(originalWeight, fontWeight)) {
    scaled.fontWeight = fontWeight;
  }

  if (letterSpacing > 0) {
    scaled.letterSpacing = (flat?.letterSpacing ?? 0) + letterSpacing;
  }

  return <RNText ref={ref} style={[style, scaled]} {...props} />;
});

Text.displayName = "AccessibleText";
