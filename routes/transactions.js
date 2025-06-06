const express = require("express");
const { sql, poolPromise } = require("../config/db");
const router = express.Router();

// Create a New Transaction
router.post("/", async (req, res) => {
  const { jID, Amount, tStatus } = req.body;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("jobID", sql.Int, jID)
      .input("Amount", sql.Decimal(10, 2), Amount)
      .input("tStatus", sql.VarChar(50), tStatus)
      .execute("sp_ProcessTransaction");

    res.status(201).json({
      message: "Transaction recorded successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Transactions
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Transactions");

    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Transactions by Job ID
router.get("/job/:jID", async (req, res) => {
  const { jID } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("jID", sql.Int, jID)
      .query("SELECT * FROM Transactions WHERE jID = @jID");

    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a Single Transaction by ID
router.get("/:transactionID", async (req, res) => {
  const { transactionID } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("transactionID", sql.Int, transactionID)
      .query("SELECT * FROM Transactions WHERE transactionID = @transactionID");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a Transaction (e.g., status change)
router.put("/:transactionID", async (req, res) => {
  const { transactionID } = req.params;
  const { Amount, tStatus } = req.body;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("transactionID", sql.Int, transactionID)
      .input("Amount", sql.Decimal(10, 2), Amount)
      .input("tStatus", sql.NVarChar, tStatus).query(`
                UPDATE Transactions 
                SET Amount = @Amount, 
                    tStatus = @tStatus
                WHERE transactionID = @transactionID
            `);

    res.status(200).json({ message: "Transaction updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a Transaction
router.delete("/:transactionID", async (req, res) => {
  const { transactionID } = req.params;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("transactionID", sql.Int, transactionID)
      .query("DELETE FROM Transactions WHERE transactionID = @transactionID");

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT t.*
        FROM Transactions t
        JOIN Jobs j ON t.jID = j.jobID
        WHERE j.cID = @userId OR j.jobID IN (
          SELECT jobID FROM Proposals WHERE freelancerID = @userId AND pStatus = 'Accepted'
        )
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching transactions for user:", error);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/client/:clientId", async (req, res) => {
  const { clientId } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("clientId", sql.Int, clientId)
      .query(`
        SELECT 
            T.transactionID,
            T.Amount,
            T.tStatus,
            T.transactionOn,
            J.jobID,
            J.Title AS JobTitle,
            C.cID AS ClientID,
            U.Name AS ClientName,
            C.companyName
        FROM Transactions T
        JOIN Jobs J ON T.jID = J.jobID
        JOIN Clients C ON J.cID = C.cID
        JOIN Users U ON C.cID = U.userID
        WHERE C.cID = @clientId
        ORDER BY T.transactionOn DESC;
      `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching transactions for client:", error);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/freelancer/:freelancerID", async (req, res) => {
  const { freelancerID } = req.params;
  
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("freelancerID", sql.Int, freelancerID)
      .query(`
        SELECT 
            T.transactionID,
            T.jID AS JobID,
            J.Title AS JobTitle,
            J.description AS JobDescription,
            J.price AS JobPrice,
            P.proposalID,
            P.freelancerID,
            U.Name AS FreelancerName,
            F.niche AS FreelancerNiche,
            F.hourlyRate AS FreelancerRate,
            P.bidAmount,
            P.coverLetter,
            P.pStatus AS ProposalStatus,
            P.submittedOn AS ProposalDate,
            T.Amount,
            T.tStatus,
            T.transactionOn
        FROM Transactions T
        JOIN Jobs J ON T.jID = J.jobID
        JOIN Proposals P ON J.jobID = P.jobID
        JOIN Freelancers F ON P.freelancerID = F.freelancerID
        JOIN Users U ON F.freelancerID = U.userID
        WHERE P.pStatus = 'Completed'
        AND P.freelancerID = @freelancerID
        ORDER BY T.transactionOn DESC, J.jobID;
      `);
      
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching transactions for freelancer:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get transaction history using the TransactionsHistory view
router.get("/history", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM TransactionsHistory");
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
