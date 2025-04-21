const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../config/db");

//  GET /api/v1/dashboard/proposals/:freelancerID
router.get("/proposals/:freelancerID", async (req, res) => {
  const { freelancerID } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("freelancerID", sql.Int, freelancerID)
      .query(`
        SELECT P.*, J.Title, J.estTime 
        FROM Proposals P 
        JOIN Jobs J ON P.jobID = J.jobID
        WHERE P.freelancerID = @freelancerID
        ORDER BY P.submittedOn DESC
      `);
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/dashboard/jobs/:clientID
router.get("/jobs/:clientID", async (req, res) => {
  const { clientID } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("clientID", sql.Int, clientID)
      .query(`
        SELECT * FROM Jobs 
        WHERE cID = @clientID 
        ORDER BY jobID DESC
      `);
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/dashboard/unread-messages/:userID
router.get("/unread-messages/:userID", async (req, res) => {
  const { userID } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userID", sql.Int, userID)
      .query(`
        SELECT COUNT(*) AS unreadCount 
        FROM Messages 
        WHERE receiverID = @userID AND isRead = 0
      `);
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/dashboard/transactions/:userID
router.get("/transactions/:userID", async (req, res) => {
  const { userID } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userID", sql.Int, userID)
      .query(`
        SELECT T.*, J.Title 
        FROM Transactions T 
        JOIN Jobs J ON T.jID = J.jobID
        WHERE J.cID = @userID OR 
              J.jobID IN (
                SELECT jobID FROM Proposals 
                WHERE freelancerID = @userID
              )
      `);
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
