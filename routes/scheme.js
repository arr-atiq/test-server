const express = require('express');
const router = express.Router();
const scheme = require('../controllers/scheme');

router.post('/', scheme.createScheme);

module.exports = router;
