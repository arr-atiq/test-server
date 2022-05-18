const express = require('express');

const router = express.Router();
const distributor = require('../controllers/distributorController');

router.post('/get-distributor-list', distributor.getDistributorList);
router.post("/edit-distributor", distributor.editDistributor);
router.post("/delete-distributor", distributor.deleteDistributor);

module.exports = router;
