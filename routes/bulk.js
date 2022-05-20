const express = require('express');

const router = express.Router();
const multer = require('multer');
const manufacturer = require('../controllers/manufacturerController');
const distributor = require('../controllers/distributorController');
const supervisor = require('../controllers/supervisorController');
const salesagent = require('../controllers/salesAgentController');
const retailer = require('../controllers/retailerController');
const menu = require('../controllers/menuController');
const { uploadDynamicBulkConfig } = require('../controllers/helperController');

const uploadDynBulkFile = multer({ storage: uploadDynamicBulkConfig('file') });

router.post(
  '/upload-manufacturer-onboarding-data',
  uploadDynBulkFile.single('file'),
  manufacturer.uploadManufacturerOnboardingFile,
);

router.post(
  '/upload-distributor-onboarding-data',
  uploadDynBulkFile.single('file'),
  distributor.uploadDistributorOnboardingFile,
);

router.post(
  '/upload-distributor-supervisor-onboarding-data',
  uploadDynBulkFile.single('file'),
  supervisor.uploadSupervisorOnboardingFile,
);

router.post(
  '/upload-sales-agent-onboarding-data',
  uploadDynBulkFile.single('file'),
  salesagent.uploadSalesAgentOnboardingFile,
);

router.post(
  '/upload-retailer-onboarding-data',
  uploadDynBulkFile.single('file'),
  retailer.uploadRetailerOnboardingFile,
);

router.post('/menu-list', menu.menuList);

module.exports = router;
