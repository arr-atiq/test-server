const { sendApiResult } = require("./helper");
const User = require("../Models/User");

exports.userList = async (req, res) => {
  try {
    const result = await User.userList(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const result = await User.getDashboard(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};