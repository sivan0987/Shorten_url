import { pool } from "../infra/db";
import { codeForNumber } from "../utils/base62";

const TOTAL = 100_000;
const BATCH_SIZE = 1_000;
// Refill only when the stock of free codes drops below this
const MIN_AVAILABLE = 10_000;

async function main() {
  // A counter that lives in Postgres and remembers where we stopped,
  // so the next run continues from the next number and never repeats one.
  await pool.query(
    "CREATE SEQUENCE IF NOT EXISTS kgs_counter MINVALUE 0 START 0"
  );

  // Safe to run on every startup: skip if there are still enough free codes
  const check = await pool.query(
    "SELECT COUNT(*) AS n FROM preallocated_keys WHERE status = 'available'"
  );
  const available = Number(check.rows[0].n); // pg returns COUNT as a string

  if (available >= MIN_AVAILABLE) {
    console.log(`Enough keys (${available}), skipping`);
    await pool.end();
    return;
  }

  let inserted = 0;

  while (inserted < TOTAL) {
    // Reserve the next 1,000 numbers from the counter in one query
    const numbers = await pool.query(
      "SELECT nextval('kgs_counter') AS n FROM generate_series(1, $1)",
      [BATCH_SIZE]
    );
    const codes = numbers.rows.map((row) => codeForNumber(Number(row.n)));

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
