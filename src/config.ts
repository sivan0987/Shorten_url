// All settings come from environment variables (the .env file), not from the code.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name} (did you create .env?)`);
  }
  return value;
}

export const config = {
  port: Number(required("PORT")),
  baseUrl: required("BASE_URL"),
  db: {
    host: required("DB_HOST"),
    port: Number(required("DB_PORT")),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: required("DB_NAME"),
  },
};
