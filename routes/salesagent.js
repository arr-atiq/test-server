const express = require("express");

const router = express.Router();
const salesagent = require("../controllers/salesAgent");

router.get("/salesagents", salesagent.getSalesAgentList);
router.get("/retailer-details/:salesagent_id", salesagent.getRetailerbySalesAgent);
router.get("/operation-regions/:id", salesagent.getSalesAgentOperationRegion);
router.get("/retailers/:salesagent_id", salesagent.getRetailersByRegionOperation);
router.get("/salesagents/:manufacturer_id", salesagent.getSalesAgentListByManufacturerAndSupervisor);
router.put("/salesagent/:id", salesagent.editSalesAgent);
router.delete("/salesagent/:id", salesagent.deleteSalesAgent);

module.exports = router;
