const express = require("express");
const { sql, poolPromise } = require("../config/db");
const router = express.Router();

// Create Freelancer
router.post("/", async (req, res) => {
    const { freelancerID, niche, hourlyRate, qualification, about } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input("freelancerID", sql.Int, freelancerID)
            .input("niche", sql.NVarChar, niche)
            .input("hourlyRate", sql.Float, hourlyRate)
            .input("qualification", sql.NVarChar, qualification)
            .input("about", sql.NVarChar, about)
            .query(`
                INSERT INTO Freelancers (freelancerID, niche, hourlyRate, qualification, about) 
                VALUES (@freelancerID, @niche, @hourlyRate, @qualification, @about)
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
    const { niche, hourlyRate, qualification, about } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input("freelancerID", sql.Int, freelancerID)
            .input("niche", sql.NVarChar, niche)
            .input("hourlyRate", sql.Float, hourlyRate)
            .input("qualification", sql.NVarChar, qualification)
            .input("about", sql.NVarChar, about)
            .query(`
                UPDATE Freelancers 
                SET niche = @niche, hourlyRate = @hourlyRate, 
                    qualification = @qualification, about = @about
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
