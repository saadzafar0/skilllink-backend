require("dotenv").config();
console.log("DB_SERVER:", process.env.DB_SERVER); 

const { connectDB } = require("./config/db");
const express = require("express");
const cors = require("cors");  // ✅ Import cors
const rootRouter = require("./routes/index");

const PORT = 4000;

const app = express();

app.use(cors()); 
app.use(express.json());

connectDB();

app.use("/api/v1/", rootRouter);

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`); 
});
