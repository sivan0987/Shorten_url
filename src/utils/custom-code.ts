// Rules for codes that users choose themselves (e.g. "my-cool-link")

// Paths we use now or will use later - a user must not take them
const RESERVED = ["admin", "api", "login", "register", "dashboard"];

export function isValidCustomCode(code: unknown): code is string {
  if (typeof code !== "string") return false;

  // 3-16 characters, only letters, digits and "-"
  if (!/^[a-zA-Z0-9-]{3,16}$/.test(code)) return false;

  // "ADMIN" and "Admin" are blocked too
  if (RESERVED.includes(code.toLowerCase())) return false;

  return true;
}
