const express = require("express");
const { sql, poolPromise } = require("../config/db");
const router = express.Router();

router.get("/unread/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query("SELECT COUNT(*) AS count FROM Messages WHERE receiverID = @userId AND isRead = 0");
    res.status(200).json({ count: result.recordset[0].count });
  } catch (err) {
    console.error("Error fetching unread messages:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;