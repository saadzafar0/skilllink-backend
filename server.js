
//server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rootRouter = require("./routes/index");
const { poolPromise } = require("./config/db");

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

poolPromise 
    .then(() => {
        app.use("/api/v1/", rootRouter);
        app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
    })
    .catch(err => {
        console.error("Unable to start server due to DB connection failure:", err);
    });
