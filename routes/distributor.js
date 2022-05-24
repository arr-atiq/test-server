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

module.exports = router;
