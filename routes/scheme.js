const express = require('express');
const router = express.Router();
const scheme = require('../controllers/scheme');
const { schemaValidation} = require("../middleware/schemeInputValidation")

router.post('/',schemaValidation, scheme.createScheme);

module.exports = router;
