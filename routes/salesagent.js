const express = require("express");

const router = express.Router();
const salesagent = require("../controllers/salesAgent");

router.get("/salesagents", salesagent.getSalesAgentList);
router.get("/salesagnets-list-for-drop-down", salesagent.getSalesAgentListDropDown);
router.get("/manufacturers", salesagent.getManufacturerListBySalesagent);
router.get("/retailer-list/:salesagent_id", salesagent.getRetailerbySalesAgent);
router.get("/retailers/:salesagent_id/:manufacturer_id", salesagent.retailersBySalesAgentAndManufacturer);
router.get("/operation-regions/:id", salesagent.getSalesAgentOperationRegion);
router.get("/retailers/:salesagent_id", salesagent.getRetailersByRegionOperation);
router.get("/salesagents/:manufacturer_id", salesagent.getSalesAgentListByManufacturerAndSupervisor);
router.put("/salesagent/:id", salesagent.editSalesAgent);
router.delete("/salesagent/:id", salesagent.deleteSalesAgent);
router.get("/unuploaded-salesagent-data", salesagent.generateSalesagentUnuploadedReport);
router.get("/invalidated-salesagent-data", salesagent.generateSalesagentInvalidatedReport);
router.get("/salesagent-list-for-drop-down", salesagent.getSalesagentDropdownList);

//12/06/2022
router.get("/disbursement-amount/:salesagent_id/:distributor_id/:manufacture_id", salesagent.getRetailersBySalesAgent);

module.exports = router;
