const express = require("express");

const router = express.Router();
const user = require("../controllers/user");

router.get("/user-list/", user.userList);

module.exports = router;
