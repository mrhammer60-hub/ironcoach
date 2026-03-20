import { ApiException, type ApiError, type RequestConfig, type TokenStore } from "./types";

export class BaseApiClient {
  private isRefreshing = false;
  private refreshQueue: Array<(token: string) => void> = [];

  constructor(
    private readonly baseUrl: string,
    private readonly tokenStore: TokenStore,
    private readonly onAuthFailure?: () => void,
  ) {}

  async request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const {
      method = "GET",
      body,
      params,
      headers = {},
      skipAuth = false,
    } = config;

    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, String(v));
      });
    }

    if (!skipAuth) {
      const token = await this.tokenStore.getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const fetchConfig: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    };

    const response = await fetch(url.toString(), fetchConfig);

    if (response.status === 401 && !skipAuth) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        fetchConfig.headers = {
          ...fetchConfig.headers,
          Authorization: `Bearer ${newToken}`,
        } as Record<string, string>;
        const retryResponse = await fetch(url.toString(), fetchConfig);
        return this.parseResponse<T>(retryResponse);
      } else {
        await this.tokenStore.clearTokens();
        this.onAuthFailure?.();
        throw new ApiException(
          {
            code: "AUTH_REQUIRED",
            message: "Session expired",
            statusCode: 401,
          },
          401,
        );
      }
    }

    return this.parseResponse<T>(response);
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshQueue.push(resolve);
      });
    }

    this.isRefreshing = true;
    try {
      const refreshToken = await this.tokenStore.getRefreshToken();
      if (!refreshToken) return null;

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as { data: { accessToken: string; refreshToken: string } };
      const { accessToken, refreshToken: newRefreshToken } = data.data;
      await this.tokenStore.setTokens(accessToken, newRefreshToken);

      this.refreshQueue.forEach((resolve) => resolve(accessToken));
      this.refreshQueue = [];
      return accessToken;
    } catch {
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const data: any = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error: ApiError =
        isJson && data?.error
          ? { ...data.error, statusCode: response.status }
          : {
              code: "UNKNOWN_ERROR",
              message: "An error occurred",
              statusCode: response.status,
            };
      throw new ApiException(error, response.status);
    }

    return (isJson && typeof data === "object" && data !== null && "data" in data
      ? data.data
      : data) as T;
  }

  get<T>(path: string, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: "GET" });
  }
  post<T>(path: string, body?: unknown, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: "POST", body });
  }
  put<T>(path: string, body?: unknown, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: "PUT", body });
  }
  patch<T>(path: string, body?: unknown, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: "PATCH", body });
  }
  delete<T>(path: string, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: "DELETE" });
  }
}
