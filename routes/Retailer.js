const express = require("express");

const router = express.Router();
const multer = require("multer");
const retailer = require("../controllers/retailer");

const { uploadDynamicBulkConfig } = require("../controllers/helper");
const uploadDynBulkFile = multer({ storage: uploadDynamicBulkConfig("file") });

router.get("/retailers", retailer.getRetailerList);
router.get("/retailers/:distributor_id", retailer.getRetailerByDistributor);
router.put("/schema", retailer.updateSchemaByRetailers);
router.get("/rn_rmn_mapping/:retailer_id", retailer.getRnRmnMappingById);
router.get("/retailer/:retailer_id", retailer.getRetailerDetailsById);
router.put("/updateLimit/:rmnID", retailer.updateLimit);
router.post("/retailer-upload-list", retailer.retailerUploadList);

router.post(
    "/upload-retailer-ekyc-data",
    uploadDynBulkFile.single("file"),
    retailer.uploadRetailerEkycFile
);

router.post(
    "/upload-retailer-cib-data",
    uploadDynBulkFile.single("file"),
    retailer.uploadRetailerCibFile
);

router.post("/eligible-retailer-list-download", retailer.eligibleRetailerListDownload);

module.exports = router;