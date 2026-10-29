import { pool } from "./db";
import { randomCode } from "./base62";

const TOTAL = 100_000;
const BATCH_SIZE = 1_000;

async function main() {
  let inserted = 0;

  while (inserted < TOTAL) {
    const codes: string[] = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      codes.push(randomCode());
    }

    const result = await pool.query(
      `INSERT INTO preallocated_keys (short_code)
       SELECT unnest($1::text[])
       ON CONFLICT (short_code) DO NOTHING`,
      [codes]
    );

    inserted += result.rowCount ?? 0;
    console.log(`Inserted ${inserted} / ${TOTAL}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});