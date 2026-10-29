const mysql = require("mysql2/promise");

const required = ["DB_HOST", "DB_USER", "DB_NAME"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}. Copy .env.example to .env and configure it.`);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  charset: "utf8mb4",
  decimalNumbers: true,
  timezone: "Z",
  ...(process.env.DB_SSL === "true" ? { ssl: { rejectUnauthorized: false } } : {})
});

async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query("SELECT 1");
    console.log("MySQL connection successful.");
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection };
