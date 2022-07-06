const express = require("express");

const router = express.Router();
const multer = require("multer");
const supervisor = require("../controllers/supervisor");
const { uploadDynamicBulkConfig } = require("../controllers/helper");
const uploadDynBulkFile = multer({ storage: uploadDynamicBulkConfig("file") });
const { uploadConfig } = require("../controllers/helper");
const uploadFile = multer({ storage: uploadConfig("file") });

router.get("/supervisors", supervisor.getSupervisorList);
router.get("/manufacturers/:supervisor_code", supervisor.getAllManufacturerForSupervisor);
router.get("/supervisors/:manufacturer_id/:distributor_id", supervisor.getSupervisorListByManufacturerAndDistributor);
router.put("/supervisor/:id", supervisor.editSupervisor);
router.delete("/supervisor/:id", supervisor.deleteSupervisor);
router.get("/salesagents-manufacturers/:supervisor_id", supervisor.getAllManufacturerOfSalesagentUnderSupervisor);
router.get("/salesagents/:manufacturer_id/:supervisor_code", supervisor.getSalesAgentListByManufacturerAndSupervisor);
router.get("/retailers/:manufacturer_id/:salesagent_id", supervisor.getRetailerListByManufacturerAndSalesagent);
router.get("/disbursement-repayment/:manufacturer_id/:supervisor_code", supervisor.getDisbursementByManufacturerAndSupervisor);
router.get("/repayment/:supervisor_code", supervisor.getRepaymentBySalesagentAndRetailer);
router.get("/unuploaded-supervisor-data", supervisor.generateSupervisorUnuploadedReport);
router.get("/invalidated-supervisor-data", supervisor.generateSupervisorInvalidatedReport);
//12/6/2022
router.get("/salesagents/:supervisor_code", supervisor.getSalesAgentListBySupervisor);
router.get("/admin-remarks-feedback-details", supervisor.getRemarksFeedbackAdmin);
router.get("/admin-repayment-remarks-feedback-details", supervisor.getRepaymentRemarksFeedbackAdmin);
//router.get("/admin-repayment-remarks-feedback-details-history", supervisor.getRepaymentRemarksFeedbackHistoryAdmin);
// router.get("/supervisor-repayment-remarks-feedback-details-history", supervisor.getRepaymentRemarksFeedbackHistorySupervisor);
// router.get("/admin-disbursement-remarks-feedback-details-history", supervisor.getDisbursementRemarksFeedbackHistoryAdmin);

router.get("/supervisor-remarks-feedback-history/:supervisor_code", supervisor.getSupervisorFeedbackListHistory);
router.get("/admin-remarks-feedback-history", supervisor.getAdminFeedbackListHistory);
//router.get("/supervisor-disbursement-remarks-feedback-details-history", supervisor.getDisbursementRemarksFeedbackHistorySupervisor);
//router.put("/admin-remarks-feedback-updated", supervisor.updateAdminStatus);
router.post(
    "/remarks-feedback",
    uploadFile.single("file"),
    supervisor.saveRemarksFeedback
);

router.post(
    "/supervisor-remarks-feedback",
    supervisor.insertRemarksFeedback
);
router.put(
    "/admin-remarks-feedback/:admin_id",
    supervisor.updateAdminFeedback
);
router.get(
    "/admin-remarks-feedback",
    supervisor.getAdminFeedbackList
);

router.get(
    "/feedback-disbursement-repayment-details",
    supervisor.getDetailsFeedbackListDisbursementRepayment
);

// router.post(
//     "/upload-remarks_feedback",
//     uploadFile.single("file"),
//     supervisor.uploadFileReamarks
// );

module.exports = router;
