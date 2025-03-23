const express = require("express");
const { sql, poolPromise } = require("../config/db");
const router = express.Router();

// Create Freelancer
router.post("/", async (req, res) => {
    const { userID, title, bio, hourlyRate, country, experienceLevel } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input("userID", sql.Int, userID)
            .input("title", sql.NVarChar, title)
            .input("bio", sql.NVarChar, bio)
            .input("hourlyRate", sql.Decimal, hourlyRate)
            .input("country", sql.NVarChar, country)
            .input("experienceLevel", sql.NVarChar, experienceLevel)
            .query(`
                INSERT INTO Freelancers (userID, title, bio, hourlyRate, country, experienceLevel, createdAt) 
                VALUES (@userID, @title, @bio, @hourlyRate, @country, @experienceLevel, GETDATE())
            `);

        res.status(201).json({ message: "Freelancer profile created successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Freelancers
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;
        let result = await pool.request().query("SELECT * FROM Freelancers");
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Single Freelancer
router.get("/:freelancerID", async (req, res) => {
    const { freelancerID } = req.params;
    try {
        const pool = await poolPromise;
        let result = await pool.request()
            .input("freelancerID", sql.Int, freelancerID)
            .query("SELECT * FROM Freelancers WHERE freelancerID = @freelancerID");

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Freelancer not found" });
        }
        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Freelancer
router.put("/:freelancerID", async (req, res) => {
    const { freelancerID } = req.params;
    const { title, bio, hourlyRate, country, experienceLevel } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input("freelancerID", sql.Int, freelancerID)
            .input("title", sql.NVarChar, title)
            .input("bio", sql.NVarChar, bio)
            .input("hourlyRate", sql.Decimal, hourlyRate)
            .input("country", sql.NVarChar, country)
            .input("experienceLevel", sql.NVarChar, experienceLevel)
            .query(`
                UPDATE Freelancers 
                SET title = @title, bio = @bio, hourlyRate = @hourlyRate, 
                    country = @country, experienceLevel = @experienceLevel
                WHERE freelancerID = @freelancerID
            `);

        res.status(200).json({ message: "Freelancer profile updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Freelancer
router.delete("/:freelancerID", async (req, res) => {
    const { freelancerID } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input("freelancerID", sql.Int, freelancerID)
            .query("DELETE FROM Freelancers WHERE freelancerID = @freelancerID");

        res.status(200).json({ message: "Freelancer profile deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
