import { type ApiRoutes } from "@server/app";
import { queryOptions } from "@tanstack/react-query";
import { hc } from "hono/client";

const client = hc<ApiRoutes>("/api/v1");

export const api = {
  v1: client
}

async function getCurrentUser() {
  const res = await api.v1.me.$get();
  if (!res.ok) {
    throw new Error("Failed to fetch profile");
  }
  return res.json();
}

export const userQueryOptions = queryOptions({
  queryKey: ["get-current-user"],
  queryFn: getCurrentUser,
  staleTime: Infinity
});

