import React from "react";
import { View, Text, StyleSheet } from "react-native";

type BadgeVariant = "lime" | "teal" | "rose" | "amber" | "sky" | "violet" | "gray";

const COLORS: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  lime: { bg: "rgba(200,241,53,0.10)", text: "#c8f135", border: "rgba(200,241,53,0.18)" },
  teal: { bg: "rgba(45,232,200,0.10)", text: "#2de8c8", border: "rgba(45,232,200,0.2)" },
  rose: { bg: "rgba(255,79,123,0.10)", text: "#ff4f7b", border: "rgba(255,79,123,0.2)" },
  amber: { bg: "rgba(255,176,64,0.10)", text: "#ffb040", border: "rgba(255,176,64,0.2)" },
  sky: { bg: "rgba(77,184,255,0.10)", text: "#4db8ff", border: "rgba(77,184,255,0.2)" },
  violet: { bg: "rgba(155,125,255,0.10)", text: "#9b7dff", border: "rgba(155,125,255,0.2)" },
  gray: { bg: "rgba(255,255,255,0.06)", text: "#7878a0", border: "rgba(255,255,255,0.10)" },
};

export function Badge({
  variant = "gray",
  children,
}: {
  variant?: BadgeVariant;
  children: string;
}) {
  const c = COLORS[variant];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.border },
      ]}
    >
      <Text style={[styles.text, { color: c.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  text: { fontSize: 11, fontWeight: "600" },
});
