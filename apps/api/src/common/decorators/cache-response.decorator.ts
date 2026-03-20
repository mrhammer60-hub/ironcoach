import { SetMetadata } from "@nestjs/common";

export const CACHE_RESPONSE_KEY = "cache_response";

export interface CacheResponseOptions {
  ttl: number; // seconds
  keyPrefix?: string;
}

export const CacheResponse = (options: CacheResponseOptions) =>
  SetMetadata(CACHE_RESPONSE_KEY, options);
