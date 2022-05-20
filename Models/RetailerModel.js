const moment = require('moment');

const { getJsDateFromExcel } = require('excel-date-to-js');
const { sendApiResult } = require('../controllers/helperController');
const knex = require('../config/database');

const FileUpload = function () {};

FileUpload.insertExcelData = function (rows, filename, req) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex
        .transaction(async (trx) => {
          let msg;
          const folderName = req.file_for;
          if (Object.keys(rows).length == 0) {
            resolve(
              sendApiResult(false, 'No Rows Found in your Uploaded File.'),
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
                  rows[index].Trade_License_No_of_Primary_Establishment
                  !== undefined
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
                    .Full_Name_of_Retailer_Authorized_Representative
                  !== undefined
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
                  rows[index].Official_Email_of_Retailer_Representative
                  !== undefined
                    ? rows[index].Official_Email_of_Retailer_Representative
                    : null,
                region_operation:
                  rows[index].Region_of_Operation !== undefined
                    ? rows[index].Region_of_Operation
                    : null,
                duration_sales_data:
                  rows[index].Duration_of_Sales_Data_Submitted_in_Months
                  !== undefined
                    ? rows[index].Duration_of_Sales_Data_Submitted_in_Months
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
                  rows[index].Month_1 !== undefined
                    ? rows[index].Month_1
                    : null,
                month_2:
                  rows[index].Month_2 !== undefined
                    ? rows[index].Month_2
                    : null,
                month_3:
                  rows[index].Month_3 !== undefined
                    ? rows[index].Month_3
                    : null,
                month_4:
                  rows[index].Month_4 !== undefined
                    ? rows[index].Month_4
                    : null,
                month_5:
                  rows[index].Month_5 !== undefined
                    ? rows[index].Month_5
                    : null,
                month_6:
                  rows[index].Month_6 !== undefined
                    ? rows[index].Month_6
                    : null,
                month_7:
                  rows[index].Month_7 !== undefined
                    ? rows[index].Month_7
                    : null,
                month_8:
                  rows[index].Month_8 !== undefined
                    ? rows[index].Month_8
                    : null,
                month_9:
                  rows[index].Month_9 !== undefined
                    ? rows[index].Month_9
                    : null,
                month_10:
                  rows[index].Month_10 !== undefined
                    ? rows[index].Month_10
                    : null,
                month_11:
                  rows[index].Month_11 !== undefined
                    ? rows[index].Month_11
                    : null,
                month_12:
                  rows[index].Month_12 !== undefined
                    ? rows[index].Month_12
                    : null,
                created_by: parseInt(req.user_id),
              };
              retailerList.push(retailerData);
            }
            const insertRetailerList = await knex(
              'APSISIPDC.cr_retailer_temp',
            ).insert(retailerList);
            if (insertRetailerList === true) {
              const date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
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
                'APSISIPDC.cr_retailer_upload_log',
              ).insert(insertLog);
              if (uploadLog === true) {
                msg = 'File Uploaded successfully!';
                resolve(sendApiResult(true, msg, insertLog));
              }
            }
          } else {
            msg = 'No Data Founds to Update';
            resolve(sendApiResult(true, msg));
          }
        })
        .then((result) => {
          //
        })
        .catch((error) => {
          reject(sendApiResult(false, 'Data not inserted.'));
          // console.log(error);
        });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  }).catch((error) => {
    // console.log(error, 'Promise error');
  });
};

FileUpload.getRetailerList = function (req) {
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

FileUpload.retailerEligibilityCheck = function () {
  return new Promise(async (resolve, reject) => {
    try {
      const retailerTypeSql = await knex
        .from('APSISIPDC.cr_retailer_type')
        .select('id', 'name')
        .where('status', 'Active');

      const retailerType = [];
      for (const [key, value] of Object.entries(retailerTypeSql)) {
        retailerType[value.name] = value.id;
      }

      const retailerTypeEntitySql = await knex
        .from('APSISIPDC.cr_retailer_type_entity')
        .select('id', 'name')
        .where('status', 'Active');

      const retailerTypeEntity = [];
      for (const [key, value] of Object.entries(retailerTypeEntitySql)) {
        retailerTypeEntity[value.name] = value.id;
      }

      const retailerInfoList = await knex
        .from('APSISIPDC.cr_retailer_temp')
        .select(
          'retailer_name',
          'retailer_nid',
          'phone',
          'email',
          'retailer_type',
          'type_of_entity',
          'retailer_code',
          'onboarding',
          'order_placement',
          'repayment',
          'distributor_code',
          'retailer_tin',
          'corporate_registration_no',
          'trade_license_no',
          'outlet_address',
          'outlet_address_1',
          'outlet_address_2',
          'postal_code',
          'post_office',
          'thana',
          'district',
          'division',
          'autho_rep_full_name',
          'autho_rep_nid',
          'autho_rep_phone',
          'autho_rep_email',
          'region_operation',
          'duration_sales_data',
          'start_date',
          'end_date',
          'month_1',
          'month_2',
          'month_3',
          'month_4',
          'month_5',
          'month_6',
          'month_7',
          'month_8',
          'month_9',
          'month_10',
          'month_11',
          'month_12',
        )
        .where('eligibility_status', null)
        .where('reason', null);

      resolve(sendApiResult(true, retailerInfoList));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

module.exports = FileUpload;
