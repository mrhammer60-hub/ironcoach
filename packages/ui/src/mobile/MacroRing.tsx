import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface MacroRingProps {
  value: number;
  target: number;
  color: string;
  label: string;
  unit?: string;
  size?: number;
}

export function MacroRing({
  value,
  target,
  color,
  label,
  unit = "g",
  size = 64,
}: MacroRingProps) {
  const strokeWidth = 5;
  const r = size / 2 - strokeWidth - 1;
  const circumference = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const offset = circumference * (1 - pct);

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#222232"
            strokeWidth={strokeWidth}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={[styles.value, { color }]}>{value}</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.target}>
        {target}
        {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 4 },
  center: { alignItems: "center", justifyContent: "center" },
  value: { fontSize: 11, fontWeight: "700", fontFamily: "Syne" },
  label: {
    fontSize: 10,
    color: "#4a4a6a",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  target: { fontSize: 11, fontWeight: "600", color: "#e8e8f2" },
});
