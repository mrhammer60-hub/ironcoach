import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export function ErrorState({
  message = "حدث خطأ ما",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={s.container}>
      <Text style={s.icon}>⚠️</Text>
      <Text style={s.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={s.btn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={s.btnText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  icon: { fontSize: 48 },
  message: {
    fontSize: 15,
    color: "#7878a0",
    textAlign: "center",
    lineHeight: 22,
  },
  btn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#c8f135",
    borderRadius: 9,
  },
  btnText: {
    color: "#0d0d12",
    fontWeight: "600",
    fontSize: 14,
  },
});
