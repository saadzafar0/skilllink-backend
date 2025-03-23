const express = require("express");
const { sql, poolPromise } = require("../config/db");
const router = express.Router();

// Submit a new proposal
router.post("/", async (req, res) => {
    const { freelancerID, jobID, bidAmount, coverLetter, pStatus } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("freelancerID", sql.Int, freelancerID)
            .input("jobID", sql.Int, jobID)
            .input("bidAmount", sql.Int, bidAmount)
            .input("coverLetter", sql.NVarChar, coverLetter)
            .input("pStatus", sql.NVarChar, pStatus)
            .query(`
                INSERT INTO Proposals (freelancerID, jobID, bidAmount, coverLetter, pStatus) 
                OUTPUT INSERTED.proposalID VALUES (@freelancerID, @jobID, @bidAmount, @coverLetter, @pStatus)
            `);

        res.status(201).json({ proposalID: result.recordset[0].proposalID, message: "Proposal submitted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all proposals for a job
router.get("/job/:jobID", async (req, res) => {
    const { jobID } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("jobID", sql.Int, jobID)
            .query("SELECT * FROM Proposals WHERE jobID = @jobID");

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all proposals by a freelancer
router.get("/freelancer/:freelancerID", async (req, res) => {
    const { freelancerID } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("freelancerID", sql.Int, freelancerID)
            .query("SELECT * FROM Proposals WHERE freelancerID = @freelancerID");

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a proposal
router.delete("/:proposalID", async (req, res) => {
    const { proposalID } = req.params;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input("proposalID", sql.Int, proposalID)
            .query("DELETE FROM Proposals WHERE proposalID = @proposalID");

        res.status(200).json({ message: "Proposal deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
