const express = require("express");

const router = express.Router();
const distributor = require("../controllers/distributor");

router.get("/distributors", distributor.getDistributorList);
router.put("/distributor/:id", distributor.editDistributor);
router.delete("/distributor/:id", distributor.deleteDistributor);
router.get("/distributors-list-for-drop-down", distributor.getDistributorListDropDown);
router.get(
  "/distributors/:manufacturer_id",
  distributor.getDistributorByManufacturer
);

router.get(
  "/manufacturer",
  distributor.getManufacturerByDistributor
);
router.get(
  "/distributor-code",
  distributor.getDistributorCodeByDistributor
);

router.get("/unuploaded-distributor-data", distributor.generateDistributorUnuploadedReport);
router.get("/invalidated-distributor-data", distributor.generateDistributorInvalidatedReport);

//Consolidated Annual Distributor Performance for IPDC Report
router.get("/distributor-consolidated-annual-report", distributor.generateDistributorAnnualReport);
router.get("distributor-consolidated-annual-filter-view", distributor.filterDistributorAnnualView);
//Consolidated Annual Distributor Performance for IPDC Report

module.exports = router;
