const fs = require("fs");
const express = require("express");
const readXlsxFile = require("read-excel-file/node");
const xlsx = require("xlsx");
const moment = require("moment");
const { sendApiResult, uploaddir } = require("./helper");
const superModel = require("../Models/Supervisor");
const knex = require("../config/database");
const excel = require("excel4node");

exports.uploadSupervisorOnboardingFile = async (req, res) => {
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
      var insert = await superModel.insertExcelData(resData, filename, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, "File format is not correct", error);
  }
};

// exports.uploadFileReamarks = async (req, res) => {
//   req.body.user_id = req.user_id;
//   const upload = await superModel.uploadFileReamarks(req.file.filename, req.body);
//   res.status(200).send(upload);
// };

exports.saveRemarksFeedback = async (req, res) => {
  try {
    const result = await superModel.saveRemarksFeedback(req);
    res.status(200).send(result)
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.insertRemarksFeedback = async (req, res) => {
  try {
    const result = await superModel.insertRemarksFeedback(req);
    res.status(200).send(result)
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
exports.updateAdminFeedback = async (req, res) => {
  try {
    const result = await superModel.updateAdminFeedback(req);
    res.status(200).send(result)
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getAdminFeedbackList = async (req, res) => {
  try {
    const result = await superModel.getAdminFeedbackList(req);
    res.status(200).send(result)
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
exports.getDetailsFeedbackListDisbursementRepayment = async (req, res) => {
  try {
    const result = await superModel.getDetailsFeedbackListDisbursementRepayment(req);
    res.status(200).send(result)
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getAdminFeedbackListHistory = async (req, res) => {
  try {
    const result = await superModel.getAdminFeedbackListHistory(req);
    res.status(200).send(result)
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getSupervisorFeedbackListHistory = async (req, res) => {
  try {
    const result = await superModel.getSupervisorFeedbackListHistory(req);
    res.status(200).send(result)
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

// @ Arfin

exports.getSupervisorList = async (req, res) => {
  try {
    const result = await superModel.getSupervisorList(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getAllManufacturerForSupervisor = async (req, res) => {
  try {
    const result = await superModel.getAllManufacturerForSupervisor(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getSalesAgentListByManufacturerAndSupervisor = async (req, res) => {
  try {
    const result = await superModel.getSalesAgentListByManufacturerAndSupervisor(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getSalesAgentListBySupervisor = async (req, res) => {
  try {
    const result = await superModel.getSalesAgentListBySupervisor(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRemarksFeedbackAdmin = async (req, res) => {
  try {
    const result = await superModel.getRemarksFeedbackAdmin(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRepaymentRemarksFeedbackAdmin = async (req, res) => {
  try {
    const result = await superModel.getRepaymentRemarksFeedbackAdmin(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRepaymentRemarksFeedbackHistoryAdmin = async (req, res) => {
  try {
    const result = await superModel.getRepaymentRemarksFeedbackHistoryAdmin(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
exports.getDisbursementRemarksFeedbackHistoryAdmin = async (req, res) => {
  try {
    const result = await superModel.getDisbursementRemarksFeedbackHistoryAdmin(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRepaymentRemarksFeedbackHistorySupervisor = async (req, res) => {
  try {
    const result = await superModel.getRepaymentRemarksFeedbackHistorySupervisor(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getDisbursementRemarksFeedbackHistorySupervisor = async (req, res) => {
  try {
    const result = await superModel.getDisbursementRemarksFeedbackHistorySupervisor(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.updateAdminStatus = async (req, res) => {
  try {
    const result = await superModel.updateAdminStatus(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRetailerListByManufacturerAndSalesagent = async (req, res) => {
  try {
    const result = await superModel.getRetailerListByManufacturerAndSalesagent(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getDisbursementByManufacturerAndSupervisor = async (req, res) => {
  try {
    const result = await superModel.getDisbursementByManufacturerAndSupervisor(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getRepaymentBySalesagentAndRetailer = async (req, res) => {
  try {
    const result = await superModel.getRepaymentBySalesagentAndRetailer(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
exports.getAllManufacturerOfSalesagentUnderSupervisor = async (req, res) => {
  try {
    const result = await superModel.getAllManufacturerOfSalesagentUnderSupervisor(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};
exports.getSupervisorListByManufacturerAndDistributor = async (req, res) => {
  try {
    const result = await superModel.getSupervisorListByManufacturerAndDistributor(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.deleteSupervisor = async (req, res) => {
  try {
    const supervisor = await superModel.deleteSupervisor(req.params);
    res.status(200).send(supervisor);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.editSupervisor = async (req, res) => {
  try {
    const supervisor = await superModel.editSupervisor(req);
    res.status(200).send(supervisor);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.generateSupervisorUnuploadedReport = async (req, res) => {
  try {
    const limit_data = await knex("APSISIPDC.cr_supervisor_unuploaded_data")
      .where("status", "Active")
      .select(
        "supervisor_name",
        "supervisor_nid",
        "phone",
        "manufacturer_id",
        "supervisor_employee_code",
        "region_of_operation",
        "distributor_id",
        "remarks_duplications"
      );

    const headers = [
      "Sr.",
      "Supervisor_Name",
      "Supervisor_NID",
      "Phone",
      "Manufacturer",
      "Supervisor_Employee_Code",
      "Region_of_Operation",
      "Distributor",
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
      let remarks_duplications = e.remarks_duplications.split('-').join(',').split(',');
      let duplication_arr = remarks_duplications.map(element => {
        return element.trim();
      });
      worksheet.cell(row, col + col_add).number(i + 1);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.supervisor_name ? e.supervisor_name : "");
      col_add++;
      if (duplication_arr.includes("Supervisor_NID")) {
        worksheet.cell(row, col + col_add).string(e.supervisor_nid ? e.supervisor_nid : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.supervisor_nid ? e.supervisor_nid : "");
        col_add++;
      }
      if (duplication_arr.includes("Phone")) {
        worksheet.cell(row, col + col_add).string(e.phone ? e.phone : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.phone ? e.phone : "");
        col_add++;
      }
      worksheet.cell(row, col + col_add).number(e.manufacturer_id ? e.manufacturer_id : "");
      col_add++;
      if (duplication_arr.includes("Supervisor_Employee_Code") || duplication_arr.includes("Supervisor_Employee_Code already used by another user")) {
        worksheet.cell(row, col + col_add).string(e.supervisor_employee_code ? e.supervisor_employee_code : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.supervisor_employee_code ? e.supervisor_employee_code : "");
        col_add++;
      }
      worksheet.cell(row, col + col_add).string(e.region_of_operation ? e.region_of_operation : "");
      col_add++;
      worksheet.cell(row, col + col_add).number(e.distributor_id ? e.distributor_id : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.remarks_duplications ? e.remarks_duplications : "").style(remarksStyle);
      col_add++;
      // worksheet.cell(row, col + col_add).number(0);
      // col_add++;
      row++;
    }
    await workbook.write("public/unupload_report/supervisor_duplicated_report.xlsx");
    const fileName = "./unupload_report/supervisor_duplicated_report.xlsx";
    await knex("APSISIPDC.cr_supervisor_unuploaded_data").del();
    setTimeout(() => {
      res.send(sendApiResult(true, "File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.generateSupervisorInvalidatedReport = async (req, res) => {
  try {
    const limit_data = await knex("APSISIPDC.cr_supervisor_invalidated_data")
      .where("status", "Active")
      .select(
        "supervisor_name",
        "supervisor_nid",
        "phone",
        "manufacturer_id",
        "supervisor_employee_code",
        "region_of_operation",
        "distributor_id",
        "remarks_invalidated"
      );
    const headers = [
      "Sr.",
      "Supervisor_Name",
      "Supervisor_NID",
      "Phone",
      "Manufacturer",
      "Supervisor_Employee_Code",
      "Region_of_Operation",
      "Distributor",
      "Invalidated Remarked",
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
        .string(e.supervisor_name ? e.supervisor_name : "");
      col_add++;
      if (e.remarks_invalidated.includes("Supervisor_NID")) {
        worksheet.cell(row, col + col_add).string(e.supervisor_nid ? e.supervisor_nid : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.supervisor_nid ? e.supervisor_nid : "");
        col_add++;
      }
      if (e.remarks_invalidated.includes("Phone")) {
        worksheet.cell(row, col + col_add).string(e.phone ? e.phone : "").style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(e.phone ? e.phone : "");
        col_add++;
      }
      if (e.remarks_invalidated.includes("mapping")) {
        worksheet.cell(row, col + col_add).number(e.manufacturer_id ? e.manufacturer_id : 0).style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).number(e.manufacturer_id ? e.manufacturer_id : 0);
        col_add++;
      }
      worksheet.cell(row, col + col_add).string(e.supervisor_employee_code ? e.supervisor_employee_code : "");
      col_add++;
      worksheet.cell(row, col + col_add).string(e.region_of_operation ? e.region_of_operation : "");
      col_add++;
      if (e.remarks_invalidated.includes("mapping")) {
        worksheet.cell(row, col + col_add).number(e.distributor_id ? e.distributor_id : 0).style(errorStyle);
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).number(e.distributor_id ? e.distributor_id : 0);
        col_add++;
      }
      worksheet.cell(row, col + col_add).string(e.remarks_invalidated ? e.remarks_invalidated : "").style(remarksStyle);
      col_add++;
      // worksheet.cell(row, col + col_add).number(0);
      // col_add++;
      row++;
    }
    await workbook.write("public/unupload_report/supervisorInvalidateDataDownload.xlsx");
    const fileName = "./unupload_report/supervisorInvalidateDataDownload.xlsx";
    await knex("APSISIPDC.cr_supervisor_invalidated_data").del();
    setTimeout(() => {
      res.send(sendApiResult(true, "File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};


exports.adminDisbursementAdd = async (req, res) => {
  try {
    const result = await superModel.adminDisbursementAdd(req);
    res.status(200).send(result)
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.GetAdminDisbursement = async (req, res) => {
  try {
    const result = await superModel.GetAdminDisbursement(req);
    res.status(200).send(result)
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.getSupervisorDropdownList = async (req, res) => {
  try {
    const result = await superModel.getSupervisorDropdownList(req);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.GetAdminAmount = async (req, res) => {
  try {
    const result = await superModel.GetAdminAmount(req);
    res.status(200).send(result)
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};