//authContoller.js
const { sql, poolPromise } = require("../config/db");


const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT * FROM Users WHERE email = @email");

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.recordset[0];

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("Login successful for:", user.email);
    res.status(200).json({
      message: "Login successful",
      userID: user.userID,
      name: user.Name,
      accType: user.accType,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const registerUser = async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    country, 
    accType,
    // Freelancer fields
    niche,
    hourlyRate,
    qualification,
    about,
    // Client fields
    companyName,
    companyAddress
  } = req.body;

  try {
    const pool = await poolPromise;
    
    // Check if email exists
    const emailCheck = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT userID FROM Users WHERE email = @email");

    if (emailCheck.recordset.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Start transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Insert into Users table
      const userResult = await new sql.Request(transaction)
        .input("name", sql.NVarChar, name)
        .input("email", sql.NVarChar, email)
        .input("password", sql.NVarChar, password)
        .input("country", sql.NVarChar, country)
        .input("accType", sql.NVarChar, accType)
        .query(`
          INSERT INTO Users (Name, email, password, Country, accType)
          OUTPUT INSERTED.userID
          VALUES (@name, @email, @password, @country, @accType)
        `);

      const userID = userResult.recordset[0].userID;

      // Insert into appropriate table based on account type
      if (accType === 'freelancer') {
        await new sql.Request(transaction)
          .input("freelancerID", sql.Int, userID)
          .input("niche", sql.NVarChar, niche)
          .input("hourlyRate", sql.Float, hourlyRate)
          .input("qualification", sql.NVarChar, qualification)
          .input("about", sql.NVarChar, about)
          .query(`
            INSERT INTO Freelancers (freelancerID, niche, hourlyRate, qualification, about)
            VALUES (@freelancerID, @niche, @hourlyRate, @qualification, @about)
          `);
      } else if (accType === 'client') {
        await new sql.Request(transaction)
          .input("cID", sql.Int, userID)
          .input("companyName", sql.NVarChar, companyName)
          .input("companyAddress", sql.NVarChar, companyAddress)
          .input("qualification", sql.NVarChar, qualification)
          .input("about", sql.NVarChar, about)
          .query(`
            INSERT INTO Clients (cID, companyName, companyAddress, qualification, about)
            VALUES (@cID, @companyName, @companyAddress, @qualification, @about)
          `);
          console.log("Client registration successful");
      }

      // Commit transaction
      await transaction.commit();
      
      res.status(201).json({ 
        message: "User registered successfully",
        userID: userID
      });
    } catch (error) {
      // Rollback transaction if any error occurs
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      details: "Registration failed. Please try again."
    });
  }
};

module.exports = { loginUser, registerUser };