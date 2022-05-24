const fs = require("fs");
const express = require("express");
const readXlsxFile = require("read-excel-file/node");
const xlsx = require("xlsx");
const moment = require("moment");
const excel = require("excel4node");
const manuFacModel = require("../Models/Manufacturer");
const { sendApiResult, uploaddir, generaeteExcel } = require("./helper");

exports.uploadManufacturerOnboardingFile = async (req, res) => {
  req.body.user_id = req.user_id;
  if (req.file != "undefined") {
    const upload = await importExcelData2DB(req.file.filename, req.body);
    res.status(200).send(upload);
  } else {
    res.status(200).send("File is Missing!");
  }
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
      var insert = await manuFacModel.insertExcelData(resData, filename, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, "File not uploaded");
  }
};

// @Arfin code start

exports.generateManufacturerSample = async (req, res) => {
  try {
    // const limit_data = await knex("APSISIPDC.cr_retail_limit")
    // .leftJoin("APSISIPDC.cr_dh_fi", "cr_dh_fi.id_dh", "cr_retail_limit.id_dh")
    // .leftJoin("APSISIPDC.company", "company.id", "cr_retail_limit.id_dh")
    // .leftJoin(
    // 	"APSISIPDC.distributorspoint",
    // 	"distributorspoint.id",
    // 	"cr_retail_limit.id_point"
    // 	)
    // .leftJoin(
    // 	"APSISIPDC.company_territory",
    // 	"company_territory.territory",
    // 	"distributorspoint.territory"
    // 	)
    // .where("cr_dh_fi.id_fi", req.params.id)
    // 	//.whereNull("id_cr_limit_info")
    // 	.where("limit_status", "Scope uploaded")
    // 	.where("kyc_status", "Approved")
    // 	.whereNotIn("cr_retail_limit.id_point", [334, 344])
    // 	.select(
    // 		"cr_retail_limit.outlet_code",
    // 		"cr_retail_limit.owner_name",
    // 		"cr_retail_limit.outlet_name",
    // 		"cr_retail_limit.phone",
    // 		"cr_retail_limit.address",
    // 		"cr_retail_limit.loan_account_number",
    // 		"cr_retail_limit.client_id",
    // 		knex.raw('"company"."name" as "house_name"'),
    // 		knex.raw('"distributorspoint"."name" as "point_name"'),
    // 		knex.raw('"company_territory"."name" as "territory_name"')
    // 		)
    // 	.groupBy("cr_retail_limit.outlet_code");

    const headers = [
      "Sr.",
      "Manufacturer_Name",
      "Type_of_Entity",
      "Name_of_Scheme",
      "Manufacturer_Registration_No",
      "Manufacturer_TIN",
      "Manufacturer_BIN",
      "Website_URL",
      "Registered_Corporate_Office_Address_in_Bangladesh",
      "Corporate_Office_Address_Line_1",
      "Corporate_Office_Address_Line_2",
      "Corporate_Office_Postal_Code",
      "Corporate_Office_Post_Office",
      "Corporate_Office_Thana",
      "Corporate_Office_District",
      "Corporate_Office_Division",
      "Nature_of_Business",
      "Alternative_Addresses",
      "Alternative_Address_Line_1",
      "Alternative_Address_Line_2",
      "Alternative_Postal_Code",
      "Alternative_Post_Office",
      "Alternative_Thana",
      "Alternative_District",
      "Alternative_Division",
      "Official_Phone_Number",
      "Official_Email_ID",
      "Authorized_Representative_Name",
      "Authorized_Representative_Full_Name",
      "Authorized_Representative_NID",
      "Authorized_Representative_Designation",
      "Authorized_Representative_Mobile_No",
      "Authorized_Representative_Official_Email_ID",
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
    let col_add = 0;
    headers.forEach((e) => {
      worksheet
        .cell(row, col + col_add)
        .string(e)
        .style(headerStyle);
      col_add++;
    });
    row++;
    // for (let i = 0; i < limit_data.length; i++) {
    // 	var col_add = 0;
    // 	let e = limit_data[i];
    // 	worksheet.cell(row, col + col_add).number(i + 1);
    // 	col_add++;
    // 	worksheet
    // 	.cell(row, col + col_add)
    // 	.string(e.outlet_code ? e.outlet_code : "");
    // 	col_add++;
    // 	worksheet
    // 	.cell(row, col + col_add)
    // 	.string(e.owner_name ? e.owner_name : "");
    // 	col_add++;
    // 	worksheet
    // 	.cell(row, col + col_add)
    // 	.string(e.outlet_name ? e.outlet_name : "");
    // 	col_add++;
    // 	worksheet.cell(row, col + col_add).string(e.phone ? e.phone : "");
    // 	col_add++;
    // 	worksheet.cell(row, col + col_add).string(e.address ? e.address : "");
    // 	col_add++;
    // 	worksheet.cell(row, col + col_add).string(e.loan_account_number ? e.loan_account_number : "");
    // 	col_add++;
    // 	worksheet.cell(row, col + col_add).string("");
    // 	col_add++;
    // 	// worksheet.cell(row, col + col_add).number(0);
    // 	// col_add++;
    // 	worksheet.cell(row, col + col_add).string(e.house_name);
    // 	col_add++;
    // 	worksheet.cell(row, col + col_add).string(e.point_name);
    // 	col_add++;
    // 	worksheet.cell(row, col + col_add).string(e.territory_name);
    // 	col_add++;
    // 	worksheet.cell(row, col + col_add).string(e.client_id);
    // 	col_add++;
    // 	row++;
    // }
    await workbook.write("public/samples/manufacturerSampleDownload.xlsx");
    const fileName = "download/samples/manufacturerSampleDownload.xlsx";
    setTimeout(() => {
      res.send(sendApiResult(true, "Sample File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getManufacturerList = async (req, res) => {
  try {
    const result = await manuFacModel.getManufacturerList(req.body);
    result.total_amount = result.data.total_amount;
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.deleteManufacturer = async (req, res) => {
  try {
    const manufacturer = await manuFacModel.deleteManufacturer(req.params);
    res.status(200).send(manufacturer);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.editManufacturer = async (req, res) => {
  try {
    const manufacturer = await manuFacModel.editManufacturer(req);
    res.status(200).send(manufacturer);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
// @Arfin - Code End
