const moment = require('moment');
const express = require('express');
const {
  sendApiResult,
  getSettingsValue,
} = require('../controllers/helperController');
const knex = require('../config/database');

const FileUpload = function () { };

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

          if (Object.keys(rows).length != 0) {
            const supervisor_insert_ids = [];
            const user_insert_ids = [];
            const distributor_ids = [];
            for (let index = 0; index < rows.length; index++) {
              const team_supervisor = {
                supervisor_name: rows[index].Supervisor_Name,
                supervisor_nid: rows[index].Supervisor_NID,
                phone: rows[index].Phone,
                manufacturer_id: rows[index].Manufacturer,
                supervisor_employee_code: rows[index].Supervisor_Employee_Code,
                region_of_operation: rows[index].Region_of_Operation,
                created_by: req.user_id,
              };
              distributor_ids.push(rows[index].Distributor);
              const insert_supervisor = await knex('APSISIPDC.cr_supervisor')
                .insert(team_supervisor)
                .returning('id');
              if (insert_supervisor) {
                supervisor_insert_ids.push(insert_supervisor[0]);
              }

              const temp_user = {
                name: rows[index].Supervisor_Name,
                email: rows[index].Supervisor_Employee_Code,
                phone: rows[index].Phone,
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
            let is_supervisor_wise_user_insert = 0;
            if (Object.keys(supervisor_insert_ids).length != 0) {
              const user_wise_supervisor = [];
              for (let i = 0; i < supervisor_insert_ids.length; i++) {
                const temp_user_supervisor_map = {
                  user_id: user_insert_ids[i],
                  supervisor_id: supervisor_insert_ids[i],
                  created_by: req.user_id,
                };
                user_wise_supervisor.push(temp_user_supervisor_map);
              }
              if (Object.keys(user_wise_supervisor).length != 0) {
                const insert_user_wise_supervisor = await knex(
                  'APSISIPDC.cr_supervisor_user',
                ).insert(user_wise_supervisor);
                if (insert_user_wise_supervisor) {
                  is_supervisor_wise_user_insert = 1;
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
              is_supervisor_wise_user_insert == 1
              && is_user_wise_role_insert == 1
            ) {
              const date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
              const insert_log = {
                sys_date: new Date(date),
                file_for: folder_name,
                file_path: `public/configuration_file/${folder_name}`,
                file_name: filename,
                found_rows: Object.keys(rows).length,
                upload_rows: Object.keys(supervisor_insert_ids).length,
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

// @Arfin

FileUpload.getSupervisorList = function (req) {
  // var query = req;
  // var per_page = parseInt(req.per_page);
  // var page = 2;

  const { page, per_page } = req;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex('APSISIPDC.cr_supervisor')
        .where('activation_status', 'Active')
        .select(
          'supervisor_name',
          'supervisor_nid',
          'phone',
          'manufacturer_id',
          'supervisor_employee_code',
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

FileUpload.deleteSupervisor = function ({ id }) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async trx => {
        const supervisor_delete = await trx("APSISIPDC.cr_supervisor").where({ id: id }).delete();
        if (supervisor_delete <= 0) reject(sendApiResult(false, "Could not Found Supervisor"))
        resolve(sendApiResult(true, "Supervisor Deleted Successfully", supervisor_delete))
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  })
}

FileUpload.editSupervisor = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async trx => {
        const supervisor_update = await trx("APSISIPDC.cr_supervisor").where({ id: req.body.id }).update({
          'supervisor_name': req.body.supervisor_name,
          'supervisor_nid': req.body.supervisor_nid,
          'phone': req.body.phone,
          'manufacturer_id': req.body.manufacturer_id,
          'supervisor_employee_code': req.body.supervisor_employee_code,
          'region_of_operation': req.body.region_of_operation,
          'updated_at': new Date(),
          'updated_by': req.body.updated_by
        });
        if (supervisor_update <= 0) reject(sendApiResult(false, "Could not Found Supervisor"))
        resolve(sendApiResult(true, "Supervisor updated Successfully", supervisor_update))
      });

    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  })
}

module.exports = FileUpload;
