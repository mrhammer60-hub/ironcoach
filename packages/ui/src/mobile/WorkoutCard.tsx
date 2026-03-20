import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Badge } from "./Badge";

interface WorkoutCardProps {
  title: string;
  exerciseCount: number;
  duration?: string;
  status?: "active" | "completed" | "paused";
  onPress?: () => void;
}

const STATUS_MAP = {
  active: { variant: "lime" as const, label: "Active" },
  completed: { variant: "teal" as const, label: "Completed" },
  paused: { variant: "amber" as const, label: "Paused" },
};

export function WorkoutCard({
  title,
  exerciseCount,
  duration,
  status = "active",
  onPress,
}: WorkoutCardProps) {
  const statusInfo = STATUS_MAP[status];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{exerciseCount} exercises</Text>
        {duration && <Text style={styles.metaText}>{duration}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#13131c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: { fontSize: 14, fontWeight: "600", color: "#e8e8f2", flex: 1 },
  meta: { flexDirection: "row", gap: 16 },
  metaText: { fontSize: 12, color: "#7878a0" },
});
