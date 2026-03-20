import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0a0a14",
          borderTopColor: "rgba(255,255,255,0.06)",
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#c8f135",
        tabBarInactiveTintColor: "#7878a0",
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "اليوم",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "تمريني",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>💪</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: "تغذيتي",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🥗</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "تقدمي",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📈</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "مدربي",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>💬</Text>
          ),
        }}
      />
    </Tabs>
  );
}
