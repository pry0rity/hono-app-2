// import { Monitoring } from "react-scan/monitoring";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import * as Sentry from "@sentry/react";

// initialize sentry
Sentry.init({
  dsn: "https://38b1b3405c4803acb3576e67046fa0cf@o4508695687725056.ingest.us.sentry.io/4508719050391552",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// create a query client
const queryClient = new QueryClient();

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree, context: { queryClient } });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* <Monitoring
        apiKey="4RD5tKji3UZNfvfinKV5uo-obdl7aUms" // Safe to expose publically
        url="https://monitoring.react-scan.com/api/v1/ingest"
        commit={process.env.GIT_COMMIT_HASH} // optional but recommended
        branch={process.env.GIT_BRANCH} // optional but recommended
      /> */}
    </QueryClientProvider>
  </StrictMode>
);
