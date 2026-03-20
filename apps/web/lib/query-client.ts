import { QueryClient } from "@tanstack/react-query";
import { ApiException } from "@ironcoach/shared";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: (failureCount, error) => {
        if (error instanceof ApiException && error.statusCode < 500)
          return false;
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error) => {
        if (error instanceof ApiException && error.statusCode === 401) {
          return;
        }
        console.error("Mutation error:", error);
      },
    },
  },
});
