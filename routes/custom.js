const express = require("express");
const multer = require("multer");
const router = express.Router();
const custom = require("../controllers/custom");
const { uploadDynamicBulkConfig } = require("../controllers/helper");

const uploadDynBulkFile = multer({ storage: uploadDynamicBulkConfig("file") });


  router.post(
    "/blacklist",
    uploadDynBulkFile.single("file"),
    custom.uploadBlackList
  );

  router.post(
    "/blacklistData",
    custom.uploadBlackListData
  );

  router.put(
    "/updatePassword",
    custom.updatePassword
  );

  router.get(
    "/getBlockList",
    custom.getBlockList
  );

module.exports = router;
