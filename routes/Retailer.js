const express = require("express");

const router = express.Router();
const retailer = require("../controllers/retailerController");

router.post('/get-retailer-list/', retailer.getRetailerList);
router.get('/retailers/:distributor_id', retailer.getRetailerByDistributor);
router.put('/schema', retailer.updateSchemaByRetailers);

module.exports = router;
