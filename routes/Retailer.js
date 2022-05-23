const express = require("express");

const router = express.Router();
const retailer = require("../controllers/retailerController");

router.post("/get-retailer-list/", retailer.getRetailerList);

module.exports = router;
