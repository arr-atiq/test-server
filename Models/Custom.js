const moment = require("moment");
const excel = require("excel4node");
const fs = require("fs");
const { getJsDateFromExcel } = require("excel-date-to-js");
const {
  sendApiResult,
  ValidateNID,
  timeout,
} = require("../controllers/helperController");
const knex = require("../config/database");

exports.uploadBlackListModel = async (rows, filename, req) => {
  var resValue = [];
  return new Promise(async (resolve, reject) => {
    try {
      await knex
        .transaction(async (trx) => {
          let msg;
          const folder_name = req.file_for;
          if (Object.keys(rows).length == 0) {
            resolve(
              sendApiResult(false, "No Rows Found in your Uploaded File.")
            );
          } else {
            rows.length > 0 &&
              rows.map((data) => {
                knex.transaction(async (trx) => {
                  const updateData = await trx("APSISIPDC.cr_retailer")
                    .where({ id: data.Retailer_ID })
                    .update({
                      retailer_status: data.Status,
                    });
                    resValue.push(updateData);
                  console.log("updatupdateDataeData", updateData);
                  console.log("rowsrowsrows", updateData);
                  if (resValue.length === rows.length) {
                    console.log('hey resolve true')
                    resolve(true);
                  }
                });
              });
          }
        })
        .then((result) => {
          sendApiResult(true, "Data updated Successfully", resValue);
        })
        .catch((error) => {
          console.log("errorerrorerrorerrorerror", error);
          reject(sendApiResult(false, "Data not inserted."));
        });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  }).catch((error) => {
    console.log("--------------------------------2nd error", error);
  });
};
