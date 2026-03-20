# Prompt 28 — EAS Build & App Store Submission

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 11 complete (Expo app built and working locally).
> **أضفه بعد الخطوة 11.**

---

## Task

إعداد EAS Build للـ iOS و Android، وخطوات رفع التطبيق لـ App Store وGoogle Play.

---

## Part A: `apps/mobile/eas.json`

```json
{
  "cli": {
    "version": ">= 10.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:3001/api/v1",
        "EXPO_PUBLIC_SOCKET_URL": "http://localhost:3001"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-staging.ironcoach.com/api/v1",
        "EXPO_PUBLIC_SOCKET_URL": "https://api-staging.ironcoach.com"
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "resourceClass": "m1-medium",
        "image": "latest"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.ironcoach.com/api/v1",
        "EXPO_PUBLIC_SOCKET_URL": "https://api.ironcoach.com"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

## Part B: `apps/mobile/app.config.ts`

```typescript
import { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'IronCoach',
  slug: 'ironcoach',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'ironcoach',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0d0d12',
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/YOUR_PROJECT_ID',
  },
  runtimeVersion: { policy: 'appVersion' },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.ironcoach.app',
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'نستخدم الكاميرا لالتقاط صور التقدم',
      NSPhotoLibraryUsageDescription: 'نستخدم مكتبة الصور لاختيار صور التقدم',
      NSPhotoLibraryAddUsageDescription: 'نحفظ صور التقدم في مكتبتك',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0d0d12',
    },
    package: 'com.ironcoach.app',
    versionCode: 1,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.VIBRATE',
    ],
    googleServicesFile: './google-services.json',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#c8f135',
        sounds: ['./assets/sounds/notification.wav'],
      },
    ],
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/Tajawal-Regular.ttf',
          './assets/fonts/Tajawal-Medium.ttf',
          './assets/fonts/Tajawal-Bold.ttf',
          './assets/fonts/Syne-Bold.ttf',
        ],
      },
    ],
  ],
  extra: {
    eas: { projectId: 'YOUR_EAS_PROJECT_ID' },
  },
}

export default config
```

---

## Part C: GitHub Actions — EAS Build

### `.github/workflows/mobile-build.yml`

```yaml
name: Mobile Build & Submit

on:
  push:
    branches: [main]
    paths: ['apps/mobile/**', 'packages/**']
  workflow_dispatch:
    inputs:
      platform:
        description: 'Platform to build'
        required: true
        default: 'all'
        type: choice
        options: [ios, android, all]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build iOS
        if: inputs.platform == 'ios' || inputs.platform == 'all'
        working-directory: apps/mobile
        run: eas build --platform ios --profile production --non-interactive

      - name: Build Android
        if: inputs.platform == 'android' || inputs.platform == 'all'
        working-directory: apps/mobile
        run: eas build --platform android --profile production --non-interactive

      - name: Submit to stores
        working-directory: apps/mobile
        run: eas submit --platform all --latest --non-interactive
        env:
          EXPO_APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
```

---

## Part D: OTA Updates (Over-The-Air)

```yaml
# .github/workflows/ota-update.yml
name: OTA Update

on:
  push:
    branches: [main]
    paths: ['apps/mobile/**']

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Publish OTA update
        working-directory: apps/mobile
        run: eas update --branch production --message "${{ github.event.head_commit.message }}"
```

OTA updates apply to JS changes only — native code changes require a full build.

---

## Part E: Required Assets

Create these files before building:

```
apps/mobile/assets/
  images/
    icon.png           ← 1024×1024 PNG, no transparency, no rounded corners
    adaptive-icon.png  ← 1024×1024 PNG, foreground for Android adaptive icon
    splash.png         ← 1242×2688 PNG, dark background (#0d0d12), centered logo
    notification-icon.png ← 96×96 PNG, white on transparent, simple
  fonts/
    Tajawal-Regular.ttf
    Tajawal-Medium.ttf
    Tajawal-Bold.ttf
    Syne-Bold.ttf
  sounds/
    notification.wav   ← short notification sound, < 30KB
```

Download Tajawal from Google Fonts: `https://fonts.google.com/specimen/Tajawal`
Download Syne from Google Fonts: `https://fonts.google.com/specimen/Syne`

---

## Part F: App Store Listing Content

### iOS App Store

```
Name: IronCoach — منصة التدريب
Subtitle: للمدربين الرياضيين المحترفين
Category: Health & Fitness
Age Rating: 4+

Description (Arabic):
IronCoach هي منصة التدريب الرياضي المتكاملة التي تجمع بين المدرب ومتدربيه في تجربة واحدة سلسة.

للمدربين:
• ابنِ برامج تدريبية احترافية
• خطط تغذية مخصصة لكل متدرب
• تابع التقدم بالأرقام والصور
• تواصل مباشر مع متدربيك

للمتدربين:
• تمارين يومية واضحة مع فيديوهات
• خطة غذائية مفصّلة
• تتبع وزنك وقياساتك
• تواصل مع مدربك في أي وقت

Keywords: مدرب,تمارين,تغذية,لياقة,bodybuilding,fitness coach,workout
Support URL: https://ironcoach.com/support
Privacy Policy URL: https://ironcoach.com/privacy
```

### Android Play Store
Same description — Google Play uses same content.

---

## Part G: Privacy Policy Page

أضف `apps/web/app/(marketing)/privacy/page.tsx`:

```tsx
// Static page with privacy policy
// Required for App Store & Play Store submissions
// Must include:
// - What data is collected
// - How it's used
// - How to request deletion
// - Contact: privacy@ironcoach.com
```

---

## Output Requirements

- `eas build --platform ios --profile production` succeeds
- `eas build --platform android --profile production` succeeds
- OTA update workflow runs on every push to main
- All required assets (icon, splash, fonts) present
- Privacy policy page live at `ironcoach.com/privacy`
- `app.config.ts` has all required permissions declared
