
//db.js
require("dotenv").config();
const sql = require("mssql");

const config = {
    server: process.env.DB_SERVER,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
    port: parseInt(process.env.DB_PORT) || 1433,
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("Database Connected Successfully!");
        return pool;
    })
    .catch(err => {
        console.error("Database Connection Failed:", err);
        process.exit(1);
    });

module.exports = { sql, poolPromise };
