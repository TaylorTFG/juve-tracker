import { env } from "@/lib/env";
import { logApi } from "@/lib/logger";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fdGet(path: string, params?: Record<string, string>) {
  if (!env.FOOTBALL_DATA_API_KEY) {
    throw new Error("FOOTBALL_DATA_API_KEY missing");
  }

  const url = new URL(`${env.FOOTBALL_DATA_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  let attempt = 0;
  const maxAttempts = 4;

  while (attempt < maxAttempts) {
    attempt += 1;
    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": env.FOOTBALL_DATA_API_KEY
      },
      next: { revalidate: 0 }
    });

    const requestId = response.headers.get("x-request-id") ?? "n/a";
    const retryAfter = response.headers.get("retry-after");
    const requestsAvailable = response.headers.get("x-requests-available-minute");

    logApi("football-data", {
      path,
      status: response.status,
      requestId,
      retryAfter,
      requestsAvailable,
      attempt
    });

    if (response.ok) {
      return response.json();
    }

    if ([429, 403, 500, 502, 503, 504].includes(response.status) && attempt < maxAttempts) {
      const backoff = retryAfter ? Number(retryAfter) * 1000 : attempt * 1200;
      await wait(backoff);
      continue;
    }

    throw new Error(`football-data error ${response.status}: ${await response.text()}`);
  }

  throw new Error("football-data retries exhausted");
}

export async function fetchSquad(teamId: number) {
  return fdGet(`/teams/${teamId}`);
}

export async function fetchMatches(teamId: number, from: string, to: string) {
  return fdGet(`/teams/${teamId}/matches`, { dateFrom: from, dateTo: to });
}

export async function fetchTodayMatches() {
  return fdGet("/matches");
}
