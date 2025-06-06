const express = require("express");
const app = express();
app.use (express.json());
const { sql, poolPromise } = require("../config/db");
const {registerUser} = require("../controllers/authController");
const router = express.Router();


// Buy Connects for Freelancer
router.post("/buy-connects", async (req, res) => {
  const { freelancerID, quantity, amount } = req.body;
  
  // Validate inputs
  if (!freelancerID || !quantity || !amount) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required fields: freelancerID, quantity, or amount" 
    });
  }
  
  try {
    const pool = await poolPromise;
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    
    try {
      // First check if user has enough balance
      const balanceResult = await transaction
        .request()
        .input("freelancerID", sql.Int, freelancerID)
        .query("SELECT amount FROM Freelancers WHERE freelancerID = @freelancerID");
      
      if (balanceResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false, 
          message: "Freelancer not found" 
        });
      }
      
      const currentBalance = balanceResult.recordset[0].amount;
      
      if (currentBalance < amount) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false, 
          message: "Insufficient balance" 
        });
      }
      
      // Update freelancer's balance and connects
      await transaction
        .request()
        .input("freelancerID", sql.Int, freelancerID)
        .input("amount", sql.Money, amount)
        .input("quantity", sql.Int, quantity)
        .query(`
          UPDATE Freelancers 
          SET amount = amount - @amount, 
              totalConnects = totalConnects + @quantity
          WHERE freelancerID = @freelancerID
        `);
      
      // Commit the transaction
      await transaction.commit();
      
      res.status(200).json({ 
        success: true, 
        message: "Connects purchased successfully" 
      });
    } catch (error) {
      // If there's an error, rollback changes
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error buying connects:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});


// Create Freelancer
router.post("/", async (req, res) => {
  const { freelancerID, niche, hourlyRate, qualification, about } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("userID", sql.Int, freelancerID)
      .input("niche", sql.VarChar(255), niche)
      .input("hourlyRate", sql.Float, hourlyRate)
      .input("qualification", sql.VarChar(100), qualification)
      .input("about", sql.VarChar(255), about)
      .execute("sp_AddFreelancer");

    res.status(201).json({ message: "Freelancer profile created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Freelancers
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    let result = await pool.request().query("SELECT * FROM Freelancers");
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Freelancer
router.get("/:freelancerID", async (req, res) => {
  const { freelancerID } = req.params;
  try {
    const pool = await poolPromise;
    let result = await pool
      .request()
      .input("freelancerID", sql.Int, freelancerID)
      .query("SELECT * FROM Freelancers WHERE freelancerID = @freelancerID");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Freelancer not found" });
    }
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Freelancer
router.put("/:freelancerID", async (req, res) => {
  const { freelancerID } = req.params;
  const { niche, hourlyRate, qualification, about } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("freelancerID", sql.Int, freelancerID)
      .input("niche", sql.NVarChar, niche)
      .input("hourlyRate", sql.Float, hourlyRate)
      .input("qualification", sql.NVarChar, qualification)
      .input("about", sql.NVarChar, about).query(`
                UPDATE Freelancers 
                SET niche = @niche, hourlyRate = @hourlyRate, 
                    qualification = @qualification, about = @about
                WHERE freelancerID = @freelancerID
            `);

    res
      .status(200)
      .json({ message: "Freelancer profile updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Freelancer
router.delete("/:freelancerID", async (req, res) => {
  const { freelancerID } = req.params;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("freelancerID", sql.Int, freelancerID)
      .query("DELETE FROM Freelancers WHERE freelancerID = @freelancerID");

    res
      .status(200)
      .json({ message: "Freelancer profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Earning of a Freelancer
router.get("/earnings/:freelancerID", async (req, res) => {
  const { freelancerID } = req.params;
  try {
    const pool = await poolPromise;
    let result = await pool
      .request()
      .input("freelancerID", sql.Int, freelancerID)
      .query(`
                SELECT earned FROM Freelancers
                WHERE freelancerID = @freelancerID
            `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Freelancer not found" });
    }
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// totalConnects of a Freelancer
router.get("/totalConnects/:freelancerID", async (req, res) => {
  const { freelancerID } = req.params;
  try {
    const pool = await poolPromise;
    let result = await pool
      .request()
      .input("freelancerID", sql.Int, freelancerID)
      .query(`
                SELECT totalConnects FROM Freelancers
                WHERE freelancerID = @freelancerID
            `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Freelancer not found" });
    }
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/register", registerUser);

//total Applied for Jobs of a Freelancer
router.get("/appliedJobs/:freelancerId", async (req, res) => {
  const { freelancerId } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("freelancerId", sql.Int, freelancerId)
      .query(`
        SELECT COUNT(*) AS appliedJobs
        FROM Proposals
        WHERE freelancerID = @freelancerId
      `);

    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching applied jobs count:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Withdraw Amount for Freelancer
router.post("/withdraw", async (req, res) => {
  const { freelancerID, amount, bankDetails } = req.body;

  // Validate inputs
  if (!freelancerID || !amount || !bankDetails) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: freelancerID, amount, or bankDetails",
    });
  }

  try {
    const pool = await poolPromise;

    // Check if freelancer exists and has enough balance
    const balanceResult = await pool
      .request()
      .input("freelancerID", sql.Int, freelancerID)
      .query("SELECT amount, earned FROM Freelancers WHERE freelancerID = @freelancerID");

    if (balanceResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Freelancer not found",
      });
    }

    const { amount: currentBalance, earned } = balanceResult.recordset[0];

    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    // Update freelancer's balance and earned amount
    await pool
      .request()
      .input("freelancerID", sql.Int, freelancerID)
      .input("amount", sql.Money, amount)
      .query(`
        UPDATE Freelancers 
        SET amount = amount - @amount, 
            earned = earned - @amount
        WHERE freelancerID = @freelancerID
      `);

    res.status(200).json({
      success: true,
      message: "Withdrawal successful",
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


module.exports = router;
