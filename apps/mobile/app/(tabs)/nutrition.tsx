import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Card, EmptyState } from "@ironcoach/ui/src/mobile";
import { api } from "../../lib/api";

export default function NutritionTab() {
  const { data } = useQuery({
    queryKey: ["nutrition", "today"],
    queryFn: () => api.get<any>("/nutrition/today"),
  });

  if (!data?.plan) {
    return (
      <View style={s.container}>
        <EmptyState icon="🥗" title="لا توجد خطة غذائية" description="سيضيف مدربك خطة قريباً" />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <Text style={s.title}>تغذيتي 🥗</Text>
      <Card style={{ marginBottom: 12 }}>
        <Text style={s.planTitle}>{data.plan.title}</Text>
        <Text style={s.calories}>{data.plan.caloriesTarget} سعرة/يوم</Text>
        <Text style={s.percent}>{data.todayLog?.percentComplete ?? 0}% من الهدف</Text>
      </Card>
      {data.meals?.map((meal: any) => (
        <Card key={meal.id} style={{ marginBottom: 8 }}>
          <Text style={s.mealTitle}>{meal.titleAr || meal.title}</Text>
          <Text style={s.mealMacros}>
            {meal.calories} سعرة · P:{Number(meal.proteinG)}g · C:{Number(meal.carbsG)}g · F:{Number(meal.fatsG)}g
          </Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d12" },
  title: { fontSize: 20, fontWeight: "700", color: "#e8e8f2", marginBottom: 16 },
  planTitle: { fontSize: 16, fontWeight: "600", color: "#e8e8f2" },
  calories: { fontSize: 24, fontWeight: "700", color: "#c8f135", marginTop: 4 },
  percent: { fontSize: 12, color: "#7878a0", marginTop: 4 },
  mealTitle: { fontSize: 14, fontWeight: "600", color: "#e8e8f2" },
  mealMacros: { fontSize: 12, color: "#7878a0", marginTop: 4 },
});
