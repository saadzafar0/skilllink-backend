const express = require('express');

const userRouter = require("./user")
const freelancerRouter = require("./freelancer")
const freelancerSkills = require("./freelancerSkills")

const router = express.Router()

router.use("/user",userRouter)
router.use("/freelancer",freelancerRouter)
router.use("/freelancerSkills",freelancerSkills)


module.exports = router


