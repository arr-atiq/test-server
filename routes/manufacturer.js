const express = require('express');

const router = express.Router();
const manufacturer = require('../controllers/manufacturerController');

router.get('/manufacturers', manufacturer.getManufacturerList);
router.put('/manufacturer/:id', manufacturer.editManufacturer);
router.delete('/manufacturer/:id', manufacturer.deleteManufacturer);
module.exports = router;
