import { defineMiddleware } from "astro:middleware";

/**
 * Middleware.
 *
 * Sets `locals.timezone` from headers. If a timezone is not present
 * (it should always be), the field defaults to 'UTC'.
 */
export const onRequest = defineMiddleware(async ({ locals, request }, next) => {
  locals.timezone = request.headers.get("timezone") ?? "UTC";
  return next();
});
