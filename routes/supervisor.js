const express = require("express");

const router = express.Router();
const supervisor = require("../controllers/supervisor");

router.get("/supervisors", supervisor.getSupervisorList);
router.get("/manufacturers/:supervisor_id", supervisor.getAllManufacturerForSupervisor);
router.get("/supervisors/:manufacturer_id/:distributor_id", supervisor.getSupervisorListByManufacturerAndDistributor);
router.put("/supervisor/:id", supervisor.editSupervisor);
router.delete("/supervisor/:id", supervisor.deleteSupervisor);

module.exports = router;
