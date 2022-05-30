const express = require("express");

const router = express.Router();
const loan = require("../controllers/loanController");

router.post("/loanCalculation", loan.insertLoanCalculation);


module.exports = router;