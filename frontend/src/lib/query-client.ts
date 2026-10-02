import { MutationCache, QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    if (mutation.options.onError || !axios.isAxiosError(error) || error.response?.status !== 429) return;
    const retryAfter = error.response.headers["retry-after"];
    const seconds = Number(retryAfter);
    toast.error(seconds > 0 ? `Too many requests. Try again in ${seconds} seconds.` : "Too many requests. Please try again shortly.");
  },
});

export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});
