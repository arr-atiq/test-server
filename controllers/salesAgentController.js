const fs = require('fs');
const express = require('express');
const readXlsxFile = require('read-excel-file/node');
const xlsx = require('xlsx');
const moment = require('moment');
const { sendApiResult, uploaddir } = require('./helperController');
const model = require('../Models/SalesAgentModel');

exports.uploadSalesAgentOnboardingFile = async (req, res) => {
  const upload = await importExcelData2DB(req.file.filename, req.body);
  res.status(200).send(upload);
};

const importExcelData2DB = async function (filename, req) {
  try {
    let resData = [];
    const folder_name = req.file_for;
    const workbook = xlsx.readFile(
      `./public/configuration_file/${folder_name}/${filename}`,
      { type: 'array' },
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
    return sendApiResult(false, 'File not uploaded');
  }
};

// @ Arfin

exports.getSalesAgentList = async (req, res) => {
  try {
    const result = await model.getSalesAgentList(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
