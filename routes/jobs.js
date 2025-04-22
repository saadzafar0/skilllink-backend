const express = require("express");
const { postJob } = require("../controllers/postJobController");
const isClient = require("../middleware/isClient");
const { sql, poolPromise } = require("../config/db");

const router = express.Router();

// POST /api/v1/jobs — Post a new job (Only by Clients)
router.post("/", isClient, postJob); 

//

// GET /api/v1/jobs — Get all jobs with filters
router.get("/", async (req, res) => {
  const { keyword, level, connects, sortBy } = req.query;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    let query = "SELECT * FROM Jobs WHERE 1=1";

    if (keyword) {
      query += " AND (Title LIKE @keyword OR targetSkills LIKE @keyword)";
      request.input("keyword", sql.NVarChar, `%${keyword}%`);
    }

    if (level && level !== "Any") {
      query += " AND jobLevel = @level";
      request.input("level", sql.NVarChar, level);
    }

    if (connects && connects !== "100") {
      query += " AND connectsRequired <= @connects";
      request.input("connects", sql.Int, parseInt(connects));
    }

    switch (sortBy) {
      case "newest":
        query += " ORDER BY postedOn DESC";
        break;
      case "oldest":
        query += " ORDER BY postedOn ASC";
        break;
      case "connectsLow":
        query += " ORDER BY connectsRequired ASC";
        break;
      case "connectsHigh":
        query += " ORDER BY connectsRequired DESC";
        break;
      default:
        query += " ORDER BY postedOn DESC";
    }

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// JobDetails
router.get("/:jobID", async (req, res) => {
  const { jobID } = req.params;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input("jobID", sql.Int, parseInt(jobID));

    const query = `
      SELECT 
        j.jobID, j.Title, j.description, j.targetSkills, j.connectsRequired,
        j.estTime, j.postedOn, j.jobLevel,
        c.companyName, c.qualification, c.rating
      FROM Jobs j
      JOIN Clients c ON j.cID = c.cID
      WHERE j.jobID = @jobID
    `;

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error fetching job details:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/jobs/client/:clientId — Get jobs posted by a client (optionally filter by status)
router.get("/client/:clientId", async (req, res) => {
  const { clientId } = req.params;
  const { status } = req.query;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input("cID", sql.Int, clientId);

    let query = "SELECT * FROM Jobs WHERE cID = @cID";

    if (status) {
      query += " AND status = @status";
      request.input("status", sql.NVarChar, status);
    }

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching client jobs:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
