export interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, string[]>;
}

export class ApiException extends Error {
  constructor(
    public readonly error: ApiError,
    public readonly statusCode: number,
  ) {
    super(error.message);
    this.name = "ApiException";
  }
}

export interface TokenStore {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(accessToken: string, refreshToken: string): Promise<void>;
  clearTokens(): Promise<void>;
}
