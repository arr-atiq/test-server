const moment = require('moment');
const express = require('express');
const {
  sendApiResult,
  getSettingsValue,
} = require('../controllers/helperController');
const knex = require('../config/database');

const FileUpload = function () {};

FileUpload.insertExcelData = function (rows, filename, req) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex
        .transaction(async (trx) => {
          let msg;
          const folder_name = req.file_for;
          if (Object.keys(rows).length == 0) {
            resolve(
              sendApiResult(false, 'No Rows Found in your Uploaded File.'),
            );
          }

          const user_roles = await knex
            .from('APSISIPDC.cr_user_roles')
            .select('id')
            .where('status', 'Active')
            .whereIn('user_type', folder_name);
          const user_role_id = user_roles[0].id;

          // console.log(user_role_id+" === "+ main_insert_tbl); return false;

          const data_array = [];
          if (Object.keys(rows).length != 0) {
            for (let index = 0; index < rows.length; index++) {
              const agent_nid = rows[index].Sales_Agent_NID;
              const duplication_check = await knex
                .count('cr_sales_agent.agent_nid as count')
                .from('APSISIPDC.cr_sales_agent')
                .where('APSISIPDC.cr_sales_agent.agent_nid',agent_nid);
              const duplication_check_val = parseInt(duplication_check[0].count);
              if (duplication_check_val == 0) {
                const temp_data = {
                  Sales_Agent_Name: rows[index].Sales_Agent_Name,
                  Sales_Agent_NID: rows[index].Sales_Agent_NID,
                  Phone: rows[index].Phone,
                  Manufacturer: rows[index].Manufacturer,
                  Sales_Agent_Employee_Code: rows[index].Sales_Agent_Employee_Code,
                  Region_of_Operation: rows[index].Region_of_Operation,
                  Distributor: rows[index].Distributor
                };
                data_array.push(temp_data);
              }
            }
          }
          if (Object.keys(rows).length != 0 && Object.keys(data_array).length == 0) {
            const date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            const empty_insert_log = {
              sys_date: new Date(date),
              file_for: folder_name,
              file_path: `public/configuration_file/${folder_name}`,
              file_name: filename,
              found_rows: Object.keys(rows).length,
              upload_rows: Object.keys(data_array).length,
              created_by: parseInt(req.user_id),
            };
            await knex('APSISIPDC.cr_bulk_upload_file_log').insert(empty_insert_log);
            msg = 'File Uploaded successfully!';
            resolve(sendApiResult(true, msg, empty_insert_log));
          }

          if (Object.keys(data_array).length != 0) {
            const sales_agent_insert_ids = [];
            const user_insert_ids = [];
            const distributor_ids = [];
            for (let index = 0; index < data_array.length; index++) {
              const team_sales_agent = {
                agent_name: data_array[index].Sales_Agent_Name,
                agent_nid: data_array[index].Sales_Agent_NID,
                phone: data_array[index].Phone,
                manufacturer_id: data_array[index].Manufacturer,
                agent_employee_code: data_array[index].Sales_Agent_Employee_Code,
                region_of_operation: data_array[index].Region_of_Operation,
                created_by: req.user_id
              };
              distributor_ids.push(data_array[index].Distributor);
              const insert_sales_agent = await knex('APSISIPDC.cr_sales_agent')
                .insert(team_sales_agent)
                .returning('id');
              if (insert_sales_agent) {
                sales_agent_insert_ids.push(insert_sales_agent[0]);
              }

              const temp_user = {
                name: data_array[index].Sales_Agent_Name,
                email: data_array[index].Sales_Agent_Employee_Code,
                phone: data_array[index].Phone,
                password: '5efd3b0647df9045c240729d31622c79',
                cr_user_type: folder_name,
              };
              const insert_user = await knex('APSISIPDC.cr_users')
                .insert(temp_user)
                .returning('id');
              if (insert_user) {
                user_insert_ids.push(insert_user[0]);
              }
            }

            let is_user_wise_role_insert = 0;
            let is_sales_agent_wise_user_insert = 0;
            if (Object.keys(sales_agent_insert_ids).length != 0) {
              const user_wise_sales_agent = [];
              for (let i = 0; i < sales_agent_insert_ids.length; i++) {
                const temp_user_sales_agent_map = {
                  user_id: user_insert_ids[i],
                  sales_agent_id: sales_agent_insert_ids[i],
                  created_by: req.user_id,
                };
                user_wise_sales_agent.push(temp_user_sales_agent_map);
              }
              if (Object.keys(user_wise_sales_agent).length != 0) {
                const insert_user_wise_sales_agent = await knex(
                  'APSISIPDC.cr_sales_agent_user',
                ).insert(user_wise_sales_agent);
                if (insert_user_wise_sales_agent) {
                  is_sales_agent_wise_user_insert = 1;
                }
              }
            }
            if (Object.keys(user_insert_ids).length != 0) {
              const user_wise_distributor = [];
              const user_wise_role = [];
              for (let i = 0; i < user_insert_ids.length; i++) {
                const temp_user_distributor_map = {
                  user_id: user_insert_ids[i],
                  distributor_id: distributor_ids[i],
                  created_by: req.user_id,
                };
                user_wise_distributor.push(temp_user_distributor_map);

                const temp_user_map = {
                  user_id: user_insert_ids[i],
                  role_id: user_role_id,
                  created_by: req.user_id,
                };
                user_wise_role.push(temp_user_map);
              }
              if (Object.keys(user_wise_role).length != 0) {
                const insert_user_wise_distributor = await knex(
                  'APSISIPDC.cr_user_wise_distributor',
                ).insert(user_wise_distributor);
                const insert_user_wise_role = await knex(
                  'APSISIPDC.cr_user_wise_role',
                ).insert(user_wise_role);
                if (insert_user_wise_distributor && insert_user_wise_role) {
                  is_user_wise_role_insert = 1;
                }
              }
            }

            if (
              is_sales_agent_wise_user_insert == 1
              && is_user_wise_role_insert == 1
            ) {
              const date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
              const insert_log = {
                sys_date: new Date(date),
                file_for: folder_name,
                file_path: `public/configuration_file/${folder_name}`,
                file_name: filename,
                found_rows: Object.keys(rows).length,
                upload_rows: Object.keys(sales_agent_insert_ids).length,
                created_by: parseInt(req.user_id),
              };
              await knex('APSISIPDC.cr_bulk_upload_file_log').insert(
                insert_log,
              );
              msg = 'File Uploaded successfully!';
              resolve(sendApiResult(true, msg, insert_log));
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
          console.log(error);
        });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  }).catch((error) => {
    console.log(error, 'Promise error');
  });
};

// @ Arfin

FileUpload.getSalesAgentList = function (req) {
  // var query = req;
  // var per_page = parseInt(req.per_page);
  // var page = 2;

  const { page, per_page } = req;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex('APSISIPDC.cr_sales_agent')
        .where('activation_status', 'Active')
        .select(
          'agent_name',
          'agent_nid',
          'phone',
          'manufacturer_id',
          'agent_employee_code',
          'autho_supervisor_employee_code',
          'region_of_operation',
        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (data == 0) reject(sendApiResult(false, 'Not found.'));

      // var total_amount = 0;
      // for (let i = 0; i < data.length; i++) {
      //     total_amount += parseFloat(data[i].credit_amount)
      // }

      // data.total_amount = total_amount.toFixed(2);

      resolve(sendApiResult(true, 'Data fetched successfully', data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

module.exports = FileUpload;
