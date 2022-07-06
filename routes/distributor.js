const express = require("express");

const router = express.Router();
const distributor = require("../controllers/distributor");

router.get("/distributors", distributor.getDistributorList);
router.put("/distributor/:id", distributor.editDistributor);
router.delete("/distributor/:id", distributor.deleteDistributor);

router.get(
  "/distributors/:manufacturer_id",
  distributor.getDistributorByManufacturer
);

router.get(
  "/manufacturer",
  distributor.getManufacturerByDistributor
);

router.get("/unuploaded-distributor-data", distributor.generateDistributorUnuploadedReport);
router.get("/invalidated-distributor-data", distributor.generateDistributorInvalidatedReport);

module.exports = router;
