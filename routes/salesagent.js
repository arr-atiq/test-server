const express = require('express');

const router = express.Router();
const salesagent = require('../controllers/salesAgentController');

router.post('/get-salesagent-list', salesagent.getSalesAgentList);

module.exports = router;
