const { sendApiResult } = require('./helperController');
const Menu = require('../Models/MenuModel');

exports.menuList = async (req, res) => {
  try {
    const result = await Menu.menuList(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
