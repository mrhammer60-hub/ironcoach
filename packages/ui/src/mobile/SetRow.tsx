import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

interface SetRowProps {
  setNumber: number;
  defaultReps?: string;
  onComplete: (reps: number, weight: number | null) => void;
}

export function SetRow({ setNumber, defaultReps, onComplete }: SetRowProps) {
  const [reps, setReps] = useState(defaultReps ?? "");
  const [weight, setWeight] = useState("");
  const [done, setDone] = useState(false);

  const handleDone = () => {
    const repsNum = parseInt(reps);
    if (!repsNum || repsNum < 1) return;
    setDone(true);
    onComplete(repsNum, weight ? parseFloat(weight) : null);
  };

  return (
    <View style={styles.row}>
      <Text style={styles.num}>{setNumber}</Text>
      <TextInput
        style={[styles.inp, done && styles.doneInp]}
        value={reps}
        onChangeText={setReps}
        keyboardType="number-pad"
        placeholder={defaultReps ?? "تكرار"}
        placeholderTextColor="#4a4a6a"
        editable={!done}
      />
      <TextInput
        style={[styles.inp, done && styles.doneInp]}
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder="وزن"
        placeholderTextColor="#4a4a6a"
        editable={!done}
      />
      <TouchableOpacity
        style={[styles.tick, done && styles.tickDone]}
        onPress={handleDone}
        activeOpacity={0.7}
      >
        <Text style={{ color: done ? "#0d0d12" : "#7878a0", fontSize: 16 }}>
          ✓
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  num: {
    width: 24,
    fontSize: 13,
    fontWeight: "600",
    color: "#7878a0",
    textAlign: "center",
  },
  inp: {
    flex: 1,
    backgroundColor: "#1a1a26",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#e8e8f2",
    textAlign: "center",
  },
  doneInp: {
    backgroundColor: "rgba(200,241,53,0.06)",
    borderColor: "rgba(200,241,53,0.15)",
  },
  tick: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  tickDone: {
    backgroundColor: "#c8f135",
    borderColor: "#c8f135",
  },
});
