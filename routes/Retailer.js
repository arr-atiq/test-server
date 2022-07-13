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

//retailer-report-1
router.get("/retailer-monthly-report", retailer.generateRetailersMonthlyReport);
router.get("/retailer-monthly-report-filter-view", retailer.RetailersMonthlyReport);
router.get("/retailer-district", retailer.getRetailerDistrict);
//retailer-report-1

//retailer-report-2-comprehensive
router.get("/retailer-individual-report", retailer.generateRetailersIndividualReport);
router.get("/retailer-outstanding-report", retailer.generateRetailerOutstandingReport)
//retailer-report-2-comprehensive

//retailer-report-3
router.get("/retailer-loan-status-report", retailer.generateRetailersLoanStatusReport);
router.get("/retailer-loan-status-report-view", retailer.generateRetailersMonthlyReport);

//retailer-report-3
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

router.post("/retailer-list-excel-download", retailer.retailerListExcelDownload);

module.exports = router;