const { sendApiResult } = require("./helper");
const Menu = require("../Models/Menu");

exports.userWiseMenuList = async (req, res) => {
  try {
    const result = await Menu.userWiseMenuList(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.addMenu = async (req, res) => {
  try {
    const result = await Menu.addMenu(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.menuList = async (req, res) => {
  try {
    const result = await Menu.menuList(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.menuDetails = async (req, res) => {
  try {
    const result = await Menu.menuDetails(req.params);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.menuDelete = async (req, res) => {
  try {
    const result = await Menu.menuDelete(req.params);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};