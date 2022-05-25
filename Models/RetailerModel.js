const moment = require("moment");

const { getJsDateFromExcel } = require("excel-date-to-js");
const {
  sendApiResult,
  ValidateNID,
  UpdatedTime,
} = require("../controllers/helperController");
const knex = require("../config/database");
const { getSchemeDetailsById } = require("../controllers/scheme");
const { creditLimit } = require("../controllers/credit_limit");

const Retailer = function () { };

Retailer.insertExcelData = function (rows, filename, req) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex
        .transaction(async (trx) => {
          let msg;
          const folderName = req.file_for;

          if (Object.keys(rows).length === 0) {
            resolve(
              sendApiResult(false, "No Rows Found in your Uploaded File.")
            );
          }

          const retailerUploadId = new Date().valueOf();
          if (Object.keys(rows).length !== 0) {
            const retailerList = [];
            for (let index = 0; index < rows.length; index++) {
              const retailerData = {
                retailer_upload_id: retailerUploadId,
                retailer_name:
                  rows[index].Retailer_Name !== undefined
                    ? rows[index].Retailer_Name
                    : null,
                retailer_nid:
                  rows[index].Retailer_NID !== undefined
                    ? rows[index].Retailer_NID
                    : null,
                phone:
                  rows[index].Mobile_No_of_the_Retailer !== undefined
                    ? rows[index].Mobile_No_of_the_Retailer
                    : null,
                email:
                  rows[index].Email !== undefined ? rows[index].Email : null,
                retailer_type:
                  rows[index].Retailer_Type !== undefined
                    ? rows[index].Retailer_Type
                    : null,
                type_of_entity:
                  rows[index].Entity_Type !== undefined
                    ? rows[index].Entity_Type
                    : null,
                retailer_code:
                  rows[index].Retailer_Code !== undefined
                    ? rows[index].Retailer_Code
                    : null,
                onboarding:
                  rows[index].Onboarding !== undefined
                    ? rows[index].Onboarding
                    : null,
                order_placement:
                  rows[index].Order_Placement !== undefined
                    ? rows[index].Order_Placement
                    : null,
                repayment:
                  rows[index].Repayment !== undefined
                    ? rows[index].Repayment
                    : null,
                manufacturer:
                  rows[index].Corresponding_manufacturer_code !== undefined
                    ? rows[index].Corresponding_manufacturer_code
                    : null,
                distributor_code:
                  rows[index].Corresponding_distributor_code !== undefined
                    ? rows[index].Corresponding_distributor_code
                    : null,
                retailer_tin:
                  rows[index].Retailer_TIN !== undefined
                    ? rows[index].Retailer_TIN
                    : null,
                corporate_registration_no:
                  rows[index].Retailer_Corporate_Registration_No !== undefined
                    ? rows[index].Retailer_Corporate_Registration_No
                    : null,
                trade_license_no:
                  rows[index].Trade_License_No_of_Primary_Establishment !==
                    undefined
                    ? rows[index].Trade_License_No_of_Primary_Establishment
                    : null,
                outlet_address:
                  rows[index].Outlet_Address !== undefined
                    ? rows[index].Outlet_Address
                    : null,
                outlet_address_1:
                  rows[index].Address_Line_1 !== undefined
                    ? rows[index].Address_Line_1
                    : null,
                outlet_address_2:
                  rows[index].Address_Line_2 !== undefined
                    ? rows[index].Address_Line_2
                    : null,
                postal_code:
                  rows[index].Postal_Code !== undefined
                    ? rows[index].Postal_Code
                    : null,
                post_office:
                  rows[index].Post_Office !== undefined
                    ? rows[index].Post_Office
                    : null,
                thana:
                  rows[index].Thana !== undefined ? rows[index].Thana : null,
                district:
                  rows[index].District !== undefined
                    ? rows[index].District
                    : null,
                division:
                  rows[index].Division !== undefined
                    ? rows[index].Division
                    : null,
                autho_rep_full_name:
                  rows[index]
                    .Full_Name_of_Retailer_Authorized_Representative !==
                    undefined
                    ? rows[index]
                      .Full_Name_of_Retailer_Authorized_Representative
                    : null,
                autho_rep_nid:
                  rows[index].NID_of_Authorized_Representative !== undefined
                    ? rows[index].NID_of_Authorized_Representative
                    : null,
                autho_rep_phone:
                  rows[index].Mobile_No_of_Representative !== undefined
                    ? rows[index].Mobile_No_of_Representative
                    : null,
                autho_rep_email:
                  rows[index].Official_Email_of_Retailer_Representative !==
                    undefined
                    ? rows[index].Official_Email_of_Retailer_Representative
                    : null,
                region_operation:
                  rows[index].Region_of_Operation !== undefined
                    ? rows[index].Region_of_Operation
                    : null,
                duration_sales_data:
                  rows[index].Duration_of_Sales_Data_Submitted_in_Months !==
                    undefined
                    ? rows[index].Duration_of_Sales_Data_Submitted_in_Months
                    : null,
                scheme_id:
                  rows[index].Scheme_ID !== undefined
                    ? rows[index].Scheme_ID
                    : null,
                start_date:
                  rows[index].Start_Date !== undefined
                    ? getJsDateFromExcel(rows[index].Start_Date)
                    : null,
                end_date:
                  rows[index].End_Date !== undefined
                    ? getJsDateFromExcel(rows[index].End_Date)
                    : null,
                month_1:
                  rows[index].Month_1 !== undefined ? rows[index].Month_1 : 0,
                month_2:
                  rows[index].Month_2 !== undefined ? rows[index].Month_2 : 0,
                month_3:
                  rows[index].Month_3 !== undefined ? rows[index].Month_3 : 0,
                month_4:
                  rows[index].Month_4 !== undefined ? rows[index].Month_4 : 0,
                month_5:
                  rows[index].Month_5 !== undefined ? rows[index].Month_5 : 0,
                month_6:
                  rows[index].Month_6 !== undefined ? rows[index].Month_6 : 0,
                month_7:
                  rows[index].Month_7 !== undefined ? rows[index].Month_7 : 0,
                month_8:
                  rows[index].Month_8 !== undefined ? rows[index].Month_8 : 0,
                month_9:
                  rows[index].Month_9 !== undefined ? rows[index].Month_9 : 0,
                month_10:
                  rows[index].Month_10 !== undefined ? rows[index].Month_10 : 0,
                month_11:
                  rows[index].Month_11 !== undefined ? rows[index].Month_11 : 0,
                month_12:
                  rows[index].Month_12 !== undefined ? rows[index].Month_12 : 0,
                created_by: parseInt(req.user_id),
              };
              retailerList.push(retailerData);
            }

            const insertRetailerList = await knex(
              "APSISIPDC.cr_retailer_temp"
            ).insert(retailerList);
            if (insertRetailerList == true) {
              const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
              const insertLog = {
                retailer_upload_id: retailerUploadId,
                bulk_upload_date: new Date(date),
                file_name: filename,
                file_path: `public/configuration_file/${folderName}`,
                file_found_rows: Object.keys(rows).length,
                file_upload_rows: Object.keys(retailerList).length,
                count_eligibility: 0,
                count_ineligible: 0,
                created_by: parseInt(req.user_id),
              };
              const uploadLog = await knex(
                "APSISIPDC.cr_retailer_upload_log"
              ).insert(insertLog);
              if (uploadLog == true) {
                msg = "File Uploaded successfully!";
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
          reject(sendApiResult(false, "Data not inserted."));
          // console.log(error);
        });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  }).catch((error) => {
    // console.log(error, 'Promise error');
  });
};

Retailer.getRetailerList = function (req) {
  // var query = req;
  // var per_page = parseInt(req.per_page);
  // var page = 2;

  // const { page, per_page } = req;

  return new Promise(async (resolve, reject) => {
    try {
      //
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
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
          "region_operation"
        )
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

Retailer.checkRetailerEligibility = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      const distributorSql = await knex
        .from("APSISIPDC.cr_distributor")
        .select("id", "distributor_code")
        .where("status", "Active");

      const distributorList = [];
      for (const [key, value] of Object.entries(distributorSql)) {
        distributorList[value.distributor_code] = value.id;
      }

      const retailerTypeSql = await knex
        .from("APSISIPDC.cr_retailer_type")
        .select("id", "name")
        .where("status", "Active");

      const retailerType = [];
      for (const [key, value] of Object.entries(retailerTypeSql)) {
        retailerType[value.name] = value.id;
      }

      const retailerTypeEntitySql = await knex
        .from("APSISIPDC.cr_retailer_type_entity")
        .select("id", "name")
        .where("status", "Active");

      const retailerTypeEntity = [];
      for (const [key, value] of Object.entries(retailerTypeEntitySql)) {
        retailerTypeEntity[value.name] = value.id;
      }

      const bulkRetailerInfoList = await knex
        .from("APSISIPDC.cr_retailer_temp")
        .select()
        .where("eligibility_status", null)
        .where("reason", null);

      let max_r_number_rn = 0;
      const r_number_rn = await knex("APSISIPDC.cr_retailer")
        .whereRaw('"master_r_number" >= 100000000000')
        .select(knex.raw(`MAX("master_r_number") AS master_r_number`))
        .first();

      max_r_number_rn =
        r_number_rn.master_r_number == null
          ? 100000000001
          : r_number_rn.master_r_number;

      const monthCount = 12,
        minimumSalesAmount = 50000;
      var validNID, validMonthlySalesData;
      var eligibileOutletCount = 0,
        disqualifiedOutletCount = 0;
      if (Object.keys(bulkRetailerInfoList).length != 0) {
        for (const [key, value] of Object.entries(bulkRetailerInfoList)) {
          var disqualifiedReason = "";
          validNID = ValidateNID(value.retailer_nid);
          if (validNID == false) {
            disqualifiedReason = disqualifiedReason + "NID Number Invalid. ;; ";
          }
          const monthlySalesArray = [];
          for (let i = 1; i <= 12; i++) {
            monthlySalesArray[i] = value["month_" + i];
          }
          validMonthlySalesData = await checkMonthlySalesData(
            monthCount,
            minimumSalesAmount,
            monthlySalesArray
          );
          if (validMonthlySalesData == false) {
            disqualifiedReason =
              disqualifiedReason + "Monthly Sales Data Invalid. ;; ";
          }

          if (validNID == false || validMonthlySalesData == false) {
            const retailerEligibilityUpdate = await knex(
              "APSISIPDC.cr_retailer_temp"
            )
              .where({ id: value.id })
              .update({
                eligibility_status: "Failed",
                reason: disqualifiedReason,
                updated_at: new Date(),
              });
            ++disqualifiedOutletCount;
          }
          if (validNID == true && validMonthlySalesData == true) {
            var salesArray = [];
            for (let i = 1; i <= 12; i++) {
              salesArray.push(value["month_" + i]);
            }
            const checkMasterRetailer = await knex
              .from("APSISIPDC.cr_retailer")
              .select("id")
              .where("retailer_code", value.retailer_code);

            if (Object.keys(checkMasterRetailer).length == 0) {
              const temp_r_number_rn = ++max_r_number_rn;
              const masterRetailerData = {
                retailer_upload_id: value.retailer_upload_id,
                master_r_number: parseInt(temp_r_number_rn),
                ac_number_1rn: await prepare_1RN_accountNumber(
                  temp_r_number_rn
                ),
                retailer_name: value.retailer_name,
                retailer_nid: parseInt(value.retailer_nid),
                phone: value.phone,
                email: value.email,
                retailer_type: parseInt(retailerType[value.retailer_type]),
                type_of_entity: parseInt(
                  retailerTypeEntity[value.type_of_entity]
                ),
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

              const masterRetailerInsertLog = await knex(
                "APSISIPDC.cr_retailer"
              )
                .insert(masterRetailerData)
                .returning("id");

              var max_r_number_rmn = 0;
              var r_number_rmn = await knex(
                "APSISIPDC.cr_retailer_manu_scheme_mapping"
              )
                // .where('manufacturer_id', value.manufacturer)
                .whereRaw('"master_r_number" >= 1000000')
                .select(knex.raw(`MAX("master_r_number") AS master_r_number`))
                .first();

              max_r_number_rmn =
                r_number_rmn.MASTER_R_NUMBER === undefined ||
                  r_number_rmn.MASTER_R_NUMBER == null
                  ? 1000000
                  : parseInt(r_number_rmn.MASTER_R_NUMBER);

              var temp_r_number_rmn = ++max_r_number_rmn;
              console.log(
                "masterRetailerInsertLog " +
                r_number_rmn +
                " => " +
                temp_r_number_rmn
              );
              var retailerManuDistMappingInsert = {
                master_r_number: parseInt(temp_r_number_rmn),
                ac_number_1rmn: await prepare_1RMN_accountNumber(
                  temp_r_number_rmn,
                  value.manufacturer
                ),
                retailer_id: masterRetailerInsertLog[0],
                retailer_code: value.retailer_code,
                manufacturer_id: value.manufacturer,
                distributor_id: distributorList[value.distributor_code],
                scheme_id: value.scheme_id,
                sales_array: JSON.stringify(salesArray),
                status: "Active",
              };

              const mappingRetailerInsertLog = await knex(
                "APSISIPDC.cr_retailer_manu_scheme_mapping"
              ).insert(retailerManuDistMappingInsert);

              if (mappingRetailerInsertLog == true) {
                const retailerEligibilityUpdate = await knex(
                  "APSISIPDC.cr_retailer_temp"
                )
                  .where({ id: value.id })
                  .update({
                    eligibility_status: "Success",
                    reason: null,
                    updated_at: new Date(),
                  });

                ++eligibileOutletCount;
              }
            }
            const checkRetailerManuMapping = await knex
              .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
              .select("id")
              .where("retailer_code", value.retailer_code)
              .where("manufacturer_id", value.manufacturer);

            if (Object.keys(checkRetailerManuMapping).length == 0) {
              var max_r_number_rmn = 0;

              var retailerInfo = await knex("APSISIPDC.cr_retailer")
                .where("retailer_code", value.retailer_code)
                .select("id AS retailer_id")
                .first();

              var r_number_rmn = await knex(
                "APSISIPDC.cr_retailer_manu_scheme_mapping"
              )
                .whereRaw('"master_r_number" >= 1000000')
                .select(knex.raw(`MAX("master_r_number") AS master_r_number`))
                .first();

              max_r_number_rmn =
                r_number_rmn.MASTER_R_NUMBER === undefined ||
                  r_number_rmn.MASTER_R_NUMBER == null
                  ? 1000000
                  : r_number_rmn.MASTER_R_NUMBER;

              var temp_r_number_rmn = ++max_r_number_rmn;
              var retailerManuDistMappingInsert = {
                master_r_number: parseInt(temp_r_number_rmn),
                ac_number_1rmn: await prepare_1RMN_accountNumber(
                  temp_r_number_rmn,
                  value.manufacturer
                ),
                retailer_id: retailerInfo.retailer_id,
                retailer_code: value.retailer_code,
                manufacturer_id: value.manufacturer,
                distributor_id: distributorList[value.distributor_code],
                scheme_id: value.scheme_id,
                sales_array: JSON.stringify(salesArray),
                status: "Active",
              };

              const mappingRetailerInsertLog = await knex(
                "APSISIPDC.cr_retailer_manu_scheme_mapping"
              ).insert(retailerManuDistMappingInsert);

              if (mappingRetailerInsertLog == true) {
                const retailerEligibilityUpdate = await knex(
                  "APSISIPDC.cr_retailer_temp"
                )
                  .where({ id: value.id })
                  .update({
                    eligibility_status: "Success",
                    reason: null,
                    updated_at: new Date(),
                  });

                ++eligibileOutletCount;
              }
            }
          }
        }
      } else {
        var msg = "No data Found";
        reject(sendApiResult(false, msg));
      }
      resolve(sendApiResult(true, "Retailer Eligibility Check Successful."));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

Retailer.schemeWiseLimitConfigure = async function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      const retailerList = await knex
        .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
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
          var schemaParameterDeatils = await getSchemeDetailsById(
            value.scheme_id
          );
          const salesArray = JSON.parse(value.sales_array);
          const systemLimit = await creditLimit(
            schemaParameterDeatils.uninterrupted_sales,
            schemaParameterDeatils.min_avg_sales_manufacturer,
            schemaParameterDeatils.avg_sales_duration,
            schemaParameterDeatils.multiplying_factor,
            salesArray,
            schemaParameterDeatils.interval_checking_avg_sales_duration
          );
          await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
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
          await knex("APSISIPDC.cr_retailer_credit_limit_history").insert(
            retailerLimitHistory
          );

          var retailerSalesVolume = [];
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
          await knex("APSISIPDC.cr_retailer_sales_volume").insert(
            retailerSalesVolume
          );
        }
      } else {
        var msg = "No data Found";
        reject(sendApiResult(false, msg));
      }
      resolve(sendApiResult(true, "Scheme Wise Limit Configure Successful."));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

const checkMonthlySalesData = async function (
  monthCount = 12,
  minimumSalesAmount,
  monthlySalesArray
) {
  if (
    !isNaN(monthCount) ||
    !isNaN(minimumSalesAmount) | !isNaN(monthlySalesArray)
  ) {
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
  var randomNumber = "";
  for (var i = 0; i < count; i++) {
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
          "cr_retailer_manu_scheme_mapping.crm_approve_limit"
        );

      /* const getRnRmnMapping = {} */
      const accountInfoArray = [];
      /* var account_exist = []; */
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
        });
      }
      /* getRnRmnMapping[account_exist[0]] = accountInfoArray; */
      resolve(sendApiResult(true, "RN & RMN Account Info Fetch Successfull.", accountInfoArray));
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

module.exports = Retailer;
