const express = require("express");
const { sql, poolPromise } = require("../config/db");
const router = express.Router();

// Create User
router.post("/", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input("name", sql.NVarChar, name)
            .input("email", sql.NVarChar, email)
            .input("password", sql.NVarChar, password)
            .query("INSERT INTO users (name, email, password) VALUES (@name, @email, @password)");

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Users (GET)
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;
        let result = await pool.request().query("SELECT * FROM users");
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Single User (GET)
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        let result = await pool.request()
            .input("id", sql.Int, id)
            .query("SELECT * FROM users WHERE id = @id");

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update User
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email, password } = req.body;
    try {
        const pool = await poolPromise;
        let result = await pool.request()
            .input("id", sql.Int, id)
            .input("name", sql.NVarChar, name)
            .input("email", sql.NVarChar, email)
            .input("password", sql.NVarChar, password)
            .query("UPDATE users SET name = @name, email = @email, password = @password WHERE id = @id");

        res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete User (DELETE)
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM users WHERE id = @id");

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
