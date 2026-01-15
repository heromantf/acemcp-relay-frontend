import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "19970412",
  database: "postgres",
});

export default pool;

let dbInitialized = false;

export async function initDB() {
  if (dbInitialized) return;

  const client = await pool.connect();
  try {
    // Check if api_keys table exists
    const apiKeysTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'api_keys'
      )
    `);

    if (!apiKeysTableExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id VARCHAR(32) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          api_key VARCHAR(64) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        )
      `);
      console.log("API keys table created");
    }

    dbInitialized = true;
  } finally {
    client.release();
  }
}

function generateApiKey(): { id: string; apiKey: string } {
  const apiKey = `ace_${crypto.randomBytes(20).toString("hex")}`;
  const id = crypto.createHash("md5").update(apiKey).digest("hex");
  return { id, apiKey };
}

export function getIdFromKey(apiKey: string): string {
  return crypto.createHash("md5").update(apiKey).digest("hex");
}

export async function getApiKey(userId: string) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM api_keys WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function createApiKey(userId: string) {
  const client = await pool.connect();
  try {
    const { id, apiKey } = generateApiKey();
    const result = await client.query(
      `INSERT INTO api_keys (id, user_id, api_key)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, userId, apiKey]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function resetApiKey(userId: string) {
  const client = await pool.connect();
  try {
    const { id, apiKey } = generateApiKey();
    const result = await client.query(
      `UPDATE api_keys
       SET id = $2, api_key = $3, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
      [userId, id, apiKey]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) return "ace_************************";
  const prefix = apiKey.slice(0, 8);
  const maskLength = apiKey.length - 8;
  return `${prefix}${"*".repeat(maskLength)}`;
}

// Request Logs functions
export interface RequestLogRow {
  id: string;
  user_id: string;
  status: string;
  status_code: number | null;
  request_path: string;
  request_method: string;
  request_timestamp: Date;
  response_duration_ms: number | null;
  client_ip: string;
}

export async function getRequestLogs(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<RequestLogRow[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, status, status_code, request_path, request_method,
              request_timestamp, response_duration_ms, client_ip
       FROM request_logs
       WHERE user_id = $1
       ORDER BY request_timestamp DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getRequestLogStats(userId: string): Promise<{
  successCount: number;
  failedCount: number;
  totalCount: number;
}> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 400) as success_count,
         COUNT(*) FILTER (WHERE status_code >= 400 OR status = 'error') as failed_count,
         COUNT(*) as total_count
       FROM request_logs
       WHERE user_id = $1`,
      [userId]
    );
    return {
      successCount: parseInt(result.rows[0].success_count || "0"),
      failedCount: parseInt(result.rows[0].failed_count || "0"),
      totalCount: parseInt(result.rows[0].total_count || "0"),
    };
  } finally {
    client.release();
  }
}

export async function getRequestLogCount(userId: string): Promise<number> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT COUNT(*) as count FROM request_logs WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].count || "0");
  } finally {
    client.release();
  }
}

// Error Details functions
export interface ErrorDetailRow {
  id: number;
  request_id: string;
  source: string;
  error: string;
  created_at: Date;
}

export async function getRequestLogById(
  userId: string,
  logId: string
): Promise<RequestLogRow | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, status, status_code, request_path, request_method,
              request_timestamp, response_duration_ms, client_ip
       FROM request_logs
       WHERE id = $1 AND user_id = $2`,
      [logId, userId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function getErrorDetailsByRequestId(
  requestId: string
): Promise<ErrorDetailRow[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, request_id, source, error, created_at
       FROM error_details
       WHERE request_id = $1
       ORDER BY created_at ASC`,
      [requestId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

// Leaderboard functions
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  request_count: number;
}

export async function getLeaderboard(dateStr?: string): Promise<LeaderboardEntry[]> {
  const client = await pool.connect();
  try {
    // Calculate today's date in Asia/Shanghai timezone if not provided
    const targetDate = dateStr || new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Shanghai'
    }).format(new Date());

    const result = await client.query(
      `SELECT l.rank, l.user_id, l.request_count, u.name as user_name
       FROM leaderboard l
       LEFT JOIN "user" u ON l.user_id = u.id
       WHERE l.date_str = $1
       ORDER BY l.rank ASC
       LIMIT 10`,
      [targetDate]
    );
    return result.rows;
  } finally {
    client.release();
  }
}
