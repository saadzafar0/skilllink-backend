const express = require("express");
const { sql, poolPromise } = require("../config/db");
const router = express.Router();

// Create User
router.post("/", async (req, res) => {
    const { name, accType, email, country, password } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input("name", sql.NVarChar, name)
            .input("accType", sql.NVarChar, accType)
            .input("email", sql.NVarChar, email)
            .input("country", sql.NVarChar, country)
            .input("password", sql.NVarChar, password)
            .query(`
                INSERT INTO Users (Name, accType, email, Country, password, createdAt) 
                VALUES (@name, @accType, @email, @country, @password, GETDATE())
            `);

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Users
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;
        let result = await pool.request().query("SELECT * FROM Users");
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Single User
router.get("/:userID", async (req, res) => {
    const { userID } = req.params;
    try {
        const pool = await poolPromise;
        let result = await pool.request()
            .input("userID", sql.Int, userID)
            .query("SELECT * FROM Users WHERE userID = @userID");

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update User
router.put("/:userID", async (req, res) => {
    const { userID } = req.params;
    const { name, accType, email, country, password } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input("userID", sql.Int, userID)
            .input("name", sql.NVarChar, name)
            .input("accType", sql.NVarChar, accType)
            .input("email", sql.NVarChar, email)
            .input("country", sql.NVarChar, country)
            .input("password", sql.NVarChar, password)
            .query(`
                UPDATE Users 
                SET Name = @name, accType = @accType, email = @email, 
                    Country = @country, password = @password 
                WHERE userID = @userID
            `);

        res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete User
router.delete("/:userID", async (req, res) => {
    const { userID } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input("userID", sql.Int, userID)
            .query("DELETE FROM Users WHERE userID = @userID");

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
