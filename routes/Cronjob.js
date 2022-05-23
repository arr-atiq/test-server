const express = require('express');

const router = express.Router();
const retailer = require('../controllers/retailerController');

router.get('/check-retailer-eligibility/', retailer.checkRetailerEligibility);

module.exports = router;
