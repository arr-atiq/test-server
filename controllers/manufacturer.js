const fs = require("fs");
const express = require("express");
const readXlsxFile = require("read-excel-file/node");
const xlsx = require("xlsx");
const moment = require("moment");
const excel = require("excel4node");
const manuFacModel = require("../Models/Manufacturer");
const { sendApiResult, uploaddir, generaeteExcel } = require("./helper");
const knex = require("../config/database");
const knexfile = require("../knexfile");

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
    console.log("-------------------", error)
    return sendApiResult(false, "File format  is not corrected", error);
  }
};

// @Arfin code start

exports.generateManufacturerSample = async (req, res) => {
  try {
    const limit_data = await knex("APSISIPDC.cr_retail_limit")
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
    await workbook.write("public/unupload_report/manufacturerDownload.xlsx");
    const fileName = "./unupload_report/manufacturerDownload.xlsx";
    setTimeout(() => {
      res.send(sendApiResult(true, "Sample File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getManufacturerList = async (req, res) => {
  try {
    const result = await manuFacModel.getManufacturerList(req);
    result.total_amount = result.data.total_amount;
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getManufacturerListDropDown = async (req, res) => {
  try {
    const result = await manuFacModel.getManufacturerListDropDown(req);
    result.total_amount = result.data.total_amount;
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.retailersByManufacturer = async (req, res) => {
  try {
    const result = await manuFacModel.retailersByManufacturer(req);
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
exports.getManufacturer = async (req, res) => {
  try {
    const manufacturer = await manuFacModel.getManufacturer(req);
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

exports.updateAllSchemasByManufacturer = async (req, res) => {
  try {
    const result = await manuFacModel.updateAllSchemasByManufacturer(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};



exports.generateManufacturerUnuploadedReport = async (req, res) => {
  try {
    const limit_data = await knex("APSISIPDC.cr_manufacturer_unuploaded_data")
      .leftJoin("APSISIPDC.cr_manufacturer_type_entity",
        "cr_manufacturer_type_entity.id",
        "cr_manufacturer_unuploaded_data.type_of_entity")
      .leftJoin("APSISIPDC.cr_manufacturer_nature_business",
        "cr_manufacturer_nature_business.id",
        "cr_manufacturer_unuploaded_data.nature_of_business")
      .where("cr_manufacturer_unuploaded_data.status", "Active")
      .select(
        "cr_manufacturer_unuploaded_data.manufacturer_name",
        "cr_manufacturer_type_entity.name AS type_of_entity",
        "cr_manufacturer_unuploaded_data.registration_no",
        "cr_manufacturer_unuploaded_data.manufacturer_tin",
        "cr_manufacturer_unuploaded_data.manufacturer_bin",
        "cr_manufacturer_unuploaded_data.website_link",
        "cr_manufacturer_unuploaded_data.corporate_ofc_address",
        "cr_manufacturer_unuploaded_data.corporate_ofc_address_1",
        "cr_manufacturer_unuploaded_data.corporate_ofc_address_2",
        "cr_manufacturer_unuploaded_data.corporate_ofc_postal_code",
        "cr_manufacturer_unuploaded_data.corporate_ofc_post_office",
        "cr_manufacturer_unuploaded_data.corporate_ofc_thana",
        "cr_manufacturer_unuploaded_data.corporate_ofc_district",
        "cr_manufacturer_unuploaded_data.corporate_ofc_division",
        "cr_manufacturer_nature_business.name AS nature_of_business",
        "cr_manufacturer_unuploaded_data.alternative_ofc_address",
        "cr_manufacturer_unuploaded_data.alternative_address_1",
        "cr_manufacturer_unuploaded_data.alternative_address_2",
        "cr_manufacturer_unuploaded_data.alternative_postal_code",
        "cr_manufacturer_unuploaded_data.alternative_post_office",
        "cr_manufacturer_unuploaded_data.alternative_thana",
        "cr_manufacturer_unuploaded_data.alternative_district",
        "cr_manufacturer_unuploaded_data.alternative_division",
        "cr_manufacturer_unuploaded_data.official_phone",
        "cr_manufacturer_unuploaded_data.official_email",
        "cr_manufacturer_unuploaded_data.name_of_authorized_representative",
        "cr_manufacturer_unuploaded_data.autho_rep_full_name",
        "cr_manufacturer_unuploaded_data.autho_rep_nid",
        "cr_manufacturer_unuploaded_data.autho_rep_designation",
        "cr_manufacturer_unuploaded_data.autho_rep_phone",
        "cr_manufacturer_unuploaded_data.autho_rep_email",
        "cr_manufacturer_unuploaded_data.name_of_scheme",
        "cr_manufacturer_unuploaded_data.remarks_duplications"
      );
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
      "Duplications Remarked"
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

    const errorStyle = workbook.createStyle({
      fill: {
        type: "pattern",
        patternType: "solid",
        fgColor: "#42a3ed",
      },
      font: {
        color: "#000000",
        size: "8",
        bold: true,
      },
    });

    const remarksStyle = workbook.createStyle({
      font: {
        color: "#000000",
        size: "8",
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

      let remarks_duplicationsArr = e.remarks_duplications.split(" ");
      worksheet.cell(row, col + col_add).number(i + 1);
      col_add++;
      if (remarks_duplicationsArr.includes("Manufacturer_Name")) {
        worksheet.cell(row, col + col_add).string(e.manufacturer_name ? e.manufacturer_name : "").style(errorStyle);
        col_add++;
      } else {
        worksheet
          .cell(row, col + col_add)
          .string(e.manufacturer_name ? e.manufacturer_name : "");
        col_add++;
      }
      worksheet
        .cell(row, col + col_add)
        .string(e.type_of_entity ? e.type_of_entity : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.name_of_scheme ? e.name_of_scheme : "");
      col_add++;
      if (remarks_duplicationsArr.includes("Manufacturer_Registration_No")) {
        worksheet.cell(row, col + col_add).string(e.registration_no ? e.registration_no : "").style(errorStyle);
        col_add++;
      } else {
        worksheet
          .cell(row, col + col_add)
          .string(e.registration_no ? e.registration_no : "");
        col_add++;
      }
      worksheet.cell(row, col + col_add).string(e.manufacturer_tin ? e.manufacturer_tin : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.manufacturer_bin ? e.manufacturer_bin : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.website_link ? e.website_link : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_address ? e.corporate_ofc_address : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_address_1 ? e.corporate_ofc_address_1 : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_address_2 ? e.corporate_ofc_address_2 : "");
      col_add++;
      worksheet.cell(row, col + col_add).number(e.corporate_ofc_postal_code ? e.corporate_ofc_postal_code : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_post_office ? e.corporate_ofc_post_office : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_thana ? e.corporate_ofc_thana : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_district ? e.corporate_ofc_district : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_division ? e.corporate_ofc_division : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.nature_of_business ? e.nature_of_business : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_ofc_address ? e.alternative_ofc_address : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_address_1 ? e.alternative_address_1 : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_address_2 ? e.alternative_address_2 : "");
      col_add++;
      worksheet.cell(row, col + col_add).number(e.alternative_postal_code ? e.alternative_postal_code : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_post_office ? e.alternative_post_office : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_thana ? e.alternative_thana : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_district ? e.alternative_district : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_division ? e.alternative_division : "");
      col_add++;
      if (remarks_duplicationsArr.includes("Official_Phone_Number")) {
        worksheet.cell(row, col + col_add).string(e.official_phone ? e.official_phone : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.official_phone ? e.official_phone : "");
        col_add++;
      }
      if (remarks_duplicationsArr.includes("Official_Email_ID")) {
        worksheet.cell(row, col + col_add).string(e.official_email ? e.official_email : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.official_email ? e.official_email : "");
        col_add++;
      }
      worksheet.cell(row, col + col_add).string(e.name_of_authorized_representative ? e.name_of_authorized_representative : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_full_name ? e.autho_rep_full_name : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_nid ? e.autho_rep_nid : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_designation ? e.autho_rep_designation : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_phone ? e.autho_rep_phone : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_email ? e.autho_rep_email : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.remarks_duplications ? e.remarks_duplications : "").style(remarksStyle);
      col_add++;
      // worksheet.cell(row, col + col_add).number(0);
      // col_add++;
      row++;
    }

    await knex("APSISIPDC.cr_manufacturer_unuploaded_data").del();
    await workbook.write("public/unupload_report/manufacturer_duplicated_data_report.xlsx");
    const fileName = "./unupload_report/manufacturer_duplicated_data_report.xlsx";
    setTimeout(() => {
      res.send(sendApiResult(true, "File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.generateManufacturerInvalidatedReport = async (req, res) => {
  try {
    const limit_data = await knex("APSISIPDC.cr_manufacturer_invalidated_data")
      .leftJoin("APSISIPDC.cr_manufacturer_type_entity",
        "cr_manufacturer_type_entity.id",
        "cr_manufacturer_invalidated_data.type_of_entity")
      .leftJoin("APSISIPDC.cr_manufacturer_nature_business",
        "cr_manufacturer_nature_business.id",
        "cr_manufacturer_invalidated_data.nature_of_business")
      .where("cr_manufacturer_invalidated_data.status", "Active")
      .select(
        "cr_manufacturer_invalidated_data.manufacturer_name",
        "cr_manufacturer_type_entity.name AS type_of_entity",
        "cr_manufacturer_invalidated_data.registration_no",
        "cr_manufacturer_invalidated_data.manufacturer_tin",
        "cr_manufacturer_invalidated_data.manufacturer_bin",
        "cr_manufacturer_invalidated_data.website_link",
        "cr_manufacturer_invalidated_data.corporate_ofc_address",
        "cr_manufacturer_invalidated_data.corporate_ofc_address_1",
        "cr_manufacturer_invalidated_data.corporate_ofc_address_2",
        "cr_manufacturer_invalidated_data.corporate_ofc_postal_code",
        "cr_manufacturer_invalidated_data.corporate_ofc_post_office",
        "cr_manufacturer_invalidated_data.corporate_ofc_thana",
        "cr_manufacturer_invalidated_data.corporate_ofc_district",
        "cr_manufacturer_invalidated_data.corporate_ofc_division",
        "cr_manufacturer_nature_business.name AS nature_of_business",
        "cr_manufacturer_invalidated_data.alternative_ofc_address",
        "cr_manufacturer_invalidated_data.alternative_address_1",
        "cr_manufacturer_invalidated_data.alternative_address_2",
        "cr_manufacturer_invalidated_data.alternative_postal_code",
        "cr_manufacturer_invalidated_data.alternative_post_office",
        "cr_manufacturer_invalidated_data.alternative_thana",
        "cr_manufacturer_invalidated_data.alternative_district",
        "cr_manufacturer_invalidated_data.alternative_division",
        "cr_manufacturer_invalidated_data.official_phone",
        "cr_manufacturer_invalidated_data.official_email",
        "cr_manufacturer_invalidated_data.name_of_authorized_representative",
        "cr_manufacturer_invalidated_data.autho_rep_full_name",
        "cr_manufacturer_invalidated_data.autho_rep_nid",
        "cr_manufacturer_invalidated_data.autho_rep_designation",
        "cr_manufacturer_invalidated_data.autho_rep_phone",
        "cr_manufacturer_invalidated_data.autho_rep_email",
        "cr_manufacturer_invalidated_data.name_of_scheme",
        "cr_manufacturer_invalidated_data.remarks_invalidated"

      );
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
      "Invalidated Remarked"
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
    const errorStyle = workbook.createStyle({
      fill: {
        type: "pattern",
        patternType: "solid",
        fgColor: "#FF0000",
      },
      font: {
        color: "#000000",
        size: "8",
        bold: true,
      },
    });

    const remarksStyle = workbook.createStyle({
      font: {
        color: "#000000",
        size: "8",
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
      let remarks_invalidatedArr = e.remarks_invalidated.split(" ");
      console.log(remarks_invalidatedArr);
      worksheet.cell(row, col + col_add).number(i + 1);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.manufacturer_name ? e.manufacturer_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.type_of_entity ? e.type_of_entity : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.name_of_scheme ? e.name_of_scheme : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.registration_no ? e.registration_no : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.manufacturer_tin ? e.manufacturer_tin : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.manufacturer_bin ? e.manufacturer_bin : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.website_link ? e.website_link : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_address ? e.corporate_ofc_address : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_address_1 ? e.corporate_ofc_address_1 : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_address_2 ? e.corporate_ofc_address_2 : "");
      col_add++;
      worksheet.cell(row, col + col_add).number(e.corporate_ofc_postal_code ? e.corporate_ofc_postal_code : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_post_office ? e.corporate_ofc_post_office : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_thana ? e.corporate_ofc_thana : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_district ? e.corporate_ofc_district : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_ofc_division ? e.corporate_ofc_division : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.nature_of_business ? e.nature_of_business : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_ofc_address ? e.alternative_ofc_address : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_address_1 ? e.alternative_address_1 : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_address_2 ? e.alternative_address_2 : "");
      col_add++;
      worksheet.cell(row, col + col_add).number(e.alternative_postal_code ? e.alternative_postal_code : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_post_office ? e.alternative_post_office : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_thana ? e.alternative_thana : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_district ? e.alternative_district : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.alternative_division ? e.alternative_division : "");
      col_add++;
      if (remarks_invalidatedArr.includes("Official_Phone_Number")) {
        worksheet.cell(row, col + col_add).string(e.official_phone ? e.official_phone : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.official_phone ? e.official_phone : "");
        col_add++;
      }
      if (remarks_invalidatedArr.includes("Official_Email_ID")) {
        worksheet.cell(row, col + col_add).string(e.official_email ? e.official_email : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.official_email ? e.official_email : "");
        col_add++;
      }
      worksheet.cell(row, col + col_add).string(e.name_of_authorized_representative ? e.name_of_authorized_representative : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_full_name ? e.autho_rep_full_name : "");
      col_add++;
      if (remarks_invalidatedArr.includes("NID")) {
        worksheet.cell(row, col + col_add).string(e.autho_rep_nid ? e.autho_rep_nid : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.autho_rep_nid ? e.autho_rep_nid : "");
        col_add++;
      }
      worksheet.cell(row, col + col_add).string(e.autho_rep_designation ? e.autho_rep_designation : "");
      col_add++;
      if (e.remarks_invalidated.includes("Authorized_Representative_Mobile_No")) {
        worksheet.cell(row, col + col_add).string(e.autho_rep_phone ? e.autho_rep_phone : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.autho_rep_phone ? e.autho_rep_phone : "");
        col_add++;
      }
      if (remarks_invalidatedArr.includes("Authorized_Representative_Official_Email_ID")) {
        worksheet.cell(row, col + col_add).string(e.autho_rep_email ? e.autho_rep_email : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.autho_rep_email ? e.autho_rep_email : "");
        col_add++;
      }
      worksheet.cell(row, col + col_add).string(e.remarks_invalidated ? e.remarks_invalidated : "").style(remarksStyle);
      col_add++;
      // worksheet.cell(row, col + col_add).number(0);
      // col_add++;
      row++;
    }

    await knex("APSISIPDC.cr_manufacturer_invalidated_data").del();
    await workbook.write("public/unupload_report/manufacturer_invalidated_data_report.xlsx");
    const fileName = "./unupload_report/manufacturer_invalidated_data_report.xlsx";
    setTimeout(() => {
      res.send(sendApiResult(true, "File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

//Consolidated Annual Distributor Performance for IPDC Report
exports.generateManufacturerAnnualReport = async (req, res) => {
  try {
    const result = await manuFacModel.generateManufacturerAnnualReport(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.filterManufacturerAnnualView = async (req, res) => {
  try {
    const result = await manuFacModel.filterManufacturerAnnualView(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
//Consolidated Annual Distributor Performance for IPDC Report

// @Arfin - Code End
