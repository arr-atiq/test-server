const express = require("express");

const router = express.Router();
const retailer = require("../controllers/retailer");

router.get("/check-retailer-eligibility/", retailer.checkRetailerEligibility);
router.get("/scheme-wise-credit-limit-configure/", retailer.schemeWiseLimitConfigure);

module.exports = router;
