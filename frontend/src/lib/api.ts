import { type ApiRoutes } from "@server/app";
import { hc } from "hono/client";

const client = hc<ApiRoutes>("/api/v1");

export const api = {
  v1: client
}