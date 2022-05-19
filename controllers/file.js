const xlsx = require('xlsx');
const moment = require('moment');
const { sendApiResult } = require('./helperController');
const FileModel = require('../Models/File');

exports.uploadScopOutletsFile = async (req, res) => {
  const upload = await importScopeOutlets2DB(req.file.filename, req.body);
  res.status(200).send(upload);
};

exports.uploadXlFile = async (req, res) => {
  const start = moment(req.body.effective_date, 'YYYY-MM-DD');
  const end = moment(
    new Date(
      req.body.duration.split('-')[0],
      parseInt(req.body.duration.split('-')[1]),
      0,
    ),
    'YYYY-MM-DD',
  );
  const duration = moment.duration(end.diff(start)).asDays();
  if (duration < 0) {
    res.json({
      success: false,
      msg: 'Duration cannot be shorter than Effective date.',
    });
  } else {
    const upload = await importExcelData2DB(req.file.filename, req.body);
    res.status(200).send(upload);
    // res.json({
    //     "success": true,
    //     'msg': 'File uploaded/imported successfully!', 'file': req.file
    // });
  }
};

exports.uploadInterestSettingsFile = async (req, res) => {
  const upload = await importInterestSettingsData2DB(
    req.file.filename,
    req.body,
  );
  res.status(200).send(upload);
};

const importScopeOutlets2DB = async function (filePath, req) {
  try {
    let resData = [];
    const workbook = xlsx.readFile(`./public/scope_outlets/${filePath}`, {
      type: 'array',
    });
    const sheetnames = Object.keys(workbook.Sheets);
    let i = sheetnames.length;
    while (i--) {
      const sheetname = sheetnames[i];
      arrayName = sheetname.toString();
      resData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
      var insert = await FileModel.insertScopeOutletBulk(
        resData,
        filePath,
        req,
      );
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, 'File not uploaded');
  }
};

const importExcelData2DB = async function (filePath, req) {
  try {
    let resData = [];
    const workbook = xlsx.readFile(`./public/uploads/${filePath}`, {
      type: 'array',
    });
    const sheetnames = Object.keys(workbook.Sheets);
    let i = sheetnames.length;
    while (i--) {
      const sheetname = sheetnames[i];
      arrayName = sheetname.toString();
      resData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
      var insert = await FileModel.insertBulk(resData, filePath, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, 'File not uploaded');
  }
};

exports.uploadBulkKYCApproveFile = async (req, res) => {
  const upload = await importBulkKYCApprove2DB(req.file.filename, req.body);
  res.status(200).send(upload);
};

const importBulkKYCApprove2DB = async function (filePath, req) {
  try {
    let resData = [];
    const workbook = xlsx.readFile(`./public/kyc_bulk_upload/${filePath}`, {
      type: 'array',
    });
    const sheetnames = Object.keys(workbook.Sheets);
    let i = sheetnames.length;
    while (i--) {
      const sheetname = sheetnames[i];
      arrayName = sheetname.toString();
      resData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
      var insert = await FileModel.insertBulkKYCApprove(resData, filePath, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, 'File not uploaded');
  }
};

exports.uploadOutletDetailsInfoFile = async (req, res) => {
  const upload = await importOutletDetailsInfo2DB(req.file.filename, req.body);
  res.status(200).send(upload);
};

const importOutletDetailsInfo2DB = async function (filePath, req) {
  try {
    let resData = [];
    const workbook = xlsx.readFile(
      `./public/outlet_documents/outlet_nid_info/${filePath}`,
      { type: 'array' },
    );
    const sheetnames = Object.keys(workbook.Sheets);
    let i = sheetnames.length;
    while (i--) {
      const sheetname = sheetnames[i];
      arrayName = sheetname.toString();
      resData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
      var insert = await FileModel.insertOutletDetailsInfo(
        resData,
        filePath,
        req,
      );
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, 'File not uploaded');
  }
};

// @arfin
exports.uploadUserDetailsInfoFile = async (req, res) => {
  const upload = await importUserDetailsInfo2DB(req.file.filename, req.body);
  res.status(200).send(upload);
};

const importUserDetailsInfo2DB = async function (filePath, req) {
  try {
    let resData = [];
    const workbook = xlsx.readFile(`./public/user_details/${filePath}`, {
      type: 'array',
    });
    const sheetnames = Object.keys(workbook.Sheets);
    let i = sheetnames.length;
    while (i--) {
      const sheetname = sheetnames[i];
      arrayName = sheetname.toString();
      resData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
      var insert = await FileModel.insertUserDetailsInfo(
        resData,
        filePath,
        req,
      );
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, 'File not uploaded');
  }
};

const importInterestSettingsData2DB = async function (filePath, req) {
  try {
    let resData = [];
    const workbook = xlsx.readFile(`./public/interest_settings/${filePath}`, {
      type: 'array',
    });
    const sheetnames = Object.keys(workbook.Sheets);
    let i = sheetnames.length;
    while (i--) {
      const sheetname = sheetnames[i];
      arrayName = sheetname.toString();
      resData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
      console.log(resData);

      var insert = await FileModel.insertInterestSettingsBulk(
        resData,
        filePath,
        req,
      );
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, 'File not uploaded');
  }
};
