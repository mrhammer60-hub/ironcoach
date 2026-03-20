import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { EmptyState } from "@ironcoach/ui/src/mobile";

export default function ChatTab() {
  return (
    <View style={s.container}>
      <Text style={s.title}>مدربي 💬</Text>
      <EmptyState
        icon="💬"
        title="محادثة المدرب"
        description="ستظهر محادثتك مع مدربك هنا"
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d12", padding: 16 },
  title: { fontSize: 20, fontWeight: "700", color: "#e8e8f2", marginBottom: 16 },
});
