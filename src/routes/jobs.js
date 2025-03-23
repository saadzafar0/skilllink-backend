const express = require("express");
const { sql, poolPromise } = require("../config/db");
const router = express.Router();

// Create a new job
router.post("/", async (req, res) => {
    const { cID, Title, description, targetSkills, connectsRequired, estTime, jobLevel } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("cID", sql.Int, cID)
            .input("Title", sql.NVarChar, Title)
            .input("description", sql.NVarChar, description)
            .input("targetSkills", sql.NVarChar, targetSkills)
            .input("connectsRequired", sql.Int, connectsRequired)
            .input("estTime", sql.NVarChar, estTime)
            .input("jobLevel", sql.NVarChar, jobLevel)
            .query(`
                INSERT INTO Jobs (cID, Title, description, targetSkills, connectsRequired, estTime, jobLevel) 
                OUTPUT INSERTED.jobID VALUES (@cID, @Title, @description, @targetSkills, @connectsRequired, @estTime, @jobLevel)
            `);

        res.status(201).json({ jobID: result.recordset[0].jobID, message: "Job created successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all jobs
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT * FROM Jobs ORDER BY postedOn DESC");

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific job by ID
router.get("/:jobID", async (req, res) => {
    const { jobID } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("jobID", sql.Int, jobID)
            .query("SELECT * FROM Jobs WHERE jobID = @jobID");

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Job not found" });
        }

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a job
router.put("/:jobID", async (req, res) => {
    const { jobID } = req.params;
    const { Title, description, targetSkills, connectsRequired, estTime, jobLevel } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input("jobID", sql.Int, jobID)
            .input("Title", sql.NVarChar, Title)
            .input("description", sql.NVarChar, description)
            .input("targetSkills", sql.NVarChar, targetSkills)
            .input("connectsRequired", sql.Int, connectsRequired)
            .input("estTime", sql.NVarChar, estTime)
            .input("jobLevel", sql.NVarChar, jobLevel)
            .query(`
                UPDATE Jobs 
                SET Title = @Title, description = @description, targetSkills = @targetSkills, 
                    connectsRequired = @connectsRequired, estTime = @estTime, jobLevel = @jobLevel 
                WHERE jobID = @jobID
            `);

        res.status(200).json({ message: "Job updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a job
router.delete("/:jobID", async (req, res) => {
    const { jobID } = req.params;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input("jobID", sql.Int, jobID)
            .query("DELETE FROM Jobs WHERE jobID = @jobID");

        res.status(200).json({ message: "Job deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
