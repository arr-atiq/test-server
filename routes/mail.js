const express = require("express");

const router = express.Router();
const mail = require("../controllers/mail");

//router.get('/sendmails', mail.getsendMail);
router.post("/sendmail", mail.saveMail);
router.get("/sendmail/:id", mail.sendMail);

module.exports = router;
