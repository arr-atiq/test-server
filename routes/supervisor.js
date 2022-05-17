const express = require('express');

const router = express.Router();
const supervisor = require('../controllers/supervisorController');

router.post('/get-supervisor-list', supervisor.getSupervisorList);

module.exports = router;
