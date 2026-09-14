import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Password hashing with Node's built-in scrypt — no native dependency.
 * Stored as `scrypt$N$r$p$salt$hash` so the cost can be raised later
 * without invalidating existing hashes.
 */

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

function derive(password: string, salt: Buffer, n: number, r: number, p: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEYLEN, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) {
    // Still spend the time, so an unknown username isn't faster to reject.
    await derive(password, randomBytes(16), N, R, P);
    return false;
  }

  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  try {
    const expected = Buffer.from(hash, "base64");
    const actual = await derive(password, Buffer.from(salt, "base64"), Number(n), Number(r), Number(p));
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
