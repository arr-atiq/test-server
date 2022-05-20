const readXlsxFile = require('read-excel-file/node');
const xlsx = require('xlsx');
const moment = require('moment');
const { sendApiResult, uploaddir } = require('./helperController');
const model = require('../Models/RetailerModel');

exports.uploadRetailerOnboardingFile = async (req, res) => {
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
      const arrayName = sheetname.toString();
      resData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
      const insert = await model.insertExcelData(resData, filename, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, 'File not uploaded');
  }
};

exports.getRetailerList = async (req, res) => {
  try {
    const result = await model.getRetailerList(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.checkRetailerEligibility = async (req, res) => {
  try {
    const result = await model.retailerEligibilityCheck(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
