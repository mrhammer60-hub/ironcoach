import {
  BaseApiClient,
  type TokenStore,
  type LoginResponse,
  type LoginInput,
  type RegisterInput,
} from "@ironcoach/shared";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;path=/;max-age=0`;
}

class WebTokenStore implements TokenStore {
  async getAccessToken() {
    return getCookie("ironcoach_access");
  }
  async getRefreshToken() {
    return getCookie("ironcoach_refresh") || "from-cookie";
  }
  async setTokens(accessToken: string, refreshToken: string) {
    setCookie("ironcoach_access", accessToken, 15 * 60); // 15 min
    if (refreshToken && refreshToken !== "from-cookie") {
      setCookie("ironcoach_refresh", refreshToken, 7 * 24 * 60 * 60); // 7 days
    }
  }
  async clearTokens() {
    deleteCookie("ironcoach_access");
    deleteCookie("ironcoach_refresh");
  }
}

export const tokenStore = new WebTokenStore();

export const api = new BaseApiClient(
  process.env.NEXT_PUBLIC_API_URL!,
  tokenStore,
  () => {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
);

export const authApi = {
  login: async (body: LoginInput) => {
    const result = await api.post<LoginResponse>("/auth/login", body, { skipAuth: true });
    // Persist tokens in cookies immediately
    await tokenStore.setTokens(result.accessToken, result.refreshToken);
    return result;
  },
  register: async (body: RegisterInput) => {
    const result = await api.post<LoginResponse>("/auth/register", body, { skipAuth: true });
    await tokenStore.setTokens(result.accessToken, result.refreshToken);
    return result;
  },
  logout: async () => {
    await api.post("/auth/logout");
    await tokenStore.clearTokens();
  },
  acceptInvite: async (body: { token: string; password: string; firstName: string; lastName: string }) => {
    const result = await api.post<LoginResponse>("/auth/accept-invite", body, { skipAuth: true });
    await tokenStore.setTokens(result.accessToken, result.refreshToken);
    return result;
  },
};

export const orgApi = {
  me: () => api.get("/organizations/me"),
  update: (body: Record<string, unknown>) => api.put("/organizations/me", body),
  members: () => api.get("/organizations/me/members"),
  invite: (body: { email: string; roleKey: string }) =>
    api.post("/organizations/me/members/invite", body),
  removeMember: (memberId: string) =>
    api.delete(`/organizations/me/members/${memberId}`),
};

export const billingApi = {
  subscription: () => api.get("/billing/subscription"),
  createCheckout: (planCode: string) =>
    api.post<{ url: string }>("/billing/create-checkout", { planCode }),
  portal: () => api.post<{ url: string }>("/billing/portal"),
  upgrade: (planCode: string) => api.put("/billing/upgrade", { planCode }),
  cancel: () => api.delete("/billing/cancel"),
};
