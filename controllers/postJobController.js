// File: server/controllers/postJobController.js
const { sql, poolPromise } = require("../config/db");

const postJob = async (req, res) => {
  const {
    title,
    description,
    targetSkills,
    connectsRequired,
    estTime,
    jobLevel,
  } = req.body;

  const { cID } = req.user;

  if (!cID) {
    return res.status(403).json({ message: "Access denied. Not a client." });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("Title", sql.NVarChar, title)
      .input("Description", sql.NVarChar, description)
      .input("targetSkills", sql.NVarChar, targetSkills)
      .input("connectsRequired", sql.Int, connectsRequired)
      .input("estTime", sql.NVarChar, estTime)
      .input("jobLevel", sql.NVarChar, jobLevel)
      .input("cID", sql.Int, cID)  // cID comes from req.user
      .input("postedOn", sql.DateTime, new Date())
      .query(`
        INSERT INTO Jobs (Title, Description, targetSkills, connectsRequired, estTime, jobLevel, cID, postedOn)
        VALUES (@Title, @Description, @targetSkills, @connectsRequired, @estTime, @jobLevel, @cID, @postedOn)
      `);

    res.status(201).json({ message: "Job posted successfully" });
  } catch (error) {
    console.error("Error posting job:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { postJob };
