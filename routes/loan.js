const express = require("express");

const router = express.Router();
const loan = require("../controllers/loanController");

router.post("/loanCalculation", loan.insertLoanCalculation);
router.post("/addCredit", loan.addCredit);
router.post("/salesAgent/disbursement", loan.disbursement);
router.post("/retailer/repayment", loan.repayment);
router.get("/retailer/slab", loan.slab);


module.exports = router;