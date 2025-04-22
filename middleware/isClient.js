// middleware/isClient.js
const { sql, poolPromise } = require("../config/db");

const isClient = async (req, res, next) => {
  const userID = req.session?.userID || req.headers['user-id']; 

  if (!userID) {
    return res.status(400).json({ message: "Missing userID or not authenticated" });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userID", sql.Int, userID)
      .query("SELECT cID FROM Clients WHERE cID = @userID");

    if (result.recordset.length === 0) {
      return res.status(403).json({ message: "Access denied. Not a client." });
    }

    req.user = { cID: result.recordset[0].cID };

    next();  
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = isClient;
