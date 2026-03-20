import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Vibration,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Button, SetRow, RestTimer } from "@ironcoach/ui/src/mobile";
import { api } from "../lib/api";
import { useSessionTimer } from "@ironcoach/ui/src/hooks";

export default function WorkoutSessionScreen() {
  const timer = useSessionTimer();
  const [restSeconds, setRestSeconds] = useState(0);
  const [completedSets, setCompletedSets] = useState<
    Record<string, Set<number>>
  >({});

  const { data } = useQuery({
    queryKey: ["workouts", "today"],
    queryFn: () => api.get<any>("/workout-logs/today"),
  });

  useEffect(() => {
    timer.start();
  }, []);

  const exercises = data?.day?.exercises ?? [];
  const completedCount = Object.values(completedSets).filter(
    (s) => s.size > 0,
  ).length;

  const handleSetComplete = (
    exerciseId: string,
    setNum: number,
    reps: number,
    weight: number | null,
    rest: number,
  ) => {
    setCompletedSets((prev) => {
      const sets = new Set(prev[exerciseId] || []);
      sets.add(setNum);
      return { ...prev, [exerciseId]: sets };
    });
    setRestSeconds(rest);
  };

  const handleFinish = () => {
    Alert.alert("🎉 ممتاز!", "أتممت التمرين بنجاح", [
      { text: "حسناً", onPress: () => router.back() },
    ]);
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text
          style={s.back}
          onPress={() => {
            Alert.alert("إنهاء التمرين؟", "سيتم حفظ تقدمك", [
              { text: "متابعة", style: "cancel" },
              { text: "إنهاء", onPress: () => router.back() },
            ]);
          }}
        >
          ← رجوع
        </Text>
        <Text style={s.timer}>{timer.formatted}</Text>
        <Text style={s.progress}>
          {completedCount}/{exercises.length}
        </Text>
      </View>

      {/* Rest Timer */}
      {restSeconds > 0 && (
        <RestTimer
          seconds={restSeconds}
          onComplete={() => setRestSeconds(0)}
        />
      )}

      {/* Exercises */}
      <ScrollView contentContainerStyle={s.exercises}>
        {exercises.map((item: any) => (
          <View key={item.id} style={s.exerciseCard}>
            <Text style={s.exerciseName}>
              🏋️ {item.exercise?.nameAr || item.exercise?.nameEn}
            </Text>
            <Text style={s.exerciseMeta}>
              {item.sets}×{item.reps} · راحة {item.restSeconds}ث
            </Text>
            {Array.from({ length: item.sets }, (_, i) => i + 1).map(
              (setNum) => (
                <SetRow
                  key={setNum}
                  setNumber={setNum}
                  defaultReps={item.reps}
                  onComplete={(reps, weight) =>
                    handleSetComplete(
                      item.exercise.id,
                      setNum,
                      reps,
                      weight,
                      item.restSeconds,
                    )
                  }
                />
              ),
            )}
          </View>
        ))}

        {completedCount === exercises.length && exercises.length > 0 && (
          <Button onPress={handleFinish} style={{ marginTop: 16 }}>
            🎉 إنهاء التمرين
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d12" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  back: { color: "#7878a0", fontSize: 14 },
  timer: { color: "#c8f135", fontSize: 18, fontWeight: "700", fontFamily: "monospace" },
  progress: { color: "#7878a0", fontSize: 13 },
  exercises: { padding: 16, paddingBottom: 100 },
  exerciseCard: {
    backgroundColor: "#13131c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  exerciseName: { fontSize: 15, fontWeight: "600", color: "#e8e8f2", marginBottom: 4 },
  exerciseMeta: { fontSize: 12, color: "#7878a0", marginBottom: 8 },
});
