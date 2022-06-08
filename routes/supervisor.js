const express = require("express");

const router = express.Router();
const supervisor = require("../controllers/supervisor");

router.get("/supervisors", supervisor.getSupervisorList);
router.get("/manufacturers/:supervisor_id", supervisor.getAllManufacturerForSupervisor);
router.get("/supervisors/:manufacturer_id/:distributor_id", supervisor.getSupervisorListByManufacturerAndDistributor);
router.put("/supervisor/:id", supervisor.editSupervisor);
router.delete("/supervisor/:id", supervisor.deleteSupervisor);
router.get("/salesagents-manufacturers/:supervisor_id", supervisor.getAllManufacturerOfSalesagentUnderSupervisor);
router.get("/salesagents/:manufacturer_id/:supervisor_code", supervisor.getSalesAgentListByManufacturerAndSupervisor);
router.get("/retailers/:manufacturer_id/:salesagent_id", supervisor.getRetailerListByManufacturerAndSalesagent);
router.get("/disbursement/:salesagent_id/:retailer_id", supervisor.getDisbursementBySalesagentAndRetailer);
router.get("/unuploaded-supervisor-bulk", supervisor.generateSupervisorUnuploadedData);


module.exports = router;
