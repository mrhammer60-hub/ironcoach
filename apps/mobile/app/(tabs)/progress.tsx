import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Card, Badge, Button, EmptyState } from "@ironcoach/ui/src/mobile";
import { api } from "../../lib/api";

export default function ProgressTab() {
  const { data } = useQuery({
    queryKey: ["trainees", "me", "progress"],
    queryFn: () => api.get<any>("/trainees/me/progress"),
  });

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <Text style={s.title}>تقدمي 📈</Text>

      {/* Stats */}
      <View style={s.statsRow}>
        <Card style={s.statCard}>
          <Text style={s.statValue}>{data?.totalWorkoutsCompleted ?? 0}</Text>
          <Text style={s.statLabel}>جلسات</Text>
        </Card>
        <Card style={s.statCard}>
          <Text style={s.statValue}>
            {data?.weightHistory?.[0]?.weightKg ?? "—"}
          </Text>
          <Text style={s.statLabel}>كجم</Text>
        </Card>
      </View>

      {/* Weight History */}
      <Text style={s.sectionTitle}>تاريخ الوزن</Text>
      {data?.weightHistory?.length > 0 ? (
        <Card style={{ marginBottom: 16 }}>
          {data.weightHistory.slice(0, 8).map((entry: any, i: number) => (
            <View key={i} style={s.historyRow}>
              <Text style={s.historyDate}>
                {new Date(entry.date).toLocaleDateString("ar")}
              </Text>
              <Text style={s.historyValue}>{entry.weightKg} كجم</Text>
            </View>
          ))}
        </Card>
      ) : (
        <EmptyState icon="📏" title="لا توجد قياسات بعد" />
      )}

      {/* Strength PRs */}
      <Text style={s.sectionTitle}>أرقامك القياسية 🔥</Text>
      {data?.strengthPRs?.length > 0 ? (
        data.strengthPRs.map((pr: any) => (
          <Card key={pr.exerciseId} style={{ marginBottom: 8 }}>
            <View style={s.prRow}>
              <Text style={s.prName}>{pr.exerciseNameAr || pr.exerciseName}</Text>
              <Badge variant="lime">{`${pr.weightKg} كجم`}</Badge>
            </View>
          </Card>
        ))
      ) : (
        <EmptyState icon="🏆" title="لم تسجل أي رقم قياسي بعد" />
      )}

      <Button variant="teal" onPress={() => {}} style={{ marginTop: 16 }}>
        📏 تسجيل وصول أسبوعي
      </Button>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d12" },
  title: { fontSize: 20, fontWeight: "700", color: "#e8e8f2", marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#7878a0", marginBottom: 8, marginTop: 8 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "700", color: "#c8f135" },
  statLabel: { fontSize: 11, color: "#7878a0", marginTop: 2 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  historyDate: { fontSize: 13, color: "#7878a0" },
  historyValue: { fontSize: 13, fontWeight: "600", color: "#e8e8f2" },
  prRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  prName: { fontSize: 13, color: "#e8e8f2" },
});
