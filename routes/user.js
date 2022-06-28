const express = require("express");

const router = express.Router();
const user = require("../controllers/user");

router.get("/user-list/", user.userList);
router.get("/dashboard/", user.getDashboard);
router.get("/notifications-count", user.getCountNotifications);
router.get("/notifications", user.getNotificationsList);

module.exports = router;
