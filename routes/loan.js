const express = require("express");

const router = express.Router();
const loan = require("../controllers/loanController");

router.post("/loanCalculation", loan.insertLoanCalculation);
router.post("/addCredit", loan.addCredit);
router.post("/salesAgent/disbursement", loan.disbursement);


module.exports = router;