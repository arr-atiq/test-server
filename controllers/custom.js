const { sendApiResult } = require("./helper");
const Custom = require("../Models/Custom");
const axios = require("axios");
const { NUMBER, DEFAULT } = require("oracledb");
const knex = require("../config/database");
const xlsx = require("xlsx");

exports.uploadBlackList = async (req, res) => {
//   try {
//     const result = await Custom.uploadBlackListModel(req.body);
//     res.status(200).send(result);
//   } catch (error) {
//     res.send(sendApiResult(false, error.message));
//   }
const upload = await importExcelData2DB(req.file.filename, req.body);
  res.status(200).send(upload);
};


exports.uploadBlackListData = async (req, res) => {

    const upload = await Custom.importDataDB(req.body);
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
        insert = await Custom.uploadBlackListModel(resData, filename, req);
      }
      return insert;
    } catch (error) {
      return sendApiResult(false, "Retailer File not uploaded due to " + error.message);
    }
  };

  exports.getBlockList = async (req, res) => {
  
    const upload = await Custom.getBlockListAll(req);
      res.status(200).send(upload);
    };