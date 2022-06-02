const express = require("express");

const router = express.Router();
const retailer = require("../controllers/retailerController");

router.get("/retailers", retailer.getRetailerList);
router.get("/retailers/:distributor_id", retailer.getRetailerByDistributor);
router.put("/schema", retailer.updateSchemaByRetailers);
router.get("/rn_rmn_mapping/:retailer_id", retailer.getRnRmnMappingById);
router.get("/retailer/:retailer_id", retailer.getRetailerDetailsById);
router.put("/updateLimit/:rmnID", retailer.updateLimit);

module.exports = router;