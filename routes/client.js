//client.js
const express = require("express");
const { sql, poolPromise } = require("../config/db");
const {registerUser} = require("../controllers/authController");
const router = express.Router();

router.post("/", async (req, res) => {
  const { cID, companyName, companyAddress, qualification, about } = req.body;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("userID", sql.Int, cID)
      .input("companyName", sql.VarChar(40), companyName)
      .input("companyAddress", sql.VarChar(255), companyAddress)
      .input("qualification", sql.VarChar(100), qualification)
      .input("about", sql.VarChar(255), about)
      .execute("sp_AddClient");

    res.status(201).json({
      cID: cID,
      message: "Client added successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  Get All Clients
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Clients");

    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  Get a Client by ID
router.get("/:cID", async (req, res) => {
  const { cID } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("cID", sql.Int, cID)
      .query("SELECT * FROM Clients WHERE cID = @cID");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  Update a Client
router.put("/:cID", async (req, res) => {
  const { cID } = req.params;
  const {
    companyName,
    companyAddress,
    qualification,
    about,
    amount,
    spent,
    rating,
    totalReviews,
  } = req.body;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("cID", sql.Int, cID)
      .input("companyName", sql.NVarChar, companyName)
      .input("companyAddress", sql.NVarChar, companyAddress)
      .input("qualification", sql.NVarChar, qualification)
      .input("about", sql.NVarChar, about)
      .input("amount", sql.Money, amount)
      .input("spent", sql.Money, spent)
      .input("rating", sql.Float, rating)
      .input("totalReviews", sql.Int, totalReviews).query(`
                UPDATE Clients 
                SET companyName = @companyName, 
                    companyAddress = @companyAddress,
                    qualification = @qualification,
                    about = @about,
                    amount = @amount,
                    spent = @spent,
                    rating = @rating,
                    totalReviews = @totalReviews
                WHERE cID = @cID
            `);

    res.status(200).json({ message: "Client updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  Delete a Client
router.delete("/:cID", async (req, res) => {
  const { cID } = req.params;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("cID", sql.Int, cID)
      .query("DELETE FROM Clients WHERE cID = @cID");

    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/register", registerUser);

// Spent By a Client
router.get("/spent/:userID", async (req, res) => {
  const { userID } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userID", sql.Int, userID)
      .query("SELECT spent FROM Clients WHERE cID = @userID");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Add Funds to Client Account
router.post("/add-funds", async (req, res) => {
  const { clientID, amount } = req.body;

  if (!clientID || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid client ID or amount" });
  }

  try {
    const pool = await poolPromise;
    
    // First, get the current amount
    const currentAmountResult = await pool
      .request()
      .input("clientID", sql.Int, clientID)
      .query("SELECT amount FROM Clients WHERE cID = @clientID");

    if (currentAmountResult.recordset.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    const currentAmount = currentAmountResult.recordset[0].amount || 0;
    const newAmount = parseFloat(currentAmount) + parseFloat(amount);
    
    // Update the client's amount
    await pool
      .request()
      .input("clientID", sql.Int, clientID)
      .input("newAmount", sql.Money, newAmount)
      .query("UPDATE Clients SET amount = @newAmount WHERE cID = @clientID");

    res.status(200).json({ 
      message: "Funds added successfully",
      newBalance: newAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
