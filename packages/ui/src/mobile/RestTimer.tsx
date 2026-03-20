import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Vibration, StyleSheet } from "react-native";
import { useRestTimer } from "../hooks/useRestTimer";

interface RestTimerProps {
  seconds: number;
  onComplete: () => void;
}

export function RestTimer({ seconds, onComplete }: RestTimerProps) {
  const timer = useRestTimer();

  useEffect(() => {
    if (seconds > 0) timer.start(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!timer.isRunning && seconds > 0) {
      Vibration.vibrate(500);
      onComplete();
    }
  }, [timer.isRunning]);

  if (!timer.isRunning) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>⏱ وقت الراحة</Text>
      <Text style={styles.time}>{timer.formatted}</Text>
      <TouchableOpacity onPress={timer.skip} style={styles.skipBtn}>
        <Text style={styles.skipText}>تخطي</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(200,241,53,0.08)",
    borderWidth: 1,
    borderColor: "rgba(200,241,53,0.15)",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  label: { fontSize: 13, color: "#7878a0" },
  time: {
    fontSize: 36,
    fontWeight: "700",
    color: "#c8f135",
    fontFamily: "Syne",
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  skipText: { fontSize: 13, color: "#7878a0", fontWeight: "500" },
});
