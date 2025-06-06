const express = require("express");
const { sql, poolPromise } = require("../config/db");
const router = express.Router();

router.post("/accept/:proposalID", async (req, res) => {
  const { proposalID } = req.params;

  if (!proposalID) {
    return res.status(400).json({ error: "Proposal ID is required." });
  }

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("proposalID", sql.Int, proposalID)
      .input("pStatus", sql.NVarChar, "Accepted")
      .query(`
        UPDATE Proposals 
        SET pStatus = @pStatus 
        WHERE proposalID = @proposalID
      `);

    res.status(200).json({ message: "Proposal status updated to Accepted." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a new proposal
router.post("/", async (req, res) => {
  const { freelancerID, jobID, bidAmount, coverLetter } = req.body;

  // Validate required fields
  if (!freelancerID || !jobID || !bidAmount || !coverLetter) {
    return res.status(400).json({ 
      error: "Missing required fields. Please provide freelancerID, jobID, bidAmount, and coverLetter." 
    });
  }

  try {
    const pool = await poolPromise;
    
    // Submit the proposal using stored procedure
    await pool
      .request()
      .input("freelancerID", sql.Int, freelancerID)
      .input("jobID", sql.Int, jobID)
      .input("bidAmount", sql.Int, bidAmount)
      .input("coverLetter", sql.Text, coverLetter)
      .input("pStatus", sql.VarChar(50), 'Pending')
      .execute("sp_SubmitProposal");
    
    // Minus the bid amount from freelancer's total connects
    await pool
      .request()
      .input("freelancerID", sql.Int, freelancerID)
      .input("bidAmount", sql.Int, bidAmount)
      .query(`
        UPDATE Freelancers
        SET totalConnects = totalConnects - @bidAmount
        WHERE freelancerID = @freelancerID
      `);

    res.status(201).json({
      message: "Proposal submitted successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all proposals for a job
router.get("/job/:jobID", async (req, res) => {
  const { jobID } = req.params; 

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("jobID", sql.Int, jobID)
      .query("SELECT * FROM Proposals WHERE jobID = @jobID AND pStatus = 'pending'");

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
    const result = await pool
      .request()
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
    await pool
      .request()
      .input("proposalID", sql.Int, proposalID)
      .query("DELETE FROM Proposals WHERE proposalID = @proposalID");

    res.status(200).json({ message: "Proposal deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
