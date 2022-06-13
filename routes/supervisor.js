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
router.get("/disbursement/:supervisor_code", supervisor.getDisbursementBySalesagentAndRetailer);
router.get("/repayment/:supervisor_code", supervisor.getRepaymentBySalesagentAndRetailer);
router.get("/unuploaded-supervisor-data", supervisor.generateSupervisorUnuploadedReport);
router.get("/invalidated-supervisor-data", supervisor.generateSupervisorInvalidatedReport);
//12/6/2022
router.get("/salesagents/:supervisor_code", supervisor.getSalesAgentListBySupervisor);


module.exports = router;
