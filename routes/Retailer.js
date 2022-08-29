const express = require("express");

const router = express.Router();
const multer = require("multer");
const retailer = require("../controllers/retailer");

const { uploadDynamicBulkConfig, uploadLimitUpload, uploadCreditMemo } = require("../controllers/helper");
const uploadDynBulkFile = multer({ storage: uploadDynamicBulkConfig("file") });
const uploadLimitUploadFile = multer({ storage: uploadLimitUpload("file") });
const uploadCreditMemoFile = multer({ storage: uploadCreditMemo("file") });

router.get("/retailers", retailer.getRetailerList);
router.get("/retailer-region", retailer.getRetailerRegionOperation);
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
router.get("/retailer-individual-report-monthly", retailer.generateRetailersMonthlyIndividualReport);
router.get("/retailer-individual-view-monthly", retailer.retailersMonthlyIndividualView);
router.get("/retailer-individual-report-total", retailer.generateRetailersIndividualTotalReport);
router.get("/retailer-outstanding-report", retailer.generateRetailerOutstandingReport)
//retailer-report-2-comprehensive

//retailer-report-3
router.get("/retailer-loan-status-report", retailer.generateRetailersLoanStatusReport);
router.get("/retailer-loan-status-report-view", retailer.retailerLoanStatusView);

//retailer-report-3

//Monthly Retailer Performance report for Distributor (Supervisor)
router.get("/retailer-monthly-performance-report-for-distributor", retailer.generateRetailersMonthlyPerformanceDistributor);
router.get("/retailer-monthly-performance-for-distributor-view", retailer.retailersMonthlyPerformanceDistributor);
//Monthly Retailer Performance report for Distributor (Supervisor)

//Monthly Retailer Performance report for Distributor (Admin)
router.get("/retailer-monthly-performance-report-for-distributor-admin", retailer.generateRetailersMonthlyPerformanceDistributorForAdmin);
router.get("/retailer-monthly-performance-for-distributor-view-admin", retailer.retailersMonthlyPerformanceDistributorForAdmin);
//Monthly Retailer Performance report for Distributor (Admin)

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

router.get("/check-retailer-data-validity/", retailer.checkRetailerDataValidity);
router.get("/check-retailer-eligibility/", retailer.checkRetailerEligibility);

router.post("/retailer-list-excel-download", retailer.retailerListExcelDownload);
router.get("/retailer-ineligible-excel-download", retailer.retailerIneligibleExcelDownload);
router.post("/download-ekyc-report", retailer.downloadEkycReport);
router.get("/check-retailer-data-validity-by-id/:retailer_upload_id", retailer.checkRetailerDataValidityById);
router.get("/get-retailer-invalid-data/", retailer.getRetailerInvalidData);
router.get("/get-retailer-invalid-data-by-id/:mapping_id", retailer.getRetailerInvalidDataById);
router.post("/update-retailer-invalid-data-by-id/", retailer.updateRetailerInvalidDataById);
// router.get("/get-duplicate-retailer-list-by-id/:retailer_upload_id", retailer.getDuplicateRetailerListById);
router.get("/get-duplicate-retailer-data-by-id/:id", retailer.getDuplicateRetailerDataById);
router.post("/update-retailer-duplicate-data", retailer.updateRetailerDuplicateData);
router.post("/create-credit-memo/", retailer.createCreditMemo);
router.post("/download-limit-upload-file", retailer.downloadLimitUploadFile);
router.post("/download-credit-memo", retailer.creditMemoDownload);

router.post(
    "/upload-limit-upload-file",
    uploadLimitUploadFile.single("file"),
    retailer.uploadRetailerLimitUploadFile
);

router.post(
    "/upload-credit-memo-file",
    uploadCreditMemoFile.single("file"),
    retailer.uploadCreditMemoFile
);

router.post("/credit-memo-action", retailer.creditMemoAction);
router.post("/active-retailer-duplicate-data", retailer.activeRetailerDuplicateData);
router.get("/credit-memo-list/", retailer.creditMemoList);

router.post("/download-eligible-retailer-list", retailer.downloadEligibleRetailerList);
router.post("/download-ekyc-eligible-retailer-list", retailer.downloadeKycEligibleRetailerList);
router.post("/download-retailer-crm-limit-excel", retailer.downloadRetailerCrmLimitExcel);

router.get("/count-pending-eligibility/", retailer.countPendingEligibility);
router.get("/count-pending-ekyc/", retailer.countPendingEkyc);
router.get("/count-pending-cib/", retailer.countPendingCib);
router.get("/count-pending-limit-upload/", retailer.countPendingLimitUpload);
// router.get("/count-pending-cib/", retailer.countPendingCib);

module.exports = router;
