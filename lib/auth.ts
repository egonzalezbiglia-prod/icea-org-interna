import { timingSafeEqual } from "crypto";

const ADMIN_KEY = "1icea2026";
const MASTER_KEY = "Ezequiel#1993";

export function safeCompare(input: string, expected: string) {
  const inputBuffer = Buffer.from(input.trim());
  const expectedBuffer = Buffer.from(expected.trim());
  if (inputBuffer.length !== expectedBuffer.length) {
    timingSafeEqual(expectedBuffer, expectedBuffer);
    return false;
  }
  return timingSafeEqual(inputBuffer, expectedBuffer);
}

export function verifyEditKey(key: unknown) {
  return typeof key === "string" && safeCompare(key, ADMIN_KEY);
}

export function verifyMasterKey(key: unknown) {
  return typeof key === "string" && safeCompare(key, MASTER_KEY);
}

export function editKeyFromRequest(request: Request, body?: Record<string, unknown>) {
  return request.headers.get("x-edit-key") ?? body?.editKey;
}

export function actorFromRequest(request: Request, body?: Record<string, unknown>) {
  const raw = request.headers.get("x-actor-name") ?? body?.actorName;
  const actor = typeof raw === "string" ? raw.trim() : "";
  return actor || "Organizacion";
}

export function masterKeyFromRequest(request: Request, body?: Record<string, unknown>) {
  return request.headers.get("x-master-key") ?? body?.masterKey;
}
