const express = require("express");
const { sql, poolPromise } = require("../config/db");
const router = express.Router();

// Add Skills to Freelancer
router.post("/", async (req, res) => {
  const { freelancerID, skills } = req.body; // skills should be an array of strings

  if (!Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({ error: "Skills must be a non-empty array" });
  }

  try {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    for (const skillName of skills) {
      let skillID;

      // Check if skill exists
      const skillResult = await transaction
        .request()
        .input("skillName", sql.NVarChar, skillName)
        .query("SELECT skillID FROM Skills WHERE skillName = @skillName");

      if (skillResult.recordset.length > 0) {
        skillID = skillResult.recordset[0].skillID;
      } else {
        // Insert new skill and retrieve skillID
        const insertSkill = await transaction
          .request()
          .input("skillName", sql.NVarChar, skillName)
          .query(
            "INSERT INTO Skills (skillName) OUTPUT INSERTED.skillID VALUES (@skillName)"
          );
        skillID = insertSkill.recordset[0].skillID;
      }

      // Insert into FreelancerSkills
      await transaction
        .request()
        .input("fID", sql.Int, freelancerID)
        .input("skillID", sql.Int, skillID)
        .query(
          "INSERT INTO FreelancerSkills (fID, skillID) VALUES (@fID, @skillID)"
        );
    }

    await transaction.commit();
    res.status(201).json({ message: "Skills added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Skills of a Freelancer
router.get("/:freelancerID", async (req, res) => {
  const { freelancerID } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request().input("fID", sql.Int, freelancerID)
      .query(`
                SELECT s.skillID, s.skillName
                FROM FreelancerSkills fs
                JOIN Skills s ON fs.skillID = s.skillID
                WHERE fs.fID = @fID
            `);

    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Freelancer Skills
router.put("/:freelancerID", async (req, res) => {
  const { freelancerID } = req.params;
  const { skills } = req.body;

  if (!Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({ error: "Skills must be a non-empty array" });
  }

  try {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    // Delete existing skills
    await transaction
      .request()
      .input("fID", sql.Int, freelancerID)
      .query("DELETE FROM FreelancerSkills WHERE fID = @fID");

    for (const skillName of skills) {
      let skillID;

      // Check if skill exists
      const skillResult = await transaction
        .request()
        .input("skillName", sql.NVarChar, skillName)
        .query("SELECT skillID FROM Skills WHERE skillName = @skillName");

      if (skillResult.recordset.length > 0) {
        skillID = skillResult.recordset[0].skillID;
      } else {
        // Insert new skill
        const insertSkill = await transaction
          .request()
          .input("skillName", sql.NVarChar, skillName)
          .query(
            "INSERT INTO Skills (skillName) OUTPUT INSERTED.skillID VALUES (@skillName)"
          );
        skillID = insertSkill.recordset[0].skillID;
      }

      // Insert into FreelancerSkills
      await transaction
        .request()
        .input("fID", sql.Int, freelancerID)
        .input("skillID", sql.Int, skillID)
        .query(
          "INSERT INTO FreelancerSkills (fID, skillID) VALUES (@fID, @skillID)"
        );
    }

    await transaction.commit();
    res.status(200).json({ message: "Skills updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a Specific Skill of a Freelancer
router.delete("/:freelancerID/:skillName", async (req, res) => {
  const { freelancerID, skillName } = req.params;

  try {
    const pool = await poolPromise;

    // Get skillID
    const skillResult = await pool
      .request()
      .input("skillName", sql.NVarChar, skillName)
      .query("SELECT skillID FROM Skills WHERE skillName = @skillName");

    if (skillResult.recordset.length === 0) {
      return res.status(404).json({ error: "Skill not found" });
    }

    const skillID = skillResult.recordset[0].skillID;

    // Delete mapping from FreelancerSkills
    await pool
      .request()
      .input("fID", sql.Int, freelancerID)
      .input("skillID", sql.Int, skillID)
      .query(
        "DELETE FROM FreelancerSkills WHERE fID = @fID AND skillID = @skillID"
      );

    res.status(200).json({ message: "Skill removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete All Skills of a Freelancer
router.delete("/:freelancerID", async (req, res) => {
  const { freelancerID } = req.params;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("fID", sql.Int, freelancerID)
      .query("DELETE FROM FreelancerSkills WHERE fID = @fID");

    res.status(200).json({ message: "All skills removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
