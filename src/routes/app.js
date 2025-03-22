require("dotenv").config();
const express = require('express');
const userRouter = require("./user")

const router = express.router()

router.use("/user",userRouter)




module.exports = router


