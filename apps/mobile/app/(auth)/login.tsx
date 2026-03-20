import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { Button, Input } from "@ironcoach/ui/src/mobile";
import { authApi } from "../../lib/api";
import * as SecureStore from "expo-secure-store";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await authApi.login({ email, password });
      await SecureStore.setItemAsync("ironcoach_access_token", result.accessToken);
      await SecureStore.setItemAsync("ironcoach_refresh_token", result.refreshToken);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("خطأ", err?.error?.message || "بيانات الدخول غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.logo}>IronCoach</Text>
      <Text style={s.subtitle}>تسجيل الدخول</Text>

      <View style={s.form}>
        <Input
          label="البريد الإلكتروني"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="coach@example.com"
        />
        <Input
          label="كلمة المرور"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <Button onPress={handleLogin} loading={loading}>
          تسجيل الدخول
        </Button>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  logo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#c8f135",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#7878a0",
    textAlign: "center",
    marginBottom: 32,
  },
  form: { gap: 16 },
});
