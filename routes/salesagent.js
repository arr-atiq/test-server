const express = require('express');

const router = express.Router();
const salesagent = require('../controllers/salesAgentController');

router.post('/get-salesagent-list', salesagent.getSalesAgentList);
router.post("/edit-salesagent", salesagent.editSalesAgent);
router.post("/delete-salesagent", salesagent.deleteSalesAgent);

module.exports = router;
