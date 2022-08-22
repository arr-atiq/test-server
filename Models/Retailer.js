const moment = require("moment");
const excel = require('excel4node');
const fs = require('fs');
const { getJsDateFromExcel } = require("excel-date-to-js");
const { sendApiResult, ValidateNID, ValidatePhoneNumber, timeout, sendReportApiResult, retailerAvgByManufacturer } = require("../controllers/helperController");
const knex = require("../config/database");
const { getSchemeDetailsById } = require("../controllers/scheme");
const { creditLimit } = require("../controllers/credit_limit");
const Pdfmake = require("pdfmake");
const PDFMerger = require("pdf-merger-js");

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
              retailer_nid: rows[index].Retailer_NID !== undefined ? ((rows[index].Retailer_NID).length != 0 ? rows[index].Retailer_NID : rows[index].Retailer_Smart_NID) : null,
              retailer_smart_nid: rows[index].Retailer_Smart_NID !== undefined ? rows[index].Retailer_Smart_NID : null,
              phone: rows[index].Mobile_No_of_the_Retailer !== undefined ? rows[index].Mobile_No_of_the_Retailer : null,
              email: rows[index].Email !== undefined ? rows[index].Email : null,
              retailer_type: rows[index].Retailer_Type !== undefined ? rows[index].Retailer_Type : null,
              type_of_entity: rows[index].Entity_Type !== undefined ? rows[index].Entity_Type : null,
              retailer_code: rows[index].Retailer_Code !== undefined ? rows[index].Retailer_Code : null,
              onboarding: rows[index].Onboarding !== undefined ? rows[index].Onboarding : null,
              order_placement: rows[index].Order_Placement !== undefined ? rows[index].Order_Placement : null,
              repayment: rows[index].Repayment !== undefined ? rows[index].Repayment : null,
              manufacturer_id: rows[index].Corresponding_manufacturer_code !== undefined ? parseInt(rows[index].Corresponding_manufacturer_code) : null,
              distributor_code: rows[index].Corresponding_distributor_code !== undefined ? rows[index].Corresponding_distributor_code : null,
              retailer_tin: rows[index].Retailer_TIN !== undefined ? rows[index].Retailer_TIN : null,
              corporate_registration_no: rows[index].Retailer_Corporate_Registration_No !== undefined ? rows[index].Retailer_Corporate_Registration_No : null,
              trade_license_no: rows[index].Trade_License_No_of_Primary_Establishment !== undefined ? rows[index].Trade_License_No_of_Primary_Establishment : null,
              outlet_address: rows[index].Outlet_Address !== undefined ? rows[index].Outlet_Address : null,
              outlet_address_1: rows[index].Address_Line_1 !== undefined ? rows[index].Address_Line_1 : null,
              outlet_address_2: rows[index].Address_Line_2 !== undefined ? rows[index].Address_Line_2 : null,
              postal_code: rows[index].Outlet_Postal_Code !== undefined ? rows[index].Outlet_Postal_Code : null,
              post_office: rows[index].Outlet_Post_Office !== undefined ? rows[index].Outlet_Post_Office : null,
              thana: rows[index].Outlet_Thana !== undefined ? rows[index].Outlet_Thana : null,
              district: rows[index].Outlet_District !== undefined ? rows[index].Outlet_District : null,
              division: rows[index].Outlet_Division !== undefined ? rows[index].Outlet_Division : null,
              autho_rep_full_name: rows[index].Full_Name_of_Retailer_Authorized_Representative !== undefined ? rows[index].Full_Name_of_Retailer_Authorized_Representative : null,
              autho_rep_nid: rows[index].NID_of_Authorized_Representative !== undefined ? rows[index].NID_of_Authorized_Representative : null,
              autho_rep_phone: rows[index].Mobile_No_of_Representative !== undefined ? rows[index].Mobile_No_of_Representative : null,
              autho_rep_email: rows[index].Official_Email_of_Retailer_Representative !== undefined ? rows[index].Official_Email_of_Retailer_Representative : null,
              region_operation: rows[index].Region_of_Operation !== undefined ? rows[index].Region_of_Operation : null,
              place_of_birth: rows[index].Place_of_Birth !== undefined ? rows[index].Place_of_Birth : null,
              duration_sales_data: rows[index].Duration_of_Sales_Data_Submitted_in_Months !== undefined ? parseInt(rows[index].Duration_of_Sales_Data_Submitted_in_Months) : null,
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
        .leftJoin(
          "APSISIPDC.cr_retailer_manu_scheme_mapping",
          "cr_retailer_manu_scheme_mapping.retailer_id",
          "cr_retailer.id"
        )
        // .leftJoin(
        //   "APSISIPDC.cr_retailer_details_info",
        //   "cr_retailer_details_info.manu_scheme_mapping_id",
        //   "cr_retailer_manu_scheme_mapping.id"
        // )
        .where("cr_retailer.status", "Active")
        .select(
          "cr_retailer.id",
          "cr_retailer.master_r_number",
          "cr_retailer.retailer_name",
          "cr_retailer.retailer_nid",
          "cr_retailer.phone",
          "cr_retailer_manu_scheme_mapping.retailer_code",
          // "cr_retailer_details_info.retailer_tin",
          // "cr_retailer_details_info.corporate_registration_no",
          // "cr_retailer_details_info.trade_license_no",
          // "cr_retailer_details_info.outlet_address",
          // "cr_retailer_details_info.postal_code",
          // "cr_retailer_details_info.post_office",
          // "cr_retailer_details_info.thana",
          // "cr_retailer_details_info.district",
          // "cr_retailer_details_info.division",
          // "cr_retailer_details_info.autho_rep_full_name",
          // "cr_retailer_details_info.autho_rep_phone",
          // "cr_retailer_details_info.region_operation",
          knex.raw(`CASE "cr_retailer"."kyc_status" WHEN 1 THEN 'True' ELSE 'False' END AS "kyc_status"`),
          knex.raw(`CASE "cr_retailer_manu_scheme_mapping"."cib_status" WHEN 1 THEN 'True' ELSE 'False' END AS "cib_status"`),
        )
        .orderBy("cr_retailer.id", "desc")
        .distinct()
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

Retailer.checkRetailerDataValidity = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      knex.transaction(async (trx) => {
        const bulk_retailer_upload_log = await trx("APSISIPDC.cr_retailer_upload_log")
          .select("retailer_upload_id", "file_found_rows")
          .where("validity_check_status", 0)
          .where("validity_check_date", null)
          .where("eligibility_check_status", 0)
          .where("eligibility_check_date", null);

        if (Object.keys(bulk_retailer_upload_log).length != 0) {

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

          const retailer_fields_validation = await trx("APSISIPDC.cr_retailer_fields_validation")
            .select("field_name", "field_type", "operator", "field_length")
            .where("status", 'Active');

          const validation_array = {};
          for (const [key, value] of Object.entries(retailer_fields_validation)) {
            let temp = {};
            temp['type'] = value.field_type;
            temp['operator'] = value.operator;
            temp['length'] = value.field_length;
            validation_array[value.field_name] = temp;
          }

          for (const [index, log] of Object.entries(bulk_retailer_upload_log)) {
            const bulkRetailerInfoList = await trx("APSISIPDC.cr_retailer_temp")
              .select()
              .where("retailer_upload_id", log.retailer_upload_id)
              .where("reason", null);

            if (Object.keys(bulkRetailerInfoList).length != 0) {
              let eligibileOutletCount = 0, disqualifiedOutletCount = 0;
              for (const [key, value] of Object.entries(bulkRetailerInfoList)) {
                let disqualifiedReason = "";
                let validityCheck = await checkRetailerDataValidityByRow(value, validation_array);
                let eligibility_status = 'Valid';
                let is_valid = 1;
                if (Object.keys(validityCheck).length != 0) {
                  eligibility_status = "Invalid";
                  let insertLog = [];
                  for (const [key, field] of Object.entries(validityCheck)) {
                    const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                    const temp = {
                      retailer_upload_id: value.retailer_upload_id,
                      temp_upload_id: value.id,
                      field_name: field,
                      status: 'Active',
                      created: new Date(date)
                    };
                    insertLog.push(temp);
                  }
                  await trx("APSISIPDC.cr_retailer_invalid_fields_log").insert(insertLog).returning("id");
                  is_valid = 0;
                }
                let salesArray = [];
                for (let i = 1; i <= 12; i++) {
                  salesArray.push(value["month_" + i]);
                }
                const checkMasterRetailer = await trx("APSISIPDC.cr_retailer")
                  .select("id")
                  .whereRaw('("retailer_nid" = ' + value.retailer_nid + ' OR "retailer_smart_nid" = ' + parseInt(value.retailer_smart_nid) + ' OR "phone" = ' + value.phone + ')');

                const distributorInfo = await trx("APSISIPDC.cr_manufacturer_vs_distributor")
                  .select("distributor_id")
                  .where("manufacturer_id", parseInt(value.manufacturer_id))
                  .where("distributor_code", value.distributor_code)
                  .where("status", 'Active')
                  .first();

                if (Object.keys(checkMasterRetailer).length == 0) {
                  const masterRetailerData = {
                    retailer_upload_id: value.retailer_upload_id,
                    temp_upload_id: value.id,
                    retailer_name: value.retailer_name,
                    retailer_nid: value.retailer_nid,
                    retailer_smart_nid: parseInt(value.retailer_smart_nid),
                    phone: value.phone
                  };
                  const masterRetailerInsertLog = await trx("APSISIPDC.cr_retailer").insert(masterRetailerData).returning("id");

                  const sales_agent_mapping = {
                    'retailer_id': parseInt(masterRetailerInsertLog[0]),
                    'retailer_code': value.retailer_code,
                    'manufacturer_id': value.manufacturer_id,
                    'sales_agent_id': value.sales_agent_id,
                  };
                  await trx("APSISIPDC.cr_retailer_vs_sales_agent").insert(sales_agent_mapping);

                  let retailerManuDistMappingInsert = {
                    retailer_upload_id: value.retailer_upload_id,
                    temp_upload_id : value.id,
                    retailer_id: parseInt(masterRetailerInsertLog[0]),
                    retailer_nid: value.retailer_nid,
                    retailer_smart_nid: parseInt(value.retailer_smart_nid),
                    phone: value.phone,
                    retailer_code: value.retailer_code,
                    manufacturer_id: value.manufacturer_id,
                    distributor_id: distributorInfo.distributor_id,
                    scheme_id: value.scheme_id,
                    sales_array: JSON.stringify(salesArray),
                    is_valid: is_valid,
                    is_duplicate: 0
                  };

                  const mappingRetailerInsertLog = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping").insert(retailerManuDistMappingInsert).returning("id");

                  const detailsRetailerData = {
                    retailer_upload_id: value.retailer_upload_id,
                    retailer_id: parseInt(masterRetailerInsertLog[0]),
                    manu_scheme_mapping_id : parseInt(mappingRetailerInsertLog[0]),
                    retailer_name: value.retailer_name,
                    phone: value.phone,
                    email: value.email,
                    retailer_type: parseInt(retailerType[value.retailer_type]),
                    type_of_entity: parseInt(retailerTypeEntity[value.type_of_entity]),
                    onboarding: value.onboarding,
                    order_placement: value.order_placement,
                    repayment: value.repayment,
                    retailer_tin: value.retailer_tin,
                    corporate_registration_no: value.corporate_registration_no,
                    trade_license_no: value.trade_license_no,
                    place_of_birth: value.place_of_birth,
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
                    status: 'Active',
                  };
                  const detailsRetailerInsertLog = await trx("APSISIPDC.cr_retailer_details_info").insert(detailsRetailerData);

                  if (detailsRetailerInsertLog == true) {
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
                    .where("manufacturer_id", parseInt(value.manufacturer_id))
                    .whereRaw('("retailer_nid" = ' + value.retailer_nid + ' OR "retailer_smart_nid" = ' + parseInt(value.retailer_smart_nid) + ' OR "phone" = ' + value.phone + ')');

                  if (Object.keys(checkRetailerManuMapping).length == 0) {
                    let retailerInfo = await trx("APSISIPDC.cr_retailer")
                      .select("id AS retailer_id")
                      .whereRaw('("retailer_nid" = ' + value.retailer_nid + ' OR "retailer_smart_nid" = ' + parseInt(value.retailer_smart_nid) + ' OR "phone" = ' + value.phone + ')')
                      .first();

                    let retailerManuDistMappingInsert = {
                      retailer_upload_id: value.retailer_upload_id,
                      temp_upload_id: value.id,
                      retailer_id: retailerInfo.retailer_id,
                      retailer_nid: value.retailer_nid,
                      retailer_smart_nid: parseInt(value.retailer_smart_nid),
                      phone: value.phone,
                      retailer_code: value.retailer_code,
                      manufacturer_id: value.manufacturer_id,
                      distributor_id: distributorInfo.distributor_id,
                      scheme_id: value.scheme_id,
                      sales_array: JSON.stringify(salesArray),
                      is_valid: is_valid,
                      is_duplicate: 1,
                    };

                    const mappingRetailerInsertLog = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping").insert(retailerManuDistMappingInsert).returning("id");;

                    const checkManuMapping = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
                      .select("id")
                      .whereRaw('("retailer_nid" = ' + value.retailer_nid + ' OR "retailer_smart_nid" = ' + parseInt(value.retailer_smart_nid) + ' OR "phone" = ' + value.phone + ')')
                      .first();

                    const duplicate_log = {
                      retailer_upload_id: value.retailer_upload_id,
                      new_retailer_info_id: parseInt(mappingRetailerInsertLog[0]),
                      old_retailer_info_id: checkManuMapping.id,
                      reason: 'New Manufacturer',
                      solved_status: 0,
                      status: 'Active'
                    };
                    await trx("APSISIPDC.cr_retailer_duplicate_log").insert(duplicate_log);

                    const detailsRetailerData = {
                      retailer_upload_id: value.retailer_upload_id,
                      retailer_id: parseInt(retailerInfo.retailer_id),
                      manu_scheme_mapping_id : parseInt(mappingRetailerInsertLog[0]),
                      retailer_name: value.retailer_name,
                      phone: value.phone,
                      email: value.email,
                      retailer_type: parseInt(retailerType[value.retailer_type]),
                      type_of_entity: parseInt(retailerTypeEntity[value.type_of_entity]),
                      onboarding: value.onboarding,
                      order_placement: value.order_placement,
                      repayment: value.repayment,
                      retailer_tin: value.retailer_tin,
                      corporate_registration_no: value.corporate_registration_no,
                      trade_license_no: value.trade_license_no,
                      place_of_birth: value.place_of_birth,
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
                      status: 'Active',
                    };
                    const detailsRetailerInsertLog = await trx("APSISIPDC.cr_retailer_details_info").insert(detailsRetailerData);

                    if (detailsRetailerInsertLog == true) {
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
                    const retailerEligibilityUpdate = await trx("APSISIPDC.cr_retailer_temp")
                      .where({ id: value.id })
                      .update({
                        eligibility_status: "Duplicate",
                        reason: disqualifiedReason,
                        updated_at: new Date()
                      });
                    ++disqualifiedOutletCount;
                  }
                }
              }
              await trx("APSISIPDC.cr_retailer_upload_log")
                .where({ retailer_upload_id: log.retailer_upload_id })
                .update({
                  validity_check_status: 1,
                  validity_check_date: new Date()
                });
            }
          }
          resolve(sendApiResult(true, "Retailer Validity Check Successful."));
        } else {
          reject(sendApiResult(false, 'No Retailer Found'));
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
  });
};

Retailer.checkRetailerDataValidityByID = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      knex.transaction(async (trx) => {
        const { retailer_upload_id } = req.params;
        const bulk_retailer_upload_log = await trx("APSISIPDC.cr_retailer_upload_log")
          .select("retailer_upload_id", "file_found_rows", "count_valid", "count_invalid")
          .where("retailer_upload_id", retailer_upload_id);

        if (Object.keys(bulk_retailer_upload_log).length != 0) {
          const retailer_fields_validation = await trx("APSISIPDC.cr_retailer_fields_validation")
            .select("field_name", "field_type", "operator", "field_length")
            .where("status", 'Active');

          const validation_array = {};
          for (const [key, value] of Object.entries(retailer_fields_validation)) {
            let temp = {};
            temp['type'] = value.field_type;
            temp['operator'] = value.operator;
            temp['length'] = value.field_length;
            validation_array[value.field_name] = temp;
          }
          const bulkRetailerInfoList = await trx("APSISIPDC.cr_retailer_temp")
            .select()
            .where("retailer_upload_id", retailer_upload_id)
            .where("eligibility_status", 'Invalid');

          if (Object.keys(bulkRetailerInfoList).length != 0) {
            let valid_data_count = 0, invalid_data_count = 0;
            for (const [key, value] of Object.entries(bulkRetailerInfoList)) {
              let validityCheck = await checkRetailerDataValidityByRow(value, validation_array);
              await trx("APSISIPDC.cr_retailer_invalid_fields_log").where({ retailer_upload_id: retailer_upload_id, temp_upload_id: value.id })
                .update({
                  status: 'Inactive',
                  updated: new Date(date)
                });
              let eligibility_status = 'Valid';
              if (Object.keys(validityCheck).length != 0) {
                eligibility_status = "Invalid";
                ++invalid_data_count;
                let insertLog = [];
                const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                for (const [key, field] of Object.entries(validityCheck)) {
                  const temp = {
                    retailer_upload_id: retailer_upload_id,
                    temp_upload_id: value.id,
                    field_name: field,
                    status: 'Active',
                    created: new Date(date)
                  };
                  insertLog.push(temp);
                }
                await trx("APSISIPDC.cr_retailer_invalid_fields_log").insert(insertLog);
              } else {
                ++valid_data_count;
              }
              await trx("APSISIPDC.cr_retailer_temp").where({ id: value.id })
                .update({
                  eligibility_status: eligibility_status
                });
            }

            await trx("APSISIPDC.cr_retailer_upload_log").where({ retailer_upload_id: retailer_upload_id })
              .update({
                count_valid: parseInt(bulk_retailer_upload_log[0].count_valid + valid_data_count),
                count_invalid: parseInt(invalid_data_count)
              });

            resolve(sendApiResult(true, "Retailer Validity Check Successful."));
          } else {
            reject(sendApiResult(false, "No Retailer List to check Validity."));
          }
        } else {
          reject(sendApiResult(false, "No Retailer List to check Validity."));
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
  });
};

const checkRetailerDataValidityByRow = async function (row, validation_array) {
  if (Object.keys(row).length != 0) {
    let validData = [];
    for (const [key, value] of Object.entries(validation_array)) {
      if (row[key] != null) {
        let condition = '';
        if (typeof (row[key]) == validation_array[key]['type']) {
          if (key == 'phone' || key == 'autho_rep_phone' || key == 'retailer_nid' || key == 'autho_rep_nid') {
            if (key == 'phone' || key == 'autho_rep_phone') {
              let validPhone = ValidatePhoneNumber(row[key]);
              if (validPhone == false) validData.push(key);
            }
            if (key == 'retailer_nid' || key == 'autho_rep_nid') {
              let validNID = ValidateNID(row[key]);
              if (validNID == false) validData.push(key);
            }
          } else {
            let value_length = typeof (row[key]) != 'number' ? row[key].length : row[key].toString().length;
            if (validation_array[key]['operator'] == '<=') {
              condition = (value_length <= validation_array[key]['length']);
            } else {
              condition = (value_length == validation_array[key]['length']);
            }
            (condition) ? null : validData.push(key);
          }
        } else {
          validData.push(key);
        }
      }
    }
    if (Object.keys(validData).length == 0) return validData;
    else return validData;
  }
};

Retailer.checkRetailerEligibility = function (req) {
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
          .where("is_valid", 1)
          .where("is_duplicate", 0)
          .where("is_valid", 1)
          .whereRaw('"cib_id" IS NULL')
          .whereRaw('"cib_status" IS NULL')
          .where("limit_status", "Unset")
          .where("status", "Inactive");

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
                is_eligible: (parseInt(systemLimit) > 0) ? 1 : 0,
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
          resolve(sendApiResult(true, "Retailer Check Eligibility & Scheme Wise Limit Configure Successful."));
        } else {
          let msg = "No data Found";
          reject(sendApiResult(false, msg));
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
  });
};

// Retailer.schemeWiseLimitConfigure = async function (req) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       await knex.transaction(async (trx) => {
//         const retailerList = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
//           .select(
//             "id",
//             "retailer_id",
//             "retailer_code",
//             "manufacturer_id",
//             "distributor_id",
//             "scheme_id",
//             "sales_array"
//           )
//           .where("limit_status", "Unset")
//           .where("status", "Active");

//         if (Object.keys(retailerList).length !== 0) {
//           for (const [key, value] of Object.entries(retailerList)) {
//             let schemaParameterDeatils = await getSchemeDetailsById(value.scheme_id);

//             const salesArray = JSON.parse(value.sales_array);
//             const systemLimit = await creditLimit(
//               schemaParameterDeatils.uninterrupted_sales,
//               schemaParameterDeatils.min_avg_sales_manufacturer,
//               schemaParameterDeatils.avg_sales_duration,
//               schemaParameterDeatils.multiplying_factor,
//               salesArray,
//               schemaParameterDeatils.interval_checking_avg_sales_duration
//             );

//             await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
//               .where({ id: value.id })
//               .update({
//                 system_limit: parseFloat(systemLimit),
//                 limit_status: "Initiated",
//                 system_limit_date: new Date(),
//                 updated_at: new Date(),
//               });

//             const retailerLimitHistory = {
//               mapping_id: value.id,
//               manufacturer_id: value.manufacturer_id,
//               retailer_id: value.retailer_id,
//               retailer_code: value.retailer_code,
//               distributor_id: value.distributor_id,
//               system_limit: systemLimit,
//               system_limit_date: new Date(),
//               status: "Active",
//             };
//             await trx("APSISIPDC.cr_retailer_credit_limit_history").insert(retailerLimitHistory);

//             let retailerSalesVolume = [];
//             for (let i = 1; i <= 12; i++) {
//               const tempSalesVolume = {
//                 manufacturer_id: value.manufacturer_id,
//                 retailer_id: value.retailer_id,
//                 retailer_code: value.retailer_code,
//                 mapping_id: value.id,
//                 month: i,
//                 amount: salesArray[i - 1],
//               };
//               retailerSalesVolume.push(tempSalesVolume);
//             }
//             await trx("APSISIPDC.cr_retailer_sales_volume").insert(retailerSalesVolume);
//           }
//         } else {
//           let msg = "No data Found";
//           reject(sendApiResult(false, msg));
//         }
//         resolve(sendApiResult(true, "Scheme Wise Limit Configure Successful."));
//       })
//     } catch (error) {
//       reject(sendApiResult(false, error.message));
//     }
//   });
// };

// const checkMonthlySalesData = async function (monthCount = 12, minimumSalesAmount, monthlySalesArray) {
//   if (!isNaN(monthCount) || !isNaN(minimumSalesAmount) | !isNaN(monthlySalesArray)) {
//     const validData = [];
//     for (let i = monthCount; i >= 1; --i) {
//       parseInt(monthlySalesArray[i]) >= parseInt(minimumSalesAmount)
//         ? validData.push(true)
//         : validData.push(false);
//     }
//     if (validData.includes(false)) return false;
//     else return true;
//   }
//   return false;
// };

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
        .leftJoin(
          "APSISIPDC.cr_supervisor",
          "cr_supervisor.supervisor_employee_code",
          "cr_sales_agent.autho_supervisor_employee_code"
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
          "cr_manufacturer.website_link",
          "cr_manufacturer.official_email",
          "cr_distributor.registered_office_bangladesh",
          "cr_distributor.region_of_operation",
          "cr_retailer_manu_scheme_mapping.system_limit",
          "cr_retailer_manu_scheme_mapping.propose_limit",
          "cr_retailer_manu_scheme_mapping.crm_approve_limit",
          "cr_retailer_manu_scheme_mapping.manufacturer_id",
          "cr_manufacturer.manufacturer_name",
          "cr_retailer_manu_scheme_mapping.distributor_id",
          "cr_distributor.distributor_name",
          "cr_supervisor.id as supervisor_id",
          "cr_supervisor.supervisor_name",
          "cr_supervisor.supervisor_employee_code",
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
          "supervisor_id": value.supervisor_id,
          "supervisor_name": value.supervisor_name,
          "supervisor_employee_code": value.supervisor_employee_code,
          "sales_agent_id": value.sales_agent_id,
          "sales_agent_name": value.agent_name,
          "system_limit": value.system_limit,
          "propose_limit": value.propose_limit,
          "crm_approve_limit": value.crm_approve_limit
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
        const folderName = req.file_for;
        if (Object.keys(rows).length !== 0) {
          let insert_count = 0;
          for (let index = 0; index < rows.length; index++) {
            let retailer_nid = rows[index].NID;
            let retailer_smart_nid = rows[index].Smart_NID;
            const retailerInfo = await trx("APSISIPDC.cr_retailer")
              .select("id")
              .whereRaw('("retailer_nid" = ' + retailer_nid + ' OR "retailer_smart_nid" = ' + parseInt(retailer_smart_nid) + ')')
              .whereRaw('"kyc_status" IS NULL')
              .whereRaw('"kyc_id" IS NULL')
              .where("activation_status", "Inactive")
              .where("status", "Active")
              .first();

            if (retailerInfo != undefined && retailerInfo.id != undefined) {
              const retailerEkycData = {
                retailer_id: retailerInfo.id,
                retailer_code: rows[index].REF_NO !== undefined ? rows[index].REF_NO : null,
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
                nid: retailer_nid,
                smart_nid: retailer_smart_nid,
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
                  retailer_code: rows[index].REF_NO !== undefined ? rows[index].REF_NO : null,
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
        const folderName = req.file_for;
        if (Object.keys(rows).length !== 0) {
          let insert_count = 0;
          for (let index = 0; index < rows.length; index++) {
            let retailer_nid = rows[index].NID;
            let retailer_smart_nid = rows[index].Smart_NID;
            let manufacturer_id = rows[index].Manufacturer_ID;
            const retailerInfo = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
              .select("id")
              .whereRaw('("retailer_nid" = ' + retailer_nid + ' OR "retailer_smart_nid" = ' + parseInt(retailer_smart_nid) + ')')
              .where("manufacturer_id", parseInt(manufacturer_id))
              .where("is_valid", 1)
              .where("is_duplicate", 0)
              .where("is_eligible", 1)
              .whereRaw('"cib_status" IS NULL')
              .whereRaw('"cib_id" IS NULL')
              .where("limit_status", 'Initiated')
              .where("status", 'Inactive')
              .first();

            if (retailerInfo != undefined && retailerInfo.id != undefined) {
              const retailerCibData = {
                retailer_id: retailerInfo.id,
                retailer_code: rows[index].Ref_No !== undefined ? rows[index].Ref_No : null,
                manufacturer_id: rows[index].Manufacturer_ID !== undefined ? rows[index].Manufacturer_ID : null,
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
                smart_nid: rows[index].Smart_NID !== undefined ? rows[index].Smart_NID : null,
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
                  manufacturer_id: rows[index].Manufacturer_ID,
                  retailer_code: rows[index].Ref_No !== undefined ? rows[index].Ref_No : null,
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
                  let retailerCibUpdate = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
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
        worksheet.cell(row, col + col_add).string(e.retailer_nid ? e.retailer_nid : "");
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
        worksheet.cell(row, col + col_add).string(e.autho_rep_nid ? e.autho_rep_nid : "");
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
        worksheet.cell(row, col + col_add).string(e.retailer_nid ? e.retailer_nid : "");
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
        worksheet.cell(row, col + col_add).string(e.autho_rep_nid ? e.autho_rep_nid : "");
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
      // await knex("APSISIPDC.cr_retailer_temp").del()
      //   .where("retailer_upload_id", retailer_upload_id)
      //   .where("eligibility_status", "Failed");
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
      const data = await knex("APSISIPDC.cr_retailer_details_info")
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
    const previousYearLastDate = moment().subtract(1, 'years').endOf('year').format('YYYY-MM-DD');

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
            const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
            const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
    const previousYearLastDate = moment().subtract(1, 'years').endOf('year').format('YYYY-MM-DD');

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
            const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
            const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
  //const startDateNextDay = moment(start_date).add(1, 'days').format('YYYY-MM-DD');
  const startDatePreviousDay = moment(start_date).subtract(1, 'days').format('YYYY-MM-DD');
  const endDate = moment(end_date).add(1, 'days').format('YYYY-MM-DD');

  return new Promise(async (resolve, reject) => {
    try {
      const onermn_acc_data = await knex("APSISIPDC.cr_retailer_loan_calculation")
        .where(function () {
          if (start_date && end_date) {
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${startDate}', 'YYYY-MM-DD')`)
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${endDate}', 'YYYY-MM-DD')`)
          }
        })
        .select(
          "cr_retailer_loan_calculation.onermn_acc"
        ).distinct();

      if (onermn_acc_data == 0) {
        reject(sendReportApiResult(false, "Account Number Not found between the date range"))
      }

      const retailer_loan_status_Arr = [];

      for (let i = 0; i < onermn_acc_data.length; i++) {

        const principal_outstanding_blans = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .select("cr_retailer_loan_calculation.principal_outstanding")
          .where("cr_retailer_loan_calculation.onermn_acc", onermn_acc_data[i].onermn_acc)
          .orderBy("cr_retailer_loan_calculation.id", "desc")
          .first()
          .where(function () {
            if (start_date && end_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${startDatePreviousDay}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${startDate}', 'YYYY-MM-DD')`)
            }
          });

        const principal_outstanding_beginning_blans =
          principal_outstanding_blans != undefined ? principal_outstanding_blans.principal_outstanding : 0;

        const onermn_acc_info_beginning_blans = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .sum("cr_retailer_loan_calculation.daily_principal_interest as daily_principal_interest")
          .sum("cr_retailer_loan_calculation.penal_interest as penal_interest")
          .sum("cr_retailer_loan_calculation.transaction_cost as transaction_cost")
          .sum("cr_retailer_loan_calculation.other_charge as other_charges")
          .where("cr_retailer_loan_calculation.onermn_acc", onermn_acc_data[i].onermn_acc)
          .where(function () {
            if (start_date && end_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${startDatePreviousDay}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${startDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_amount = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .sum("cr_retailer_loan_calculation.disburshment as disbursement")
          .sum("cr_retailer_loan_calculation.repayment as recovery")
          .sum("cr_retailer_loan_calculation.daily_principal_interest as interest_charged")
          .sum("cr_retailer_loan_calculation.penal_interest as penal_interest")
          .sum("cr_retailer_loan_calculation.other_charge as other_charges")
          .where("cr_retailer_loan_calculation.onermn_acc", onermn_acc_data[i].onermn_acc)
          .where(function () {
            if (start_date && end_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${startDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${endDate}', 'YYYY-MM-DD')`)
            }
          });

        const beginning_balance = principal_outstanding_beginning_blans
          + onermn_acc_info_beginning_blans[0].daily_principal_interest
          + onermn_acc_info_beginning_blans[0].penal_interest
          + onermn_acc_info_beginning_blans[0].transaction_cost
          + onermn_acc_info_beginning_blans[0].other_charges;

        const ending_balance = beginning_balance
          + total_amount[0].disbursement
          + total_amount[0].interest_charged
          + total_amount[0].penal_interest
          + total_amount[0].other_charges
          - total_amount[0].recovery;

        const retailer_loan_status_info = {
          onermn_acc: onermn_acc_data[i].onermn_acc,
          beginning_balance: beginning_balance,
          disbursement: total_amount[0].disbursement,
          recovery: total_amount[0].recovery,
          interest_charged: total_amount[0].interest_charged,
          penal_interest: total_amount[0].penal_interest,
          other_charges: total_amount[0].other_charges,
          ending_balance: ending_balance
        }

        retailer_loan_status_Arr.push(retailer_loan_status_info);
      }
      const headers = [
        "Sr.",
        "Account No",
        "Begining Balance",
        "Disbursement",
        "Interest Charged",
        "Penal Interest",
        "Other Charges",
        "Recovery",
        "Ending Balance"
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
      for (let i = 0; i < retailer_loan_status_Arr.length; i++) {
        var col_add = 0;
        let e = retailer_loan_status_Arr[i];
        worksheet.cell(row, col + col_add).number(i + 1);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .string(e.onermn_acc ? e.onermn_acc : "");
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.beginning_balance ? e.beginning_balance : 0);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.disbursement ? e.disbursement : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.interest_charged ? e.interest_charged : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.penal_interest ? e.penal_interest : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.other_charges ? e.other_charges : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.recovery ? e.recovery : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.ending_balance ? e.ending_balance : 0);
        col_add++;

        // worksheet.cell(row, col + col_add).number(0);
        // col_add++;
        row++;
      }
      await workbook.write("public/reports_retailer/retailer_loan_status_reports.xlsx");
      const fileName = "./reports_retailer/retailer_loan_status_reports.xlsx";
      setTimeout(() => {
        resolve(sendApiResult(true, "File Generated", fileName));
      }, 1500);
    } catch (error) {
      console.log(error);
      reject(sendApiResult(false, error.message));
    }
  });
};

Retailer.retailerLoanStatusView = async (req, res) => {
  const { start_date, end_date } = req.query;
  const startDate = moment(start_date).startOf('date').format('YYYY-MM-DD');
  //const startDateNextDay = moment(start_date).add(1, 'days').format('YYYY-MM-DD');
  const startDatePreviousDay = moment(start_date).subtract(1, 'days').format('YYYY-MM-DD');
  const endDate = moment(end_date).add(1, 'days').format('YYYY-MM-DD');

  return new Promise(async (resolve, reject) => {
    try {
      const onermn_acc_data = await knex("APSISIPDC.cr_retailer_loan_calculation")
        .where(function () {
          if (start_date && end_date) {
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${startDate}', 'YYYY-MM-DD')`)
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${endDate}', 'YYYY-MM-DD')`)
          }
        })
        .select(
          "cr_retailer_loan_calculation.onermn_acc"
        ).distinct();

      if (onermn_acc_data == 0) {
        reject(sendReportApiResult(false, "Account Number Not found between the date range"));
        // reject({
        //   success: false,
        //   message: "Account Number Not found between the date range",
        //   response: retailer_loan_status_Arr11,
        // });
      }

      const retailer_loan_status_Arr = [];

      for (let i = 0; i < onermn_acc_data.length; i++) {

        const principal_outstanding_blans = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .select("cr_retailer_loan_calculation.principal_outstanding")
          .where("cr_retailer_loan_calculation.onermn_acc", onermn_acc_data[i].onermn_acc)
          .orderBy("cr_retailer_loan_calculation.id", "desc")
          .first()
          .where(function () {
            if (start_date && end_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${startDatePreviousDay}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${startDate}', 'YYYY-MM-DD')`)
            }
          });

        const principal_outstanding_beginning_blans =
          principal_outstanding_blans != undefined ? principal_outstanding_blans.principal_outstanding : 0;

        const onermn_acc_info_beginning_blans = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .sum("cr_retailer_loan_calculation.daily_principal_interest as daily_principal_interest")
          .sum("cr_retailer_loan_calculation.penal_interest as penal_interest")
          .sum("cr_retailer_loan_calculation.transaction_cost as transaction_cost")
          .sum("cr_retailer_loan_calculation.other_charge as other_charges")
          .where("cr_retailer_loan_calculation.onermn_acc", onermn_acc_data[i].onermn_acc)
          .where(function () {
            if (start_date && end_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${startDatePreviousDay}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${startDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_amount = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .sum("cr_retailer_loan_calculation.disburshment as disbursement")
          .sum("cr_retailer_loan_calculation.repayment as recovery")
          .sum("cr_retailer_loan_calculation.daily_principal_interest as interest_charged")
          .sum("cr_retailer_loan_calculation.penal_interest as penal_interest")
          .sum("cr_retailer_loan_calculation.other_charge as other_charges")
          .where("cr_retailer_loan_calculation.onermn_acc", onermn_acc_data[i].onermn_acc)
          .where(function () {
            if (start_date && end_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${startDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${endDate}', 'YYYY-MM-DD')`)
            }
          });

        const beginning_balance = principal_outstanding_beginning_blans
          + onermn_acc_info_beginning_blans[0].daily_principal_interest
          + onermn_acc_info_beginning_blans[0].penal_interest
          + onermn_acc_info_beginning_blans[0].transaction_cost
          + onermn_acc_info_beginning_blans[0].other_charges;

        const ending_balance = beginning_balance
          + total_amount[0].disbursement
          + total_amount[0].interest_charged
          + total_amount[0].penal_interest
          + total_amount[0].other_charges
          - total_amount[0].recovery;

        const retailer_loan_status_info = {
          onermn_acc: onermn_acc_data[i].onermn_acc,
          beginning_balance: beginning_balance,
          disbursement: total_amount[0].disbursement,
          recovery: total_amount[0].recovery,
          interest_charged: total_amount[0].interest_charged,
          penal_interest: total_amount[0].penal_interest,
          other_charges: total_amount[0].other_charges,
          ending_balance: ending_balance
        }

        retailer_loan_status_Arr.push(retailer_loan_status_info);
      }

      if (retailer_loan_status_Arr == 0) reject(sendReportApiResult(false, "Not found."));

      resolve(sendReportApiResult(true, "Retailer Loan Status filter successfully", retailer_loan_status_Arr));

    } catch (error) {
      console.log(error);
      reject(sendApiResult(false, error.message));
    }
  });
};

//Monthly Retailer Performance report for Distributor (Supervisor)

Retailer.generateRetailersMonthlyPerformanceDistributor = async (req, res) => {
  return new Promise(async (resolve, reject) => {

    const { month, supervisor_id, manufacturer_id, sales_agent_id, page, per_page } = req.query;
    const previousYearLastDate = moment().subtract(1, 'years').endOf('year').format('YYYY-MM-DD');

    try {

      const distributor = await knex("APSISIPDC.cr_supervisor")
        .select("distributor_id")
        .where("cr_supervisor.id", supervisor_id);

      const distributor_id = distributor[0]?.distributor_id ?? 0;

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
          "cr_retailer_loan_calculation.retailer_id",
          "cr_retailer.id"
        )
        .leftJoin(
          "APSISIPDC.cr_retailer_vs_sales_agent",
          "cr_retailer_vs_sales_agent.retailer_id",
          "cr_retailer.id"
        )
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where(function () {

          if (manufacturer_id) {
            this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
          }
          if (sales_agent_id) {
            this.where("cr_retailer_vs_sales_agent.sales_agent_id", sales_agent_id)
          }
          if (month) {
            const monthNum = parseInt(month);
            const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
            const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
            "cr_retailer_loan_calculation.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_vs_sales_agent",
            "cr_retailer_vs_sales_agent.retailer_id",
            "cr_retailer.id"
          )
          .sum("cr_retailer_loan_calculation.disburshment as total_disbursement_amount")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (sales_agent_id) {
              this.where("cr_retailer_vs_sales_agent.sales_agent_id", sales_agent_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
            "cr_retailer_loan_calculation.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_vs_sales_agent",
            "cr_retailer_vs_sales_agent.retailer_id",
            "cr_retailer.id"
          )
          .sum("cr_retailer_loan_calculation.repayment as total_repayment_amount")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
          .where(function () {

            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (sales_agent_id) {
              this.where("cr_retailer_vs_sales_agent.sales_agent_id", sales_agent_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
            "cr_retailer_loan_calculation.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_vs_sales_agent",
            "cr_retailer_vs_sales_agent.retailer_id",
            "cr_retailer.id"
          )
          .sum("cr_retailer_loan_calculation.transaction_cost as total_transaction_cost")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (sales_agent_id) {
              this.where("cr_retailer_vs_sales_agent.sales_agent_id", sales_agent_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
            "cr_retailer_loan_calculation.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_vs_sales_agent",
            "cr_retailer_vs_sales_agent.retailer_id",
            "cr_retailer.id"
          )
          .select("cr_retailer_loan_calculation.total_outstanding")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
          .orderBy("cr_retailer_loan_calculation.id", "desc")
          .first()
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (sales_agent_id) {
              this.where("cr_retailer_vs_sales_agent.sales_agent_id", sales_agent_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
          .leftJoin(
            "APSISIPDC.cr_retailer_vs_sales_agent",
            "cr_retailer_vs_sales_agent.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_sales_agent",
            "cr_sales_agent.id",
            "cr_retailer_vs_sales_agent.sales_agent_id",
          )
          .select(
            "cr_retailer.retailer_name",
            "cr_retailer_manu_scheme_mapping.retailer_code",
            "cr_retailer.district",
            "cr_manufacturer.manufacturer_name",
            "cr_distributor.distributor_name",
            // "cr_retailer_manu_scheme_mapping.crm_approve_limit",
            // "cr_retailer_loan_calculation.onermn_acc",
            "cr_sales_agent.agent_name"
          )
          .distinct()
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (sales_agent_id) {
              this.where("cr_retailer_vs_sales_agent.sales_agent_id", sales_agent_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
          //total_transaction_cost: transaction_cost[0].total_transaction_cost,
          retailer_name: retailer_info[0].retailer_name,
          retailer_code: retailer_info[0].retailer_code,
          district: retailer_info[0].district,
          manufacturer_name: retailer_info[0].manufacturer_name,
          distributor_name: retailer_info[0].distributor_name,
          salesagent: retailer_info[0].agent_name,
          // crm_approve_limit: retailer_info[0].crm_approve_limit,
          // onermn_acc: retailer_info[0].onermn_acc
        }

        retailer_performance_info_Arr.push(retailer_performance_info);
      }

      const headers = [
        "Sr.",
        "Retailer name",
        "Retailer code",
        "Manufacturer name",
        "Sales agent name",
        "No of orders placed",
        //"Total_transaction_cost",
        "Total amount of transaction done(BDT)",
        "Total amount of loan requested(BDT)",
        "Total amount of repayment(BDT)",
        "Total outstanding amount(BDT)",
        // "Total_amount_of_disbursement"
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
        worksheet.cell(row, col + col_add).string(e.manufacturer_name ? e.manufacturer_name : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.salesagent ? e.salesagent : "");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.no_of_orders_placed ? e.no_of_orders_placed : "-");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_amount_transaction_done ? e.total_amount_transaction_done : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_disbursement_amount ? e.total_disbursement_amount : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_repayment_amount ? e.total_repayment_amount : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_outstanding ? e.total_outstanding : 0);
        col_add++;

        // worksheet.cell(row, col + col_add).number(0);
        // col_add++;
        row++;
      }
      await workbook.write("public/reports_retailer/retailer-monthly-performance-report-for-distributor_supervisor.xlsx");
      const fileName = "./reports_retailer/retailer-monthly-performance-report-for-distributor_supervisor.xlsx";
      setTimeout(() => {
        resolve(sendApiResult(true, "File Generated", fileName));
      }, 1500);
    } catch (error) {
      console.log(error);
      reject(sendApiResult(false, error.message));
    }
  });
};

Retailer.retailersMonthlyPerformanceDistributor = async (req, res) => {
  return new Promise(async (resolve, reject) => {

    const { month, supervisor_id, manufacturer_id, sales_agent_id, page, per_page } = req.query;
    const previousYearLastDate = moment().subtract(1, 'years').endOf('year').format('YYYY-MM-DD');

    try {

      const distributor = await knex("APSISIPDC.cr_supervisor")
        .select("distributor_id")
        .where("cr_supervisor.id", supervisor_id);

      const distributor_id = distributor[0]?.distributor_id ?? 0;

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
          "cr_retailer_loan_calculation.retailer_id",
          "cr_retailer.id"
        )
        .leftJoin(
          "APSISIPDC.cr_retailer_vs_sales_agent",
          "cr_retailer_vs_sales_agent.retailer_id",
          "cr_retailer.id"
        )
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where(function () {

          if (manufacturer_id) {
            this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
          }
          if (sales_agent_id) {
            this.where("cr_retailer_vs_sales_agent.sales_agent_id", sales_agent_id)
          }
          if (month) {
            const monthNum = parseInt(month);
            const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
            const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
            "cr_retailer_loan_calculation.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_vs_sales_agent",
            "cr_retailer_vs_sales_agent.retailer_id",
            "cr_retailer.id"
          )
          .sum("cr_retailer_loan_calculation.disburshment as total_disbursement_amount")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (sales_agent_id) {
              this.where("cr_retailer_vs_sales_agent.sales_agent_id", sales_agent_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
            "cr_retailer_loan_calculation.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_vs_sales_agent",
            "cr_retailer_vs_sales_agent.retailer_id",
            "cr_retailer.id"
          )
          .sum("cr_retailer_loan_calculation.repayment as total_repayment_amount")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
          .where(function () {

            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (sales_agent_id) {
              this.where("cr_retailer_vs_sales_agent.sales_agent_id", sales_agent_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
            "cr_retailer_loan_calculation.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_vs_sales_agent",
            "cr_retailer_vs_sales_agent.retailer_id",
            "cr_retailer.id"
          )
          .sum("cr_retailer_loan_calculation.transaction_cost as total_transaction_cost")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (sales_agent_id) {
              this.where("cr_retailer_vs_sales_agent.sales_agent_id", sales_agent_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
            "cr_retailer_loan_calculation.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_vs_sales_agent",
            "cr_retailer_vs_sales_agent.retailer_id",
            "cr_retailer.id"
          )
          .select("cr_retailer_loan_calculation.total_outstanding")
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
          .orderBy("cr_retailer_loan_calculation.id", "desc")
          .first()
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (sales_agent_id) {
              this.where("cr_retailer_vs_sales_agent.sales_agent_id", sales_agent_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
          .leftJoin(
            "APSISIPDC.cr_retailer_vs_sales_agent",
            "cr_retailer_vs_sales_agent.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_sales_agent",
            "cr_sales_agent.id",
            "cr_retailer_vs_sales_agent.sales_agent_id",
          )
          .select(
            "cr_retailer.retailer_name",
            //"cr_retailer.retailer_code",
            //"cr_retailer.district",
            "cr_manufacturer.manufacturer_name",
            "cr_distributor.distributor_name",
            // "cr_retailer_manu_scheme_mapping.crm_approve_limit",
            // "cr_retailer_loan_calculation.onermn_acc",
            "cr_sales_agent.agent_name"
          )
          .distinct()
          .where("cr_retailer_loan_calculation.onermn_acc", filter_report_data[i].onermn_acc)
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (sales_agent_id) {
              this.where("cr_retailer_vs_sales_agent.sales_agent_id", sales_agent_id)
            }
            if (month) {
              const monthNum = parseInt(month);
              const monthStartDate = moment(previousYearLastDate).add(monthNum, 'months').startOf('month').format('YYYY-MM-DD');
              const monthEndDate = moment(previousYearLastDate).add(monthNum, 'months').endOf('month').format('YYYY-MM-DD');
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
          //total_transaction_cost: transaction_cost[0].total_transaction_cost,
          retailer_name: retailer_info[0].retailer_name,
          retailer_code: retailer_info[0].retailer_code,
          district: retailer_info[0].district,
          manufacturer_name: retailer_info[0].manufacturer_name,
          distributor_name: retailer_info[0].distributor_name,
          salesagent: retailer_info[0].agent_name,
          // crm_approve_limit: retailer_info[0].crm_approve_limit,
          // onermn_acc: retailer_info[0].onermn_acc
        }

        retailer_performance_info_Arr.push(retailer_performance_info);
      }
      if (retailer_performance_info_Arr == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendReportApiResult(true, "Retailer Performance filter successfully", retailer_performance_info_Arr));

    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

Retailer.downloadEkycReport = function (req) {
  return new Promise(async (resolve, reject) => {
    const result = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
      .where("cr_retailer_manu_scheme_mapping.limit_status", 'Initiated')
      .whereRaw(`"cr_retailer_manu_scheme_mapping"."cib_status" IS NULL`)
      .whereRaw(`"cr_retailer_manu_scheme_mapping"."cib_id" IS NULL`)
      .where("cr_retailer_manu_scheme_mapping.is_valid", 1)
      .where("cr_retailer_manu_scheme_mapping.is_duplicate", 0)
      .where("cr_retailer_manu_scheme_mapping.is_eligible", 1)
      .where("cr_retailer_manu_scheme_mapping.status", 'Inactive')
      .select(
        "cr_retailer_kyc_information.subject_role",
        "cr_retailer_kyc_information.type_of_financing",
        "cr_retailer_kyc_information.number_of_installment",
        "cr_retailer_kyc_information.installment_amount",
        "cr_retailer_kyc_information.total_requested_amount",
        "cr_retailer_kyc_information.periodicity_of_payment",
        "cr_retailer_kyc_information.title",
        "cr_retailer_kyc_information.name",
        "cr_retailer_kyc_information.father_title",
        "cr_retailer_kyc_information.father_name",
        "cr_retailer_kyc_information.mother_title",
        "cr_retailer_kyc_information.mother_name",
        "cr_retailer_kyc_information.spouse_title",
        "cr_retailer_kyc_information.spouse_name",
        "cr_retailer_kyc_information.nid",
        "cr_retailer_kyc_information.smart_nid",
        "cr_retailer_kyc_information.tin",
        knex.raw(`TO_CHAR("cr_retailer_kyc_information"."date_of_birth", 'YYYY-MM-DD') AS "date_of_birth"`),
        "cr_retailer_kyc_information.gender",
        "cr_retailer_kyc_information.district_of_birth",
        "cr_retailer_kyc_information.country_of_birth",
        "cr_retailer_kyc_information.permanent_district",
        "cr_retailer_kyc_information.permanent_street_name_and_number",
        "cr_retailer_kyc_information.permanent_postal_code",
        "cr_retailer_kyc_information.permanent_country",
        "cr_retailer_kyc_information.present_district",
        "cr_retailer_kyc_information.present_street_name_and_number",
        "cr_retailer_kyc_information.present_postal_code",
        "cr_retailer_kyc_information.present_country",
        "cr_retailer_kyc_information.id_type",
        "cr_retailer_kyc_information.id_number",
        knex.raw(`TO_CHAR("cr_retailer_kyc_information"."id_issue_date", 'YYYY-MM-DD') AS "id_issue_date"`),
        "cr_retailer_kyc_information.id_issue_country",
        "cr_retailer_kyc_information.sector_type",
        "cr_retailer_kyc_information.sector_code",
        "cr_retailer_kyc_information.telephone_number",
        "cr_retailer_kyc_information.data_source",
        "cr_retailer_kyc_information.ref_no",
        "cr_retailer_kyc_information.applicant_type",
        "cr_retailer_kyc_information.remarks",
        "cr_retailer_kyc_information.ekycresultid",
        "cr_retailer_kyc_information.trackingno",
        "cr_retailer_kyc_information.mobileno",
        "cr_retailer_kyc_information.fullnamebn",
        "cr_retailer_kyc_information.mothernamebn",
        "cr_retailer_kyc_information.fathernamebn",
        "cr_retailer_kyc_information.permanentaddressbn",
        "cr_retailer_kyc_information.facematchscorerpa",
        "cr_retailer_kyc_information.makeby",
        knex.raw(`TO_CHAR("cr_retailer_kyc_information"."makedate", 'YYYY-MM-DD') AS "makedate"`),
        knex.raw(`CASE "cr_retailer"."kyc_status" WHEN 0 THEN 'Not Verified' WHEN 1 THEN 'Verified' END AS "isverified"`)
      )
      .innerJoin(
        "APSISIPDC.cr_retailer",
        "cr_retailer.id",
        "cr_retailer_manu_scheme_mapping.retailer_id"
      )
      .innerJoin(
        "APSISIPDC.cr_retailer_kyc_information",
        "cr_retailer_kyc_information.nid",
        "cr_retailer.retailer_nid"
      );

    if (result.length == 0) {
      reject(sendApiResult(false, "No Retailer list Found."));
    } else {
      const today = moment(new Date()).format('YYYY-MM-DD');
      var workbook = new excel.Workbook();
      var worksheet = workbook.addWorksheet("Limit Upload Retailer List");
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
        "SUBJECT_ROLE",
        "TYPE_OF_FINANCING",
        "NUMBER_OF_INSTALLMENT",
        "INSTALLMENT_AMOUNT",
        "TOTAL_REQUESTED_AMOUNT",
        "PERIODICITY_OF_PAYMENT",
        "TITLE",
        "NAME",
        "FATHER_TITLE",
        "FATHER_NAME",
        "MOTHER_TITLE",
        "MOTHER_NAME",
        "SPOUSE_TITLE",
        "SPOUSE_NAME",
        "NID",
        "SMART_NID",
        "TIN",
        "DATE_OF_BIRTH",
        "GENDER",
        "DISTRICT_OF_BIRTH",
        "COUNTRY_OF_BIRTH",
        "PERMANENT_DISTRICT",
        "PERMANENT_STREET_NAME_AND_NUMBER",
        "PERMANENT_POSTAL_CODE",
        "PERMANENT_COUNTRY",
        "PRESENT_DISTRICT",
        "PRESENT_STREET_NAME_AND_NUMBER",
        "PRESENT_POSTAL_CODE",
        "PRESENT_COUNTRY",
        "ID_TYPE",
        "ID_NUMBER",
        "ID_ISSUE_DATE",
        "ID_ISSUE_COUNTRY",
        "SECTOR_TYPE",
        "SECTOR_CODE",
        "TELEPHONE_NUMBER",
        "DATA_SOURCE",
        "REF_NO",
        "APPLICANT_TYPE",
        "REMARKS",
        "EKYCRESULTID",
        "TRACKINGNO",
        "MOBILENO",
        "FULLNAMEBN",
        "MOTHERNAMEBN",
        "FATHERNAMEBN",
        "PERMANENTADDRESSBN",
        "FACEMATCHSCORERPA",
        "MAKEBY",
        "MAKEDATE",
        "ISVERIFIED"
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
        worksheet.cell(row, col + col_add).string(e.subject_role ? e.subject_role : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.type_of_financing ? e.type_of_financing : " ");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.number_of_installment ? e.number_of_installment : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.installment_amount ? e.installment_amount : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_requested_amount ? e.total_requested_amount : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.periodicity_of_payment ? e.periodicity_of_payment : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.title ? e.title : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.name ? e.name : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.father_title ? e.father_title : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.father_name ? e.father_name : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.mother_title ? e.mother_title : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.mother_name ? e.mother_name : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.spouse_title ? e.spouse_title : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.spouse_name ? e.spouse_name : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.nid ? e.nid : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.smart_nid ? e.smart_nid : " ");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.tin ? e.tin : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.date_of_birth ? e.date_of_birth : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.gender ? e.gender : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.district_of_birth ? e.district_of_birth : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.country_of_birth ? e.country_of_birth : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.permanent_district ? e.permanent_district : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.permanent_street_name_and_number ? e.permanent_street_name_and_number : " ");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.permanent_postal_code ? e.permanent_postal_code : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.permanent_country ? e.permanent_country : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.present_district ? e.present_district : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.present_street_name_and_number ? e.present_street_name_and_number : " ");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.present_postal_code ? e.present_postal_code : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.present_country ? e.present_country : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.id_type ? e.id_type : " ");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.id_number ? e.id_number : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.id_issue_date ? e.id_issue_date : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.id_issue_country ? e.id_issue_country : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.sector_type ? e.sector_type : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.sector_code ? e.sector_code : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.telephone_number ? e.telephone_number : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.data_source ? e.data_source : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.ref_no ? e.ref_no : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.applicant_type ? e.applicant_type : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.remarks ? e.remarks : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.ekycresultid ? e.ekycresultid : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.trackingno ? e.trackingno : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.mobileno ? e.mobileno : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.fullnamebn ? e.fullnamebn : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.mothernamebn ? e.mothernamebn : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.fathernamebn ? e.fathernamebn : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.permanentaddressbn ? e.permanentaddressbn : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.facematchscorerpa ? e.facematchscorerpa : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.makeby ? e.makeby : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.makedate ? e.makedate : " ");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.isverified ? e.isverified : "");
        col_add++;
        row++;
      }
      const file_path = 'public/eKyc-report/';
      if (!fs.existsSync(file_path)) {
        fs.mkdirSync(file_path, { recursive: true });
      }
      workbook.write(file_path + " eKyc_Report_(" + today + ").xlsx");
      const fileName = "eKyc-report/" + "eKyc_Report_(" + today + ").xlsx";
      await timeout(1500);
      resolve(sendApiResult(true, "eKyc_Report", fileName));
    }
  });
}

Retailer.getRetailerInvalidData = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      knex.transaction(async (trx) => {
        const { retailer_upload_id } = req.params;
        const retailer_info = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
          .select(
            "cr_retailer_manu_scheme_mapping.id",
            "cr_retailer.retailer_name",
            "cr_retailer_manu_scheme_mapping.retailer_code",
            "cr_retailer_manu_scheme_mapping.retailer_nid",
            "cr_retailer.phone",
            knex.raw(`CASE "cr_retailer_manu_scheme_mapping"."is_valid" WHEN 0 THEN 'Yes' WHEN 1 THEN 'No' END AS "invalid"`),
            knex.raw(`CASE "cr_retailer_manu_scheme_mapping"."is_duplicate" WHEN 0 THEN 'No' WHEN 1 THEN 'Yes' END AS "is_duplicate"`)
          )
          .innerJoin(
            "APSISIPDC.cr_retailer",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .where("cr_retailer_manu_scheme_mapping.retailer_upload_id", retailer_upload_id)
          .whereRaw(`"cr_retailer_manu_scheme_mapping"."is_valid" = 0 OR "cr_retailer_manu_scheme_mapping"."is_duplicate" = 1`)
          .where("cr_retailer_manu_scheme_mapping.status", 'Inactive')
          .orderBy("cr_retailer_manu_scheme_mapping.id", "asc");

        resolve(sendApiResult(true, "Retailer Data Found", retailer_info));
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
  });
};

Retailer.getRetailerInvalidDataById = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      knex.transaction(async (trx) => {
        const { retailer_mapping_id } = req.params;
        const retailer_info = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
          .select()
          .where("id", retailer_mapping_id);

        if (Object.keys(retailer_info).length != 0) {
          const fields_array = {};
          for (const [key, value] of Object.entries(retailer_info)) {
            const invalid_fields = await trx("APSISIPDC.cr_retailer_invalid_fields_log")
              .select("field_name")
              .where("temp_upload_id", retailer_id)
              .where("status", 'Active');

            if (Object.keys(invalid_fields).length != 0) {
              let temp = {};
              for (const [index, field] of Object.entries(invalid_fields)) {
                temp[field.field_name] = value[field.field_name];
              }
              fields_array[retailer_id] = temp;
            }
          }
          resolve(sendApiResult(true, "Retailer Data Found", fields_array));
        } else {
          reject(sendApiResult(false, "No Invalid Data."));
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
  });
};

Retailer.updateRetailerInvalidDataById = function (request) {
  return new Promise(async (resolve, reject) => {
    try {
      knex.transaction(async (trx) => {
        for (const [key, value] of Object.entries(request)) {
          for (const [index, data] of Object.entries(value)) {
            await trx("APSISIPDC.cr_retailer_temp").where({ id: key })
              .update({
                [index]: data
              });
          }
        }
        resolve(sendApiResult(true, "Retailer Data Updated Successfully"));
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
  });
};

Retailer.getDuplicateRetailerListById = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      knex.transaction(async (trx) => {
        const { retailer_upload_id } = req.params;
        const data = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
          .innerJoin(
            "APSISIPDC.cr_schema",
            "cr_schema.id",
            "cr_retailer_manu_scheme_mapping.scheme_id"
          )
          .innerJoin(
            "APSISIPDC.cr_retailer",
            "cr_retailer.id",
            "cr_retailer_manu_scheme_mapping.retailer_id"
          )
          .innerJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .where("cr_retailer.retailer_upload_id", retailer_upload_id)
          .where("cr_retailer.status", "Active")
          .where("cr_retailer_manu_scheme_mapping.status", "Duplicate")
          .select(
            'cr_retailer_manu_scheme_mapping.id',
            'cr_schema.scheme_name',
            'cr_retailer.retailer_name',
            'cr_retailer.retailer_nid',
            'cr_manufacturer.manufacturer_name',
            'cr_retailer_manu_scheme_mapping.manufacturer_id',
            'cr_retailer.phone'
          );

        if (Object.keys(data).length != 0) {
          let mapping_data = [];
          for (const [key, value] of Object.entries(data)) {
            const mapping_info = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
              .select(
                knex.raw(`LISTAGG ("cr_manufacturer"."manufacturer_name", ', ') as "manufacturer_name"`)
              )
              .where("cr_retailer_manu_scheme_mapping.retailer_nid", value.retailer_nid)
              .where("cr_retailer_manu_scheme_mapping.status", 'Active')
              .innerJoin(
                "APSISIPDC.cr_manufacturer",
                "cr_manufacturer.id",
                "cr_retailer_manu_scheme_mapping.manufacturer_id"
              );
            let temp = {};
            temp['mapping_id'] = value.id;
            temp['retailer_name'] = value.retailer_name;
            temp['phone'] = value.phone;
            temp['requested_manufacturer_name'] = value.manufacturer_name;
            temp['existing_manufacturer_name'] = mapping_info[0].manufacturer_name;
            temp['scheme_name'] = value.scheme_name;
            mapping_data.push(temp);
          }
          resolve(sendApiResult(true, "Retailer Data Found Successfully", mapping_data));
        } else {
          reject(sendApiResult(false, 'No Retailer Found.'));
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
  });
};

Retailer.createCreditMemo = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      knex.transaction(async (trx) => {
        const uniqueMemoId = new Date().valueOf();
        const retailerList = await creditMemoRetailerList();
        if (Object.keys(retailerList).length !== 0) {
          const memoReferenceNumber = await prepareReferenceNumber();
          const createFrontPage = await preparePdfMemoFrontPage(uniqueMemoId, retailerList, memoReferenceNumber);
          const prepareRetailerListPage = await preparePdfRetailerListPage(uniqueMemoId, retailerList, memoReferenceNumber);
          const memo_log = await creditMemolog(req, uniqueMemoId, retailerList, memoReferenceNumber);
          if (createFrontPage && prepareRetailerListPage && memo_log)
            resolve(sendApiResult(true, "Credit Memo Created Successfully", []));
          else
            reject(sendApiResult(false, 'Credit Memo Generate Failed!'));
        } else {
          reject(sendApiResult(false, 'No Retailer Found.'));
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
  });
};

const creditMemoRetailerList = async function () {
  const result = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
    .where("cr_retailer_manu_scheme_mapping.limit_status", 'Upload')
    .whereRaw(`"cr_retailer_manu_scheme_mapping"."crm_approve_date" IS NOT NULL`)
    .where("cr_retailer.kyc_status", 1)
    .where("cr_retailer_manu_scheme_mapping.cib_status", 1)
    .where("cr_retailer_manu_scheme_mapping.is_valid", 1)
    .where("cr_retailer_manu_scheme_mapping.is_duplicate", 0)
    .where("cr_retailer_manu_scheme_mapping.status", 'Inactive')
    .whereRaw(`"cr_retailer_manu_scheme_mapping"."credit_memo_id" IS NULL`)
    .whereRaw(`"cr_retailer_manu_scheme_mapping"."credit_memo_status" IS NULL`)
    .select(
      "cr_retailer_manu_scheme_mapping.id",
      "cr_retailer_manu_scheme_mapping.retailer_code",
      "cr_retailer_manu_scheme_mapping.retailer_nid",
      "cr_retailer_manu_scheme_mapping.retailer_smart_nid",
      "cr_retailer_manu_scheme_mapping.manufacturer_id",
      "cr_retailer.retailer_name",
      "cr_manufacturer.manufacturer_name",
      "cr_retailer_manu_scheme_mapping.propose_limit",
      "cr_retailer_manu_scheme_mapping.crm_approve_limit",
      "cr_retailer_manu_scheme_mapping.processing_fee",
      knex.raw(`TO_CHAR("cr_retailer"."created_at", 'YYYY/MM/DD') AS "created_date"`)
    )
    .innerJoin(
      "APSISIPDC.cr_retailer",
      "cr_retailer.id",
      "cr_retailer_manu_scheme_mapping.retailer_id"
    )
    .innerJoin(
      "APSISIPDC.cr_manufacturer",
      "cr_manufacturer.id",
      "cr_retailer_manu_scheme_mapping.manufacturer_id"
    );
  return result;
}

const prepareReferenceNumber = async function () {
  let currentdate = new Date();
  let today = currentdate.getFullYear() + "" + ('0' + (currentdate.getMonth() + 1)).slice(-2) + "" + ('0' + currentdate.getDate()).slice(-2);
  const memo_info = await knex("APSISIPDC.cr_credit_memo_log")
    .select(
      "cr_credit_memo_log.id"
    );
  const referenceNumber = 'IPDC/CM/DANA/' + today + '/APNL' + await addingExtraZeros(Object.keys(memo_info).length, 4);
  return referenceNumber;
}

const addingExtraZeros = async function (str, max) {
  str = str.toString();
  return str.length < max ? await addingExtraZeros('0' + str, max) : str;
}

const preparePdfMemoFrontPage = async function (uniqueMemoId, retailerList, memoReferenceNumber) {
  var fonts = {
    Roboto: {
      normal: 'node_modules/font/roboto/Roboto-Regular.ttf',
      bold: 'node_modules/font/roboto/Roboto-Medium.ttf',
      italics: 'node_modules/font/roboto/Roboto-Italic.ttf',
      bolditalics: 'node_modules/font/roboto/Roboto-MediumItalic.ttf'
    },
    Calibri: {
      normal: 'node_modules/font/calibri/Calibri-Regular.ttf',
      bold: 'node_modules/font/calibri/Calibri-Bold.ttf',
      italics: 'node_modules/font/calibri/Calibri-Italic.ttf',
    }
  };

  let manufactureSummaryTable = await manufacture_summary_table(retailerList);

  let currentdate = new Date();
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const today_event = new Date(Date.UTC(currentdate.getFullYear(), ('0' + (currentdate.getMonth() + 0)).slice(-2), (('0' + currentdate.getDate()).slice(-2)), 3, 0, 0));
  const today = today_event.toLocaleDateString('en-US', options);
  const add_five_year_event = new Date(Date.UTC((currentdate.getFullYear() + 5), ('0' + (currentdate.getMonth() + 0)).slice(-2), (('0' + currentdate.getDate()).slice(-2)), 3, 0, 0));
  const add_five_year = add_five_year_event.toLocaleDateString('en-US', options);

  var pdfDocument = {
    pageOrientation: 'portrait',
    pageSize: 'Letter',
    pageMargins: [55, 80, 55, 25],
    defaultStyle: {
      font: 'Calibri',
      fontSize: 9,
      bold: true
    },
    // margin: [left, top, right, bottom],
    header: {
      columns: [
        {
          text: 'MCC No. ' + memoReferenceNumber,
          margin: [55, 40, 0, 0],
          alignment: 'left',
        },
        {
          image: 'public/credit_memo/ipdc_logo.png',
          width: 80,
          margin: [50, 22, 0, 0],
          alignment: 'right',
        },
      ]
    },
    footer: {
      columns: []
    },
    content: [
      {
        text: 'IPDC FINANCE LIMITED',
        margin: [0, 0, 0, 7],
        alignment: 'center',
        fontSize: 10,
      },
      {
        style: 'tableExample',
        table: {
          widths: ['32.5%', '13.5%', '13.5%', '13.5%', '13.5%', '13.5%'],
          body: [
            [
              { text: ' ▢  APPROVED\n ▢  CONDITIONALLY APPROVED\n ▢  DEFERRED\n ▢  DECLINED', fontSize: 9, lineHeight: 1.1, alignment: 'left', bold: false, margin: [7, 0, 0, 0] },
              { text: 'APPROVER-1', fontSize: 9, alignment: 'center', bold: true },
              { text: 'APPROVER-2', fontSize: 9, alignment: 'center', bold: true },
              { text: 'APPROVER-3', fontSize: 9, alignment: 'center', bold: true },
              { text: 'APPROVER-4', fontSize: 9, alignment: 'center', bold: true },
              { text: 'APPROVER-5', fontSize: 9, alignment: 'center', bold: true }
            ]
          ]
        },
        layout: {
          hLineWidth: function (i, node) {
            return 1;
          },
          vLineWidth: function (i, node) {
            return 1;
          }
        }
      },
      {
        text: 'PROPOSAL FOR APPROVAL OF RETAILER FINANCING',
        alignment: 'center',
        margin: [0, 10, 0, 0],
        fontSize: 10,
        bold: true,
      },
      {
        text: 'FACILITY FAVOURING RETAILERS UNDER DANA',
        alignment: 'center',
        margin: [0, 2, 0, 0],
        fontSize: 10,
        bold: true,
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 45,
            y1: 5,
            x2: 600 - 3 * 50,
            y2: 5,
            lineWidth: 1.5,
            color: '#C0C0C0'
          }
        ]
      },
      {
        text: 'PROPOSAL SUMMARY: ',
        alignment: 'left',
        margin: [0, 10, 0, 0],
        fontSize: 9,
        bold: true,
        decoration: 'underline'
      },
      {
        text: 'We propose for the approval of the Retailer Financing facility favouring Retailers of OEMs mentioned in the attached list. Major terms and conditions of the facility are as follows:',
        alignment: 'justify',
        lineHeight: 1.2,
        margin: [0, 2, 0, 0],
        fontSize: 9,
        bold: false,
      },
      {
        style: 'tableExample',
        margin: [0, 5, 0, 0],
        table: {
          widths: ['28%', '72%'],
          body: [
            [
              { text: 'Particulars', margin: [5, 0], bold: true },
              { text: 'Description', margin: [5, 0], bold: true },
            ],
            [
              { text: 'Facility Type', margin: [5, 0], bold: true },
              { text: 'Term Loan (Revolving)', margin: [5, 0], bold: false },
            ],
            [
              { text: 'Sanction Tenor', margin: [5, 0], bold: true },
              { text: '60 months (Renewable)', margin: [5, 0], bold: false },
            ],
            [
              { text: 'Purpose', margin: [5, 0], bold: true },
              { text: 'Term Loan (Revolving)', margin: [5, 0], bold: false },
            ],
            [
              { text: 'Credit Tenor', margin: [5, 0], bold: true },
              {
                style: 'tableExample',
                margin: [1, 1],
                table: {
                  widths: ['33%', '33%', '33%'],
                  body: manufactureSummaryTable.table,
                },
                layout: {
                  hLineWidth: function (i, node) {
                    return 1;
                  },
                  vLineWidth: function (i, node) {
                    return 1;
                  }
                }
              }
            ],
            [
              { text: 'Payment Modality', margin: [5, 0], bold: true },
              { text: 'Retailers make direct payments to IPDC’s bank account in multiple tranches until maturity. ', alignment: 'justify', fontSize: 9, margin: [5, 0], lineHeight: 1.2, bold: false },
            ],
            [
              { text: 'Interest Rate', margin: [5, 0], bold: true },
              { text: '11.00% p.a.', margin: [5, 0], bold: false },
            ],
            [
              { text: 'Total Proposed Limit under\n this proposal', margin: [5, 0], bold: true },
              // {text: await amount_in_words(manufactureSummaryTable.sum), color: 'black', margin: [ 5, 0 ], bold: false},
              { text: await numberWithCommas(manufactureSummaryTable.sum), color: 'black', margin: [5, 0], bold: false },
            ],
            [
              { text: 'Sanction Date', margin: [5, 0], bold: true },
              { text: today, color: 'black', margin: [5, 0], bold: false },
            ],
            [
              { text: 'Sanction Expiry', margin: [5, 0], bold: true },
              { text: add_five_year, color: 'black', margin: [5, 0], bold: false },
            ],
            [
              { text: 'Sanction Limit Parameters', margin: [5, 0], bold: true },
              { text: 'Based on the latest 12 month\'s uninterrupted sales data of the Retailers of OEMs and as per already decided credit parameters set for the OEMs. Proposed sanction amounts per Retailer under this proposal are mentioned in the attached list.', alignment: 'justify', fontSize: 8.6, margin: [5, 0], lineHeight: 1.2, bold: false },
            ],
          ]
        },
        layout: {
          hLineWidth: function (i, node) {
            return 1;
          },
          vLineWidth: function (i, node) {
            return 1;
          }
        }
      },
      {
        text: 'SUBMISSION: ',
        alignment: 'left',
        margin: [0, 12, 0, 0],
        fontSize: 10,
        bold: true,
        decoration: 'underline'
      },
      {
        text: 'Approval is sought for Retailer Financing facility favouring Retailers of OEMs cited in the attached list (<<Total No. of Retailers in Annexure>> Retailers) as per the above-mentioned terms subject to completion of appropriate documentation. ',
        alignment: 'justify',
        lineHeight: 1.2,
        margin: [0, 2, 0, 0],
        fontSize: 9.2,
        bold: false,
      },
      {
        text: 'CIB Status Check, NID and Signature Verification: ',
        alignment: 'left',
        margin: [0, 12, 0, 0],
        fontSize: 10,
        bold: true,
        decoration: 'underline'
      },
      {
        text: 'CIB Status Check, NID and Signature Verification of the mentioned Retailers has been found okay.',
        alignment: 'left',
        lineHeight: 1.2,
        margin: [0, 2, 0, 0],
        fontSize: 9.2,
        bold: false,
      },
      {
        text: 'REMARKS',
        alignment: 'left',
        margin: [0, 12, 0, 0],
        fontSize: 10,
        bold: true,
        decoration: 'underline'
      },
      {
        text: ' ',
        alignment: 'left',
        lineHeight: 1.2,
        margin: [0, 2, 0, 0],
        fontSize: 10,
        bold: false,
      },
      {
        text: 'Annexure',
        alignment: 'left',
        margin: [0, 12, 0, 0],
        fontSize: 10,
        bold: true,
        decoration: 'underline'
      },
      {
        text: 'List of retailers proposed for retailer financing facility.  ',
        alignment: 'left',
        lineHeight: 1.2,
        margin: [0, 2, 0, 0],
        fontSize: 9.2,
        italics: true,
        bold: false,
      },
      {
        style: 'tableExample',
        margin: [0, 5, 0, 0],
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: 'Proposed by:', alignment: 'center', margin: [5, 0], bold: true },
              { text: 'Reviewed by:', alignment: 'center', margin: [5, 0], bold: true },
            ],
            [
              { text: ' \n \n ', margin: [5, 0], bold: true },
              { text: ' \n \n ', margin: [5, 0], bold: false },
            ],
            [
              { text: 'Head of Unit', alignment: 'center', margin: [5, 0], bold: false },
              { text: 'Representative of CRM Department', alignment: 'center', margin: [5, 0], bold: false },
            ],
          ]
        },
        layout: {
          hLineWidth: function (i, node) {
            return 1;
          },
          vLineWidth: function (i, node) {
            return 1;
          }
        }
      },
    ],
  };

  let pdfmake = new Pdfmake(fonts);
  const file_path = 'public/credit_memo/' + uniqueMemoId;
  if (!fs.existsSync(file_path)) {
    fs.mkdirSync(file_path, { recursive: true });
  }
  var file_name = "page_1.pdf";
  let pdfDoc = pdfmake.createPdfKitDocument(pdfDocument, {});
  pdfDoc.pipe(fs.createWriteStream(file_path + '/' + file_name));
  pdfDoc.end();
  return true;
}

const preparePdfRetailerListPage = async function (uniqueMemoId, retailer_list, memoReferenceNumber) {
  const retailerList = await creditMemoRetailerListPrepare(retailer_list);
  var fonts = {
    Calibri: {
      normal: 'node_modules/font/calibri/Calibri-Regular.ttf',
      bold: 'node_modules/font/calibri/Calibri-Bold.ttf',
      italics: 'node_modules/font/calibri/Calibri-Italic.ttf',
    }
  };

  var pdfDocument = {
    pageOrientation: 'landscape',
    pageMargins: [55, 80, 55, 25],
    pageSize: { width: 900, height: 630 },
    defaultStyle: {
      font: 'Calibri',
      fontSize: 10,
    },
    header: {
      columns: [
        {
          text: 'MCC No. ' + memoReferenceNumber,
          margin: [55, 40, 0, 0],
          alignment: 'left',
        },
        {
          image: 'public/credit_memo/ipdc_logo.png',
          width: 80,
          margin: [50, 22, 0, 0],
          alignment: 'right',
        },
      ]
    },
    footer: {
      columns: []
    },
    content: [
      {
        table: {
          headerRows: 1,
          widths: [50, 45, 45, 45, 50, 50, 66, 70, 50, 62, 60, 55, 50],
          body: retailerList
        }
      }
    ]
  };
  let pdfmake = new Pdfmake(fonts);
  const file_path = 'public/credit_memo/' + uniqueMemoId;
  if (!fs.existsSync(file_path)) {
    fs.mkdirSync(file_path, { recursive: true });
  }
  var file_name = "page_2.pdf";
  let pdfDoc = pdfmake.createPdfKitDocument(pdfDocument, {});
  pdfDoc.pipe(fs.createWriteStream(file_path + '/' + file_name));
  pdfDoc.end();
  return true;
}

const creditMemolog = async function (req, uniqueMemoId, retailerList, memoReferenceNumber) {
  let id_list = [];
  let count_sum = 0;
  for (const [key, value] of Object.entries(retailerList)) {
    id_list.push(value.id);
    count_sum += value.crm_approve_limit;
  }

  const cr_credit_memo_log = {
    memo_id: uniqueMemoId,
    ref_no: memoReferenceNumber,
    count_retailer: Object.keys(retailerList).length,
    count_sum: parseInt(count_sum),
    credit_memo_status: null,
    credit_memo_create_date: new Date(),
    created_by: parseInt(req.user_id)
  }
  const insert_log = await knex("APSISIPDC.cr_credit_memo_log").insert(cr_credit_memo_log).returning("id");

  await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
    .whereIn("id", id_list)
    .update({
      credit_memo_id: parseInt(insert_log[0]),
      credit_memo_status: 1,
    });

  return true;
}

const manufacture_summary_table = async function (retailerList) {
  let temp = [];
  let tableList = [];
  temp.push({ text: 'OEM', color: '#000', margin: [5, 0], alignment: 'center', bold: true });
  temp.push({ text: 'Credit Tenor (Days)', margin: [5, 0], alignment: 'center', bold: true });
  temp.push({ text: 'Grace Period (Days)', margin: [5, 0], alignment: 'center', bold: true });
  tableList.push(temp);

  let check_array = [];
  let count_sum = 0;
  for (const [key, value] of Object.entries(retailerList)) {
    if (!check_array.includes(value.manufacturer_name)) {
      let temp = [];
      temp.push({ text: value.manufacturer_name, margin: [5, 0], alignment: 'left', bold: false });
      temp.push({ text: '-', margin: [5, 0], alignment: 'center', bold: false });
      temp.push({ text: '-', margin: [5, 0], alignment: 'center', bold: false });
      check_array.push(value.manufacturer_name);
      tableList.push(temp);
    }
    count_sum += value.crm_approve_limit;
  }
  return { sum: count_sum, table: tableList };
}

const creditMemoRetailerListPrepare = async function (result) {

  let retailerList = [];
  let count = 0;

  let temp = [];
  temp.push({ text: 'Serial No.', color: '#000', margin: [0, 35], alignment: 'center', border: [true, true, true, true], bold: true });
  temp.push({ text: 'Retailer Name', color: '#000', margin: [0, 25], alignment: 'center', border: [false, true, true, true], bold: true });
  temp.push({ text: 'Unique Code of Retailer', color: '#000', margin: [0, 25], alignment: 'center', border: [false, true, true, true], bold: true });
  temp.push({ text: 'OEM', color: '#000', margin: [0, 35], alignment: 'center', border: [false, true, true, true], bold: true });
  temp.push({ text: 'Processing Fee', color: '#000', margin: [0, 25], alignment: 'center', border: [false, true, true, true], bold: true });
  temp.push({ text: 'Existing Limit', color: '#000', margin: [0, 25], alignment: 'center', border: [false, true, true, true], bold: true });
  temp.push({ text: 'Existing Limit for All Manufacturers', color: '#000', margin: [0, 20], alignment: 'center', border: [false, true, true, true], bold: true });
  temp.push({ text: 'Max. Sanction Amount Allowed', color: '#000', margin: [0, 20], alignment: 'center', border: [false, true, true, true], bold: true });
  temp.push({ text: 'Proposed Limit', color: '#000', margin: [0, 25], alignment: 'center', border: [false, true, true, true], bold: true });
  temp.push({ text: 'Enhancement', color: '#000', margin: [0, 35], alignment: 'center', border: [false, true, true, true], bold: true });
  temp.push({ text: 'Proposed Sanction Amount as a % of total lifting amount of 12M', color: '#000', margin: [0, 2, 0, 1], alignment: 'center', border: [false, true, true, true], bold: true });
  temp.push({ text: 'Relationship Tenor', color: '#000', margin: [0, 25], alignment: 'center', border: [false, true, true, true], bold: true });
  temp.push({ text: 'Number of Times Revolved', color: '#000', margin: [0, 20], alignment: 'center', border: [false, true, true, true], bold: true });
  retailerList.push(temp);

  for (const [key, value] of Object.entries(result)) {
    let limit_info_details = await retailerAvgByManufacturer(value.retailer_nid, value.manufacturer_id);
    if (limit_info_details != undefined) {
      let temp = [];
      temp.push({ text: (++count) + ' .', alignment: 'center' });
      temp.push({ text: value.retailer_name, alignment: 'center' });
      temp.push({ text: value.retailer_code, alignment: 'center' });
      temp.push({ text: value.manufacturer_name, alignment: 'center' });
      temp.push({ text: await numberWithCommas(value.processing_fee), alignment: 'center' });
      temp.push({ text: await numberWithCommas(limit_info_details.pre_assigned_limit_manufacturer), alignment: 'center' });
      temp.push({ text: await numberWithCommas(limit_info_details.pre_assigned_limit_all_manufacturer), alignment: 'center' });
      temp.push({ text: await numberWithCommas(limit_info_details.max_sanction_amount_allowed), alignment: 'center' });
      temp.push({ text: await numberWithCommas(value.crm_approve_limit), alignment: 'center' });
      temp.push({ text: await numberWithCommas(limit_info_details.pre_assigned_limit_manufacturer - value.crm_approve_limit), alignment: 'center' });
      temp.push({ text: await numberWithCommas(limit_info_details.proposed_sanction_amount_total_lifting_amount), alignment: 'center' });
      temp.push({ text: await dayDifference(value.created_date), alignment: 'center' });
      temp.push({ text: '-', alignment: 'center' });
      retailerList.push(temp);
    }
  }
  temp = [];
  temp.push({ text: ' ', alignment: 'center' });
  temp.push({ text: ' ', alignment: 'center' });
  temp.push({ text: ' ', alignment: 'center' });
  temp.push({ text: ' ', alignment: 'center' });
  temp.push({ text: ' ', alignment: 'center' });
  temp.push({ text: ' ', alignment: 'center' });
  temp.push({ text: ' ', alignment: 'center' });
  temp.push({ text: ' ', alignment: 'center' });
  temp.push({ text: ' ', alignment: 'center' });
  temp.push({ text: ' ', alignment: 'center' });
  temp.push({ text: ' ', alignment: 'center' });
  temp.push({ text: ' ', alignment: 'center' });
  temp.push({ text: ' ', alignment: 'center' });
  retailerList.push(temp);
  return retailerList;
}

const numberWithCommas = async function (num) {
  if (num) {
    var parts = num.toString().split('.');
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
  }
}

const dayDifference = async function (created_date) {
  let date1 = new Date(created_date);
  let currentdate = new Date();
  let today = currentdate.getFullYear() + "/" + ('0' + (currentdate.getMonth() + 1)).slice(-2) + "/" + ('0' + currentdate.getDate()).slice(-2);
  let date2 = new Date(today);
  let difference_time = date2.getTime() - date1.getTime();
  let difference_days = difference_time / (1000 * 3600 * 24);
  return difference_days;
}

const margePdf = async function (today, memo_id) {
  var merger = new PDFMerger();
  const file_path = 'public/credit_memo/' + memo_id;

  (async () => {
    await merger.add(file_path + '/' + 'page_1.pdf');
    await merger.add(file_path + '/' + 'page_2.pdf');
    await merger.save(file_path + '/' + 'Credit_Memo_' + memo_id + '_(' + today + ')' + '.pdf');
  })();
}

Retailer.creditMemoDownload = function (req) {
  return new Promise(async (resolve, reject) => {
    const memo_id = req.memo_id;
    const result = await knex("APSISIPDC.cr_credit_memo_log")
      .where("id", memo_id)
      .select(
        "cr_credit_memo_log.*",
      )
      .first();

    var file_path = '';
    const today = moment(new Date()).format('YYYY-MM-DD');
    if (result.credit_memo_url == null) {
      file_path = 'public/credit_memo/' + result.memo_id + '/' + 'Credit_Memo_' + result.memo_id + '_(' + today + ')' + '.pdf';
      await margePdf(today, result.memo_id);
      await knex("APSISIPDC.cr_credit_memo_log")
        .where({ id: memo_id })
        .update({
          credit_memo_url: file_path,
          credit_memo_status: 1
        });
    }
    await timeout(1500);
    resolve(sendApiResult(true, "Credit Memo Download Successfully", file_path));
  });
}

Retailer.downloadLimitUploadFile = function (req) {
  return new Promise(async (resolve, reject) => {
    const result = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
      .where("cr_retailer_manu_scheme_mapping.limit_status", 'Initiated')
      .whereRaw(`"cr_retailer_manu_scheme_mapping"."crm_approve_date" IS NULL`)
      .where("cr_retailer.kyc_status", 1)
      .where("cr_retailer_manu_scheme_mapping.cib_status", 1)
      .where("cr_retailer_manu_scheme_mapping.is_valid", 1)
      .where("cr_retailer_manu_scheme_mapping.is_duplicate", 0)
      .where("cr_retailer_manu_scheme_mapping.is_eligible", 1)
      .where("cr_retailer_manu_scheme_mapping.status", 'Inactive')
      .select(
        "cr_retailer.retailer_name",
        "cr_retailer_manu_scheme_mapping.retailer_nid",
        "cr_retailer_manu_scheme_mapping.manufacturer_id",
        knex.raw(`TO_CHAR("cr_retailer_kyc_information"."date_of_birth", 'YYYY-MM-DD') AS "date_of_birth"`),
        "cr_retailer_manu_scheme_mapping.retailer_code",
        knex.raw(`CASE "cr_retailer_manu_scheme_mapping"."cib_status" WHEN 0 THEN 'No' WHEN 1 THEN 'Yes' END AS "cib_status"`),
        "cr_retailer_manu_scheme_mapping.loan_id as total_outstanding",
        "cr_retailer_manu_scheme_mapping.loan_id as overdue_amount",
        "cr_retailer_manu_scheme_mapping.loan_id as default_history",
        knex.raw(`CASE "cr_retailer"."kyc_status" WHEN 0 THEN 'No' WHEN 1 THEN 'Yes' END AS "kyc_status"`),
        "cr_retailer_manu_scheme_mapping.loan_id as avg_monthly_sales",
        "cr_retailer_manu_scheme_mapping.system_limit as proposed_sanction_limit_by_system",
        "cr_retailer_manu_scheme_mapping.loan_id as proposed_sanction_with_avg_sales_value",
        "cr_retailer_manu_scheme_mapping.loan_id as proposed_limit_by_crm",
        "cr_retailer_manu_scheme_mapping.loan_id as proposed_sanction_by_crm_with_average_sales_value",
        "cr_manufacturer.manufacturer_name",
        "cr_schema.scheme_name",
        "cr_retailer.phone"
      )
      .innerJoin(
        "APSISIPDC.cr_retailer",
        "cr_retailer.id",
        "cr_retailer_manu_scheme_mapping.retailer_id"
      )
      .innerJoin(
        "APSISIPDC.cr_manufacturer",
        "cr_manufacturer.id",
        "cr_retailer_manu_scheme_mapping.manufacturer_id"
      )
      .innerJoin(
        "APSISIPDC.cr_retailer_kyc_information",
        "cr_retailer_kyc_information.nid",
        "cr_retailer.retailer_nid"
      )
      .innerJoin(
        "APSISIPDC.cr_schema",
        "cr_schema.id",
        "cr_retailer_manu_scheme_mapping.scheme_id"
      );

    if (result.length == 0) {
      reject(sendApiResult(false, "No Retailer list Found."));
    } else {
      const today = moment(new Date()).format('YYYY-MM-DD');
      var workbook = new excel.Workbook();
      var worksheet = workbook.addWorksheet("Limit Upload Retailer List");
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
        "Name of the Retailer",
        "Retailer_NID",
        "Age",
        "Retailer Code",
        "CIB Status",
        "Total Outstanding (BDT)",
        "Overdue Amount (BDT)",
        "Default History",
        "E-KYC Verification Status",
        "Average Monthly Sales",
        "Proposed Sanction Limit by System",
        "% of Proposed Sanction with Average Sales Value",
        "Proposed_Limit_by_CRM",
        "% Of Proposed Sanction by CRM with Average Sales Value",
        "Manufacturer_Name",
        "Scheme Name",
        "Pre-Assigned Limit for this manufacturer in DANA System",
        "Pre-Assigned Limit across all manufacturers in DANA System",
        "Average Ticket Size (Applicable for existing retailers only)",
        "Highest Ticket Size",
        "Average Payment Period (Applicable for existing retailers only)",
        "Lowest Ticket Size",
        "Relationship Tenor (Applicable for existing retailers only)",
        "No of Revolving Times (Applicable for existing retailers only)",
        "Current Overdue Amount in DANA",
        "Historical Maximum Overdue Days in DANA",
        "Current Maximum Overdue Days in DANA",
        "Retailer_Mobile_Number"
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
        let limit_info_details = await retailerAvgByManufacturer(e.retailer_nid, e.manufacturer_id);
        if (limit_info_details != undefined) {
          worksheet.cell(row, col + col_add).number((i + 1));
          col_add++;
          worksheet.cell(row, col + col_add).string(e.retailer_name ? e.retailer_name : "");
          col_add++;
          worksheet.cell(row, col + col_add).string(e.retailer_nid ? e.retailer_nid : "");
          col_add++;
          worksheet.cell(row, col + col_add).number(e.date_of_birth ? await yearDifference(e.date_of_birth) : "0");
          col_add++;
          worksheet.cell(row, col + col_add).string(e.retailer_code ? e.retailer_code : "-");
          col_add++;
          worksheet.cell(row, col + col_add).string(e.cib_status ? e.cib_status : "-");
          col_add++;
          worksheet.cell(row, col + col_add).string(e.total_outstanding ? e.total_outstanding : "-");
          col_add++;
          worksheet.cell(row, col + col_add).string(e.overdue_amount ? e.overdue_amount : "-");
          col_add++;
          worksheet.cell(row, col + col_add).string(e.default_history ? e.default_history : "-");
          col_add++;
          worksheet.cell(row, col + col_add).string(e.kyc_status ? e.kyc_status : "-");
          col_add++;
          worksheet.cell(row, col + col_add).string(e.avg_monthly_sales ? e.avg_monthly_sales : "-");
          col_add++;
          worksheet.cell(row, col + col_add).number(e.proposed_sanction_limit_by_system ? e.proposed_sanction_limit_by_system : 0);
          col_add++;
          worksheet.cell(row, col + col_add).string(e.proposed_sanction_with_avg_sales_value ? e.proposed_sanction_with_avg_sales_value : "-");
          col_add++;
          worksheet.cell(row, col + col_add).string(" ");
          col_add++;
          worksheet.cell(row, col + col_add).string(e.proposed_sanction_by_crm_with_average_sales_value ? e.proposed_sanction_by_crm_with_average_sales_value : "-");
          col_add++;
          worksheet.cell(row, col + col_add).string(e.manufacturer_name ? e.manufacturer_name : "-");
          col_add++;
          worksheet.cell(row, col + col_add).string(e.scheme_name ? e.scheme_name : "-");
          col_add++;
          worksheet.cell(row, col + col_add).number(limit_info_details.pre_assigned_limit_manufacturer ? limit_info_details.pre_assigned_limit_manufacturer : 0);
          col_add++;
          worksheet.cell(row, col + col_add).number(limit_info_details.pre_assigned_limit_all_manufacturer ? limit_info_details.pre_assigned_limit_all_manufacturer : 0);
          col_add++;
          worksheet.cell(row, col + col_add).number(limit_info_details.avg_ticket_size ? limit_info_details.avg_ticket_size : 0);
          col_add++;
          worksheet.cell(row, col + col_add).number(limit_info_details.highest_ticket_size ? limit_info_details.highest_ticket_size : 0);
          col_add++;
          worksheet.cell(row, col + col_add).number(limit_info_details.avg_payment_period ? limit_info_details.avg_payment_period : 0);
          col_add++;
          worksheet.cell(row, col + col_add).number(limit_info_details.lowest_ticket_size ? limit_info_details.lowest_ticket_size : 0);
          col_add++;
          worksheet.cell(row, col + col_add).number(limit_info_details.relationship_tenor ? limit_info_details.relationship_tenor : 0);
          col_add++;
          worksheet.cell(row, col + col_add).number(limit_info_details.no_revolving_times ? limit_info_details.no_revolving_times : 0);
          col_add++;
          worksheet.cell(row, col + col_add).number(limit_info_details.current_overdue_amount ? limit_info_details.current_overdue_amount : 0);
          col_add++;
          worksheet.cell(row, col + col_add).number(limit_info_details.historical_maximum_overdue_days ? limit_info_details.historical_maximum_overdue_days : 0);
          col_add++;
          worksheet.cell(row, col + col_add).number(limit_info_details.current_maximum_overdue_days ? limit_info_details.current_maximum_overdue_days : 0);
          col_add++;
          worksheet.cell(row, col + col_add).string(e.phone ? e.phone : "");
          col_add++;
          row++;
        } else {
          // console.log('undefined');
          // console.log(e.retailer_nid + ' => ' +e.manufacturer_id);
        }
      }
      const file_path = 'public/retailer/limit_upload/';
      if (!fs.existsSync(file_path)) {
        fs.mkdirSync(file_path, { recursive: true });
      }
      workbook.write(file_path + "Limit_Upload_Retailer_List_(" + today + ").xlsx");
      const fileName = "retailer/limit_upload/" + "Limit_Upload_Retailer_List_(" + today + ").xlsx";
      await timeout(1500);
      resolve(sendApiResult(true, "Limit Upload Retailer List", fileName));
    }
  })
}

const yearDifference = async function (dob){
  let date1 = new Date(dob);
  let currentdate = new Date();
  let today = currentdate.getFullYear() + "-" + ('0' + (currentdate.getMonth() + 1)).slice(-2) + "-" + ('0' + currentdate.getDate()).slice(-2);
  let date2 = new Date(today);
  let difference_time = date2.getTime() - date1.getTime();
  let difference_year = difference_time / (1000 * 3600 * 24 * 365);
  return parseInt(difference_year);
}

Retailer.uploadRetailerLimitUploadFile = function (rows, filename, req) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        const manufacturer_sql = await trx("APSISIPDC.cr_manufacturer")
          .select("id", "manufacturer_name")
          .where("status", "Active");

        const manufacturer_list = [];
        for (const [key, value] of Object.entries(manufacturer_sql)) {
          manufacturer_list[value.manufacturer_name] = value.id;
        }
        let update_count = 0;
        if (Object.keys(rows).length !== 0) {
          for (let index = 0; index < rows.length; index++) {
            if (rows[index].Retailer_NID != undefined && rows[index].Manufacturer_Name != undefined && rows[index].Proposed_Limit_by_CRM != undefined) {
              let limit_crm = rows[index].Proposed_Limit_by_CRM;
              let retailer_nid = rows[index].Retailer_NID;
              let manufacturer_id = rows[index].Manufacturer_Name ? manufacturer_list[rows[index].Manufacturer_Name] : null;
              let mobile_number = rows[index].Retailer_Mobile_Number;
              const limitUpdate = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
                .where({ retailer_nid: retailer_nid, manufacturer_id: manufacturer_id, phone: mobile_number, cib_status: 1, is_valid: 1, is_duplicate: 0, is_eligible: 1, status: 'Inactive', limit_status: 'Initiated' })
                .whereRaw('("cr_retailer_manu_scheme_mapping"."system_limit_date" IS NOT NULL AND "cr_retailer_manu_scheme_mapping"."crm_approve_date" IS NULL)')
                .update({
                  crm_approve_limit: parseInt(limit_crm),
                  crm_approve_date: new Date(),
                  limit_status: 'Upload'
                });
              if (limitUpdate) ++update_count;
            }
          }
          if (Object.keys(rows).length != 0) {
            resolve(sendApiResult(true, "Limit Upload Successfull. " + update_count + " Retailer's Limit Updated."));
          }
          else {
            reject(sendApiResult(false, "Limit Upload Failed"));
          }
        }
        else {
          resolve(sendApiResult(true, "No Valid Retailer Limit Found in your Uploaded File."));
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

Retailer.uploadCreditMemoFile = function (filename, req) {
  return new Promise(async (resolve, reject) => {
    await knex.transaction(async (trx) => {
      const limitUpdate = await trx("APSISIPDC.cr_credit_memo_log")
      .where({id : req.memo_id})
      .update({
        credit_memo_upload_status : 1,
        credit_memo_upload_url : 'public/credit_memo/signed/' + filename,
        credit_memo_upload_date : new Date()
      });
      resolve(sendApiResult(true, "Credit Memo Upload Successfully."));
    })
      .then((result) => {
        //
      })
      .catch((error) => {
        reject(sendApiResult(false, error.message));
      });
  }).catch((error) => {
    console.log(error, 'Promise error');
  });
}

Retailer.creditMemoAction = function (req) {
  return new Promise(async (resolve, reject) => {
    await knex.transaction(async (trx) => {
      const memo_id = req.memo_id;
      const action_type = req.action_type;
      switch(action_type) {
        case 'Approve':
          const credit_memo_approve = await creditMemoApprove(memo_id);
          break;
        case 'Reject':
          const credit_memo_reject = await creditMemoReject(memo_id);
          break;
        case 'Release':
          const credit_memo_release = await creditMemoRelease(memo_id);
          break;
        default:
      }
      resolve(sendApiResult(true, "Credit Memo " + action_type + " Successfully.", action_type));
    })
      .then((result) => {
        //
      })
      .catch((error) => {
        reject(sendApiResult(false, error.message));
      });
  }).catch((error) => {
    console.log(error, 'Promise error');
  });
}

const creditMemoApprove = async function (memo_id) {

}

const creditMemoReject = async function (memo_id, action_type) {

}

const creditMemoRelease = async function (memo_id, action_type) {

}

const amount_in_words = async function (numericValue) {
  numericValue = parseFloat(numericValue).toFixed(2);
  var amount = numericValue.toString().split('.');
  var taka = amount[0];
  var paisa = amount[1];
  var full_amount_in_words = await convert(taka) + " Taka and " + await convert(paisa) + " Paisa Only";
  return full_amount_in_words;
}

const convert = async function (numericValue) {
  var iWords = ['Zero', ' One', ' Two', ' Three', ' Four', ' Five', ' Six', ' Seven', ' Eight', ' Nine'];
  var ePlace = ['Ten', ' Eleven', ' Twelve', ' Thirteen', ' Fourteen', ' Fifteen', ' Sixteen', ' Seventeen', ' Eighteen', ' Nineteen'];
  var tensPlace = ['', ' Ten', ' Twenty', ' Thirty', ' Forty', ' Fifty', ' Sixty', ' Seventy', ' Eighty', ' Ninety'];
  var inWords = [];
  var numReversed, inWords, actnumber, i, j;
  inWords = [];
  if (numericValue == "00" || numericValue == "0") {
    return 'Zero';
  }
  var obStr = numericValue.toString();
  numReversed = obStr.split('');
  actnumber = numReversed.reverse();
  if (Number(numericValue) == 0) {
    return 'Zero';
  }
  var iWordsLength = numReversed.length;
  var finalWord = '';
  j = 0;
  for (i = 0; i < iWordsLength; i++) {
    switch (i) {
      case 0:
        if (actnumber[i] == '0' || actnumber[i + 1] == '1') {
          inWords[j] = '';
        } else {
          inWords[j] = iWords[actnumber[i]];
        }
        inWords[j] = inWords[j] + '';
        break;
      case 1:
        if (actnumber[i] == 0) {
          inWords[j] = '';
        } else if (actnumber[i] == 1) {
          inWords[j] = ePlace[actnumber[i - 1]];
        } else {
          inWords[j] = tensPlace[actnumber[i]];
        }
        break;
      case 2:
        if (actnumber[i] == '0') {
          inWords[j] = '';
        } else if (actnumber[i - 1] !== '0' && actnumber[i - 2] !== '0') {
          inWords[j] = iWords[actnumber[i]] + ' Hundred';
        } else {
          inWords[j] = iWords[actnumber[i]] + ' Hundred';
        }
        break;
      case 3:
        if (actnumber[i] == '0' || actnumber[i + 1] == '1') {
          inWords[j] = '';
        } else {
          inWords[j] = iWords[actnumber[i]];
        }
        if (actnumber[i + 1] !== '0' || actnumber[i] > '0') {
          inWords[j] = inWords[j] + ' Thousand';
        }
        break;
      case 4:
        if (actnumber[i] == 0) {
          inWords[j] = '';
        } else if (actnumber[i] == 1) {
          inWords[j] = ePlace[actnumber[i - 1]];
        } else {
          inWords[j] = tensPlace[actnumber[i]];
        }
        break;
      case 5:
        if (actnumber[i] == '0' || actnumber[i + 1] == '1') {
          inWords[j] = '';
        } else {
          inWords[j] = iWords[actnumber[i]];
        }
        if (actnumber[i + 1] !== '0' || actnumber[i] > '0') {
          inWords[j] = inWords[j] + ' Lakh';
        }
        break;
      case 6:
        if (actnumber[i] == 0) {
          inWords[j] = '';
        } else if (actnumber[i] == 1) {
          inWords[j] = ePlace[actnumber[i - 1]];
        } else {
          inWords[j] = tensPlace[actnumber[i]];
        }
        break;
      case 7:
        if (actnumber[i] == '0' || actnumber[i + 1] == '1') {
          inWords[j] = '';
        } else {
          inWords[j] = iWords[actnumber[i]];
        }
        inWords[j] = inWords[j] + ' Crore';
        break;
      case 8:
        if (actnumber[i] == 0) {
          inWords[j] = '';
        } else if (actnumber[i] == 1) {
          inWords[j] = ePlace[actnumber[i - 1]];
        } else {
          inWords[j] = tensPlace[actnumber[i]];
        }
        break;
      default:
        break;
    }
    j++;
  }
  inWords.reverse();
  for (i = 0; i < inWords.length; i++) {
    finalWord += inWords[i];
  }
  return finalWord;
}

module.exports = Retailer;

