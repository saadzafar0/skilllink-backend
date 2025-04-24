const express = require("express");
const { sql, poolPromise } = require("../config/db");
const router = express.Router();

router.get("/unread/:userID", async (req, res) => {
  const { userID } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userID", sql.Int, userID)
      .query("SELECT COUNT(*) AS count FROM Messages WHERE receiverID = @userID AND isRead = 0");
    res.status(200).json({ count: result.recordset[0].count });
  } catch (err) {
    console.error("Error fetching unread messages:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all conversations for a user
router.get("/conversations/:userID", async (req, res) => {
  const { userID } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userID", sql.Int, userID)
      .query(`
        WITH RankedMessages AS (
          SELECT 
            CASE 
              WHEN m.senderID = @userID THEN m.receiverID
              ELSE m.senderID
            END as userID,
            u.name,
            m.content as lastMessage,
            m.timestamp as lastMessageTimestamp,
            ROW_NUMBER() OVER (
              PARTITION BY 
                CASE 
                  WHEN m.senderID = @userID THEN m.receiverID
                  ELSE m.senderID
                END
              ORDER BY m.timestamp DESC
            ) as rn
          FROM Messages m
          JOIN Users u ON (m.senderID = u.userID OR m.receiverID = u.userID)
          WHERE (m.senderID = @userID OR m.receiverID = @userID)
            AND u.userID != @userID
        )
        SELECT 
          userID,
          name,
          lastMessage,
          lastMessageTimestamp,
          (
            SELECT COUNT(*) 
            FROM Messages 
            WHERE receiverID = @userID 
              AND senderID = userID 
              AND isRead = 0
          ) as unreadCount
        FROM RankedMessages
        WHERE rn = 1
        ORDER BY lastMessageTimestamp DESC
      `);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Start a new conversation
router.post("/start-conversation", async (req, res) => {
  const { senderID, receiverID, content } = req.body;
  try {
    const pool = await poolPromise;
    
    // Check if conversation already exists
    const checkResult = await pool
      .request()
      .input("senderID", sql.Int, senderID)
      .input("receiverID", sql.Int, receiverID)
      .query(`
        SELECT TOP 1 messageID 
        FROM Messages 
        WHERE (senderID = @senderID AND receiverID = @receiverID)
           OR (senderID = @receiverID AND receiverID = @senderID)
      `);

    if (checkResult.recordset.length === 0) {
      // Create first message
      await pool
        .request()
        .input("senderID", sql.Int, senderID)
        .input("receiverID", sql.Int, receiverID)
        .input("content", sql.NVarChar, content)
        .query(`
          INSERT INTO Messages (senderID, receiverID, content, timestamp, isRead)
          VALUES (@senderID, @receiverID, @content, GETDATE(), 0)
        `);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error starting conversation:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get messages between two users
router.get("/:userID1/:userID2", async (req, res) => {
  const { userID1, userID2 } = req.params;
  
  // Validate and convert userIDs to integers
  const parsedUserID1 = parseInt(userID1, 10);
  const parsedUserID2 = parseInt(userID2, 10);
  
  if (isNaN(parsedUserID1) || isNaN(parsedUserID2)) {
    return res.status(400).json({ error: "Invalid user IDs provided" });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userID1", sql.Int, parsedUserID1)
      .input("userID2", sql.Int, parsedUserID2)
      .query(`
        SELECT m.*, u.name as senderName
        FROM Messages m
        JOIN Users u ON m.senderID = u.userID
        WHERE (m.senderID = @userID1 AND m.receiverID = @userID2)
           OR (m.senderID = @userID2 AND m.receiverID = @userID1)
        ORDER BY m.timestamp ASC
      `);

    // Mark messages as read
    await pool
      .request()
      .input("userID1", sql.Int, parsedUserID1)
      .input("userID2", sql.Int, parsedUserID2)
      .query(`
        UPDATE Messages
        SET isRead = 1
        WHERE receiverID = @userID1 AND senderID = @userID2 AND isRead = 0
      `);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;