const readXlsxFile = require("read-excel-file/node");
const xlsx = require("xlsx");
const moment = require("moment");
const { sendApiResult, uploaddir } = require("./helperController");
const model = require("../Models/Retailer");
const knex = require("../config/database");
const excel = require("excel4node");

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
      { type: "array" }
    );
    const sheetnames = Object.keys(workbook.Sheets);
    let i = sheetnames.length;
    var insert = "";
    while (i--) {
      const sheetname = sheetnames[i];
      const arrayName = sheetname.toString();
      resData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
      insert = await model.insertExcelData(resData, filename, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, "Retailer File not uploaded due to " + error.message);
  }
};

exports.getRetailerList = async (req, res) => {
  try {
    const result = await model.getRetailerList(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRetailerRegionOperation = async (req, res) => {
  try {
    const result = await model.getRetailerRegionOperation(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.checkRetailerDataValidity = async (req, res) => {
  try {
    const result = await model.checkRetailerDataValidity(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.checkRetailerDataValidityById = async (req, res) => {
  try {
    const result = await model.checkRetailerDataValidityByID(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.checkRetailerEligibility = async (req, res) => {
  try {
    const result = await model.checkRetailerEligibility(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.schemeWiseLimitConfigure = async (req, res) => {
  try {
    const result = await model.schemeWiseLimitConfigure(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRetailerByDistributor = async (req, res) => {
  try {
    const result = await model.getRetailerByDistributor(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.updateSchemaByRetailers = async (req, res) => {
  try {
    const result = await model.updateSchemaByRetailers(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRnRmnMappingById = async (req, res) => {
  try {
    const result = await model.getRnRmnMappingById(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRetailerDetailsById = async (req, res) => {
  try {
    const result = await model.getRetailerDetailsById(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
exports.updateLimit = async (req, res) => {
  try {
    req.body.user_id = req.user_id;
    const result = await model.updateLimitMapping(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
exports.getRetailerDistrict = async (req, res) => {
  try {
    const result = await model.getRetailerDistrict(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.uploadRetailerEkycFile = async (req, res) => {
  const upload = await uploadRetailerEkycFile(req.file.filename, req.body);
  res.status(200).send(upload);
};

const uploadRetailerEkycFile = async function (filename, req) {
  try {
    let resData = [];
    const folder_name = req.file_for;
    const workbook = xlsx.readFile(
      `./public/configuration_file/${folder_name}/${filename}`,
      { type: "array" }
    );
    const sheetnames = Object.keys(workbook.Sheets);
    let i = sheetnames.length;
    var insert = "";
    while (i--) {
      const sheetname = sheetnames[i];
      const arrayName = sheetname.toString();
      resData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
      insert = await model.uploadRetailerEkycFile(resData, filename, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, "File not uploaded due to " + error.message);
  }
};

exports.uploadRetailerCibFile = async (req, res) => {
  const upload = await uploadRetailerCibFile(req.file.filename, req.body);
  res.status(200).send(upload);
};

const uploadRetailerCibFile = async function (filename, req) {
  try {
    let resData = [];
    const folder_name = req.file_for;
    const workbook = xlsx.readFile(
      `./public/configuration_file/${folder_name}/${filename}`,
      { type: "array" }
    );
    const sheetnames = Object.keys(workbook.Sheets);
    let i = sheetnames.length;
    var insert = "";
    while (i--) {
      const sheetname = sheetnames[i];
      const arrayName = sheetname.toString();
      resData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
      insert = await model.uploadRetailerCibFile(resData, filename, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, "File not uploaded due to " + error.message);
  }
};

exports.generateRetailersMonthlyReport = async (req, res) => {
  try {
    const result = await model.generateRetailersMonthlyReport(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.RetailersMonthlyReport = async (req, res) => {
  try {
    const result = await model.RetailersMonthlyReport(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
// retailer-report-3
exports.generateRetailersLoanStatusReport = async (req, res) => {
  try {
    const result = await model.generateRetailersLoanStatusReport(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.retailerLoanStatusView = async (req, res) => {
  try {
    const result = await model.retailerLoanStatusView(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
// retailer-report-3

exports.retailerUploadList = async (req, res) => {
  try {
    const result = await model.retailerUploadList(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.eligibleRetailerListDownload = async (req, res) => {
  try {
    const result = await model.eligibleRetailerListDownload(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.generateRetailerOutstandingReport = async (req, res) => {
  try {
    const result = await model.generateRetailerOutstandingReport(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

//Monthly Retailer Performance report for Distributor (Supervisor)
exports.generateRetailersMonthlyPerformanceDistributor = async (req, res) => {
  try {
    const result = await model.generateRetailersMonthlyPerformanceDistributor(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.retailersMonthlyPerformanceDistributor = async (req, res) => {
  try {
    const result = await model.retailersMonthlyPerformanceDistributor(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
//Monthly Retailer Performance report for Distributor (Supervisor)

//Monthly Retailer Performance report for Distributor (Admin)
exports.generateRetailersMonthlyPerformanceDistributorForAdmin = async (req, res) => {
  try {
    const result = await model.generateRetailersMonthlyPerformanceDistributorForAdmin(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.retailersMonthlyPerformanceDistributorForAdmin = async (req, res) => {
  try {
    const result = await model.retailersMonthlyPerformanceDistributorForAdmin(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
//Monthly Retailer Performance report for Distributor (Admin)


exports.generateRetailersMonthlyIndividualReport = async (req, res) => {
  try {
    const result = await model.generateRetailersMonthlyIndividualReport(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.retailerUploadList = async (req, res) => {
  try {
    const result = await model.retailerUploadList(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.retailerListExcelDownload = async (req, res) => {
  try {
    const result = await model.retailerListExcelDownload(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};


//retailer-ineligible-list
exports.retailerIneligibleExcelDownload = async (req, res) => {
  try {
    const result = await model.retailerIneligibleExcelDownload(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

//reporting 
exports.generateRetailersIndividualTotalReport = async (req, res) => {
  try {
    const result = await model.generateRetailersIndividualTotalReport(req);
    res.status(200).send(result);

  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.downloadEkycReport = async (req, res) => {
  try {
    const result = await model.downloadEkycReport(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRetailerInvalidData = async (req, res) => {
  try {
    const result = await model.getRetailerInvalidData(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRetailerInvalidDataById = async (req, res) => {
  try {
    const result = await model.getRetailerInvalidDataById(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.updateRetailerInvalidDataById = async (req, res) => {
  try {
    const result = await model.updateRetailerInvalidDataById(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

// exports.getDuplicateRetailerListById = async (req, res) => {
//   try {
//     const result = await model.getDuplicateRetailerListById(req);
//     res.status(200).send(result);
//   } catch (error) {
//     res.send(sendApiResult(false, error.message));
//   }
// };

exports.getDuplicateRetailerDataById = async (req, res) => {
  try {
    const result = await model.getDuplicateRetailerDataById(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.createCreditMemo = async (req, res) => {
  try {
    const result = await model.createCreditMemo(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.creditMemoDownload = async (req, res) => {
  try {
    const result = await model.creditMemoDownload(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.downloadLimitUploadFile = async (req, res) => {
  try {
    const result = await model.downloadLimitUploadFile(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.uploadRetailerLimitUploadFile = async (req, res) => {
  const upload = await uploadRetailerLimitUploadFile(req.file.filename, req.body);
  res.status(200).send(upload);
};

const uploadRetailerLimitUploadFile = async function (filename, req) {
  try {
    let resData = [];
    const folder_name = req.file_for;
    const workbook = xlsx.readFile(
      `./public/configuration_file/limit_upload/${filename}`,
      { type: "array" }
    );
    const sheetnames = Object.keys(workbook.Sheets);
    let i = sheetnames.length;
    var insert = "";
    while (i--) {
      const sheetname = sheetnames[i];
      const arrayName = sheetname.toString();
      resData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
      insert = await model.uploadRetailerLimitUploadFile(resData, filename, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, "File not uploaded due to " + error.message);
  }
};

exports.uploadCreditMemoFile = async (req, res) => {
  const result = await model.uploadCreditMemoFile(req.file.filename, req.body);
  res.status(200).send(result);
};

exports.creditMemoAction = async (req, res) => {
  try {
    const result = await model.creditMemoAction(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.creditMemoList = async (req, res) => {
  try {
    const result = await model.creditMemoList(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.updateRetailerDuplicateData = async (req, res) => {
  try {
    const result = await model.updateRetailerDuplicateData(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.activeRetailerDuplicateData = async (req, res) => {
  try {
    const result = await model.activeRetailerDuplicateData(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.downloadPendingEligibleRetailerList = async (req, res) => {
  try {
    const result = await model.downloadPendingEligibleRetailerList(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.downloadRetailerCrmLimitExcel = async (req, res) => {
  try {
    const result = await model.downloadRetailerCrmLimitExcel(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.downloadeKycEligibleRetailerList = async (req, res) => {
  try {
    const result = await model.downloadeKycEligibleRetailerList(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.countPendingEligibility = async (req, res) => {
  try {
    const result = await model.countPendingEligibility(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.countPendingEkyc = async (req, res) => {
  try {
    const result = await model.countPendingEkyc(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.countPendingCib = async (req, res) => {
  try {
    const result = await model.countPendingCib(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.countPendingLimitUpload = async (req, res) => {
  try {
    const result = await model.countPendingLimitUpload(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.downloadRejectionRetailerList = async (req, res) => {
  try {
    const result = await model.downloadRejectionRetailerList(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.bulkRetailerUploadLogList = async (req, res) => {
  try {
    const result = await model.bulkRetailerUploadLogList(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.downloadChunkUploadRetailerExcel = async (req, res) => {
  try {
    const result = await model.downloadChunkUploadRetailerExcel(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};