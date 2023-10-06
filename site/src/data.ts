import { PrismaClient } from "@prisma/client";
import { atom } from "nanostores";

/**
 * Prisma connection.
 *
 * Per the Prisma documentation, explicit opening and closing of
 * the connection is not required.
 */
export const DB = new PrismaClient();

/**
 * Entry in the OAuth state array store.
 */
type OAuthStateEntry = {
  val: string;
  stored: Date;
};

/**
 * Values returned from checking an OAuth state.
 */
export enum StateLookupResponse {
  NotPresent,
  Expired,
  Accepted,
}

/**
 * Storage of OAuth 'state' values for verification.
 */
const oauthStates = atom<Array<OAuthStateEntry>>([]);

/**
 * Adds the state to the OAuth states store.
 */
export function addOAuthState(state: string): void {
  oauthStates.set([...oauthStates.get(), { val: state, stored: new Date() }]);
}

/**
 * Returns true if the OAuth state store contains the value and
 * it's been under 30 minutes since the login flow was started.
 *
 * If the state is present, it is removed from the store.
 */
export function checkOAuthState(state: string): StateLookupResponse {
  const lookup = oauthStates.get().find((pair) => pair.val === state);
  if (lookup === undefined) {
    return StateLookupResponse.NotPresent;
  }
  oauthStates.set(oauthStates.get().filter((s) => s.val !== state));
  if (new Date().getTime() - lookup.stored.getTime() > 1_000 * 60 * 30) {
    return StateLookupResponse.Expired;
  }
  return StateLookupResponse.Accepted;
}
