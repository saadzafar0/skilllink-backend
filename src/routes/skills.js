const express = require("express");
const { sql, poolPromise } = require("../config/db");
const router = express.Router();

// Add a New Skill
router.post("/", async (req, res) => {
  const { skillName } = req.body;

  if (!skillName) {
    return res.status(400).json({ error: "skillName is required" });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("skillName", sql.VarChar(255), skillName)
      .query(
        "INSERT INTO Skills (skillName) OUTPUT INSERTED.skillID VALUES (@skillName)"
      );

    res
      .status(201)
      .json({
        message: "Skill added successfully",
        skillID: result.recordset[0].skillID,
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Skills
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Skills");

    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Skill by ID
router.get("/:skillID", async (req, res) => {
  const { skillID } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("skillID", sql.Int, skillID)
      .query("SELECT * FROM Skills WHERE skillID = @skillID");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Skill not found" });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a Skill
router.put("/:skillID", async (req, res) => {
  const { skillID } = req.params;
  const { skillName } = req.body;

  if (!skillName) {
    return res.status(400).json({ error: "skillName is required" });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("skillID", sql.Int, skillID)
      .input("skillName", sql.VarChar(255), skillName)
      .query(
        "UPDATE Skills SET skillName = @skillName WHERE skillID = @skillID"
      );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Skill not found" });
    }

    res.status(200).json({ message: "Skill updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a Skill
router.delete("/:skillID", async (req, res) => {
  const { skillID } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("skillID", sql.Int, skillID)
      .query("DELETE FROM Skills WHERE skillID = @skillID");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Skill not found" });
    }

    res.status(200).json({ message: "Skill deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
