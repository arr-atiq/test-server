const express = require("express");

const router = express.Router();
const menu = require("../controllers/menu");

router.post("/user-wise-menu-list", menu.userWiseMenuList);
router.post("/add-menu", menu.addMenu);
router.post("/menu-list", menu.menuList);
router.get("/menu-details/:id", menu.menuDetails);
router.get("/delete-menu/:id", menu.menuDelete);

module.exports = router;
