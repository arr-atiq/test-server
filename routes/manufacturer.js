const express = require("express");

const router = express.Router();
const manufacturer = require("../controllers/manufacturer");

router.get("/manufacturers", manufacturer.getManufacturerList);
router.put("/manufacturer/:id", manufacturer.editManufacturer);
router.delete("/manufacturer/:id", manufacturer.deleteManufacturer);
router.put("/schemas", manufacturer.updateAllSchemasByManufacturer);

module.exports = router;
