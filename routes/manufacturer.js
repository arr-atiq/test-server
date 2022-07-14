const express = require("express");

const router = express.Router();
const manufacturer = require("../controllers/manufacturer");

router.get("/manufacturers", manufacturer.getManufacturerList);
router.get("/manufacturers-list-for-drop-down", manufacturer.getManufacturerListDropDown);
router.put("/manufacturer/:id", manufacturer.editManufacturer);
router.delete("/manufacturer/:id", manufacturer.deleteManufacturer);
router.put("/schemas", manufacturer.updateAllSchemasByManufacturer);
router.get("/unuploaded-manufacturer-bulk", manufacturer.generateManufacturerSample)

router.get("/unuploaded-manufacturer-data", manufacturer.generateManufacturerUnuploadedReport);
router.get("/invalidated-manufacturer-data", manufacturer.generateManufacturerInvalidatedReport);

module.exports = router;
