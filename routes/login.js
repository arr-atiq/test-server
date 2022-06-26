const express = require("express");

const router = express.Router();
const auth = require("../controllers/auth");

router.post("/", auth.login);
router.put("/device_token", auth.deviceToken);
module.exports = router;
