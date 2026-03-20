import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type ToastVariant = "success" | "error" | "info" | "warning";

const COLORS: Record<ToastVariant, { bg: string; text: string; border: string }> = {
  success: { bg: "rgba(45,232,200,0.12)", text: "#2de8c8", border: "rgba(45,232,200,0.2)" },
  error: { bg: "rgba(255,79,123,0.12)", text: "#ff4f7b", border: "rgba(255,79,123,0.2)" },
  info: { bg: "rgba(77,184,255,0.12)", text: "#4db8ff", border: "rgba(77,184,255,0.2)" },
  warning: { bg: "rgba(255,176,64,0.12)", text: "#ffb040", border: "rgba(255,176,64,0.2)" },
};

interface ToastProps {
  variant?: ToastVariant;
  message: string;
  visible: boolean;
  onDismiss?: () => void;
}

export function Toast({
  variant = "info",
  message,
  visible,
  onDismiss,
}: ToastProps) {
  if (!visible) return null;

  const c = COLORS[variant];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.bg, borderColor: c.border },
      ]}
    >
      <Text style={[styles.message, { color: c.text }]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss}>
          <Text style={{ color: c.text, opacity: 0.6 }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  message: { fontSize: 13, fontWeight: "500", flex: 1 },
});
