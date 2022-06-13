const express = require("express");

const router = express.Router();
const loan = require("../controllers/loanController");

router.post("/loanCalculation", loan.insertLoanCalculation);
router.post("/addCredit", loan.addCredit);
router.post("/salesAgent/disbursement", loan.disbursement);
router.post("/retailer/repayment", loan.repayment);
router.get("/retailer/slab", loan.slab);
router.get("/retailer/:onermn_acc", loan.totalLoan);
router.get("/getprocessingFeeAmount/:onermn_acc", loan.processingFeeAmout);
router.post("/UpdateprocessingFeeAmount", loan.UpdateprocessingFeeAmount);
router.post("/loanTenorInDays", loan.loanTenorInDays);
// router.post("/totalLoan", loan.totalLoan);


module.exports = router;