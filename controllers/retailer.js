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

exports.generateRetailersIndividualReport = async (req, res) => {
  const previousMonthStartDate = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
  const previousMonthEndDate = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
  try {
    const limit_data = await knex("APSISIPDC.cr_retailer")
      .leftJoin(
        "APSISIPDC.cr_retailer_kyc_information",
        "cr_retailer_kyc_information.retailer_id",
        "cr_retailer.id"
      )
      .leftJoin(
        "APSISIPDC.cr_retailer_manu_scheme_mapping",
        "cr_retailer_manu_scheme_mapping.retailer_id",
        "cr_retailer.id"
      )
      .leftJoin(
        "APSISIPDC.cr_distributor",
        "cr_distributor.id",
        "cr_retailer_manu_scheme_mapping.distributor_id"
      )
      .whereRaw(`"cr_retailer"."created_at" >= TO_DATE('${previousMonthStartDate}', 'YYYY-MM-DD')`)
      .whereRaw(`"cr_retailer"."created_at" <= TO_DATE('${previousMonthEndDate}', 'YYYY-MM-DD')`)
      .select(
        "cr_retailer.retailer_code",
        "cr_retailer.ac_number_1rn",
        "cr_retailer.created_at",
        "cr_retailer_kyc_information.title",
        "cr_retailer_kyc_information.name",
        "cr_retailer_kyc_information.father_title",
        "cr_retailer_kyc_information.father_name",
        "cr_retailer_kyc_information.mother_title",
        "cr_retailer_kyc_information.mother_name",
        "cr_retailer_kyc_information.spouse_title",
        "cr_retailer_kyc_information.spouse_name",
        "cr_retailer_kyc_information.gender",
        "cr_retailer_kyc_information.date_of_birth",
        "cr_retailer_kyc_information.district_of_birth",
        "cr_retailer_kyc_information.country_of_birth",
        "cr_retailer_kyc_information.nid",
        "cr_retailer_kyc_information.tin",
        "cr_retailer_kyc_information.permanent_street_name_and_number",
        "cr_retailer_kyc_information.permanent_postal_code",
        "cr_retailer_kyc_information.permanent_district",
        "cr_retailer_kyc_information.permanent_country",
        "cr_retailer_kyc_information.present_street_name_and_number",
        "cr_retailer_kyc_information.present_postal_code",
        "cr_retailer_kyc_information.present_district",
        "cr_retailer_kyc_information.present_country",
        "cr_retailer_kyc_information.telephone_number",
        "cr_retailer_kyc_information.sector_code",
        "cr_distributor.distributor_name"

      );
    const headers = [
      "Sr.",
      "Retailer_Code",
      "Master Loan Account Number",
      "Client ID",
      "Branch",
      "Title",
      "Name",
      "Father_Title",
      "Father_Name",
      "Mother_Title",
      "Mother_Name",
      "Spouse_Title",
      "Spouse_Name",
      "Gender",
      "Date_of_Birth",
      "Birth_District",
      "Birth_Country",
      "NID",
      "TIN_Number",
      "Permanent_Address",
      "Permanent_Address_Post_Code",
      "Permanent_Address_District",
      "Country_of_Permanent_Address",
      "Business_Address",
      "Business_Address_Code",
      "Business_Address_District",
      "Country_of_Business",
      "Phone",
      "Distributor Name",
      "Point Name",
      "Limit",
      "Open Date",
      "Expiry Date"
    ];
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Individual Report (Monthly)");
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
        .string(e.retailer_code ? e.retailer_code : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.ac_number_1rn ? e.ac_number_1rn : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.client_id ? e.client_id : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.branch ? e.branch : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.title ? e.title : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.name ? e.name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.father_title ? e.father_title : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.father_name ? e.father_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.mother_title ? e.mother_title : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.mother_name ? e.mother_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.spouse_title ? e.spouse_title : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.spouse_name ? e.spouse_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.gender ? e.gender : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.date_of_birth ? e.date_of_birth.toString() : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.district_of_birth ? e.district_of_birth : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.country_of_birth ? e.country_of_birth : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .number(e.nid ? e.nid : 0);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .number(e.tin ? e.tin : 0);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.permanent_street_name_and_number ? e.permanent_street_name_and_number : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .number(e.permanent_postal_code ? e.permanent_postal_code : 0);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.permanent_district ? e.permanent_district : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.permanent_country ? e.permanent_country : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.present_street_name_and_number ? e.present_street_name_and_number : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .number(e.present_postal_code ? e.present_postal_code : 0);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.present_district ? e.present_district : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.present_country ? e.present_country : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.telephone_number ? e.telephone_number : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.distributor_name ? e.distributor_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.sector_code ? e.sector_code : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.limit ? e.limit : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.created_at ? e.created_at.toString() : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.expiry_date ? e.expiry_date.toString() : "");
      col_add++;
      // worksheet.cell(row, col + col_add).number(0);
      // col_add++;
      row++;
    }
    await workbook.write("public/reports_retailer/retailer_comprehensive_reports.xlsx");
    const fileName = "./reports_retailer/retailer_comprehensive_reports.xlsx";
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

  const { startDate, endDate } = req.query;
  const previousMonthStartDate = moment(startDate).format('YYYY-MM-DD');
  const previousMonthEndDate = moment(endDate).format('YYYY-MM-DD');
  try {
    const limit_data = await knex("APSISIPDC.cr_retailer")
      .leftJoin(
        "APSISIPDC.cr_retailer_kyc_information",
        "cr_retailer_kyc_information.retailer_id",
        "cr_retailer.id"
      )
      .leftJoin(
        "APSISIPDC.cr_retailer_manu_scheme_mapping",
        "cr_retailer_manu_scheme_mapping.retailer_id",
        "cr_retailer.id"
      )
      .leftJoin(
        "APSISIPDC.cr_distributor",
        "cr_distributor.id",
        "cr_retailer_manu_scheme_mapping.distributor_id"
      )
      .whereRaw(`"cr_retailer"."created_at" >= TO_DATE('${previousMonthStartDate}', 'YYYY-MM-DD')`)
      .whereRaw(`"cr_retailer"."created_at" <= TO_DATE('${previousMonthEndDate}', 'YYYY-MM-DD')`)
      .select(
        "cr_retailer.retailer_code",
        "cr_retailer.ac_number_1rn",
        "cr_retailer.created_at",
        "cr_retailer_kyc_information.title",
        "cr_retailer_kyc_information.name",
        "cr_retailer_kyc_information.father_title",
        "cr_retailer_kyc_information.father_name",
        "cr_retailer_kyc_information.mother_title",
        "cr_retailer_kyc_information.mother_name",
        "cr_retailer_kyc_information.spouse_title",
        "cr_retailer_kyc_information.spouse_name",
        "cr_retailer_kyc_information.gender",
        "cr_retailer_kyc_information.date_of_birth",
        "cr_retailer_kyc_information.district_of_birth",
        "cr_retailer_kyc_information.country_of_birth",
        "cr_retailer_kyc_information.nid",
        "cr_retailer_kyc_information.tin",
        "cr_retailer_kyc_information.permanent_street_name_and_number",
        "cr_retailer_kyc_information.permanent_postal_code",
        "cr_retailer_kyc_information.permanent_district",
        "cr_retailer_kyc_information.permanent_country",
        "cr_retailer_kyc_information.present_street_name_and_number",
        "cr_retailer_kyc_information.present_postal_code",
        "cr_retailer_kyc_information.present_district",
        "cr_retailer_kyc_information.present_country",
        "cr_retailer_kyc_information.telephone_number",
        "cr_retailer_kyc_information.sector_code",
        "cr_distributor.distributor_name"

      );
    const headers = [
      "Sr.",
      "Retailer_Code",
      "Master Loan Account Number",
      "Client ID",
      "Branch",
      "Title",
      "Name",
      "Father_Title",
      "Father_Name",
      "Mother_Title",
      "Mother_Name",
      "Spouse_Title",
      "Spouse_Name",
      "Gender",
      "Date_of_Birth",
      "Birth_District",
      "Birth_Country",
      "NID",
      "TIN_Number",
      "Permanent_Address",
      "Permanent_Address_Post_Code",
      "Permanent_Address_District",
      "Country_of_Permanent_Address",
      "Business_Address",
      "Business_Address_Code",
      "Business_Address_District",
      "Country_of_Business",
      "Phone",
      "Distributor Name",
      "Point Name",
      "Limit",
      "Open Date",
      "Expiry Date"
    ];
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 2");
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
        .string(e.retailer_code ? e.retailer_code : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.ac_number_1rn ? e.ac_number_1rn : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.client_id ? e.client_id : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.branch ? e.branch : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.title ? e.title : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.name ? e.name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.father_title ? e.father_title : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.father_name ? e.father_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.mother_title ? e.mother_title : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.mother_name ? e.mother_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.spouse_title ? e.spouse_title : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.spouse_name ? e.spouse_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.gender ? e.gender : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.date_of_birth ? e.date_of_birth.toString() : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.district_of_birth ? e.district_of_birth : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.country_of_birth ? e.country_of_birth : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .number(e.nid ? e.nid : 0);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .number(e.tin ? e.tin : 0);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.permanent_street_name_and_number ? e.permanent_street_name_and_number : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .number(e.permanent_postal_code ? e.permanent_postal_code : 0);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.permanent_district ? e.permanent_district : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.permanent_country ? e.permanent_country : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.present_street_name_and_number ? e.present_street_name_and_number : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .number(e.present_postal_code ? e.present_postal_code : 0);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.present_district ? e.present_district : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.present_country ? e.present_country : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.telephone_number ? e.telephone_number : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.distributor_name ? e.distributor_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.sector_code ? e.sector_code : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.limit ? e.limit : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.created_at ? e.created_at.toString() : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.expiry_date ? e.expiry_date.toString() : "");
      col_add++;
      // worksheet.cell(row, col + col_add).number(0);
      // col_add++;
      row++;
    }
    await workbook.write("public/reports_retailer/retailer_comprehensive_reports.xlsx");
    const fileName = "./reports_retailer/retailer_comprehensive_reports.xlsx";
    setTimeout(() => {
      res.send(sendApiResult(true, "File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
}

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