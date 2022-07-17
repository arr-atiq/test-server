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



exports.getBlockListAll = function (req) {
    const { page, per_page } = req.query;
    return new Promise(async (resolve, reject) => {
      try {
        const data = await knex("APSISIPDC.cr_retailer")
        //   .where("retailer_status", "BLOCK")
          .whereIn('retailer_status', ["BLOCK", "SUSPEND"])
          .select(
            "id",
            "master_r_number",
            "retailer_name",
            "retailer_nid",
            "phone",
            "retailer_code",
            "retailer_tin",
            "corporate_registration_no",
            "trade_license_no",
            "outlet_address",
            "postal_code",
            "post_office",
            "thana",
            "district",
            "division",
            "autho_rep_full_name",
            "autho_rep_phone",
            "region_operation",
            "kyc_status",
            "cib_status",
            "retailer_status",
          )
          .orderBy("id", "desc")
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });
        if (data == 0) reject(sendApiResult(false, "Not found."));
  
        resolve(sendApiResult(true, "Retailer List fetched successfully", data));
      } catch (error) {
        reject(sendApiResult(false, error.message));
      }
    });
  };
