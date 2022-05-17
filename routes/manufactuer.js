const express = require('express');

const router = express.Router();
const manufacturer = require('../controllers/manufacturerController');

router.post('/get-manufactuer-list', manufacturer.getManufacturerList);
module.exports = router;
