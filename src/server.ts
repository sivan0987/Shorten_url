import express from "express";
import { pool } from "./db";

const app = express();
app.use(express.json());

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function isValidUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Request 1: shorten a URL
app.post("/api/v1/urls", async (req, res) => {
  const url = req.body?.url;

  if (!isValidUrl(url)) {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Atomically take one available key; SKIP LOCKED lets concurrent
    // requests each grab a different key without waiting on each other.
    const keyResult = await client.query(
      `UPDATE preallocated_keys
       SET status = 'allocated'
       WHERE id = (
         SELECT id FROM preallocated_keys
         WHERE status = 'available'
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING short_code`
    );

    if (keyResult.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(503).json({ error: "No keys available" });
      return;
    }

    const shortCode: string = keyResult.rows[0].short_code;

    await client.query(
      `INSERT INTO short_urls (short_code, original_url)
       VALUES ($1, $2)`,
      [shortCode, url]
    );

    await client.query("COMMIT");
    res.status(201).json({ shortCode, shortUrl: `${BASE_URL}/${shortCode}` });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// Request 2: redirect a short code to the original URL
app.get("/:code", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT original_url, expires_at
       FROM short_urls
       WHERE short_code = $1`,
      [req.params.code]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Link not found" });
      return;
    }

    const { original_url, expires_at } = result.rows[0];

    if (expires_at && new Date(expires_at) < new Date()) {
      res.status(410).json({ error: "Link expired" });
      return;
    }

    res.redirect(302, original_url);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on ${BASE_URL}`);
});
