import { defineMiddleware } from "astro:middleware";
import { DB } from "./data";
import { verifyJwt } from "./util/auth";
import { LOGGER } from "./util/log";
import { infoToName } from "./util/print";

const AUTHORIZATION_HEADER = "authorization";

/**
 * Middleware.
 *
 * Checks the authorization header from the request, retrieving and
 * validating the JWT.
 *
 * Sets `locals.timezone` and `locals.jwt` from headers. If
 * a timezone is not present (it should always be), the field
 * defaults to 'UTC'. As an "authorization" header is not required
 * to be present, the field may be `null`.
 */
export const onRequest = defineMiddleware(async ({ locals, request }, next) => {
  locals.timezone = request.headers.get("timezone") ?? "UTC";

  const jwt = request.headers.get(AUTHORIZATION_HEADER)?.substring(7);
  if (jwt) {
    try {
      const auth = await verifyJwt(jwt);

      /*
       * Since JWTs live on the user's browser, there needs to be some way to
       * prevent their access to the site if needed, like for dismissals,
       * abuse, or mandate of the ATM/DATM/TA.
       */
      const blocked = await DB.userBlocklist.findFirst({
        where: { cid: auth.info.cid },
      });
      if (blocked) {
        LOGGER.info(
          `${infoToName(auth.info)} (${
            auth.info.cid
          }) was blocked from accessing the site`,
        );
        return new Response("You have been blocked from accessing this site", {
          status: 401,
        });
      }

      locals.auth = auth;
    } catch (err) {
      // singing issue / tampered with / different secret / something weird
      LOGGER.warn(`Could not parse & verify JWT "${jwt}": ${err}`);
      return new Response("Could not verify JWT", { status: 400 });
    }
  } else {
    locals.auth = null;
  }

  return next();
});
