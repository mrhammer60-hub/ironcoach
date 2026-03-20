import * as SecureStore from "expo-secure-store";
import {
  BaseApiClient,
  type TokenStore,
  type LoginResponse,
  type LoginInput,
  type RegisterInput,
} from "@ironcoach/shared";
import { router } from "expo-router";

const KEYS = {
  ACCESS: "ironcoach_access_token",
  REFRESH: "ironcoach_refresh_token",
};

class MobileTokenStore implements TokenStore {
  async getAccessToken() {
    return SecureStore.getItemAsync(KEYS.ACCESS);
  }
  async getRefreshToken() {
    return SecureStore.getItemAsync(KEYS.REFRESH);
  }
  async setTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH, refreshToken),
    ]);
  }
  async clearTokens() {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS),
      SecureStore.deleteItemAsync(KEYS.REFRESH),
    ]);
  }
}

export const api = new BaseApiClient(
  process.env.EXPO_PUBLIC_API_URL!,
  new MobileTokenStore(),
  () => router.replace("/(auth)/login" as any),
);

export const authApi = {
  login: (body: LoginInput) =>
    api.post<LoginResponse>("/auth/login", body, { skipAuth: true }),
  register: (body: RegisterInput) =>
    api.post<LoginResponse>("/auth/register", body, { skipAuth: true }),
  logout: () => api.post("/auth/logout"),
  acceptInvite: (body: { token: string; password: string; firstName: string; lastName: string }) =>
    api.post<LoginResponse>("/auth/accept-invite", body, { skipAuth: true }),
};

export const orgApi = {
  me: () => api.get("/organizations/me"),
};

export const billingApi = {
  subscription: () => api.get("/billing/subscription"),
};
