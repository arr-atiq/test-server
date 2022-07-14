const moment = require("moment");
const excel = require('excel4node');
const fs = require('fs');
const { getJsDateFromExcel } = require("excel-date-to-js");
const { sendApiResult, ValidateNID, timeout } = require("../controllers/helperController");
const knex = require("../config/database");
const { getSchemeDetailsById } = require("../controllers/scheme");
const { creditLimit } = require("../controllers/credit_limit");

const Retailer = function () { };

Retailer.insertExcelData = function (rows, filename, req) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        let msg;

        if (Object.keys(rows).length === 0) {
          resolve(sendApiResult(false, "No Rows Found in your Uploaded File."));
        }

        const retailerUploadId = new Date().valueOf();
        if (Object.keys(rows).length !== 0) {
          const retailerList = [];
          for (let index = 0; index < rows.length; index++) {
            const retailerData = {
              retailer_upload_id: retailerUploadId,
              sales_agent_id: rows[index].Sales_Agent_ID !== undefined ? rows[index].Sales_Agent_ID : null,
              retailer_name: rows[index].Retailer_Name !== undefined ? rows[index].Retailer_Name : null,
              sales_agent_id: rows[index].Sales_Agent_ID !== undefined ? rows[index].Sales_Agent_ID : null,
              retailer_nid: rows[index].Retailer_NID !== undefined ? rows[index].Retailer_NID : null,
              phone: rows[index].Mobile_No_of_the_Retailer !== undefined ? rows[index].Mobile_No_of_the_Retailer : null,
              email: rows[index].Email !== undefined ? rows[index].Email : null,
              retailer_type: rows[index].Retailer_Type !== undefined ? rows[index].Retailer_Type : null,
              type_of_entity: rows[index].Entity_Type !== undefined ? rows[index].Entity_Type : null,
              retailer_code: rows[index].Retailer_Code !== undefined ? rows[index].Retailer_Code : null,
              onboarding: rows[index].Onboarding !== undefined ? rows[index].Onboarding : null,
              order_placement: rows[index].Order_Placement !== undefined ? rows[index].Order_Placement : null,
              repayment: rows[index].Repayment !== undefined ? rows[index].Repayment : null,
              manufacturer: rows[index].Corresponding_manufacturer_code !== undefined ? rows[index].Corresponding_manufacturer_code : null,
              distributor_code: rows[index].Corresponding_distributor_code !== undefined ? rows[index].Corresponding_distributor_code : null,
              retailer_tin: rows[index].Retailer_TIN !== undefined ? rows[index].Retailer_TIN : null,
              corporate_registration_no: rows[index].Retailer_Corporate_Registration_No !== undefined ? rows[index].Retailer_Corporate_Registration_No : null,
              trade_license_no: rows[index].Trade_License_No_of_Primary_Establishment !== undefined ? rows[index].Trade_License_No_of_Primary_Establishment : null,
              outlet_address: rows[index].Outlet_Address !== undefined ? rows[index].Outlet_Address : null,
              outlet_address_1: rows[index].Address_Line_1 !== undefined ? rows[index].Address_Line_1 : null,
              outlet_address_2: rows[index].Address_Line_2 !== undefined ? rows[index].Address_Line_2 : null,
              postal_code: rows[index].Postal_Code !== undefined ? rows[index].Postal_Code : null,
              post_office: rows[index].Post_Office !== undefined ? rows[index].Post_Office : null,
              thana: rows[index].Thana !== undefined ? rows[index].Thana : null,
              district: rows[index].District !== undefined ? rows[index].District : null,
              division: rows[index].Division !== undefined ? rows[index].Division : null,
              autho_rep_full_name: rows[index].Full_Name_of_Retailer_Authorized_Representative !== undefined ? rows[index].Full_Name_of_Retailer_Authorized_Representative : null,
              autho_rep_nid: rows[index].NID_of_Authorized_Representative !== undefined ? rows[index].NID_of_Authorized_Representative : null,
              autho_rep_phone: rows[index].Mobile_No_of_Representative !== undefined ? rows[index].Mobile_No_of_Representative : null,
              autho_rep_email: rows[index].Official_Email_of_Retailer_Representative !== undefined ? rows[index].Official_Email_of_Retailer_Representative : null,
              region_operation: rows[index].Region_of_Operation !== undefined ? rows[index].Region_of_Operation : null,
              duration_sales_data: rows[index].Duration_of_Sales_Data_Submitted_in_Months !== undefined ? rows[index].Duration_of_Sales_Data_Submitted_in_Months : null,
              scheme_id: rows[index].Scheme_ID !== undefined ? rows[index].Scheme_ID : null,
              start_date: rows[index].Start_Date !== undefined ? getJsDateFromExcel(rows[index].Start_Date) : null,
              end_date: rows[index].End_Date !== undefined ? getJsDateFromExcel(rows[index].End_Date) : null,
              month_1: rows[index].Month_1 !== undefined ? rows[index].Month_1 : 0,
              month_2: rows[index].Month_2 !== undefined ? rows[index].Month_2 : 0,
              month_3: rows[index].Month_3 !== undefined ? rows[index].Month_3 : 0,
              month_4: rows[index].Month_4 !== undefined ? rows[index].Month_4 : 0,
              month_5: rows[index].Month_5 !== undefined ? rows[index].Month_5 : 0,
              month_6: rows[index].Month_6 !== undefined ? rows[index].Month_6 : 0,
              month_7: rows[index].Month_7 !== undefined ? rows[index].Month_7 : 0,
              month_8: rows[index].Month_8 !== undefined ? rows[index].Month_8 : 0,
              month_9: rows[index].Month_9 !== undefined ? rows[index].Month_9 : 0,
              month_10: rows[index].Month_10 !== undefined ? rows[index].Month_10 : 0,
              month_11: rows[index].Month_11 !== undefined ? rows[index].Month_11 : 0,
              month_12: rows[index].Month_12 !== undefined ? rows[index].Month_12 : 0,
              created_by: parseInt(req.user_id)
            };
            retailerList.push(retailerData);
          }
          const insertRetailerList = await trx("APSISIPDC.cr_retailer_temp").insert(retailerList);

          if (insertRetailerList == true) {
            const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
            const insertLog = {
              retailer_upload_id: retailerUploadId,
              bulk_upload_date: new Date(date),
              file_name: filename,
              file_for: req.file_for,
              file_path: `public/configuration_file/${req.file_for}`,
              file_found_rows: Object.keys(rows).length,
              file_upload_rows: Object.keys(retailerList).length,
              count_eligibility: 0,
              count_ineligible: 0,
              created_by: parseInt(req.user_id),
            };
            const uploadLog = await trx("APSISIPDC.cr_retailer_upload_log").insert(insertLog);
            if (uploadLog == true) {
              msg = "Retailer List Uploaded successfully!";
              resolve(sendApiResult(true, msg, insertLog));
            }
          }
        } else {
          msg = "No Data Founds to Update";
          resolve(sendApiResult(true, msg));
        }
      })
        .then((result) => {
          //
        })
        .catch((error) => {
          reject(sendApiResult(false, error.message));
        });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  }).catch((error) => {
    console.log(error.message);
  });
};

Retailer.getRetailerList = function (req) {
  const { page, per_page } = req.query;
  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_retailer")
        .where("status", "Active")
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
          "cib_status"
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

Retailer.getRetailerRegionOperation = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_retailer")
        .where("status", "Active")
        .select(
          "region_operation"
        );
      if (data == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendApiResult(true, "Retailer Region fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

Retailer.checkRetailerEligibility = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      knex.transaction(async (trx) => {
        const bulk_retailer_upload_log = await trx("APSISIPDC.cr_retailer_upload_log")
          .select("retailer_upload_id")
          .where("eligibility_check_status", 0)
          .where("eligibility_check_date", null);

        if (Object.keys(bulk_retailer_upload_log).length != 0) {
          const distributorSql = await trx("APSISIPDC.cr_distributor")
            .select("id", "distributor_code")
            .where("status", "Active");

          const distributorList = [];
          for (const [key, value] of Object.entries(distributorSql)) {
            distributorList[value.distributor_code] = value.id;
          }

          const retailerTypeSql = await trx("APSISIPDC.cr_retailer_type")
            .select("id", "name")
            .where("status", "Active");

          const retailerType = [];
          for (const [key, value] of Object.entries(retailerTypeSql)) {
            retailerType[value.name] = value.id;
          }

          const retailerTypeEntitySql = await trx("APSISIPDC.cr_retailer_type_entity")
            .select("id", "name")
            .where("status", "Active");

          const retailerTypeEntity = [];
          for (const [key, value] of Object.entries(retailerTypeEntitySql)) {
            retailerTypeEntity[value.name] = value.id;
          }
          for (const [index, log] of Object.entries(bulk_retailer_upload_log)) {
            const bulkRetailerInfoList = await trx("APSISIPDC.cr_retailer_temp")
              .select()
              .where("retailer_upload_id", log.retailer_upload_id)
              .where("eligibility_status", null)
              .where("reason", null);

            const monthCount = 6, minimumSalesAmount = 1000; // static value
            let validNID, validMonthlySalesData;
            let eligibileOutletCount = 0, disqualifiedOutletCount = 0;
            if (Object.keys(bulkRetailerInfoList).length != 0) {
              let max_r_number_rn = 0;
              const r_number_rn = await trx("APSISIPDC.cr_retailer")
                .whereRaw('"master_r_number" >= 100000000000')
                .select(trx.raw(`MAX("master_r_number") AS master_r_number`))
                .first();

              max_r_number_rn = r_number_rn.master_r_number == null ? 100000000001 : r_number_rn.master_r_number;

              const max_master_loan_info = await knex("APSISIPDC.cr_retailer")
                .select(
                  knex.raw(`COUNT("id") AS max_master_loan_id`)
                );

              const customer_id_info = await knex("APSISIPDC.cr_retailer")
                .select(
                  knex.raw(`MAX("customer_id") AS max_customer_id`)
                )
                .where("customer_id", '>=', 10000000)
                .whereNotNull("customer_id");

              let max_customer_id = (customer_id_info[0].max_customer_id != null) ? customer_id_info[0].max_customer_id : 10000000;
              let max_master_loan_id = (max_master_loan_info[0].max_master_loan_id != null) ? max_master_loan_info[0].max_master_loan_id : 0;
              // let master_loan_id = '1001DANA' + await addLeadingZeros(++max_master_loan_id, 8);
              for (const [key, value] of Object.entries(bulkRetailerInfoList)) {
                let disqualifiedReason = "";
                validNID = ValidateNID(value.retailer_nid);
                if (validNID == false) {
                  disqualifiedReason = disqualifiedReason + "NID Number Invalid. ;; ";
                }
                const monthlySalesArray = [];
                for (let i = 1; i <= 12; i++) {
                  monthlySalesArray[i] = value["month_" + i];
                }
                validMonthlySalesData = await checkMonthlySalesData(monthCount, minimumSalesAmount, monthlySalesArray);
                if (validMonthlySalesData == false) {
                  disqualifiedReason = disqualifiedReason + "Monthly Sales Data Invalid. ;; ";
                }

                if (validNID == false || validMonthlySalesData == false) {
                  const retailerEligibilityUpdate = await trx("APSISIPDC.cr_retailer_temp")
                    .where({ id: value.id })
                    .update({
                      eligibility_status: "Failed",
                      reason: disqualifiedReason,
                      updated_at: new Date(),
                    });
                  ++disqualifiedOutletCount;
                }
                if (validNID == true && validMonthlySalesData == true) {
                  let salesArray = [];
                  for (let i = 1; i <= 12; i++) {
                    salesArray.push(value["month_" + i]);
                  }
                  const checkMasterRetailer = await trx("APSISIPDC.cr_retailer")
                    .select("id")
                    // .where("retailer_code", value.retailer_code);
                    .where("retailer_nid", parseInt(value.retailer_nid));

                  if (Object.keys(checkMasterRetailer).length == 0) {
                    const temp_r_number_rn = ++max_r_number_rn;
                    const masterRetailerData = {
                      retailer_upload_id: value.retailer_upload_id,
                      master_r_number: parseInt(temp_r_number_rn),
                      ac_number_1rn: await prepare_1RN_accountNumber(temp_r_number_rn),
                      master_loan_id: '1001DANA' + await addLeadingZeros(++max_master_loan_id, 8),
                      customer_id: parseInt(++max_customer_id),
                      retailer_name: value.retailer_name,
                      retailer_nid: parseInt(value.retailer_nid),
                      phone: value.phone,
                      email: value.email,
                      retailer_type: parseInt(retailerType[value.retailer_type]),
                      type_of_entity: parseInt(retailerTypeEntity[value.type_of_entity]),
                      retailer_code: value.retailer_code,
                      onboarding: value.onboarding,
                      order_placement: value.order_placement,
                      repayment: value.repayment,
                      retailer_tin: value.retailer_tin,
                      corporate_registration_no: value.corporate_registration_no,
                      trade_license_no: value.trade_license_no,
                      outlet_address: value.outlet_address,
                      outlet_address_1: value.outlet_address_1,
                      outlet_address_2: value.outlet_address_2,
                      postal_code: parseInt(value.postal_code),
                      post_office: value.post_office,
                      thana: value.thana,
                      district: value.district,
                      division: value.division,
                      autho_rep_full_name: value.autho_rep_full_name,
                      autho_rep_nid: parseInt(value.autho_rep_nid),
                      autho_rep_phone: value.autho_rep_phone,
                      autho_rep_email: value.autho_rep_email,
                      region_operation: value.region_operation,
                      duration_sales_data: parseInt(value.duration_sales_data),
                    };

                    const masterRetailerInsertLog = await trx("APSISIPDC.cr_retailer").insert(masterRetailerData)
                      .returning("id");

                    const sales_agent_mapping = {
                      'retailer_id': parseInt(masterRetailerInsertLog[0]),
                      'retailer_code': value.retailer_code,
                      'manufacturer_id': value.manufacturer,
                      'sales_agent_id': value.sales_agent_id,
                    };
                    await trx("APSISIPDC.cr_retailer_vs_sales_agent").insert(sales_agent_mapping);

                    let max_r_number_rmn = 0;
                    let r_number_rmn = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
                      .whereRaw('"master_r_number" >= 1000000')
                      .select(trx.raw(`MAX("master_r_number") AS master_r_number`))
                      .first();

                    max_r_number_rmn = r_number_rmn.MASTER_R_NUMBER === undefined || r_number_rmn.MASTER_R_NUMBER == null ? 1000000 : parseInt(r_number_rmn.MASTER_R_NUMBER);

                    let temp_r_number_rmn = ++max_r_number_rmn;
                    // console.log("masterRetailerInsertLog " + r_number_rmn + " => " + temp_r_number_rmn);


                    let loan_id_counter = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
                      .where("manufacturer_id", value.manufacturer)
                      .where("distributor_id", distributorList[value.distributor_code])
                      .select("id");

                    let loan_id = '';
                    if (Object.keys(loan_id_counter).length == 0)
                      loan_id = '1001DN' + await addLeadingZeros(value.manufacturer, 2) + await addLeadingZeros(distributorList[value.distributor_code], 3) + await addLeadingZeros(1, 5);
                    else
                      loan_id = '1001DN' + await addLeadingZeros(value.manufacturer, 2) + await addLeadingZeros(distributorList[value.distributor_code], 3) + await addLeadingZeros(++(Object.keys(loan_id_counter).length), 5);

                    let retailerManuDistMappingInsert = {
                      master_r_number: parseInt(temp_r_number_rmn),
                      ac_number_1rmn: await prepare_1RMN_accountNumber(temp_r_number_rmn, value.manufacturer),
                      loan_id: loan_id,
                      retailer_id: masterRetailerInsertLog[0],
                      retailer_nid: parseInt(value.retailer_nid),
                      retailer_code: value.retailer_code,
                      manufacturer_id: value.manufacturer,
                      distributor_id: distributorList[value.distributor_code],
                      scheme_id: value.scheme_id,
                      sales_array: JSON.stringify(salesArray),
                      status: "Active",
                    };

                    const mappingRetailerInsertLog = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping").insert(retailerManuDistMappingInsert);

                    if (mappingRetailerInsertLog == true) {
                      const retailerEligibilityUpdate = await trx("APSISIPDC.cr_retailer_temp")
                        .where({ id: value.id })
                        .update({
                          eligibility_status: "Success",
                          reason: null,
                          updated_at: new Date(),
                        });
                      ++eligibileOutletCount;
                    }
                  } else {
                    const checkRetailerManuMapping = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
                      .select("id")
                      // .where("retailer_code", value.retailer_code)
                      .where("retailer_nid", parseInt(value.retailer_nid))
                      .where("manufacturer_id", value.manufacturer);

                    if (Object.keys(checkRetailerManuMapping).length == 0) {
                      let max_r_number_rmn = 0;
                      let retailerInfo = await trx("APSISIPDC.cr_retailer")
                        .where("retailer_nid", parseInt(value.retailer_nid))
                        .select("id AS retailer_id")
                        .first();

                      let r_number_rmn = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
                        .whereRaw('"master_r_number" >= 1000000')
                        .select(trx.raw(`MAX("master_r_number") AS master_r_number`))
                        .first();

                      let loan_id_counter = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
                        .where("manufacturer_id", value.manufacturer)
                        .where("distributor_id", distributorList[value.distributor_code])
                        .select("id");

                      let loan_id = '';
                      if (Object.keys(loan_id_counter).length == 0)
                        loan_id = '1001DN' + await addLeadingZeros(value.manufacturer, 2) + await addLeadingZeros(distributorList[value.distributor_code], 3) + await addLeadingZeros(1, 5);
                      else
                        loan_id = '1001DN' + await addLeadingZeros(value.manufacturer, 2) + await addLeadingZeros(distributorList[value.distributor_code], 3) + await addLeadingZeros(++(Object.keys(loan_id_counter).length), 5);

                      max_r_number_rmn = r_number_rmn.MASTER_R_NUMBER === undefined || r_number_rmn.MASTER_R_NUMBER == null ? 1000000 : r_number_rmn.MASTER_R_NUMBER;

                      let temp_r_number_rmn = ++max_r_number_rmn;
                      let retailerManuDistMappingInsert = {
                        master_r_number: parseInt(temp_r_number_rmn),
                        ac_number_1rmn: await prepare_1RMN_accountNumber(temp_r_number_rmn, value.manufacturer),
                        loan_id: loan_id,
                        retailer_id: retailerInfo.retailer_id,
                        retailer_nid: parseInt(value.retailer_nid),
                        retailer_code: value.retailer_code,
                        manufacturer_id: value.manufacturer,
                        distributor_id: distributorList[value.distributor_code],
                        scheme_id: value.scheme_id,
                        sales_array: JSON.stringify(salesArray),
                        status: "Active",
                      };

                      const mappingRetailerInsertLog = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping").insert(retailerManuDistMappingInsert);

                      if (mappingRetailerInsertLog == true) {
                        const retailerEligibilityUpdate = await trx("APSISIPDC.cr_retailer_temp")
                          .where({ id: value.id })
                          .update({
                            eligibility_status: "Success",
                            reason: null,
                            updated_at: new Date(),
                          });
                        ++eligibileOutletCount;
                      }
                    } else {
                      disqualifiedReason = disqualifiedReason + "Duplicate NID Found. ;; ";
                      const duplicate_nid_log = {
                        retailer_upload_id: value.retailer_upload_id,
                        retailer_temp_id: value.id,
                        reason: 'Duplicate NID',
                        status: 'Active'
                      };
                      await trx("APSISIPDC.cr_retailer_duplicate_log").insert(duplicate_nid_log);

                      const retailerEligibilityUpdate = await trx("APSISIPDC.cr_retailer_temp")
                        .where({ id: value.id })
                        .update({
                          eligibility_status: "Failed",
                          reason: disqualifiedReason,
                          updated_at: new Date()
                        });
                      ++disqualifiedOutletCount;
                    }
                  }
                }
              }
              await trx("APSISIPDC.cr_retailer_upload_log")
                .where({ retailer_upload_id: log.retailer_upload_id })
                .update({
                  eligibility_check_status: 1,
                  eligibility_check_date: new Date(),
                  count_eligibility: parseInt(eligibileOutletCount),
                  count_ineligible: parseInt(disqualifiedOutletCount),
                  updated_at: new Date()
                });
            } else {
              reject(sendApiResult(false, "No Retailer List to check Eligibility."));
            }
          }
        } else {
          reject(sendApiResult(false, "No Retailer List to check Eligibility."));
        }
        resolve(sendApiResult(true, "Retailer Eligibility Check Successful."));
      })
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

Retailer.schemeWiseLimitConfigure = async function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        const retailerList = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
          .select(
            "id",
            "retailer_id",
            "retailer_code",
            "manufacturer_id",
            "distributor_id",
            "scheme_id",
            "sales_array"
          )
          .where("limit_status", "Unset")
          .where("status", "Active");

        if (Object.keys(retailerList).length !== 0) {
          for (const [key, value] of Object.entries(retailerList)) {
            let schemaParameterDeatils = await getSchemeDetailsById(value.scheme_id);

            const salesArray = JSON.parse(value.sales_array);
            const systemLimit = await creditLimit(
              schemaParameterDeatils.uninterrupted_sales,
              schemaParameterDeatils.min_avg_sales_manufacturer,
              schemaParameterDeatils.avg_sales_duration,
              schemaParameterDeatils.multiplying_factor,
              salesArray,
              schemaParameterDeatils.interval_checking_avg_sales_duration
            );

            await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
              .where({ id: value.id })
              .update({
                system_limit: parseFloat(systemLimit),
                limit_status: "Initiated",
                system_limit_date: new Date(),
                updated_at: new Date(),
              });

            const retailerLimitHistory = {
              mapping_id: value.id,
              manufacturer_id: value.manufacturer_id,
              retailer_id: value.retailer_id,
              retailer_code: value.retailer_code,
              distributor_id: value.distributor_id,
              system_limit: systemLimit,
              system_limit_date: new Date(),
              status: "Active",
            };
            await trx("APSISIPDC.cr_retailer_credit_limit_history").insert(retailerLimitHistory);

            let retailerSalesVolume = [];
            for (let i = 1; i <= 12; i++) {
              const tempSalesVolume = {
                manufacturer_id: value.manufacturer_id,
                retailer_id: value.retailer_id,
                retailer_code: value.retailer_code,
                mapping_id: value.id,
                month: i,
                amount: salesArray[i - 1],
              };
              retailerSalesVolume.push(tempSalesVolume);
            }
            await trx("APSISIPDC.cr_retailer_sales_volume").insert(retailerSalesVolume);
          }
        } else {
          let msg = "No data Found";
          reject(sendApiResult(false, msg));
        }
        resolve(sendApiResult(true, "Scheme Wise Limit Configure Successful."));
      })
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

const checkMonthlySalesData = async function (monthCount = 12, minimumSalesAmount, monthlySalesArray) {
  if (!isNaN(monthCount) || !isNaN(minimumSalesAmount) | !isNaN(monthlySalesArray)) {
    const validData = [];
    for (let i = monthCount; i >= 1; --i) {
      parseInt(monthlySalesArray[i]) >= parseInt(minimumSalesAmount)
        ? validData.push(true)
        : validData.push(false);
    }
    if (validData.includes(false)) return false;
    else return true;
  }
  return false;
};

const addLeadingZeros = async function (num, size) {
  var s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

const prepare_1RN_accountNumber = async function (max_r_number) {
  //  1RN where R = Retailer ID (12-digit integer, system generated), N = Account Number, length (3). The numbers will be filled with zeros in the left.
  const R = max_r_number;
  const N = await generateRandomNumber(3);
  const RN_number = 0 + "" + R + "" + N;
  return RN_number;
};

const prepare_1RMN_accountNumber = async function (max_r_number, m_number) {
  // 1RMN where R = Retailer ID (7-digit integer, system generated), M = Manufacturer ID (5-digit integer, system generated), N = Account Number (3-digit integer, system generated) The numbers will be filled with zeros in the left with 1 being the 16th digit.
  const R = max_r_number;
  const M = m_number;
  const N = await generateRandomNumber(3);
  const RMN_number = 0 + "" + R + "" + M + "" + N;
  return RMN_number;
};

const generateRandomNumber = async function (count) {
  const numberList = "1234567890";
  let randomNumber = "";
  for (let i = 0; i < count; i++) {
    randomNumber += numberList[parseInt(Math.random() * numberList.length)];
  }
  return randomNumber;
};

Retailer.getRetailerByDistributor = function (req) {
  const { distributor_id } = req.params;
  const { page, per_page } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
        .leftJoin(
          "APSISIPDC.cr_schema",
          "cr_schema.id",
          "cr_retailer_manu_scheme_mapping.scheme_id"
        )
        .leftJoin(
          "APSISIPDC.cr_retailer",
          "cr_retailer.id",
          "cr_retailer_manu_scheme_mapping.retailer_id"
        )
        .where("cr_retailer_manu_scheme_mapping.status", "Active")
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .select(
          'cr_retailer_manu_scheme_mapping.id',
          'cr_retailer_manu_scheme_mapping.retailer_id',
          'cr_retailer_manu_scheme_mapping.retailer_code',
          'cr_retailer_manu_scheme_mapping.scheme_id',
          'cr_schema.scheme_name',
          'cr_retailer.retailer_name',
          'cr_retailer.ac_number_1rn',
          'cr_retailer.phone',
          'cr_retailer.retailer_tin',
          'cr_retailer.trade_license_no',
          'cr_retailer.outlet_address',
          'cr_retailer.postal_code',
          'cr_retailer.post_office',
          'cr_retailer.thana',
          'cr_retailer.district',
          'cr_retailer.division',
          'cr_retailer.autho_rep_full_name',
          'cr_retailer.autho_rep_phone',
          'cr_retailer.region_operation'
        )
        .distinct()
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (data == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

Retailer.getRnRmnMappingById = function (req) {
  const { retailer_id } = req.params;

  return new Promise(async (resolve, reject) => {
    try {
      const accountInfo = await knex("APSISIPDC.cr_retailer")
        .leftJoin(
          "APSISIPDC.cr_retailer_manu_scheme_mapping",
          "cr_retailer.id",
          "cr_retailer_manu_scheme_mapping.retailer_id"
        )
        .leftJoin(
          "APSISIPDC.cr_manufacturer",
          "cr_retailer_manu_scheme_mapping.manufacturer_id",
          "cr_manufacturer.id"
        )
        .leftJoin(
          "APSISIPDC.cr_distributor",
          "cr_retailer_manu_scheme_mapping.distributor_id",
          "cr_distributor.id"
        )
        .leftJoin(
          "APSISIPDC.cr_retailer_vs_sales_agent",
          "cr_retailer_vs_sales_agent.retailer_id",
          "cr_retailer.id"
        )
        .leftJoin(
          "APSISIPDC.cr_sales_agent",
          "cr_sales_agent.id",
          "cr_retailer_vs_sales_agent.sales_agent_id"
        )
        .where("cr_retailer.status", "Active")
        .where("cr_retailer_manu_scheme_mapping.status", "Active")
        .where("cr_retailer.id", retailer_id)
        .where("cr_retailer_manu_scheme_mapping.retailer_id", retailer_id)
        .select(
          "cr_retailer.ac_number_1rn",
          "cr_retailer.retailer_name",
          "cr_retailer.retailer_code",
          "cr_retailer_manu_scheme_mapping.ac_number_1rmn",
          "cr_retailer_manu_scheme_mapping.manufacturer_id",
          "cr_manufacturer.manufacturer_name",
          "cr_manufacturer.website_link",
          "cr_manufacturer.official_email",
          "cr_retailer_manu_scheme_mapping.distributor_id",
          "cr_distributor.distributor_name",
          "cr_distributor.registered_office_bangladesh",
          "cr_distributor.region_of_operation",
          "cr_retailer_manu_scheme_mapping.system_limit",
          "cr_retailer_manu_scheme_mapping.propose_limit",
          "cr_retailer_manu_scheme_mapping.crm_approve_limit",
          "cr_sales_agent.id as sales_agent_id",
          "cr_sales_agent.agent_name"
        );

      /* const getRnRmnMapping = {} */
      const accountInfoArray = [];
      /* let account_exist = []; */
      for (const [key, value] of Object.entries(accountInfo)) {
        /*if (!account_exist.includes(value.ac_number_1rn)) {
          account_exist.push(value.ac_number_1rn);
        }*/
        accountInfoArray.push({
          "ac_number_1rn": value.ac_number_1rn,
          "retailer_name": value.retailer_name,
          "retailer_code": value.retailer_code,
          "ac_number_1rn": value.ac_number_1rn,
          "ac_number_1rmn": value.ac_number_1rmn,
          "manufacturer_id": value.manufacturer_id,
          "manufacturer_name": value.manufacturer_name,
          "manufacturer_website_link": value.website_link,
          "manufacturer_official_email": value.official_email,
          "distributor_id": value.distributor_id,
          "distributor_name": value.distributor_name,
          "distributor_registered_office_bangladesh": value.registered_office_bangladesh,
          "distributor_region_of_operation": value.region_of_operation,
          "system_limit": value.system_limit,
          "propose_limit": value.propose_limit,
          "crm_approve_limit": value.crm_approve_limit,
          "sales_agent_id": value.sales_agent_id,
          "sales_agent_name": value.agent_name
        });
      }
      /* getRnRmnMapping[account_exist[0]] = accountInfoArray; */
      resolve(sendApiResult(true, "RN & RMN Account Info Fetch Successfull.", accountInfoArray));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

Retailer.getRetailerDetailsById = function (req) {
  const { retailer_id } = req.params;

  return new Promise(async (resolve, reject) => {
    try {
      const RetailerInfo = await knex("APSISIPDC.cr_retailer")
        .leftJoin(
          "APSISIPDC.cr_retailer_manu_scheme_mapping",
          "cr_retailer.id",
          "cr_retailer_manu_scheme_mapping.retailer_id"
        )
        .leftJoin(
          "APSISIPDC.cr_manufacturer",
          "cr_retailer_manu_scheme_mapping.manufacturer_id",
          "cr_manufacturer.id"
        )
        .leftJoin(
          "APSISIPDC.cr_distributor",
          "cr_retailer_manu_scheme_mapping.distributor_id",
          "cr_distributor.id"
        )
        .leftJoin(
          "APSISIPDC.cr_schema",
          "cr_retailer_manu_scheme_mapping.scheme_id",
          "cr_schema.id"
        )
        .where("cr_retailer.status", "Active")
        .where("cr_retailer_manu_scheme_mapping.status", "Active")
        .where("cr_retailer.id", retailer_id)
        .where("cr_retailer_manu_scheme_mapping.retailer_id", retailer_id)
        .select(
          "cr_retailer.id",
          "cr_retailer.ac_number_1rn",
          "cr_retailer.retailer_name",
          "cr_retailer.retailer_code",
          "cr_retailer_manu_scheme_mapping.ac_number_1rmn",
          "cr_retailer_manu_scheme_mapping.manufacturer_id",
          "cr_manufacturer.manufacturer_name",
          "cr_manufacturer.website_link",
          "cr_manufacturer.official_email",
          "cr_manufacturer.corporate_ofc_address",
          "cr_manufacturer.corporate_ofc_postal_code",
          "cr_manufacturer.corporate_ofc_post_office",
          "cr_manufacturer.corporate_ofc_thana",
          "cr_manufacturer.corporate_ofc_district",
          "cr_manufacturer.corporate_ofc_division",
          "cr_manufacturer.name_of_authorized_representative",
          "cr_manufacturer.autho_rep_phone",
          "cr_retailer_manu_scheme_mapping.distributor_id",
          "cr_distributor.distributor_name",
          "cr_distributor.registered_office_bangladesh",
          "cr_distributor.ofc_postal_code",
          "cr_distributor.ofc_post_office",
          "cr_distributor.ofc_thana",
          "cr_distributor.ofc_district",
          "cr_distributor.ofc_division",
          "cr_distributor.name_of_authorized_representative",
          "cr_distributor.region_of_operation",
          "cr_retailer_manu_scheme_mapping.system_limit",
          "cr_retailer_manu_scheme_mapping.propose_limit",
          "cr_retailer_manu_scheme_mapping.crm_approve_limit",
          "cr_retailer_manu_scheme_mapping.scheme_id",
          "cr_schema.transaction_fee",
          "cr_schema.transaction_type"
        );

      const RetailerInfoArray = [];

      for (const [key, value] of Object.entries(RetailerInfo)) {

        RetailerInfoArray.push({
          "retailer": {
            "id": value.id,
            "name": value.retailer_name,
            "code": value.retailer_code,
            "ac_number_1rn": value.ac_number_1rn,
            "ac_number_1rmn": value.ac_number_1rmn,
            "system_limit": value.system_limit,
            "propose_limit": value.propose_limit,
            "crm_approve_limit": value.crm_approve_limit,
            "scheme_id": value.scheme_id,
            "scheme_transaction_type": value.transaction_type,
            "scheme_transaction_fee": value.transaction_type == "SLAB" ? null : value.transaction_fee
          },
          "distributor": {
            "id": value.distributor_id,
            "name": value.distributor_name,
            "registered_office_bangladesh": value.registered_office_bangladesh,
            "ofc_postal_code": value.ofc_postal_code,
            "ofc_post_office": value.ofc_post_office,
            "ofc_thana": value.ofc_thana,
            "ofc_district": value.ofc_district,
            "ofc_division": value.ofc_division,
            "name_of_authorized_representative": value.name_of_authorized_representative,
            "region_of_operation": value.region_of_operation

          },
          "manifacturer": {
            "id": value.manufacturer_id,
            "name": value.manufacturer_name,
            "website_link": value.website_link,
            "official_email": value.official_email,
            "corporate_ofc_address": value.official_email,
            "corporate_ofc_postal_code": value.corporate_ofc_postal_code,
            "corporate_ofc_post_office": value.corporate_ofc_post_office,
            "corporate_ofc_thana": value.corporate_ofc_thana,
            "corporate_ofc_district": value.corporate_ofc_district,
            "corporate_ofc_division": value.corporate_ofc_division,
            "name_of_authorized_representative": value.name_of_authorized_representative,
            "autho_rep_phone": value.autho_rep_phone,
          }

        });
      }
      resolve(sendApiResult(true, "Retailer Info Fetch Successfull.", RetailerInfoArray));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

Retailer.updateSchemaByRetailers = function (req) {
  const { ids, scheme_id } = req.body;

  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        const scheme_update = await trx(
          "APSISIPDC.cr_retailer_manu_scheme_mapping"
        )
          .whereIn("id", ids)
          .update({
            scheme_id,
          });
        if (scheme_update <= 0)
          reject(sendApiResult(false, "Could not Found Schema"));
        resolve(
          sendApiResult(true, "Schema updated Successfully", scheme_update)
        );
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};


Retailer.updateLimitMapping = async (req, res) => {

  console.log("haha start");
  const {
    type,
    limitValue,
    user_id
  } = req.body;

  return new Promise(async (resolve, reject) => {
    try {
      if (type == 'ProposeLimit') {
        knex.transaction(async (trx) => {
          const updateData = await trx('APSISIPDC.cr_retailer_manu_scheme_mapping')
            .where({ ac_number_1rmn: req.params.rmnID })
            .update({
              propose_limit: limitValue,
              propose_approve_by: user_id
            });

          if (updateData <= 0) (sendApiResult(false, 'Could not Found ac_number_1rmn'));
          resolve(sendApiResult(
            true,
            'Data updated Successfully',
            updateData,
          )
          )
        })
        //.toSQL().toNative()
      }
      else {
        knex.transaction(async (trx) => {
          const updateData = await trx('APSISIPDC.cr_retailer_manu_scheme_mapping')
            .where({ ac_number_1rmn: req.params.rmnID })
            .update({
              crm_approve_limit: limitValue,
              crm_approve_date: knex.fn.now(),
              crm_approve_by: user_id
            });
          console.log('updateData', updateData)
          if (updateData <= 0) res.send(sendApiResult(false, 'Could not Found ac_number_1rmn'));
          resolve(sendApiResult(
            true,
            'Data updated Successfully',
            updateData,
          ))
        })
      }
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
}

Retailer.uploadRetailerEkycFile = function (rows, filename, req) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        let msg;
        const folderName = req.file_for;
        if (Object.keys(rows).length !== 0) {
          let insert_count = 0;
          for (let index = 0; index < rows.length; index++) {
            let retailer_code = rows[index].REF_NO;
            const retailerInfo = await trx("APSISIPDC.cr_retailer")
              .select("id")
              .where("retailer_code", retailer_code)
              // .whereNot("kyc_status", 1)
              .where("kyc_status", null)
              .where("cib_status", null)
              .where("activation_status", "Inactive")
              .where("status", "Active")
              .first();

            if (retailerInfo != undefined && retailerInfo.id != undefined) {
              const retailerEkycData = {
                retailer_id: retailerInfo.id,
                retailer_code: retailer_code,
                subject_role: rows[index].SUBJECT_ROLE !== undefined ? rows[index].SUBJECT_ROLE : null,
                type_of_financing: rows[index].TYPE_OF_FINANCING !== undefined ? rows[index].TYPE_OF_FINANCING : null,
                number_of_installment: rows[index].NUMBER_OF_INSTALLMENT !== undefined ? rows[index].NUMBER_OF_INSTALLMENT : null,
                installment_amount: rows[index].INSTALLMENT_AMOUNT !== undefined ? rows[index].INSTALLMENT_AMOUNT : null,
                total_requested_amount: rows[index].TOTAL_REQUESTED_AMOUNT !== undefined ? rows[index].TOTAL_REQUESTED_AMOUNT : null,
                periodicity_of_payment: rows[index].PERIODICITY_OF_PAYMENT !== undefined ? rows[index].PERIODICITY_OF_PAYMENT : null,
                title: rows[index].TITLE !== undefined ? rows[index].TITLE : null,
                name: rows[index].NAME !== undefined ? rows[index].NAME : null,
                father_title: rows[index].FATHER_TITLE !== undefined ? rows[index].FATHER_TITLE : null,
                father_name: rows[index].FATHER_NAME !== undefined ? rows[index].FATHER_NAME : null,
                mother_title: rows[index].MOTHER_TITLE !== undefined ? rows[index].MOTHER_TITLE : null,
                mother_name: rows[index].MOTHER_NAME !== undefined ? rows[index].MOTHER_NAME : null,
                spouse_title: rows[index].SPOUSE_TITLE !== undefined ? rows[index].SPOUSE_TITLE : null,
                spouse_name: rows[index].SPOUSE_NAME !== undefined ? rows[index].SPOUSE_NAME : null,
                nid: rows[index].NID !== undefined ? rows[index].NID : null,
                tin: rows[index].TIN !== undefined ? rows[index].TIN : null,
                date_of_birth: rows[index].DATE_OF_BIRTH !== undefined ? getJsDateFromExcel(rows[index].DATE_OF_BIRTH) : null,
                gender: rows[index].GENDER !== undefined ? rows[index].GENDER : null,
                district_of_birth: rows[index].DISTRICT_OF_BIRTH !== undefined ? rows[index].DISTRICT_OF_BIRTH : null,
                country_of_birth: rows[index].COUNTRY_OF_BIRTH !== undefined ? rows[index].COUNTRY_OF_BIRTH : null,
                permanent_district: rows[index].PERMANENT_DISTRICT !== undefined ? rows[index].PERMANENT_DISTRICT : null,
                permanent_street_name_and_number: rows[index].PERMANENT_STREET_NAME_AND_NUMBER !== undefined ? rows[index].PERMANENT_STREET_NAME_AND_NUMBER : null,
                permanent_postal_code: rows[index].PERMANENT_POSTAL_CODE !== undefined ? rows[index].PERMANENT_POSTAL_CODE : null,
                permanent_country: rows[index].PERMANENT_COUNTRY !== undefined ? rows[index].PERMANENT_COUNTRY : null,
                present_district: rows[index].PRESENT_DISTRICT !== undefined ? rows[index].PRESENT_DISTRICT : null,
                present_street_name_and_number: rows[index].PRESENT_STREET_NAME_AND_NUMBER !== undefined ? rows[index].PRESENT_STREET_NAME_AND_NUMBER : null,
                present_postal_code: rows[index].PRESENT_POSTAL_CODE !== undefined ? rows[index].PRESENT_POSTAL_CODE : null,
                present_country: rows[index].PRESENT_COUNTRY !== undefined ? rows[index].PRESENT_COUNTRY : null,
                id_type: rows[index].ID_TYPE !== undefined ? rows[index].ID_TYPE : null,
                id_number: rows[index].ID_NUMBER !== undefined ? rows[index].ID_NUMBER : null,
                id_issue_date: rows[index].ID_ISSUE_DATE !== undefined ? getJsDateFromExcel(rows[index].ID_ISSUE_DATE) : null,
                id_issue_country: rows[index].ID_ISSUE_COUNTRY !== undefined ? rows[index].ID_ISSUE_COUNTRY : null,
                sector_type: rows[index].SECTOR_TYPE !== undefined ? rows[index].SECTOR_TYPE : null,
                sector_code: rows[index].SECTOR_CODE !== undefined ? rows[index].SECTOR_CODE : null,
                telephone_number: rows[index].TELEPHONE_NUMBER !== undefined ? rows[index].TELEPHONE_NUMBER : null,
                data_source: rows[index].DATA_SOURCE !== undefined ? rows[index].DATA_SOURCE : null,
                ref_no: rows[index].REF_NO !== undefined ? rows[index].REF_NO : null,
                applicant_type: rows[index].APPLICANT_TYPE !== undefined ? rows[index].APPLICANT_TYPE : null,
                remarks: rows[index].REMARKS !== undefined ? rows[index].REMARKS : null,
                ekycresultid: rows[index].EKYCRESULTID !== undefined ? rows[index].EKYCRESULTID : null,
                trackingno: rows[index].TRACKINGNO !== undefined ? rows[index].TRACKINGNO : null,
                mobileno: rows[index].MOBILENO !== undefined ? rows[index].MOBILENO : null,
                fullnamebn: rows[index].FULLNAMEBN !== undefined ? rows[index].FULLNAMEBN : null,
                mothernamebn: rows[index].MOTHERNAMEBN !== undefined ? rows[index].MOTHERNAMEBN : null,
                fathernamebn: rows[index].FATHERNAMEBN !== undefined ? rows[index].FATHERNAMEBN : null,
                permanentaddressbn: rows[index].PERMANENTADDRESSBN !== undefined ? rows[index].PERMANENTADDRESSBN : null,
                facematchscorerpa: rows[index].FACEMATCHSCORERPA !== undefined ? rows[index].FACEMATCHSCORERPA : null,
                makeby: rows[index].MAKEBY !== undefined ? rows[index].MAKEBY : null,
                makedate: rows[index].MAKEDATE !== undefined ? getJsDateFromExcel(rows[index].MAKEDATE) : null,
                isverified: rows[index].ISVERIFIED !== undefined ? rows[index].ISVERIFIED : null,
                created_by: parseInt(req.user_id)
              };

              const insertRetailerEkycInfo = await trx("APSISIPDC.cr_retailer_kyc_information").insert(retailerEkycData).returning("id");

              if (rows[index].ISVERIFIED !== undefined) {
                ++insert_count;
                const retailerEkycHistory = {
                  retailer_id: retailerInfo.id,
                  retailer_code: retailer_code,
                  kyc_id: parseInt(insertRetailerEkycInfo[0]),
                  kyc_date: rows[index].MAKEDATE !== undefined ? getJsDateFromExcel(rows[index].MAKEDATE) : null,
                  kyc_time: rows[index].MAKEDATE !== undefined ? getJsDateFromExcel(rows[index].MAKEDATE) : null,
                  kyc_status: ((rows[index].ISVERIFIED).toLowerCase() == 'yes') ? 'Active' : 'Inactive',
                  start_date: new Date(),
                  end_date: new Date(await getDateAfterDays(365)), // as Kyc validity will be one year from upload date
                  kyc_done_by: rows[index].MAKEBY !== undefined ? rows[index].MAKEBY : null,
                  created_by: parseInt(req.user_id)
                }
                const insertRetailerEkycHistory = await trx("APSISIPDC.cr_retailer_kyc_history").insert(retailerEkycHistory);
                if (insertRetailerEkycHistory == true) {
                  if ((rows[index].ISVERIFIED).toLowerCase() == 'yes') {
                    let retailerEkycUpdate = await trx("APSISIPDC.cr_retailer")
                      .where({ id: retailerInfo.id })
                      .update({
                        kyc_status: 1,
                        kyc_id: insertRetailerEkycInfo[0]
                      });
                  } else {
                    let retailerEkycUpdate = await trx("APSISIPDC.cr_retailer")
                      .where({ id: retailerInfo.id })
                      .update({
                        kyc_status: 0
                      });
                  }
                }
              }
            }
          }
          if (parseInt(insert_count) !== 0) {
            const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
            const insertLog = {
              bulk_upload_date: new Date(date),
              file_name: filename,
              file_for: req.file_for,
              file_path: `public/configuration_file/${req.file_for}`,
              file_found_rows: Object.keys(rows).length,
              file_upload_rows: parseInt(insert_count),
              created_by: parseInt(req.user_id)
            };
            const uploadLog = await trx("APSISIPDC.cr_retailer_upload_log").insert(insertLog);
            if (uploadLog == true) {
              resolve(sendApiResult(true, "Ekyc File Uploaded successfully!"));
            }
          } else {
            resolve(sendApiResult(true, "No Valid Retailer Info Found in your Uploaded File."));
          }
        }
        if (Object.keys(rows).length === 0) {
          reject(sendApiResult(false, "No Rows Found in your Uploaded File."));
        }
      })
        .then((result) => {
          //
        })
        .catch((error) => {
          reject(sendApiResult(false, error.message));
        });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  }).catch((error) => {
    console.log(error);
  });
};

const getDateAfterDays = async function (days) {
  let newDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return newDate;
};

Retailer.uploadRetailerCibFile = function (rows, filename, req) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        let msg;
        const folderName = req.file_for;
        if (Object.keys(rows).length !== 0) {
          let insert_count = 0;
          for (let index = 0; index < rows.length; index++) {
            let retailer_code = rows[index].Ref_No;
            const retailerInfo = await trx("APSISIPDC.cr_retailer")
              .select("id")
              .where("retailer_code", retailer_code)
              .whereNot("kyc_status", null)
              .where("cib_status", null)
              .where("activation_status", "Inactive")
              .where("status", "Active")
              .first();

            if (retailerInfo != undefined && retailerInfo.id != undefined) {
              const retailerCibData = {
                retailer_id: retailerInfo.id,
                retailer_code: retailer_code,
                subject_code: rows[index].Subject_Code !== undefined ? rows[index].Subject_Code : null,
                classification: rows[index].Classification !== undefined ? rows[index].Classification : null,
                ref_no: rows[index].Ref_No !== undefined ? rows[index].Ref_No : null,
                title: rows[index].Title !== undefined ? rows[index].Title : null,
                name: rows[index].Name !== undefined ? rows[index].Name : null,
                father_title: rows[index].Father_Title !== undefined ? rows[index].Father_Title : null,
                father_name: rows[index].Fathers_Name !== undefined ? rows[index].Fathers_Name : null,
                mother_title: rows[index].Mother_Title !== undefined ? rows[index].Mother_Title : null,
                mother_name: rows[index].Mothers_Name !== undefined ? rows[index].Mothers_Name : null,
                spouse_title: rows[index].Spouse_Title !== undefined ? rows[index].Spouse_Title : null,
                spouse_name: rows[index].Spouse_Name !== undefined ? rows[index].Spouse_Name : null,
                nid: rows[index].NID !== undefined ? rows[index].NID : null,
                tin: rows[index].TIN !== undefined ? rows[index].TIN : null,
                country: rows[index].Country !== undefined ? rows[index].Country : null,
                dob: rows[index].DOB !== undefined ? getJsDateFromExcel(rows[index].DOB) : null,
                gender: rows[index].Gender !== undefined ? rows[index].Gender : null,
                district_of_birth: rows[index].District_Of_Birth !== undefined ? rows[index].District_Of_Birth : null,
                country_of_birth: rows[index].Country_Of_Birth !== undefined ? rows[index].Country_Of_Birth : null,
                permanent_district: rows[index].Permanent_District !== undefined ? rows[index].Permanent_District : null,
                permanent_street_name_and_number: rows[index].Permanent_Street_Name_And_Number !== undefined ? rows[index].Permanent_Street_Name_And_Number : null,
                permanent_postal_code: rows[index].Permanent_Postal_Code !== undefined ? rows[index].Permanent_Postal_Code : null,
                permanent_country: rows[index].Permanent_Country !== undefined ? rows[index].Permanent_Country : null,
                present_district: rows[index].Present_District !== undefined ? rows[index].Present_District : null,
                present_street_name_and_number: rows[index].Present_Street_Name_And_Number !== undefined ? rows[index].Present_Street_Name_And_Number : null,
                present_postal_code: rows[index].Present_Postal_Code !== undefined ? rows[index].Present_Postal_Code : null,
                present_country: rows[index].Present_Country !== undefined ? rows[index].Present_Country : null,
                subject_role: rows[index].Subject_Role !== undefined ? rows[index].Subject_Role : null,
                id_number: rows[index].ID_NUMBER !== undefined ? rows[index].ID_NUMBER : null,
                type_of_financing: rows[index].Type_Of_Financing !== undefined ? rows[index].Type_Of_Financing : null,
                number_of_installment: rows[index].Number_Of_Installment !== undefined ? parseInt(rows[index].Number_Of_Installment) : null,
                installment_amount: rows[index].Installment_Amount !== undefined ? parseInt(rows[index].Installment_Amount) : null,
                total_requested_amount: rows[index].Total_Requested_Amount !== undefined ? parseInt(rows[index].Total_Requested_Amount) : null,
                periodicity_of_payment: rows[index].Periodicity_Of_Payment !== undefined ? rows[index].Periodicity_Of_Payment : null,
                id_type: rows[index].ID_Type !== undefined ? rows[index].ID_Type : null,
                id_number: rows[index].ID_Number !== undefined ? rows[index].ID_Number : null,
                id_issue_date: rows[index].ID_Issue_Date !== undefined ? getJsDateFromExcel(rows[index].ID_Issue_Date) : null,
                id_issue_country: rows[index].ID_Issue_Country !== undefined ? rows[index].ID_Issue_Country : null,
                sector_type: rows[index].Sector_Type !== undefined ? rows[index].Sector_Type : null,
                sector_code: rows[index].Sector_Code !== undefined ? rows[index].Sector_Code : null,
                telephone_number: rows[index].Telephone_Number !== undefined ? rows[index].Telephone_Number : null,
                remarks: rows[index].Remarks !== undefined ? rows[index].Remarks : null,
                cib_created_by: rows[index].Created_By !== undefined ? rows[index].Created_By : null,
                cib_created_date: rows[index].Created_Date !== undefined ? getJsDateFromExcel(rows[index].Created_Date) : null,
                downloaded_by: rows[index].Downloaded_By !== undefined ? rows[index].Downloaded_By : null,
                downloaded_date: rows[index].Downloaded_Date !== undefined ? getJsDateFromExcel(rows[index].Downloaded_Date) : null,
                ref_type: rows[index].Ref_Type !== undefined ? rows[index].Ref_Type : null,
                total_outstanding_bdt: rows[index].Total_Outstanding_BDT !== undefined ? rows[index].Total_Outstanding_BDT : null,
                overdue_amount_bdt: rows[index].Overdue_Amount_BDT !== undefined ? rows[index].Overdue_Amount_BDT : null,
                default_history: rows[index].Default_History !== undefined ? rows[index].Default_History : null,
                status: rows[index].Status !== undefined ? rows[index].Status : null
              };

              const insertRetailerCibInfo = await trx("APSISIPDC.cr_retailer_cib_information").insert(retailerCibData).returning("id");

              if (insertRetailerCibInfo) {
                ++insert_count;
                const retailerCibHistory = {
                  retailer_id: retailerInfo.id,
                  retailer_code: retailer_code,
                  cib_id: parseInt(insertRetailerCibInfo[0]),
                  cib_date: rows[index].Created_Date !== undefined ? getJsDateFromExcel(rows[index].Created_Date) : null,
                  cib_status: ((rows[index].Default_History).toLowerCase() == 'yes') ? 'Active' : 'Inactive',
                  start_date: new Date(),
                  end_date: new Date(await getDateAfterDays(365)), // as CIB validity will be one year from upload date
                  cib_done_by: rows[index].Downloaded_By !== undefined ? rows[index].Downloaded_By : null,
                  created_by: parseInt(req.user_id)
                }
                const insertRetailerCibHistory = await trx("APSISIPDC.cr_retailer_cib_history").insert(retailerCibHistory);
                if (insertRetailerCibHistory == true) {
                  let retailerCibUpdate = await trx("APSISIPDC.cr_retailer")
                    .where({ id: retailerInfo.id })
                    .update({
                      cib_status: 1,
                      cib_id: insertRetailerCibInfo[0]
                    });
                }
              }
            }
          }
          if (parseInt(insert_count) !== 0) {
            const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
            const insertLog = {
              bulk_upload_date: new Date(date),
              file_name: filename,
              file_for: req.file_for,
              file_path: `public/configuration_file/${req.file_for}`,
              file_found_rows: Object.keys(rows).length,
              file_upload_rows: parseInt(insert_count),
              created_by: parseInt(req.user_id)
            };
            const uploadLog = await trx("APSISIPDC.cr_retailer_upload_log").insert(insertLog);
            if (uploadLog == true) {
              resolve(sendApiResult(true, "CIB File Uploaded successfully!"));
            }
          } else {
            resolve(sendApiResult(true, "No Valid Retailer Info Found in your Uploaded File."));
          }
        }
        if (Object.keys(rows).length === 0) {
          resolve(sendApiResult(false, "No Rows Found in your Uploaded File."));
        }
      })
        .then((result) => {
          //
        })
        .catch((error) => {
          reject(sendApiResult(false, error.message));
        });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  }).catch((error) => {
    console.log(error, 'Promise error');
  });
};

Retailer.retailerUploadList = function (req) {
  const { page, per_page } = req.query;
  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_retailer_upload_log")
        .whereNot("cr_retailer_upload_log.retailer_upload_id", null)
        .where("cr_retailer_upload_log.file_for", "retailer_onboarding")
        .select(
          "cr_retailer_upload_log.retailer_upload_id",
          knex.raw('TO_CHAR("cr_retailer_upload_log"."bulk_upload_date", \'YYYY-MM-DD\') AS bulk_upload_date'),
          knex.raw(`CASE "cr_retailer_upload_log"."eligibility_check_status" WHEN 0 THEN 'No' WHEN 1 THEN 'Yes' END AS "eligibility_check"`),
          "cr_retailer_upload_log.eligibility_check_status",
          "cr_retailer_upload_log.file_path",
          "cr_retailer_upload_log.file_name",
          "cr_retailer_upload_log.file_found_rows",
          "cr_retailer_upload_log.file_upload_rows",
          "cr_retailer_upload_log.count_eligibility",
          "cr_retailer_upload_log.count_ineligible",
          "cr_users.name AS uploaded_by"
        )
        .innerJoin(
          "APSISIPDC.cr_users",
          "cr_users.id",
          "cr_retailer_upload_log.created_by"
        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (data == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendApiResult(true, "Retailer Upload List fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

Retailer.retailerListExcelDownload = function (req) {
  return new Promise(async (resolve, reject) => {
    const result = await knex("APSISIPDC.cr_retailer")
      .where(function () {
        this.where("cr_retailer.retailer_upload_id", req.retailer_upload_id);
        if (req.download_for == 'eligible') {
          // this.whereIn("cr_retailer.kyc_status", [null, 0, 1]);
          // this.whereIn("cr_retailer.cib_status", [null, 0, 1]);
        }
        if (req.download_for == 'kyc') {
          this.where("cr_retailer.kyc_status", 1);
        }
        if (req.download_for == 'cib') {
          this.where("cr_retailer.cib_status", 1);
        }
      })
      .select(
        "cr_retailer.retailer_name",
        "cr_retailer.retailer_nid",
        "cr_retailer.phone",
        "cr_retailer.retailer_code",
        "cr_retailer_type.name AS type_name",
        "cr_retailer_type_entity.name AS entity_name",
        "cr_retailer.ac_number_1rn",
        "cr_retailer.retailer_tin",
        "cr_retailer.corporate_registration_no",
        "cr_retailer.trade_license_no",
        "cr_retailer.outlet_address",
        "cr_retailer.autho_rep_full_name",
        "cr_retailer.autho_rep_phone",
        "cr_retailer.autho_rep_nid",
        "cr_retailer.duration_sales_data",
        knex.raw(`CASE "cr_retailer"."kyc_status" WHEN NULL THEN 'N/A' WHEN 0 THEN 'Failed' WHEN 1 THEN 'Success' END AS "kyc_status"`),
        knex.raw(`CASE "cr_retailer"."cib_status" WHEN NULL THEN 'N/A' WHEN 0 THEN 'Failed' WHEN 1 THEN 'Success' END AS "cib_status"`),
        "cr_retailer.activation_status AS status"
      )
      .innerJoin(
        "APSISIPDC.cr_retailer_type",
        "cr_retailer_type.id",
        "cr_retailer.retailer_type"
      )
      .innerJoin(
        "APSISIPDC.cr_retailer_type_entity",
        "cr_retailer_type_entity.id",
        "cr_retailer.type_of_entity"
      );

    if (result.length == 0) {
      reject(sendApiResult(false, "No " + (req.download_for).toUpperCase() + " Retailer list Found."));
    } else {
      const today = moment(new Date()).format('YYYY-MM-DD');
      var workbook = new excel.Workbook();
      var worksheet = workbook.addWorksheet((req.download_for).toUpperCase() + " Retailer List");
      var headerStyle = workbook.createStyle({
        fill: {
          type: "pattern",
          patternType: "solid",
          bgColor: "#E1F0FF",
          fgColor: "#E1F0FF"
        },
        font: {
          color: "#000000",
          size: "10",
          bold: true
        }
      });

      var headers = [
        "Sr.",
        "Retailer Name",
        "Retailer NID",
        "Retailer Phone",
        "Retailer Code",
        "Retailer Type",
        "Retailer Entity Type",
        "Retailer 1RN",
        "Retailer TIN",
        "Corporate Registration No",
        "Trade License No",
        "Outlet Address",
        "Name of Authorized Representative",
        "Phone No of Authorized Representative",
        "NID No of Authorized Representative",
        "Duration Sales Data",
        "KYC Status",
        "CIB Status",
        "Status"
      ];

      var col = 1;
      var row = 1;
      var col_add = 0;

      headers.forEach((e) => {
        worksheet
          .cell(row, col + col_add)
          .string(e)
          .style(headerStyle);
        col_add++;
      });

      row = 2;
      for (let i = 0; i < result.length; i++) {
        var col_add = 0;
        let e = result[i];
        worksheet.cell(row, col + col_add).number((i + 1));
        col_add++;
        worksheet.cell(row, col + col_add).string(e.retailer_name ? e.retailer_name : "");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.retailer_nid ? e.retailer_nid : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.phone ? e.phone : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.retailer_code ? e.retailer_code : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.type_name ? e.type_name : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.entity_name ? e.entity_name : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.ac_number_1rn ? e.ac_number_1rn : "");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.retailer_tin ? e.retailer_tin : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.corporate_registration_no ? e.corporate_registration_no : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.trade_license_no ? e.trade_license_no : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.outlet_address ? e.outlet_address : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.autho_rep_full_name ? e.autho_rep_full_name : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.autho_rep_phone ? e.autho_rep_phone : "");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.autho_rep_nid ? e.autho_rep_nid : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.duration_sales_data ? e.duration_sales_data : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.kyc_status ? e.kyc_status : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.cib_status ? e.cib_status : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.status ? e.status : "");
        col_add++;
        row++;
      }
      const file_path = 'public/retailer/';
      if (!fs.existsSync(file_path)) {
        fs.mkdirSync(file_path, { recursive: true });
      }
      workbook.write(file_path + (req.download_for).toUpperCase() + " Retailer List (" + today + ").xlsx");
      const fileName = "retailer/" + (req.download_for).toUpperCase() + " Retailer List (" + today + ").xlsx";
      await timeout(1500);
      resolve(sendApiResult(true, (req.download_for).toUpperCase() + " Retailer List Download", fileName));
    }
  })
}

Retailer.retailerIneligibleExcelDownload = function (req) {

  const { retailer_upload_id } = req.query;
  return new Promise(async (resolve, reject) => {
    const result = await knex("APSISIPDC.cr_retailer_temp")
      .select()
      .where("retailer_upload_id", retailer_upload_id)
      .where("eligibility_status", "Failed");

    if (result.length == 0) {
      reject(sendApiResult(false, "No Ineligible Retailer list Found."));
    } else {
      const today = moment(new Date()).format('YYYY-MM-DD');
      var workbook = new excel.Workbook();
      var worksheet = workbook.addWorksheet(("Retailer Ineligible List"));
      var headerStyle = workbook.createStyle({
        fill: {
          type: "pattern",
          patternType: "solid",
          bgColor: "#E1F0FF",
          fgColor: "#E1F0FF"
        },
        font: {
          color: "#000000",
          size: "10",
          bold: true
        }
      });

      var headers = [
        "Sr.",
        "Retailer Name",
        "Retailer NID",
        "Retailer Phone",
        "Retailer Email",
        "Retailer Type",
        "Retailer Entity Type",
        "Retailer Code",
        "Manufacturer",
        "Distributor Code",
        "Retailer TIN",
        "Corporate Registration No",
        "Trade License No",
        "Outlet Address",
        "Outlet Address 1",
        "Outlet Address 2",
        "Postal Code",
        "Post Office",
        "Thana",
        "District",
        "Division",
        "Name of Authorized Representative",
        "NID No of Authorized Representative",
        "Phone No of Authorized Representative",
        "Duration Sales Data",
        "Scheme ID",
        "Month 1",
        "Month 2",
        "Month 3",
        "Month 4",
        "Month 5",
        "Month 6",
        "Month 7",
        "Month 8",
        "Month 9",
        "Month 10",
        "Month 11",
        "Month 12",
        "Eligibility Status",
        "Reason",
        "Created At",
        "Sales Agent ID"
      ];

      var col = 1;
      var row = 1;
      var col_add = 0;

      headers.forEach((e) => {
        worksheet
          .cell(row, col + col_add)
          .string(e)
          .style(headerStyle);
        col_add++;
      });

      row = 2;
      for (let i = 0; i < result.length; i++) {
        var col_add = 0;
        let e = result[i];
        worksheet.cell(row, col + col_add).number((i + 1));
        col_add++;
        worksheet.cell(row, col + col_add).string(e.retailer_name ? e.retailer_name : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.retailer_nid ? retailer_nid : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.phone ? e.phone : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.email ? e.email : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.retailer_type ? e.retailer_type : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.type_of_entity ? e.type_of_entity : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.retailer_code ? e.retailer_code : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.manufacturer ? e.manufacturer : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.distributor_code ? e.distributor_code : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.retailer_tin ? e.retailer_tin : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.corporate_registration_no ? e.corporate_registration_no : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.trade_license_no ? e.trade_license_no : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.outlet_address ? e.outlet_address : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.outlet_address_1 ? e.outlet_address_1 : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.outlet_address_2 ? e.outlet_address_2 : "");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.postal_code ? e.postal_code : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.post_office ? e.post_office : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.thana ? e.thana : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.district ? e.district : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.division ? e.division : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.autho_rep_full_name ? e.autho_rep_full_name : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.autho_rep_nid ? autho_rep_nid : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.autho_rep_phone ? e.autho_rep_phone : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.duration_sales_data ? e.duration_sales_data : "");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.scheme_id ? e.scheme_id : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.month_1 ? e.month_1 : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.month_2 ? e.month_2 : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.month_3 ? e.month_3 : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.month_4 ? e.month_4 : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.month_5 ? e.month_5 : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.month_6 ? e.month_6 : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.month_7 ? e.month_7 : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.month_8 ? e.month_8 : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.month_9 ? e.month_9 : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.month_10 ? e.month_10 : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.month_11 ? e.month_11 : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.month_12 ? e.month_12 : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.eligibility_status ? e.eligibility_status : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.reason ? e.reason : "");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.created_by ? e.created_by : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.sales_agent_id ? e.sales_agent_id : 0);
        col_add++;
        row++;
      }
      const file_path = 'public/retailer/';
      if (!fs.existsSync(file_path)) {
        fs.mkdirSync(file_path, { recursive: true });
      }
      await knex("APSISIPDC.cr_retailer_temp").del()
        .where("retailer_upload_id", retailer_upload_id)
        .where("eligibility_status", "Failed");
      workbook.write(file_path + "Retailer_Ineligible_List(" + today + ").xlsx");
      const fileName = "./retailer/" + "Retailer_Ineligible_List(" + today + ").xlsx";
      await timeout(1500);
      resolve(sendApiResult(true, " Retailer Ineligible List Download", fileName));
    }
  })
}

Retailer.getRetailerDistrict = function (req) {

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_retailer")
        .select(
          "district"
        )
        .distinct();
      if (data == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

Retailer.RetailersMonthlyReport = async (req, res) => {
  return new Promise(async (resolve, reject) => {
    const { month, distributor_id, manufacturer_id, district, page, per_page } = req.query;
    try {
      const filter_report_data = await knex("APSISIPDC.cr_retailer")
        .leftJoin(
          "APSISIPDC.cr_retailer_manu_scheme_mapping",
          "cr_retailer_manu_scheme_mapping.retailer_id",
          "cr_retailer.id"
        )
        .leftJoin(
          "APSISIPDC.cr_manufacturer",
          "cr_manufacturer.id",
          "cr_retailer_manu_scheme_mapping.manufacturer_id"
        )
        .leftJoin(
          "APSISIPDC.cr_distributor",
          "cr_distributor.id",
          "cr_retailer_manu_scheme_mapping.distributor_id"
        )
        .leftJoin(
          "APSISIPDC.cr_retailer_loan_calculation",
          "cr_retailer.id",
          "cr_retailer_loan_calculation.retailer_id"
        )
        .where(function () {
          if (district) {
            this.where("cr_retailer.district", district)
          }
          if (manufacturer_id) {
            this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
          }
          if (distributor_id) {
            this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
          }
          if (month) {
            const monthNum = parseInt(month);
            const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
            const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
          }
        })
        .select(
          "cr_retailer_loan_calculation.onermn_acc"
        ).distinct();

      const retailer_performance_info_Arr = [];

      for (let i = 0; i < filter_report_data.length; i++) {
        const disbursement_amount = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .sum("cr_retailer_loan_calculation.disburshment as total_disbursement_amount")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const repayment_amount = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .sum("cr_retailer_loan_calculation.repayment as total_repayment_amount")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const transaction_cost = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .sum("cr_retailer_loan_calculation.transaction_cost as total_transaction_cost")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_outstanding_amount = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .select("cr_retailer_loan_calculation.total_outstanding")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .orderBy("cr_retailer_loan_calculation.id", "desc")
          .first()
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const retailer_info = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .select(
            "cr_retailer.retailer_name",
            "cr_retailer.retailer_code",
            "cr_retailer.district",
            "cr_manufacturer.manufacturer_name",
            "cr_distributor.distributor_name",
            "cr_retailer_manu_scheme_mapping.crm_approve_limit",
            "cr_retailer_loan_calculation.onermn_acc",
          )
          .distinct()
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_amount_transaction_done = disbursement_amount[0].total_disbursement_amount + repayment_amount[0].total_repayment_amount;

        const retailer_performance_info = {
          total_disbursement_amount: disbursement_amount[0].total_disbursement_amount,
          total_repayment_amount: repayment_amount[0].total_repayment_amount,
          total_outstanding: total_outstanding_amount.total_outstanding,
          total_amount_transaction_done: total_amount_transaction_done,
          total_transaction_cost: transaction_cost[0].total_transaction_cost,
          retailer_name: retailer_info[0].retailer_name,
          retailer_code: retailer_info[0].retailer_code,
          district: retailer_info[0].district,
          manufacturer_name: retailer_info[0].manufacturer_name,
          distributor_name: retailer_info[0].distributor_name,
          crm_approve_limit: retailer_info[0].crm_approve_limit,
          onermn_acc: retailer_info[0].onermn_acc
        }

        retailer_performance_info_Arr.push(retailer_performance_info);
      }

      if (retailer_performance_info_Arr == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendApiResult(true, "Data filter successfully", retailer_performance_info_Arr));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }

  });
};

Retailer.generateRetailerOutstandingReport = async (req, res) => {
  const previousMonthStartDate = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
  const previousMonthEndDate = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
  try {
    const limit_data = await knex("APSISIPDC.cr_retailer")
      .leftJoin(
        "APSISIPDC.cr_retailer_kyc_information",
        "cr_retailer_kyc_information.retailer_id",
        "cr_retailer.id"
      )
      .leftJoin(
        "APSISIPDC.cr_retailer_manu_scheme_mapping",
        "cr_retailer_manu_scheme_mapping.retailer_id",
        "cr_retailer.id"
      )
      .leftJoin(
        "APSISIPDC.cr_distributor",
        "cr_distributor.id",
        "cr_retailer_manu_scheme_mapping.distributor_id"
      )
      .whereRaw(`"cr_retailer"."created_at" >= TO_DATE('${previousMonthStartDate}', 'YYYY-MM-DD')`)
      .whereRaw(`"cr_retailer"."created_at" <= TO_DATE('${previousMonthEndDate}', 'YYYY-MM-DD')`)
      .select(
        "cr_retailer.retailer_code",
        "cr_retailer.ac_number_1rn",
        "cr_retailer.created_at",
        "cr_retailer_kyc_information.title",
        "cr_retailer_kyc_information.name",
        "cr_retailer_kyc_information.father_title",
        "cr_retailer_kyc_information.father_name",
        "cr_retailer_kyc_information.mother_title",
        "cr_retailer_kyc_information.mother_name",
        "cr_retailer_kyc_information.spouse_title",
        "cr_retailer_kyc_information.spouse_name",
        "cr_retailer_kyc_information.gender",
        "cr_retailer_kyc_information.date_of_birth",
        "cr_retailer_kyc_information.district_of_birth",
        "cr_retailer_kyc_information.country_of_birth",
        "cr_retailer_kyc_information.nid",
        "cr_retailer_kyc_information.tin",
        "cr_retailer_kyc_information.permanent_street_name_and_number",
        "cr_retailer_kyc_information.permanent_postal_code",
        "cr_retailer_kyc_information.permanent_district",
        "cr_retailer_kyc_information.permanent_country",
        "cr_retailer_kyc_information.present_street_name_and_number",
        "cr_retailer_kyc_information.present_postal_code",
        "cr_retailer_kyc_information.present_district",
        "cr_retailer_kyc_information.present_country",
        "cr_retailer_kyc_information.telephone_number",
        "cr_retailer_kyc_information.sector_code",
        "cr_distributor.distributor_name"
      );
    const headers = [
      "Sr.",
      "Retailer_Code",
      "Master Loan Account Number",
      "Client ID",
      "Branch",
      "Title",
      "Name",
      "Father_Title",
      "Father_Name",
      "Mother_Title",
      "Mother_Name",
      "Spouse_Title",
      "Spouse_Name",
      "Gender",
      "Date_of_Birth",
      "Birth_District",
      "Birth_Country",
      "NID",
      "TIN_Number",
      "Permanent_Address",
      "Permanent_Address_Post_Code",
      "Permanent_Address_District",
      "Country_of_Permanent_Address",
      "Business_Address",
      "Business_Address_Code",
      "Business_Address_District",
      "Country_of_Business",
      "Phone",
      "Distributor Name",
      "Point Name",
      "Limit",
      "Open Date",
      "Expiry Date"
    ];
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Individual Report (Monthly)");
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
        .string(e.retailer_code ? e.retailer_code : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.ac_number_1rn ? e.ac_number_1rn : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.client_id ? e.client_id : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.branch ? e.branch : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.title ? e.title : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.name ? e.name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.father_title ? e.father_title : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.father_name ? e.father_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.mother_title ? e.mother_title : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.mother_name ? e.mother_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.spouse_title ? e.spouse_title : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.spouse_name ? e.spouse_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.gender ? e.gender : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.date_of_birth ? e.date_of_birth.toString() : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.district_of_birth ? e.district_of_birth : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.country_of_birth ? e.country_of_birth : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .number(e.nid ? e.nid : 0);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .number(e.tin ? e.tin : 0);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.permanent_street_name_and_number ? e.permanent_street_name_and_number : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .number(e.permanent_postal_code ? e.permanent_postal_code : 0);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.permanent_district ? e.permanent_district : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.permanent_country ? e.permanent_country : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.present_street_name_and_number ? e.present_street_name_and_number : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .number(e.present_postal_code ? e.present_postal_code : 0);
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.present_district ? e.present_district : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.present_country ? e.present_country : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.telephone_number ? e.telephone_number : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.distributor_name ? e.distributor_name : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.sector_code ? e.sector_code : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.limit ? e.limit : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.created_at ? e.created_at.toString() : "");
      col_add++;
      worksheet
        .cell(row, col + col_add)
        .string(e.expiry_date ? e.expiry_date.toString() : "");
      col_add++;
      // worksheet.cell(row, col + col_add).number(0);
      // col_add++;
      row++;
    }
    await workbook.write("public/reports_retailer/retailer_comprehensive_reports.xlsx");
    const fileName = "./reports_retailer/retailer_comprehensive_reports.xlsx";
    setTimeout(() => {
      res.send(sendApiResult(true, "File Generated", fileName));
    }, 1500);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
}

Retailer.generateRetailersMonthlyReport = async (req, res) => {
  return new Promise(async (resolve, reject) => {

    const { month, distributor_id, manufacturer_id, district, page, per_page } = req.query;
    try {
      const filter_report_data = await knex("APSISIPDC.cr_retailer")
        .leftJoin(
          "APSISIPDC.cr_retailer_manu_scheme_mapping",
          "cr_retailer_manu_scheme_mapping.retailer_id",
          "cr_retailer.id"
        )
        .leftJoin(
          "APSISIPDC.cr_manufacturer",
          "cr_manufacturer.id",
          "cr_retailer_manu_scheme_mapping.manufacturer_id"
        )
        .leftJoin(
          "APSISIPDC.cr_distributor",
          "cr_distributor.id",
          "cr_retailer_manu_scheme_mapping.distributor_id"
        )
        .leftJoin(
          "APSISIPDC.cr_retailer_loan_calculation",
          "cr_retailer.id",
          "cr_retailer_loan_calculation.retailer_id"
        )
        .where(function () {
          if (district) {
            this.where("cr_retailer.district", district)
          }
          if (manufacturer_id) {
            this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
          }
          if (distributor_id) {
            this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
          }
          if (month) {
            const monthNum = parseInt(month);
            const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
            const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
          }
        })
        .select(
          "cr_retailer_loan_calculation.onermn_acc"
        ).distinct();

      const retailer_performance_info_Arr = [];

      for (let i = 0; i < filter_report_data.length; i++) {
        const disbursement_amount = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .sum("cr_retailer_loan_calculation.disburshment as total_disbursement_amount")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const repayment_amount = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .sum("cr_retailer_loan_calculation.repayment as total_repayment_amount")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const transaction_cost = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .sum("cr_retailer_loan_calculation.transaction_cost as total_transaction_cost")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_outstanding_amount = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .select("cr_retailer_loan_calculation.total_outstanding")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .orderBy("cr_retailer_loan_calculation.id", "desc")
          .first()
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const retailer_info = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .select(
            "cr_retailer.retailer_name",
            "cr_retailer.retailer_code",
            "cr_retailer.district",
            "cr_manufacturer.manufacturer_name",
            "cr_distributor.distributor_name",
            "cr_retailer_manu_scheme_mapping.crm_approve_limit",
            "cr_retailer_loan_calculation.onermn_acc",
          )
          .distinct()
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });
        const total_amount_transaction_done = disbursement_amount[0].total_disbursement_amount + repayment_amount[0].total_repayment_amount;

        const retailer_performance_info = {
          total_disbursement_amount: disbursement_amount[0].total_disbursement_amount,
          total_repayment_amount: repayment_amount[0].total_repayment_amount,
          total_outstanding: total_outstanding_amount.total_outstanding,
          total_amount_transaction_done: total_amount_transaction_done,
          total_transaction_cost: transaction_cost[0].total_transaction_cost,
          retailer_name: retailer_info[0].retailer_name,
          retailer_code: retailer_info[0].retailer_code,
          district: retailer_info[0].district,
          manufacturer_name: retailer_info[0].manufacturer_name,
          distributor_name: retailer_info[0].distributor_name,
          crm_approve_limit: retailer_info[0].crm_approve_limit,
          onermn_acc: retailer_info[0].onermn_acc
        }

        retailer_performance_info_Arr.push(retailer_performance_info);
      }

      console.log(retailer_performance_info_Arr);
      const headers = [
        "Sr.",
        "Retailer_name",
        "Retailer code",
        "District",
        "Manufacturer_name",
        "Distributor_name",
        "Total_credit_limit",
        "No_of_orders_placed",
        "Total_transaction_cost",
        "Total_amount_of_loan_requested",
        "Total_outstanding_amount",
        "Total_amount_of_transaction_done",
        "Total_amount_of_repayment",
        "Total_amount_of_disbursement",
        "One RMN Account"
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
      for (let i = 0; i < retailer_performance_info_Arr.length; i++) {
        var col_add = 0;
        let e = retailer_performance_info_Arr[i];
        worksheet.cell(row, col + col_add).number(i + 1);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .string(e.retailer_name ? e.retailer_name : "");
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .string(e.retailer_code ? e.retailer_code : "");
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .string(e.district ? e.district : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.manufacturer_name ? e.manufacturer_name : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.distributor_name ? e.distributor_name : "");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.crm_approve_limit ? e.crm_approve_limit : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.no_of_orders_placed ? e.no_of_orders_placed : "-");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_transaction_cost ? e.total_transaction_cost : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.total_amount_of_loan_requested ? e.total_amount_of_loan_requested : "-");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_outstanding ? e.total_outstanding : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_amount_transaction_done ? e.total_amount_transaction_done : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_repayment_amount ? e.total_repayment_amount : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_disbursement_amount ? e.total_disbursement_amount : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.onermn_acc ? e.onermn_acc : "");
        col_add++;

        // worksheet.cell(row, col + col_add).number(0);
        // col_add++;
        row++;
      }
      await workbook.write("public/reports_retailer/retailer_monthly_reports.xlsx");
      const fileName = "./reports_retailer/retailer_monthly_reports.xlsx";
      setTimeout(() => {
        resolve(sendApiResult(true, "File Generated", fileName));
      }, 1500);
    } catch (error) {
      console.log(error);
      reject(sendApiResult(false, error.message));
    }
  });
};

//retailer-report-3
Retailer.generateRetailersLoanStatusReport = async (req, res) => {
  const { start_date, end_date } = req.query;
  const startDate = moment(start_date).startOf('date').format('YYYY-MM-DD');
  const endDate = moment(end_date).add(1, 'days').format('YYYY-MM-DD');

  return new Promise(async (resolve, reject) => {
    try {
      const onermn_acc_data = await knex("APSISIPDC.cr_retailer_loan_calculation")
        .where(function () {
          if (start_date && end_date) {
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${startDate}', 'YYYY-MM-DD')`)
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${endDate}', 'YYYY-MM-DD')`)
          }
        })
        .select(
          "cr_retailer_loan_calculation.onermn_acc"
        ).distinct();

      if (onermn_acc_data == 0) {
        reject(sendApiResult(false, "Account Number Not found between the date range"))
      }

      const retailer_loan_status_Arr = [];

      for (let i = 0; i < onermn_acc_data.length; i++) {
        const transaction_done = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .sum("cr_retailer_loan_calculation.disburshment as total_amount_transaction_done")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const repayment_amount = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .sum("cr_retailer_loan_calculation.repayment as total_repayment_amount")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const transaction_cost = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .sum("cr_retailer_loan_calculation.transaction_cost as total_transaction_cost")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_outstanding_amount = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .select("cr_retailer_loan_calculation.total_outstanding")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .orderBy("cr_retailer_loan_calculation.id", "desc")
          .first()
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const retailer_info = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_retailer_manu_scheme_mapping.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_loan_calculation",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id"
          )
          .select(
            "cr_retailer.retailer_name",
            "cr_retailer.retailer_code",
            "cr_retailer.district",
            "cr_manufacturer.manufacturer_name",
            "cr_distributor.distributor_name",
            "cr_retailer_manu_scheme_mapping.crm_approve_limit",
            "cr_retailer_loan_calculation.onermn_acc",
          )
          .distinct()
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where(function () {
            if (district) {
              this.where("cr_retailer.district", district)
            }
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment('2021-12-31').add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment('2021-12-31').add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${monthStartDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${monthEndDate}', 'YYYY-MM-DD')`)
            }
          });

        const retailer_performance_info = {
          total_amount_transaction_done: transaction_done[0].total_amount_transaction_done,
          total_repayment_amount: repayment_amount[0].total_repayment_amount,
          total_outstanding: total_outstanding_amount.total_outstanding,
          total_transaction_cost: transaction_cost[0].total_transaction_cost,
          retailer_name: retailer_info[0].retailer_name,
          retailer_code: retailer_info[0].retailer_code,
          district: retailer_info[0].district,
          manufacturer_name: retailer_info[0].manufacturer_name,
          distributor_name: retailer_info[0].distributor_name,
          crm_approve_limit: retailer_info[0].crm_approve_limit,
          onermn_acc: retailer_info[0].onermn_acc
        }

        retailer_performance_info_Arr.push(retailer_performance_info);
      }

      console.log(retailer_performance_info_Arr);
      const headers = [
        "Sr.",
        "Retailer_name",
        "Retailer code",
        "District",
        "Manufacturer_name",
        "Distributor_name",
        "Total_credit_limit",
        "No_of_orders_placed",
        "Total_transaction_cost",
        "Total_amount_of_loan_requested",
        "Total_outstanding_amount",
        "Total_amount_of_transaction_done",
        "Total_amount_of_repayment",
        "One RMN Account"
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
      for (let i = 0; i < retailer_performance_info_Arr.length; i++) {
        var col_add = 0;
        let e = retailer_performance_info_Arr[i];
        worksheet.cell(row, col + col_add).number(i + 1);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .string(e.retailer_name ? e.retailer_name : "");
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .string(e.retailer_code ? e.retailer_code : "");
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .string(e.district ? e.district : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.manufacturer_name ? e.manufacturer_name : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.distributor_name ? e.distributor_name : "");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.crm_approve_limit ? e.crm_approve_limit : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.no_of_orders_placed ? e.no_of_orders_placed : "-");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_transaction_cost ? e.total_transaction_cost : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.total_amount_of_loan_requested ? e.total_amount_of_loan_requested : "-");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_outstanding ? e.total_outstanding : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_amount_transaction_done ? e.total_amount_transaction_done : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_repayment_amount ? e.total_repayment_amount : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.onermn_acc ? e.onermn_acc : "");
        col_add++;

        // worksheet.cell(row, col + col_add).number(0);
        // col_add++;
        row++;
      }
      await workbook.write("public/reports_retailer/retailer_monthly_reports.xlsx");
      const fileName = "./reports_retailer/retailer_monthly_reports.xlsx";
      setTimeout(() => {
        resolve(sendApiResult(true, "File Generated", fileName));
      }, 1500);
    } catch (error) {
      console.log(error);
      reject(sendApiResult(false, error.message));
    }
  });
};

module.exports = Retailer;