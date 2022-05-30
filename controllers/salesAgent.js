const fs = require("fs");
const express = require("express");
const readXlsxFile = require("read-excel-file/node");
const xlsx = require("xlsx");
const moment = require("moment");
const { sendApiResult, uploaddir } = require("./helper");
const model = require("../Models/SalesAgent");

exports.uploadSalesAgentOnboardingFile = async (req, res) => {
  req.body.user_id = req.user_id;
  const upload = await importExcelData2DB(req.file.filename, req.body);
  res.status(200).send(upload);
};

const importExcelData2DB = async function (filename, req) {
  try {
    let resData = [];
    const folder_name = req.file_for;
    const workbook = xlsx.readFile(
      `./public/configuration_file/${folder_name}/${filename}`,
      { type: "array" }
    );
    const sheetnames = Object.keys(workbook.Sheets);
    let i = sheetnames.length;
    while (i--) {
      const sheetname = sheetnames[i];
      arrayName = sheetname.toString();
      resData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
      var insert = await model.insertExcelData(resData, filename, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, "File not uploaded");
  }
};

// @ Arfin

exports.getSalesAgentList = async (req, res) => {
  try {
    const result = await model.getSalesAgentList(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getSalesAgentOperationRegion = async (req, res) => {
  try {
    const result = await model.getSalesAgentOperationRegion(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRetailersByRegionOperation = async (req, res) => {
  try {
    const result = await model.getRetailersByRegionOperation(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getSalesAgentListByManufacturerAndSupervisor = async (req, res) => {
  try {
    const result = await model.getSalesAgentListByManufacturerAndSupervisor(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.deleteSalesAgent = async (req, res) => {
  try {
    const salesagent = await model.deleteSalesAgent(req.params);
    res.status(200).send(salesagent);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.editSalesAgent = async (req, res) => {
  try {
    const salesagent = await model.editSalesAgent(req);
    res.status(200).send(salesagent);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
