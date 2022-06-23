const fs = require("fs");
const express = require("express");
const readXlsxFile = require("read-excel-file/node");
const xlsx = require("xlsx");
const moment = require("moment");
const { sendApiResult, uploaddir } = require("./helper");
const distModel = require("../Models/Distributor");
const knex = require("../config/database");
const excel = require("excel4node");

exports.uploadDistributorOnboardingFile = async (req, res) => {
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
      var insert = await distModel.insertExcelData(resData, filename, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, "File not uploaded");
  }
};

exports.getDistributorList = async (req, res) => {
  try {
    const result = await distModel.getDistributorList(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.deleteDistributor = async (req, res) => {
  try {
    const distributor = await distModel.deleteDistributor(req.params);
    res.status(200).send(distributor);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.editDistributor = async (req, res) => {
  try {
    const distributor = await distModel.editDistributor(req);
    res.status(200).send(distributor);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getDistributorByManufacturer = async (req, res) => {
  try {
    const result = await distModel.getDistributorByManufacturer(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.generateDistributorUnuploadedReport = async (req, res) => {
  try {
    const limit_data = await knex("APSISIPDC.cr_distributor_unuploaded_data")
      .where("status", "Active")
      .select(
        "distributor_name",
        "distributor_code",
        "distributor_tin",
        "manufacturer_id",
        "official_email",
        "official_contact_number",
        "region_of_operation",
        "is_distributor_or_third_party_agency",
        "corporate_registration_no",
        "trade_license_no",
        "registered_office_bangladesh",
        "ofc_address1",
        "ofc_address2",
        "ofc_postal_code",
        "ofc_post_office",
        "ofc_thana",
        "ofc_district",
        "ofc_division",
        "name_of_authorized_representative",
        "autho_rep_full_name",
        "autho_rep_nid",
        "autho_rep_designation",
        "autho_rep_phone",
        "autho_rep_email"
      );
    const headers = [
      "Sr.",
      "Manufacturer_id",
      "Distributor_Name",
      "Distributor_Code",
      "Distributor_TIN",
      "Official_Email",
      "Official_Contact_Number",
      "Is_Distributor_or_Third_Party_Agency",
      "Distributor_Corporate_Registration_No",
      "Trade_License_No",
      "Distributor_Registered_Office_in_Bangladesh",
      "Address_Line_1",
      "Address_Line_2",
      "Postal_Code",
      "Post_Office",
      "Thana",
      "District",
      "Division",
      "Name_of_Authorized_Representative",
      "Full_Name",
      "NID",
      "Designation_of_Authorized_Representative",
      "Mobile_No",
      "Official_Email_Id_of_Authorized_Representative",
      "Region_of_Operation"
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
    	.number(e.manufacturer_id ? e.manufacturer_id : "");
    	col_add++;
    	worksheet
    	.cell(row, col + col_add)
    	.string(e.distributor_name ? e.distributor_name : "");
    	col_add++;
    	worksheet
    	.cell(row, col + col_add)
    	.string(e.distributor_code ? e.distributor_code : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).string(e.distributor_tin ? e.distributor_tin : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).string(e.official_email ? e.official_email : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).string(e.official_contact_number ? e.official_contact_number : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).string(e.is_distributor_or_third_party_agency ? e.is_distributor_or_third_party_agency : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_registration_no ? e.corporate_registration_no : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.trade_license_no ? e.trade_license_no : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.registered_office_bangladesh ? e.registered_office_bangladesh : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.ofc_address1 ? e.ofc_address1 : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.ofc_address2 ? e.ofc_address2 : "");
    	col_add++;
      worksheet.cell(row, col + col_add).number(e.ofc_postal_code ? e.ofc_postal_code : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.ofc_post_office ? e.ofc_post_office : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.ofc_thana ? e.ofc_thana : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.ofc_district ? e.ofc_district : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.ofc_division ? e.ofc_division : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.name_of_authorized_representative ? e.name_of_authorized_representative : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_full_name ? e.autho_rep_full_name : "");
    	col_add++;
      worksheet.cell(row, col + col_add).number(e.autho_rep_nid ? e.autho_rep_nid : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_designation ? e.autho_rep_designation : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_phone ? e.autho_rep_phone : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_email ? e.autho_rep_email : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.region_of_operation ? e.region_of_operation : "");
    	col_add++;
    	// worksheet.cell(row, col + col_add).number(0);
    	// col_add++;
    	row++;
    }
    
    await workbook.write("public/unupload_report/distributor_unuploaded_data_report.xlsx");
    const fileName = "./unupload_report/distributor_unuploaded_data_report.xlsx";
    await knex("APSISIPDC.cr_distributor_unuploaded_data").del();
    setTimeout(() => {
      res.send(sendApiResult(true, "File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.generateDistributorInvalidatedReport = async (req, res) => {
  try {
    const limit_data = await knex("APSISIPDC.cr_distributor_invalidated_data")
      .where("status", "Active")
      .select(
        "distributor_name",
        "distributor_code",
        "distributor_tin",
        "manufacturer_id",
        "official_email",
        "official_contact_number",
        "region_of_operation",
        "is_distributor_or_third_party_agency",
        "corporate_registration_no",
        "trade_license_no",
        "registered_office_bangladesh",
        "ofc_address1",
        "ofc_address2",
        "ofc_postal_code",
        "ofc_post_office",
        "ofc_thana",
        "ofc_district",
        "ofc_division",
        "name_of_authorized_representative",
        "autho_rep_full_name",
        "autho_rep_nid",
        "autho_rep_designation",
        "autho_rep_phone",
        "autho_rep_email"
      );
    const headers = [
      "Sr.",
      "Manufacturer_id",
      "Distributor_Name",
      "Distributor_Code",
      "Distributor_TIN",
      "Official_Email",
      "Official_Contact_Number",
      "Is_Distributor_or_Third_Party_Agency",
      "Distributor_Corporate_Registration_No",
      "Trade_License_No",
      "Distributor_Registered_Office_in_Bangladesh",
      "Address_Line_1",
      "Address_Line_2",
      "Postal_Code",
      "Post_Office",
      "Thana",
      "District",
      "Division",
      "Name_of_Authorized_Representative",
      "Full_Name",
      "NID",
      "Designation_of_Authorized_Representative",
      "Mobile_No",
      "Official_Email_Id_of_Authorized_Representative",
      "Region_of_Operation"
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
    	.number(e.manufacturer_id ? e.manufacturer_id : "");
    	col_add++;
    	worksheet
    	.cell(row, col + col_add)
    	.string(e.distributor_name ? e.distributor_name : "");
    	col_add++;
    	worksheet
    	.cell(row, col + col_add)
    	.string(e.distributor_code ? e.distributor_code : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).string(e.distributor_tin ? e.distributor_tin : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).string(e.official_email ? e.official_email : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).string(e.official_contact_number ? e.official_contact_number : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).string(e.is_distributor_or_third_party_agency ? e.is_distributor_or_third_party_agency : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.corporate_registration_no ? e.corporate_registration_no : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.trade_license_no ? e.trade_license_no : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.registered_office_bangladesh ? e.registered_office_bangladesh : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.ofc_address1 ? e.ofc_address1 : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.ofc_address2 ? e.ofc_address2 : "");
    	col_add++;
      worksheet.cell(row, col + col_add).number(e.ofc_postal_code ? e.ofc_postal_code : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.ofc_post_office ? e.ofc_post_office : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.ofc_thana ? e.ofc_thana : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.ofc_district ? e.ofc_district : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.ofc_division ? e.ofc_division : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.name_of_authorized_representative ? e.name_of_authorized_representative : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_full_name ? e.autho_rep_full_name : "");
    	col_add++;
      worksheet.cell(row, col + col_add).number(e.autho_rep_nid ? e.autho_rep_nid : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_designation ? e.autho_rep_designation : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_phone ? e.autho_rep_phone : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_rep_email ? e.autho_rep_email : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.region_of_operation ? e.region_of_operation : "");
    	col_add++;
    	// worksheet.cell(row, col + col_add).number(0);
    	// col_add++;
    	row++;
    }

    await workbook.write("public/unupload_report/distributor_invalidated_data_report.xlsx");
    const fileName = "./unupload_report/distributor_invalidated_data_report.xlsx";
    await knex("APSISIPDC.cr_distributor_invalidated_data").del();
    setTimeout(() => {
      res.send(sendApiResult(true, "File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

