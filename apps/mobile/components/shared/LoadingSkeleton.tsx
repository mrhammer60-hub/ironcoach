import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@ironcoach/ui/src/mobile";

export function LoadingSkeleton() {
  return (
    <View style={s.container}>
      <Skeleton width="100%" height={140} borderRadius={14} />
      <Skeleton width="100%" height={180} borderRadius={14} />
      <Skeleton width="100%" height={80} borderRadius={14} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
});
