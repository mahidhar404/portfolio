/**
 * TanStack Query hooks. These are the only way components read server state.
 */
import { useMutation, useQuery, type UseQueryResult } from "@tanstack/react-query";

import { fetchApi, postJson } from "./client";
import { fallbackPortfolio } from "./fallback";
import { contactResponseSchema, parsePortfolio, parseProjectDetail } from "./schemas";
import type { Portfolio, ProjectDetail } from "./types";

export const queryKeys = {
  portfolio: ["portfolio"] as const,
  project: (slug: string) => ["project", slug] as const,
};

/**
 * The whole site in one request.
 *
 * `initialData` is the build-time snapshot, so the first paint is instant even
 * when the backend is cold. `staleTime: 0` means a background revalidation
 * starts immediately and swaps in live data the moment it arrives.
 */
export function usePortfolio(): UseQueryResult<Portfolio, Error> {
  return useQuery({
    queryKey: queryKeys.portfolio,
    queryFn: () => fetchApi("/api/v1/portfolio/", parsePortfolio, { timeoutMs: 60_000 }),
    ...(fallbackPortfolio ? { initialData: fallbackPortfolio, initialDataUpdatedAt: 0 } : {}),
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useProject(slug: string): UseQueryResult<ProjectDetail, Error> {
  return useQuery({
    queryKey: queryKeys.project(slug),
    queryFn: () =>
      fetchApi(`/api/v1/projects/${encodeURIComponent(slug)}/`, parseProjectDetail, {
        timeoutMs: 60_000,
      }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: slug.length > 0,
  });
}

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot — must stay empty. Real browsers never fill a hidden field. */
  website: string;
}

export function useSendMessage() {
  return useMutation({
    mutationFn: (payload: ContactPayload) =>
      postJson("/api/v1/contact/", payload, (data) => contactResponseSchema.parse(data)),
  });
}
