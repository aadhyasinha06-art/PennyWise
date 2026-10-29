require("dotenv").config();

const app = require("./src/app");
const { testConnection, pool } = require("./src/config/db");

const PORT = Number(process.env.PORT || 5000);

async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`PennyWise API running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Could not start PennyWise API:", error.message);
    process.exit(1);
  }
}

async function shutdown() {
  console.log("Shutting down PennyWise API...");
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
