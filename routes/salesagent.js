const express = require('express');

const router = express.Router();
const salesagent = require('../controllers/salesAgentController');

router.get('/salesagents', salesagent.getSalesAgentList);
router.put("/salesagent/:id", salesagent.editSalesAgent);
router.delete("/salesagent/:id", salesagent.deleteSalesAgent);

module.exports = router;
