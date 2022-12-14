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
  if (req.file) {
    const upload = await importExcelData2DB(req.file.filename, req.body);
    res.status(200).send(upload);
  } else {
    res.status(404).send("File not Found!");
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
      var insert = await model.insertExcelData(resData, filename, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, "File format is not correct", error);
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

exports.getManufacturerListBySalesagent = async (req, res) => {
  try {
    const result = await model.getManufacturerListBySalesagent(req);
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

exports.getRetailersBySalesAgent = async (req, res) => {
  try {
    const result = await model.getRetailersBySalesAgent(req);
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

exports.retailersBySalesAgentAndManufacturer = async (req, res) => {
  try {
    const result = await model.retailersBySalesAgentAndManufacturer(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getSalesAgentListDropDown = async (req, res) => {
  try {
    const result = await model.getSalesAgentListDropDown(req);
    result.total_amount = result.data.total_amount;
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

exports.getSalesagentDropdownList = async (req, res) => {
  try {
    const result = await model.getSalesagentDropdownList(req);
    res.status(200).send(result);

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
        "agent_employee_code",
        "autho_supervisor_employee_code",
        "distributor_id",
        "manufacturer_id",
        "region_of_operation",
        "remarks_duplications"
      );
    const headers = [
      "Sr.",
      "Sales_Agent_Name",
      "Sales_Agent_NID",
      "Phone",
      "Sales_Agent_Employee_Code",
      "Authorized_supervisor_emp_code",
      "Distributor",
      "Manufacturer",
      "Region_of_Operation",
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
      worksheet.cell(row, col + col_add).number(i + 1);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.agent_name ? e.agent_name : "");
      col_add++;
      if (e.remarks_duplications.includes("Sales_Agent_NID")) {
        worksheet.cell(row, col + col_add).string(e.agent_nid ? e.agent_nid : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.agent_nid ? e.agent_nid : "");
        col_add++;
      }
      if (e.remarks_duplications.includes("Phone")) {
        worksheet.cell(row, col + col_add).string(e.phone ? e.phone : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.phone ? e.phone : "");
        col_add++;
      }
      if (e.remarks_duplications.includes("Sales_Agent_Employee_Code")) {
        worksheet.cell(row, col + col_add).string(e.agent_employee_code ? e.agent_employee_code : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.agent_employee_code ? e.agent_employee_code : "");
        col_add++;
      }
      worksheet.cell(row, col + col_add).string(e.autho_supervisor_employee_code ? e.autho_supervisor_employee_code : "");
      col_add++;
      worksheet.cell(row, col + col_add).number(e.distributor_id ? e.distributor_id : 0);
      col_add++;
      worksheet.cell(row, col + col_add).number(e.manufacturer_id ? e.manufacturer_id : 0);
      col_add++;
      worksheet.cell(row, col + col_add).string(e.region_of_operation ? e.region_of_operation : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.remarks_duplications ? e.remarks_duplications : "").style(remarksStyle);
      col_add++;
      // worksheet.cell(row, col + col_add).number(0);
      // col_add++;
      row++;
    }
    await workbook.write("public/unupload_report/sales_agent_duplicated_report.xlsx");
    const fileName = "./unupload_report/sales_agent_duplicated_report.xlsx";
    await knex("APSISIPDC.cr_salesagent_unuploaded_data").del();
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
        "agent_employee_code",
        "autho_supervisor_employee_code",
        "distributor_id",
        "manufacturer_id",
        "region_of_operation",
        "remarks_invalidated"
      );
    const headers = [
      "Sr.",
      "Sales_Agent_Name",
      "Sales_Agent_NID",
      "Phone",
      "Sales_Agent_Employee_Code",
      "Authorized_supervisor_emp_code",
      "Distributor",
      "Manufacturer",
      "Region_of_Operation",
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
      worksheet.cell(row, col + col_add).number(i + 1);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.agent_name ? e.agent_name : "");
      col_add++;
      if (e.remarks_invalidated.includes("Sales_Agent_NID")) {
        worksheet.cell(row, col + col_add).string(e.agent_nid ? e.agent_nid : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.agent_nid ? e.agent_nid : "");
        col_add++;
      }
      if (e.remarks_invalidated.includes("Phone")) {
        worksheet.cell(row, col + col_add).string(e.phone ? e.phone : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.phone ? e.phone : "");
        col_add++;
      }
      worksheet.cell(row, col + col_add).string(e.agent_employee_code ? e.agent_employee_code : "");
      col_add++;
      if (e.remarks_invalidated.includes("not existed")) {
        worksheet.cell(row, col + col_add).string(e.autho_supervisor_employee_code ? e.autho_supervisor_employee_code : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.autho_supervisor_employee_code ? e.autho_supervisor_employee_code : "");
        col_add++;
      }
      worksheet.cell(row, col + col_add).number(e.distributor_id ? e.distributor_id : 0);
      col_add++;
      worksheet.cell(row, col + col_add).number(e.manufacturer_id ? e.manufacturer_id : 0);
      col_add++;
      worksheet.cell(row, col + col_add).string(e.region_of_operation ? e.region_of_operation : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.remarks_invalidated ? e.remarks_invalidated : "").style(remarksStyle);
      col_add++;
      // worksheet.cell(row, col + col_add).number(0);
      // col_add++;
      row++;
    }
    await workbook.write("public/unupload_report/sales_agent_invalidated_data.xlsx");
    const fileName = "./unupload_report/sales_agent_invalidated_data.xlsx";
    await knex("APSISIPDC.cr_sales_agent_invalidated_data").del();
    setTimeout(() => {
      res.send(sendApiResult(true, "File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};