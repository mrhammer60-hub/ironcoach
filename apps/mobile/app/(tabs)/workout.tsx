import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Card, Button, EmptyState } from "@ironcoach/ui/src/mobile";
import { router } from "expo-router";
import { api } from "../../lib/api";

export default function WorkoutTab() {
  const { data } = useQuery({
    queryKey: ["workouts", "today"],
    queryFn: () => api.get<any>("/workout-logs/today"),
  });

  return (
    <View style={s.container}>
      <Text style={s.title}>تمريني 💪</Text>
      {data?.day ? (
        <Card>
          <Text style={s.dayName}>{data.day.title || "تمرين اليوم"}</Text>
          <Text style={s.exerciseCount}>
            {data.day.exercises?.length ?? 0} تمارين
          </Text>
          <Button
            onPress={() => router.push("/workout-session")}
            style={{ marginTop: 16 }}
          >
            ابدأ التمرين
          </Button>
        </Card>
      ) : (
        <EmptyState icon="💪" title="لا يوجد تمرين اليوم" />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d12", padding: 16 },
  title: { fontSize: 20, fontWeight: "700", color: "#e8e8f2", marginBottom: 16 },
  dayName: { fontSize: 16, fontWeight: "600", color: "#e8e8f2" },
  exerciseCount: { fontSize: 13, color: "#7878a0", marginTop: 4 },
});
