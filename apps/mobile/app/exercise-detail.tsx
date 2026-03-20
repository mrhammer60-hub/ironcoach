import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function ExerciseDetailScreen() {
  const { name, instructions } = useLocalSearchParams<{
    name: string;
    instructions: string;
  }>();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.back} onPress={() => router.back()}>
          ← رجوع
        </Text>
        <Text style={s.title}>{name}</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.instructions}>{instructions || "لا توجد تعليمات"}</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d12" },
  header: {
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  back: { color: "#7878a0", fontSize: 14, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700", color: "#e8e8f2" },
  content: { padding: 16 },
  instructions: { fontSize: 14, color: "#b0b0c8", lineHeight: 22 },
});
