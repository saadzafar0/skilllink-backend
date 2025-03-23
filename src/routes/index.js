const express = require('express');

const userRouter = require("./user")
const freelancerRouter = require("./freelancer")
const freelancerSkills = require("./freelancerSkills")
const skills  = require("./skills")

const router = express.Router()

router.use("/user",userRouter)
router.use("/freelancer",freelancerRouter)
router.use("/freelancer-skills",freelancerSkills)
router.use("/skills",skills)



module.exports = router


