import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "IronCoach",
  slug: "ironcoach",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "ironcoach",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0d0d12",
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID ?? "YOUR_PROJECT_ID"}`,
  },
  runtimeVersion: { policy: "appVersion" },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.ironcoach.app",
    buildNumber: "1",
    infoPlist: {
      NSCameraUsageDescription: "نستخدم الكاميرا لالتقاط صور التقدم",
      NSPhotoLibraryUsageDescription: "نستخدم مكتبة الصور لاختيار صور التقدم",
      NSPhotoLibraryAddUsageDescription: "نحفظ صور التقدم في مكتبتك",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#0d0d12",
    },
    package: "com.ironcoach.app",
    versionCode: 1,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.VIBRATE",
    ],
    googleServicesFile: "./google-services.json",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#c8f135",
      },
    ],
  ],
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID ?? "YOUR_EAS_PROJECT_ID" },
  },
};

export default config;
