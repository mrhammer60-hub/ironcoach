import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
} from "react-native";

interface ButtonProps {
  variant?: "primary" | "ghost" | "danger" | "teal";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: string;
  style?: ViewStyle;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onPress,
  children,
  style,
}: ButtonProps) {
  const variantStyles = {
    primary: { bg: "#c8f135", text: "#0d0d12" },
    ghost: { bg: "transparent", text: "#7878a0" },
    danger: { bg: "rgba(255,79,123,0.12)", text: "#ff4f7b" },
    teal: { bg: "rgba(45,232,200,0.12)", text: "#2de8c8" },
  };

  const sizeStyles = {
    sm: { px: 12, py: 5, fontSize: 12 },
    md: { px: 16, py: 10, fontSize: 13 },
    lg: { px: 24, py: 14, fontSize: 15 },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          opacity: disabled ? 0.5 : 1,
        },
        variant === "ghost" && styles.ghost,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text style={[styles.text, { color: v.text, fontSize: s.fontSize }]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ghost: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  text: {
    fontWeight: "600",
    fontFamily: "Tajawal",
  },
});
