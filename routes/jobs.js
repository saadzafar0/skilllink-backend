const express = require("express");
const { postJob } = require("../controllers/postJobController");
const isClient = require("../middleware/isClient");
const { sql, poolPromise } = require("../config/db");

const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    
    let query = `
      SELECT * FROM Jobs 
      Where
      jobID NOT IN (
        SELECT jobID FROM Proposals 
        WHERE pStatus IN ('Accepted', 'Completed')
      )`;
    
    const result = await request.query(query);
    
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });1
  }
});




router.post("/", isClient, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      targetSkills, 
      estTime, 
      jobLevel, 
      connectsRequired
    } = req.body;
    
    // Get client ID from the request headers
    const cID = req.headers["user-id"];
    
    if (!cID) {
      return res.status(401).json({ message: "Client ID not provided" });
    }
    
    const pool = await poolPromise;
    const request = pool.request();
    
    // Add input parameters
    request.input("cID", sql.Int, parseInt(cID));
    request.input("Title", sql.VarChar(255), title);
    request.input("description", sql.Text, description);
    request.input("targetSkills", sql.VarChar(255), targetSkills);
    request.input("connectsRequired", sql.Int, parseInt(connectsRequired));
    request.input("estTime", sql.VarChar(50), estTime);
    request.input("jobLevel", sql.VarChar(50), jobLevel);
    
    const result = await request.execute("sp_PostJob");
    
    res.status(201).json({ 
      message: "Job created successfully"
    });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: error.message });
  }
});

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


// JobDetails
router.get("/client/:clientId", async (req, res) => {
  const { clientId } = req.params;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input("cID", sql.Int, clientId);

    // Modified query to exclude jobs that have proposals with pStatus = 'Accepted' or 'Completed'
    // Status filtering removed completely
    const query = `
      SELECT * FROM Jobs 
      WHERE cID = @cID
      AND jobID NOT IN (
        SELECT jobID FROM Proposals 
        WHERE pStatus IN ('Accepted', 'Completed')
      )
    `;

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching client jobs:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/client/:clientId", async (req, res) => {
  const { clientId } = req.params;
  const { status } = req.query;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input("cID", sql.Int, clientId);

    // Modified query to exclude jobs that have proposals with pStatus = 'Accepted'
    let query = `
      SELECT * FROM Jobs 
      WHERE cID = @cID
      AND jobID NOT IN (
        SELECT jobID FROM Proposals 
        WHERE pStatus = 'Accepted'
      )
    `;

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

// Get active jobs using the ActiveJobs view
router.get("/active", async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    
    const query = `SELECT * FROM ActiveJobs`;
    const result = await request.query(query);
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching active jobs:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
