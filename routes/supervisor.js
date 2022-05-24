const express = require("express");

const router = express.Router();
const supervisor = require("../controllers/supervisor");

router.get("/supervisors", supervisor.getSupervisorList);
router.put("/supervisor/:id", supervisor.editSupervisor);
router.delete("/supervisor/:id", supervisor.deleteSupervisor);

module.exports = router;
