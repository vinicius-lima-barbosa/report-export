import { logger } from "@/shared/utils/logger";
import { Pool, type QueryResult } from "pg";
import { env } from "./env";

const pool = new Pool({
  user: env.DB_USER,
  host: env.DB_HOST,
  database: env.DB_NAME,
  password: env.DB_PASSWORD,
  port: Number(env.DB_PORT),
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    logger.error("Failed to connect to the database");
  } else {
    logger.info("Database connection established successfully");
  }
});

export const db = {
  query: (text: string, params?: any[]) =>
    pool.query(text, params) as Promise<QueryResult>,
};
