import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nManager } from "react-native";

if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 2 },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0d0d12" },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="workout-session"
          options={{ presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="exercise-detail"
          options={{ presentation: "modal" }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
