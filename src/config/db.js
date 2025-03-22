require("dotenv").config();
const sql = require("mssql");

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  options: {
    encrypt: false, 
    trustServerCertificate: true, 
  },
};

async function connectDB() {
  try {
    let pool = await sql.connect(dbConfig);
    console.log("Connected to MSSQL (Docker)");
    return pool;
  } catch (err) {
    console.error("Database connection failed: ", err);
  }
}

module.exports = { connectDB, sql };
