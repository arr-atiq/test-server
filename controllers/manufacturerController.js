const xlsx = require('xlsx');
const moment = require('moment');
const { sendApiResult } = require('./helperController');
const manuFacturerModel = require('../Models/ManufacturerModel');

exports.uploadManufacturerOnboardingFile = async (req, res) => {
  console.log(req.file);
  if (req.file != 'undefined') {
    const upload = await importExcelData2DB(req.file.filename, req.body);
    res.status(200).send(upload);
  } else {
    res.status(200).send('File is Missing!');
  }
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
      var insert = await manuFacturerModel.insertExcelData(
        resData,
        filename,
        req,
      );
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, 'File not uploaded');
  }
};
