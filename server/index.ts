import app from './app'
import * as Sentry from "@sentry/bun";

// Initialize Sentry
Sentry.init({
  dsn: "https://38b1b3405c4803acb3576e67046fa0cf@o4508695687725056.ingest.us.sentry.io/4508719050391552",
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.NODE_ENV !== 'production',
  tracesSampleRate: 1.0,
  enabled: true,
});

Bun.serve({
  fetch: async (request, server) => {
    try {
      const response = await app.fetch(request, server);
      return response;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  },
  development: process.env.NODE_ENV !== 'production',
});

console.log("Bun Server Running on http://localhost:3000");       