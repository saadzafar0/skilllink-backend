const express = require("express");

const userRouter = require("./user");
const freelancerRouter = require("./freelancer");
const freelancerSkillsRouter = require("./freelancerSkills");
const skillsRouter = require("./skills");
const jobsRouter = require("./jobs");
const proposalsRouter = require("./proposals");
const clientRouter = require("./client");
const transactionsRouter = require("./transactions");
const dashboardRouter = require("./dashboard");
const submissionRouter = require("./submissions");
const messagesRouter = require("./messages");

const router = express.Router();

router.use("/user", userRouter);
router.use("/freelancer", freelancerRouter);
router.use("/freelancer-skills", freelancerSkillsRouter);
router.use("/skills", skillsRouter);
router.use("/jobs", jobsRouter);
router.use("/proposals", proposalsRouter);
router.use("/client", clientRouter);
router.use("/transations", transactionsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/submissions", submissionRouter);
router.use("/messages", messagesRouter);

module.exports = router;
