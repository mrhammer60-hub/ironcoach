import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {action && (
        <Button onPress={action.onPress} style={{ marginTop: 8 }}>
          {action.label}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 15, fontWeight: "600", color: "#b0b0c8", textAlign: "center" },
  description: {
    fontSize: 13,
    color: "#4a4a6a",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
});
