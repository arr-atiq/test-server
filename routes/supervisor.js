const express = require('express');

const router = express.Router();
const supervisor = require('../controllers/supervisorController');

router.post('/get-supervisor-list', supervisor.getSupervisorList);
router.post("/edit-supervisor", supervisor.editSupervisor);
router.post("/delete-supervisor", supervisor.deleteSupervisor);

module.exports = router;
