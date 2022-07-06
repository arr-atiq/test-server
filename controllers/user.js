const { sendApiResult } = require("./helper");
const User = require("../Models/User");
const axios = require("axios");
const { NUMBER, DEFAULT } = require("oracledb");
const knex = require("../config/database");

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
exports.getNotificationsList = async (req, res) => {
  try {
    const result = await User.getNotificationsList(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.compareOtp = async (req, res) => {
  try {
    const result = await User.compareOtp(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
exports.sendOtp = async (req, res) => {
  try {
    const { sales_agent_id, retailer_onermn_account, disbursement_amount, repayment_amount, retailer_phone_number } = req.body;
    var four_digit_otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    four_digit_otp = four_digit_otp.substring(-2);
    let sms_body = `You have requested loan of BDT ${disbursement_amount} and repaid BDT ${repayment_amount}. Please share OTP with the agent ID <${sales_agent_id}> if agreed: FOUR DIGIT OTP - ${four_digit_otp}`;
    const { SMS_URL, MASKING, SMS_USERNAME, SMS_PASSWORD, MSGTYPE } = process.env;
    const response = await axios.get(`${SMS_URL}?masking=${MASKING}&userName=${SMS_USERNAME}&password=${SMS_PASSWORD}&MsgType=${MSGTYPE}&receiver=${retailer_phone_number}&message=${sms_body}`)
    if (response) {
      let object = {
        otp: four_digit_otp,
        expiry_time: 300000,
        status: 0,
        sales_agent_id,
        retailer_onermn_account,
        disbursement_amount,
        repayment_amount,
        retailer_phone_number
      }

      const retailer_onermn_account_exist = await knex
        .count("cr_otp.retailer_onermn_account as count")
        .from("APSISIPDC.cr_otp")
        .where(
          "APSISIPDC.cr_otp.retailer_onermn_account",
          retailer_onermn_account.toString()
        );

      const retailer_onermn_account_exist_val = parseInt(
        retailer_onermn_account_exist[0].count
      );

      if (retailer_onermn_account_exist_val == 0) {
        await knex("APSISIPDC.cr_otp").insert(object);
      }
      else {
        await knex("APSISIPDC.cr_otp")
          .where("APSISIPDC.cr_otp.retailer_onermn_account",
            retailer_onermn_account.toString())
          .delete();
        await knex("APSISIPDC.cr_otp").insert(object);
        
      }

    }
    else {
      res.send(sendApiResult(false, "OTP Sending failure.."));
    }
  }
  catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

