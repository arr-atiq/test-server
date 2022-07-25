const express = require("express");

const router = express.Router();
const auth = require("../controllers/auth");



router.get("/getPassAndMail", auth.getPassAndMail);
router.post("/", auth.login);
router.put("/device_token", auth.deviceToken);
router.put("/updatePassword", auth.updatePassword);

module.exports = router;
