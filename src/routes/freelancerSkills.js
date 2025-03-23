const express = require("express");
const { sql, poolPromise } = require("../config/db");
const router = express.Router();

// Add Skill to Freelancer
router.post("/", async (req, res) => {
    const { freelancerID, skillName } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input("freelancerID", sql.Int, freelancerID)
            .input("skillName", sql.NVarChar, skillName)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM FreelancerSkills WHERE freelancerID = @freelancerID AND skillName = @skillName)
                BEGIN
                    INSERT INTO FreelancerSkills (freelancerID, skillName) VALUES (@freelancerID, @skillName)
                END
            `);

        res.status(201).json({ message: "Skill added to freelancer successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Skills for a Freelancer
router.get("/:freelancerID", async (req, res) => {
    const { freelancerID } = req.params;
    try {
        const pool = await poolPromise;
        let result = await pool.request()
            .input("freelancerID", sql.Int, freelancerID)
            .query("SELECT skillName FROM FreelancerSkills WHERE freelancerID = @freelancerID");

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a Freelancer Skill
router.delete("/", async (req, res) => {
    const { freelancerID, skillName } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input("freelancerID", sql.Int, freelancerID)
            .input("skillName", sql.NVarChar, skillName)
            .query("DELETE FROM FreelancerSkills WHERE freelancerID = @freelancerID AND skillName = @skillName");

        res.status(200).json({ message: "Skill removed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
