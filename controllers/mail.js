const fs = require("fs");
const express = require("express");
const readXlsxFile = require("read-excel-file/node");
const xlsx = require("xlsx");
const moment = require("moment");
const { sendApiResult, uploaddir } = require("./helper");
const mailModel = require("../Models/Mail");

exports.saveMail = async (req, res) => {
  try {
    const result = await mailModel.saveMail(req, res);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.sendMail = async (req, res) => {
  try {
    const result = await mailModel.sendEmail(req, res);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
