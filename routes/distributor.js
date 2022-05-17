const express = require('express');

const router = express.Router();
const distributor = require('../controllers/distributorController');

router.post('/get-distributor-list', distributor.getDistributorList);

module.exports = router;
