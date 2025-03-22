require("dotenv").config({ path: __dirname + "/../../.env" }); // 👈 Explicitly set path
const sql = require("mssql");

console.log("DB_SERVER:", process.env.DB_SERVER); // ✅ Debugging

const config = {
    server: process.env.DB_SERVER, // 🔥 FIXED: Using correct env variable
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,  
        trustServerCertificate: true,
    },
    port: parseInt(process.env.DB_PORT) || 1433,  
};

const connectDB = async () => {
    try {
        console.log("Connecting to Database with config:", config);
        await sql.connect(config);
        console.log("✅ Database Connected Successfully!");
    } catch (err) {
        console.error("❌ Database connection failed:", err);
        process.exit(1);
    }
};

module.exports = { connectDB };
