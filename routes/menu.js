const express = require('express');

const router = express.Router();
const menu = require('../controllers/menuController');

router.post('/menu-list', menu.menuList);

module.exports = router;
