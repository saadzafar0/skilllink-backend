const express = require("express");
const { postJob } = require("../controllers/postJobController");
const isClient = require("../middleware/isClient");
const { sql, poolPromise } = require("../config/db");

const router = express.Router();

router.get("/ongoingfreelancerJobs/:userID", async (req, res) => {
  const { userID } = req.params;
  
  try {
    const pool = await poolPromise;
    const request = pool.request();

    // Bind the userID parameter
    request.input('userID', userID);

    const query = `
      SELECT Jobs.*, Proposals.* 
      FROM Jobs
      JOIN Proposals ON Jobs.jobID = Proposals.jobID
      WHERE Proposals.pStatus = 'Accepted'
      AND Proposals.freelancerID = @userID
    `;

    const result = await request.query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No ongoing jobs found" });
    }

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching ongoing jobs:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/ongoing/:userID", async (req, res) => {
  const { userID } = req.params;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    // Bind the userID parameter
    request.input('userID', userID);

    const query = `
      SELECT * FROM Jobs
      JOIN Proposals ON Jobs.jobID = Proposals.jobID
      WHERE Proposals.pStatus = 'Accepted'
      AND Jobs.cID = @userID
    `;

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching job details:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    
    let query = "SELECT * FROM Jobs ORDER BY postedOn DESC";
    
    const result = await request.query(query);
    console.log("Jobs fetched successfully:", result.recordset);
    
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

// POST /api/v1/jobs/complete/:jobID - Mark job as completed and handle payment transfer
router.post("/complete/:jobID", async (req, res) => {
  console.log("Request to complete job received");
  const { jobID } = req.params;

  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input("jobID", sql.Int, parseInt(jobID));
    
    // Get job details including price, client ID, and freelancer ID
    const jobQuery = `
      SELECT j.jobID, j.price, j.cID, p.freelancerID, p.proposalID
      FROM Jobs j
      JOIN Proposals p ON j.jobID = p.jobID
      WHERE j.jobID = @jobID AND p.pStatus = 'Accepted'
    `;
    
    const jobResult = await request.query(jobQuery);
    
    console.log("Job result:", jobResult);
    const { price, cID, freelancerID, proposalID } = jobResult.recordset[0];

    // Check if client has sufficient balance
    const clientRequest = pool.request();
    clientRequest.input("cID", sql.Int, cID);
    clientRequest.input("price", sql.Money, price);
    
    const clientQuery = `
      SELECT amount FROM Clients WHERE cID = @cID AND amount >= @price
    `;
    
    const clientResult = await clientRequest.query(clientQuery);
    
    if (clientResult.recordset.length === 0) {
      return res.status(400).json({ message: "Insufficient client balance" });
    }

    // Update client's balance
    const updateClientRequest = pool.request();
    updateClientRequest.input("cID", sql.Int, cID);
    updateClientRequest.input("price", sql.Money, price);
    
    await updateClientRequest.query(`
      UPDATE Clients 
      SET amount = amount - @price,
          spent = spent + @price
      WHERE cID = @cID
    `);

    // Update freelancer's earned amount
    const updateFreelancerRequest = pool.request();
    updateFreelancerRequest.input("freelancerID", sql.Int, freelancerID);
    updateFreelancerRequest.input("price", sql.Money, price);
    
    await updateFreelancerRequest.query(`
      UPDATE Freelancers 
      SET earned = earned + @price,
          amount = amount + @price
      WHERE freelancerID = @freelancerID
    `);

    // Create transaction record
    const transactionRequest = pool.request();
    transactionRequest.input("jobID", sql.Int, parseInt(jobID));
    transactionRequest.input("amount", sql.Money, price);
    
    await transactionRequest.query(`
      INSERT INTO Transactions (jID, Amount, tStatus)
      VALUES (@jobID, @amount, 'Completed')
    `);

    // Mark the proposal as completed
    const updateProposalRequest = pool.request();
    updateProposalRequest.input("proposalID", sql.Int, proposalID);
    
    await updateProposalRequest.query(`
      UPDATE Proposals 
      SET pStatus = 'Completed'
      WHERE proposalID = @proposalID
    `);

    res.status(200).json({ 
      message: "Job completed successfully",
      amount: price,
      clientID: cID,
      freelancerID: freelancerID,
      proposalID: proposalID
    });

  } catch (error) {
    console.error("Error completing job:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
