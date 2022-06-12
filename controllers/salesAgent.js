const fs = require("fs");
const express = require("express");
const readXlsxFile = require("read-excel-file/node");
const xlsx = require("xlsx");
const moment = require("moment");
const { sendApiResult, uploaddir } = require("./helper");
const model = require("../Models/SalesAgent");
const knex = require("../config/database");
const excel = require("excel4node");

exports.uploadSalesAgentOnboardingFile = async (req, res) => {
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
      var insert = await model.insertExcelData(resData, filename, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, "File not uploaded");
  }
};

// @ Arfin

exports.getSalesAgentList = async (req, res) => {
  try {
    const result = await model.getSalesAgentList(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getSalesAgentOperationRegion = async (req, res) => {
  try {
    const result = await model.getSalesAgentOperationRegion(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRetailersByRegionOperation = async (req, res) => {
  try {
    const result = await model.getRetailersByRegionOperation(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRetailerbySalesAgent = async (req, res) => {
  try {
    const result = await model.getRetailerbySalesAgent(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getSalesAgentListByManufacturerAndSupervisor = async (req, res) => {
  try {
    const result = await model.getSalesAgentListByManufacturerAndSupervisor(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.deleteSalesAgent = async (req, res) => {
  try {
    const salesagent = await model.deleteSalesAgent(req.params);
    res.status(200).send(salesagent);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.editSalesAgent = async (req, res) => {
  try {
    const salesagent = await model.editSalesAgent(req);
    res.status(200).send(salesagent);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.generateSalesagentUnuploadedReport = async (req, res) => {
  try {
    const limit_data = await knex("APSISIPDC.cr_salesagent_unuploaded_data")
      .where("status", "Active")
      .select(
        "agent_name",
        "agent_nid",
        "phone",
        "manufacturer_id",
        "agent_employee_code",
        "autho_supervisor_employee_code",
        "region_of_operation",
        "distributor_id"
      );
    const headers = [
      "Sr.",
      "Sales_Agent_Name",
      "Sales_Agent_NID",
      "Phone",
      "Sales_Agent_Employee_Code",
      "Authorized_supervisor_emp_code",
      "Manufacturer",
      "Distributor",
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
    	.string(e.agent_name ? e.agent_name : "");
    	col_add++;
    	worksheet
    	.cell(row, col + col_add)
    	.number(e.agent_nid ? e.agent_nid : "");
    	col_add++;
    	worksheet
    	.cell(row, col + col_add)
    	.string(e.phone ? e.phone : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).number(e.manufacturer_id ? e.manufacturer_id : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).string(e.agent_employee_code ? e.agent_employee_code : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).string(e.region_of_operation ? e.region_of_operation : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).number(e.distributor_id ? e.distributor_id : "");
    	col_add++;
    	// worksheet.cell(row, col + col_add).number(0);
    	// col_add++;
    	row++;
    }
    await workbook.write("public/unupload_report/sales_agent_unuploaded_report.xlsx");
    const fileName = "./unupload_report/sales_agent_unuploaded_report.xlsx";
    setTimeout(() => {
      res.send(sendApiResult(true, "File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.generateSalesagentInvalidatedReport = async (req, res) => {
  try {
    const limit_data = await knex("APSISIPDC.cr_sales_agent_invalidated_data")
      .where("status", "Active")
      .select(
        "agent_name",
        "agent_nid",
        "phone",
        "manufacturer_id",
        "agent_employee_code",
        "autho_supervisor_employee_code",
        "region_of_operation",
        "distributor_id"
      );
    const headers = [
      "Sr.",
      "Sales_Agent_Name",
      "Sales_Agent_NID",
      "Phone",
      "Sales_Agent_Employee_Code",
      "Authorized_supervisor_emp_code",
      "Manufacturer",
      "Distributor",
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
    	.string(e.agent_name ? e.agent_name : "");
    	col_add++;
    	worksheet
    	.cell(row, col + col_add)
    	.number(e.agent_nid ? e.agent_nid : "");
    	col_add++;
    	worksheet
    	.cell(row, col + col_add)
    	.string(e.phone ? e.phone : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).number(e.manufacturer_id ? e.manufacturer_id : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).string(e.agent_employee_code ? e.agent_employee_code : "");
    	col_add++;
      worksheet.cell(row, col + col_add).string(e.autho_supervisor_employee_code ? e.autho_supervisor_employee_code : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).string(e.region_of_operation ? e.region_of_operation : "");
    	col_add++;
    	worksheet.cell(row, col + col_add).number(e.distributor_id ? e.distributor_id : "");
    	col_add++;
    	// worksheet.cell(row, col + col_add).number(0);
    	// col_add++;
    	row++;
    }
    await workbook.write("public/unupload_report/sales_agent_unuploaded_report.xlsx");
    const fileName = "./unupload_report/sales_agent_unuploaded_report.xlsx";
    setTimeout(() => {
      res.send(sendApiResult(true, "File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};