const express = require("express");

const router = express.Router();
const retailer = require("../controllers/retailerController");

router.get("/check-retailer-eligibility/", retailer.checkRetailerEligibility);
router.get("/scheme-wise-limit-configure/", retailer.schemeWiseLimitConfigure);

module.exports = router;
