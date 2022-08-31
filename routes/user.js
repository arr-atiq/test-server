const express = require("express");

const router = express.Router();
const user = require("../controllers/user");

router.get("/user-list/", user.userList);
router.get("/user-details", user.userDetails);
router.get("/user-manufacturers", user.getManufacturersForUser);
router.get("/user-supervisors", user.getSupervisorsForUser);
router.get("/user-salesagents", user.getSalesagentsForUser);
router.get("/user-retailers", user.getRetailersForUser);
router.get("/dashboard/", user.getDashboard);
router.get("/dashboard-collection-disbursement-graph/", user.getCollectionDisbursementGraphData);
router.get("/notifications-count", user.getCountNotifications);
router.get("/notifications", user.getNotificationsList);
router.post("/sendotp", user.sendOtp);
router.put("/compareotp", user.compareOtp);
router.get("/smart-search-view/", user.getSearchResultView);
router.get("/documents-view/", user.getDocumentsView);

module.exports = router;
