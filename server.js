//server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rootRouter = require("./routes/index");
const { poolPromise, sql } = require("./config/db");
const { createServer } = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 4000;
const app = express();
const httpServer = createServer(app);

// Enable CORS for all routes
app.use(cors());

app.use(express.json());

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  path: "/socket.io",
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  cookie: false
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a room based on user ID
  socket.on("join_room", (userID) => {
    socket.join(userID);
    console.log(`User ${userID} joined their room`);
  });

  // Handle sending messages
  socket.on("send_message", async (data) => {
    try {
      const pool = await poolPromise;
      const { senderID, receiverID, content } = data;
      
      // Save message to database
      await pool.request()
        .input("senderID", sql.Int, senderID)
        .input("receiverID", sql.Int, receiverID)
        .input("content", sql.NVarChar, content)
        .query(`
          INSERT INTO Messages (senderID, receiverID, content, timestamp, isRead)
          VALUES (@senderID, @receiverID, @content, GETDATE(), 0)
        `);

      // Emit to specific user's room
      io.to(receiverID.toString()).emit("receive_message", {
        senderID,
        content,
        timestamp: new Date()
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  });

  // Handle message read status
  socket.on("mark_as_read", async (data) => {
    try {
      const pool = await poolPromise;
      const { messageID } = data;
      
      await pool.request()
        .input("messageID", sql.Int, messageID)
        .query(`
          UPDATE Messages 
          SET isRead = 1 
          WHERE messageID = @messageID
        `);
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// API routes
app.use("/api/v1/", rootRouter);

// Start server
poolPromise 
    .then(() => {
        httpServer.listen(PORT, () => {
            console.log(`Server running on PORT ${PORT}`);
            console.log(`Socket.IO server is running`);
        });
    })
    .catch(err => {
        console.error("Unable to start server due to DB connection failure:", err);
    });
