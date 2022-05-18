const express = require('express');

const router = express.Router();
const manufacturer = require('../controllers/manufacturerController');

router.post('/get-manufacturer-list', manufacturer.getManufacturerList);
router.post("/edit-manufacturer", manufacturer.editManufacturer);
router.post("/delete-manufacturer", manufacturer.deleteManufacturer);
module.exports = router;
