const { sendApiResult } = require('./helper');
const Menu = require('../Models/Menu');

exports.menuList = async (req, res) => {
  try {
    const result = await Menu.menuList(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
