import { PrismaClient } from "@prisma/client";
import { atom } from "nanostores";

/**
 * Prisma connection
 */
export const DB = new PrismaClient();

/**
 * Storage of OAuth 'state' var for verification.
 */
export const ssoState = atom<string | null>(null);
