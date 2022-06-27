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
exports.getCountNotifications = async (req, res) => {
  try {
    const result = await User.getCountNotifications(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
exports.updateNotificationsSeen = async (req, res) => {
  try {
    const result = await User.updateNotificationsSeen(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
