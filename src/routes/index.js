const express = require('express');

const userRouter = require("./user")
const freelancerRouter = require("./freelancer")
const freelancerSkillsRouter = require("./freelancerSkills")
const skillsRouter  = require("./skills")
const jobsRouter = require("./jobs")
const proposalsRouter = require("./proposals")
const clientRouter = require("./client")
const transactionsRouter = require("./transactions")

const router = express.Router()

router.use("/user",userRouter)
router.use("/freelancer",freelancerRouter)
router.use("/freelancer-skills",freelancerSkillsRouter)
router.use("/skills",skillsRouter)
router.use("/jobs",jobsRouter)
router.use("/proposals",proposalsRouter)
router.use("/client",clientRouter)
router.use("/transation",transactionsRouter)





module.exports = router


