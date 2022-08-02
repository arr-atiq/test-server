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
const md5 = require("md5");

exports.uploadBlackListModel = async (rows, filename, req) => {
  var resValue = [];
  var unUpdateData = 0;
  var updatedData = 0;

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
                      retailer_comment: data.Comment
                    });
                    if(updateData == 0){
                        unUpdateData ++
                    }else{
                        updatedData ++
                    }
                    resValue.push(updateData);
                  if (resValue.length === rows.length) {
                    // console.log('hey resolve true')
                    resolve(true);
                  }
                });
              });
          }
        })
        .then((result) => {
            var responseValue = {
                unUpdateData , 
                updatedData
            }
         return sendApiResult(true, "Data updated Successfully", responseValue);
        //   return responseValue;
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
            "retailer_comment"
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


  exports.importDataDB = async (rows) => {
    var resValue = [];
    var unUpdateData = 0;
    var updatedData = 0;
  
    return new Promise(async (resolve, reject) => {
      try {
        await knex
          .transaction(async (trx) => {
            let msg;
            // const folder_name = req.file_for;
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
                        updated_at: knex.fn.now(),
                        retailer_comment: data.Comment
                      });
                      if(updateData == 0){
                          unUpdateData ++
                      }else{
                          updatedData ++
                      }
                      resValue.push(updateData);
                    if (resValue.length === rows.length) {
                      // console.log('hey resolve true')
                      resolve(true);
                    }
                  });
                });
            }
          })
          .then((result) => {
              var responseValue = {
                  unUpdateData , 
                  updatedData
              }
           return sendApiResult(true, "Data updated Successfully", responseValue);
          //   return responseValue;
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


  exports.updatePassword = async (req) => {
    console.log('req.body',req)

    const { curr_pass, new_pass ,  id } = req;
    const valueData = await knex("APSISIPDC.cr_users")
          .where('id', id)
          .select(
            "id",
            "password"
          )

     if((md5(`++${curr_pass}--`) === valueData[0]?.password)){
      const data = await knex("APSISIPDC.cr_users").where("id", id).update({
        password: md5(`++${new_pass}--`),
      });
      return sendApiResult(true, "You have Successfully Reset Password.", data);
     }  else{
      return sendApiResult(false, "Current Password Is Not Same.", valueData);
     }  
    
    
  }