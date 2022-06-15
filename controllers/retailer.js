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

  const { month, distributor_id, manufacturer_id, district } = req.query;
  try {
    const limit_data = await knex("APSISIPDC.cr_retailer")
      .leftJoin(
        "APSISIPDC.cr_retailer_manu_scheme_mapping",
        "cr_retailer_manu_scheme_mapping.retailer_id",
        "cr_retailer.id"
      )
      .leftJoin(
        "APSISIPDC.cr_manufacturer",
        "cr_manufacturer.id",
        "cr_retailer_manu_scheme_mapping.manufacturer_id"
      )
      .leftJoin(
        "APSISIPDC.cr_distributor",
        "cr_distributor.id",
        "cr_retailer_manu_scheme_mapping.distributor_id"
      )
      .leftJoin(
        "APSISIPDC.cr_retailer_loan_calculation",
        "cr_retailer.id",
        "cr_retailer_loan_calculation.retailer_id"
      )
      .where(function () {
        if (district) {
          this.where("cr_retailer.district", district)
        }
      })
      .select(
        "cr_retailer.retailer_name",
        "cr_retailer.retailer_code",
        "cr_retailer.district",
        "cr_manufacturer.manufacturer_name",
        "cr_distributor.distributor_name",
        "cr_retailer_manu_scheme_mapping.crm_approve_limit",
        "cr_retailer_loan_calculation.transaction_cost",
        "cr_retailer_loan_calculation.total_outstanding",
        "cr_retailer_loan_calculation.repayment"
      );
    console.log(limit_data);
    const headers = [
      "Sr.",
      "Retailer_name",
      "Retailer code",
      "District",
      "Manufacturer_name",
      "Distributor_name",
      "Total_credit_limit",
      "No_of_orders_placed",
      "Total_amount_of_transaction_done",
      "Total_amount_of_loan_requested",
      "Total_amount_of_repayment",
      "Total_outstanding_amount"
    ];
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");
    const headerStyle = workbook.createStyle({
      fill: {
        type: "pattern",
        patternType: "solid",
        bgColor: "#E1F0FF",
        fgColor: "#E1F0FF",
      },
      font: {
        color: "#000000",
        size: "10",
        bold: true,
      },
    });
    const col = 1;
    let row = 1;
    let col_addH = 0;
    headers.forEach((e) => {
      worksheet
        .cell(row, col + col_addH)
        .string(e)
        .style(headerStyle);
      col_addH++;
    });
    row++;
    for (let i = 0; i < limit_data.length; i++) {
      var col_add = 0;
      let e = limit_data[i];
      worksheet.cell(row, col + col_add).number(i + 1);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.retailer_name ? e.retailer_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.retailer_code ? e.retailer_code : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.district ? e.district : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.manufacturer_name ? e.manufacturer_name : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.distributor_name ? e.distributor_name : "");
      col_add++;
      worksheet.cell(row, col + col_add).number(e.crm_approve_limit ? e.crm_approve_limit : "");
      col_add++;
      worksheet.cell(row, col + col_add).number(e.no_of_orders_placed ? e.no_of_orders_placed : 0);
      col_add++;
      worksheet.cell(row, col + col_add).number(e.transaction_cost ? e.transaction_cost : 0);
      col_add++;
      worksheet.cell(row, col + col_add).number(e.total_amount_of_loan_requested ? e.total_amount_of_loan_requested : 0);
      col_add++;
      worksheet.cell(row, col + col_add).number(e.total_outstanding ? e.total_outstanding : 0);
      col_add++;
      worksheet.cell(row, col + col_add).number(e.repayment ? e.repayment : 0);
      col_add++;

      // worksheet.cell(row, col + col_add).number(0);
      // col_add++;
      row++;
    }
    await workbook.write("public/reports_retailer/retailer_monthly_reports.xlsx");
    const fileName = "./reports_retailer/retailer_monthly_reports.xlsx";
    setTimeout(() => {
      res.send(sendApiResult(true, "File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
}
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