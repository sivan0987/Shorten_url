// One-to-one (bijective) key generator.
// Every number 0, 1, 2, ... is written in base 62 as a 7-character code.
// Different numbers always give different codes, so duplicates are impossible.

const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE = 62;

export const CODE_LENGTH = 7;
export const KEY_SPACE = BASE ** CODE_LENGTH; // 62^7 ≈ 3.52 trillion codes

// Could the KGS ever produce this code? Only if it has exactly 7 characters,
// and all of them come from the base 62 alphabet.
export function couldBeKgsCode(code: string): boolean {
  return /^[0-9a-zA-Z]{7}$/.test(code);
}

// Write a number in base 62, padded with leading zeros to a fixed length.
export function codeForNumber(n: number): string {
  if (n < 0 || n >= KEY_SPACE) {
    throw new RangeError("Key space exhausted");
  }

  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code = ALPHABET[n % BASE] + code;
    n = Math.floor(n / BASE);
  }
  return code;
}
