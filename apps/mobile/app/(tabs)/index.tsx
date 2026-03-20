import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Card, Button } from "@ironcoach/ui/src/mobile";
import { api } from "../../lib/api";

export default function TodayScreen() {
  const {
    data: workout,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["workouts", "today"],
    queryFn: () => api.get<any>("/workout-logs/today"),
  });

  const { data: nutrition } = useQuery({
    queryKey: ["nutrition", "today"],
    queryFn: () => api.get<any>("/nutrition/today"),
  });

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#c8f135" />
      }
    >
      <Text style={s.greeting}>مرحباً 👋</Text>

      {/* Today's Workout */}
      <Card style={s.card}>
        <Text style={s.sectionTitle}>تمرين اليوم</Text>
        {workout?.day ? (
          <>
            <Text style={s.dayTitle}>
              {workout.day.title || `يوم ${workout.day.dayNumber}`}
            </Text>
            <Text style={s.meta}>
              {workout.day.exercises?.length ?? 0} تمارين
            </Text>
            <Button
              onPress={() => router.push("/workout-session")}
              style={{ marginTop: 12 }}
            >
              {workout.log ? "متابعة التمرين" : "ابدأ التمرين 💪"}
            </Button>
          </>
        ) : (
          <Text style={s.empty}>لا يوجد تمرين اليوم</Text>
        )}
      </Card>

      {/* Macro Summary */}
      {nutrition?.plan && (
        <Card style={s.card}>
          <Text style={s.sectionTitle}>التغذية</Text>
          <View style={s.macroRow}>
            <MacroItem
              label="سعرات"
              current={nutrition.todayLog?.totalCalories ?? 0}
              target={nutrition.plan.caloriesTarget}
              color="#ffb040"
            />
            <MacroItem
              label="بروتين"
              current={nutrition.todayLog?.totalProtein ?? 0}
              target={nutrition.plan.proteinG}
              color="#2de8c8"
            />
            <MacroItem
              label="كربوهيدرات"
              current={nutrition.todayLog?.totalCarbs ?? 0}
              target={nutrition.plan.carbsG}
              color="#9b7dff"
            />
            <MacroItem
              label="دهون"
              current={nutrition.todayLog?.totalFats ?? 0}
              target={nutrition.plan.fatsG}
              color="#c8f135"
            />
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

function MacroItem({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  return (
    <View style={s.macroItem}>
      <Text style={[s.macroValue, { color }]}>{current}</Text>
      <Text style={s.macroTarget}>/{target}</Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d12" },
  content: { padding: 16, paddingBottom: 100 },
  greeting: { fontSize: 22, fontWeight: "700", color: "#e8e8f2", marginBottom: 16 },
  card: { marginBottom: 12 },
  sectionTitle: { fontSize: 12, color: "#7878a0", marginBottom: 8 },
  dayTitle: { fontSize: 16, fontWeight: "600", color: "#e8e8f2" },
  meta: { fontSize: 13, color: "#7878a0", marginTop: 4 },
  empty: { fontSize: 14, color: "#4a4a6a", textAlign: "center", paddingVertical: 20 },
  macroRow: { flexDirection: "row", justifyContent: "space-around" },
  macroItem: { alignItems: "center" },
  macroValue: { fontSize: 18, fontWeight: "700" },
  macroTarget: { fontSize: 11, color: "#4a4a6a" },
  macroLabel: { fontSize: 10, color: "#7878a0", marginTop: 2 },
});
