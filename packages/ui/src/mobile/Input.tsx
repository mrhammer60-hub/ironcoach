import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
} from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor="#4a4a6a"
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 11.5, fontWeight: "500", color: "#7878a0" },
  input: {
    backgroundColor: "#1a1a26",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: "#e8e8f2",
    fontFamily: "Tajawal",
  },
  inputError: { borderColor: "#ff4f7b" },
  error: { fontSize: 11, color: "#ff4f7b" },
  hint: { fontSize: 11, color: "#4a4a6a" },
});
