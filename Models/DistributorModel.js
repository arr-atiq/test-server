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

          const data_array = [];
          if (Object.keys(rows).length != 0) {
            for (let index = 0; index < rows.length; index++) {
              const temp_data = {
                Distributor_Name: rows[index].Distributor_Name,
                Distributor_Code: rows[index].Distributor_Code,
                Distributor_TIN: rows[index].Distributor_TIN,
                Official_Email: rows[index].Official_Email,
                Official_Contact_Number: rows[index].Official_Contact_Number,
                Is_Distributor_or_Third_Party_Agency:
                  rows[index].Is_Distributor_or_Third_Party_Agency,
                Distributor_Corporate_Registration_No:
                  rows[index].Distributor_Corporate_Registration_No,
                Trade_License_No: rows[index].Trade_License_No,
                Distributor_Registered_Office_in_Bangladesh:
                  rows[index].Distributor_Registered_Office_in_Bangladesh,
                Address_Line_1: rows[index].Address_Line_1,
                Address_Line_2: rows[index].Address_Line_2,
                Postal_Code: rows[index].Postal_Code,
                Post_Office: rows[index].Post_Office,
                Thana: rows[index].Thana,
                District: rows[index].District,
                Division: rows[index].Division,
                Name_of_Authorized_Representative:
                  rows[index].Name_of_Authorized_Representative,
                Full_Name: rows[index].Full_Name,
                NID: rows[index].NID,
                Designation_of_Authorized_Representative:
                  rows[index].Designation_of_Authorized_Representative,
                Mobile_No: rows[index].Mobile_No,
                Official_Email_Id_of_Authorized_Representative:
                  rows[index].Official_Email_Id_of_Authorized_Representative,
                Region_of_Operation: rows[index].Region_of_Operation,
                Distributor_Bank_Account_Number:
                  rows[index].Distributor_Bank_Account_Number,
                Distributor_Bank_Account_Title:
                  rows[index].Distributor_Bank_Account_Title,
                Distributor_Bank_Account_Type:
                  rows[index].Distributor_Bank_Account_Type,
                Distributor_Bank_Name: rows[index].Distributor_Bank_Name,
                Distributor_Bank_Branch: rows[index].Distributor_Bank_Branch,
              };
              data_array.push(temp_data);
            }
          }

          console.log('=========');
          console.log(data_array);
          console.log('=========');
          // resolve(sendApiResult(true, '', data_array));

          if (Object.keys(rows).length != 0) {
            const distributor_insert_ids = [];
            const user_insert_ids = [];
            for (let index = 0; index < rows.length; index++) {
              const distributor_corporate_reg = rows[index].Distributor_Corporate_Registration_No;

              const duplication_check = await knex
                .count('cr_distributor.corporate_registration_no as count')
                .from('APSISIPDC.cr_distributor')
                .where(
                  'APSISIPDC.cr_distributor.corporate_registration_no',
                  distributor_corporate_reg,
                );

              console.log('duplication_check');
              console.log(duplication_check[0].count);
              // return duplication_check;

              const team_distributor = {
                distributor_name: rows[index].Distributor_Name,
                distributor_code: rows[index].Distributor_Code,
                distributor_tin: rows[index].Distributor_TIN,
                official_email: rows[index].Official_Email,
                official_contact_number: rows[index].Official_Contact_Number,
                is_distributor_or_third_party_agency:
                  rows[index].Is_Distributor_or_Third_Party_Agency,
                corporate_registration_no:
                  rows[index].Distributor_Corporate_Registration_No,
                trade_license_no: rows[index].Trade_License_No,
                registered_office_bangladesh:
                  rows[index].Distributor_Registered_Office_in_Bangladesh,
                ofc_address1: rows[index].Address_Line_1,
                ofc_address2: rows[index].Address_Line_2,
                ofc_postal_code: rows[index].Postal_Code,
                ofc_post_office: rows[index].Post_Office,
                ofc_thana: rows[index].Thana,
                ofc_district: rows[index].District,
                ofc_division: rows[index].Division,
                name_of_authorized_representative:
                  rows[index].Name_of_Authorized_Representative,
                autho_rep_full_name: rows[index].Full_Name,
                autho_rep_nid: rows[index].NID,
                autho_rep_designation:
                  rows[index].Designation_of_Authorized_Representative,
                autho_rep_phone: rows[index].Mobile_No,
                autho_rep_email:
                  rows[index].Official_Email_Id_of_Authorized_Representative,
                region_of_operation: rows[index].Region_of_Operation,
                created_by: req.user_id,
              };
              const insert_distributor = await knex('APSISIPDC.cr_distributor')
                .insert(team_distributor)
                .returning('id');
              if (insert_distributor) {
                const temp_manufacturer_vs_distributor_map = {
                  manufacturer_id: req.manufacturer_id,
                  distributor_id: insert_distributor[0],
                  created_by: req.user_id,
                };
                const insert_manufacturer_vs_distributor = await knex(
                  'APSISIPDC.cr_manufacturer_vs_distributor',
                ).insert(temp_manufacturer_vs_distributor_map);

                const acc_num = rows[index].Distributor_Bank_Account_Number.split(';');
                const acc_title = rows[index].Distributor_Bank_Account_Title.split(';');
                const acc_type = rows[index].Distributor_Bank_Account_Type.split(';');
                const bank_name = rows[index].Distributor_Bank_Name.split(';');
                const branch = rows[index].Distributor_Bank_Branch.split(';');
                for (let k = 0; k < acc_num.length; k++) {
                  const team_bank_acc = {
                    distributor_id: insert_distributor[0],
                    acc_num: acc_num[k],
                    acc_title: acc_title[k],
                    acc_type: acc_type[k],
                    bank_name: bank_name[k],
                    branch: branch[k],
                    created_by: req.user_id,
                  };
                  const insert_bank_acc = await knex(
                    'APSISIPDC.cr_distributor_bank_acc_details',
                  ).insert(team_bank_acc);
                }

                distributor_insert_ids.push(insert_distributor[0]);
              }

              const temp_user = {
                name: rows[index].Distributor_Name,
                email: rows[index].Official_Email,
                phone: rows[index].Official_Contact_Number,
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
            let is_distributor_wise_user_insert = 0;
            if (Object.keys(distributor_insert_ids).length != 0) {
              const user_wise_distributor = [];
              for (let i = 0; i < distributor_insert_ids.length; i++) {
                const temp_user_distributor_map = {
                  user_id: user_insert_ids[i],
                  distributor_id: distributor_insert_ids[i],
                  created_by: req.user_id,
                };
                user_wise_distributor.push(temp_user_distributor_map);
              }
              if (Object.keys(user_wise_distributor).length != 0) {
                const insert_user_wise_distributor = await knex(
                  'APSISIPDC.cr_distributor_user',
                ).insert(user_wise_distributor);
                const insert_user_wise_distributor2 = await knex(
                  'APSISIPDC.cr_user_wise_distributor',
                ).insert(user_wise_distributor);
                if (
                  insert_user_wise_distributor
                  && insert_user_wise_distributor2
                ) {
                  is_distributor_wise_user_insert = 1;
                }
              }
            }
            if (Object.keys(user_insert_ids).length != 0) {
              const user_wise_role = [];
              for (let i = 0; i < user_insert_ids.length; i++) {
                const temp_user_map = {
                  user_id: user_insert_ids[i],
                  role_id: user_role_id,
                  created_by: req.user_id,
                };
                user_wise_role.push(temp_user_map);
              }
              if (Object.keys(user_wise_role).length != 0) {
                const insert_user_wise_role = await knex(
                  'APSISIPDC.cr_user_wise_role',
                ).insert(user_wise_role);
                if (insert_user_wise_role) {
                  is_user_wise_role_insert = 1;
                }
              }
            }

            if (
              is_distributor_wise_user_insert == 1
              && is_user_wise_role_insert == 1
            ) {
              const date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
              const insert_log = {
                sys_date: new Date(date),
                file_for: folder_name,
                file_path: `public/configuration_file/${folder_name}`,
                file_name: filename,
                found_rows: Object.keys(rows).length,
                upload_rows: Object.keys(distributor_insert_ids).length,
                created_by: parseInt(req.user_id),
              };
              console.log(insert_log);
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

FileUpload.getDistributorList = function (req) {
  // var query = req;
  // var per_page = parseInt(req.per_page);
  // var page = 2;

  const { page, per_page } = req;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex('APSISIPDC.cr_distributor')
        .where('activation_status', 'Active')
        .select(
          'id',
          'distributor_name',
          'distributor_code',
          'distributor_tin',
          'official_email',
          'official_contact_number',
          'is_distributor_or_third_party_agency',
          'corporate_registration_no',
          'trade_license_no',
          'registered_office_bangladesh',
          'ofc_address1',
          'ofc_address2',
          'ofc_postal_code',
          'ofc_post_office',
          'ofc_thana',
          'ofc_district',
          'ofc_division',
          'name_of_authorized_representative',
          'autho_rep_full_name',
          'autho_rep_nid',
          'autho_rep_designation',
          'autho_rep_phone',
          'autho_rep_email',
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

FileUpload.deleteDistributor = function ({ id }) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async trx => {
        const distributor_delete = await trx("APSISIPDC.cr_distributor").where({ id: id }).delete();
        if (distributor_delete <= 0) reject(sendApiResult(false, "Could not Found Distributor"))
        resolve(sendApiResult(true, "Distributor Deleted Successfully", distributor_delete))
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  })
}

FileUpload.editDistributor = function (req) {
  const {
    distributor_name,
    distributor_code,
    distributor_tin,
    official_email,
    official_contact_number,
    is_distributor_or_third_party_agency,
    corporate_registration_no,
    trade_license_no,
    registered_office_bangladesh,
    ofc_address1,
    ofc_address2,
    ofc_postal_code,
    ofc_post_office,
    ofc_thana,
    ofc_district,
    ofc_division,
    name_of_authorized_representative,
    autho_rep_full_name,
    autho_rep_nid,
    autho_rep_designation,
    autho_rep_phone,
    autho_rep_email,
    region_of_operation,
    updated_by
  } = req.body;

  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async trx => {
        const distributor_update = await trx("APSISIPDC.cr_distributor").where({ id: req.params.id }).update({
          'distributor_name': distributor_name,
          'distributor_code': distributor_code,
          'distributor_tin': distributor_tin,
          'official_email': official_email,
          'official_contact_number': official_contact_number,
          'is_distributor_or_third_party_agency': is_distributor_or_third_party_agency,
          'corporate_registration_no': corporate_registration_no,
          'trade_license_no': trade_license_no,
          'registered_office_bangladesh': registered_office_bangladesh,
          'ofc_address1': ofc_address1,
          'ofc_address2': ofc_address2,
          'ofc_postal_code': ofc_postal_code,
          'ofc_post_office': ofc_post_office,
          'ofc_thana': ofc_thana,
          'ofc_district': ofc_district,
          'ofc_division': ofc_division,
          'name_of_authorized_representative': name_of_authorized_representative,
          'autho_rep_full_name': autho_rep_full_name,
          'autho_rep_nid': autho_rep_nid,
          'autho_rep_designation': autho_rep_designation,
          'autho_rep_phone': autho_rep_phone,
          'autho_rep_email': autho_rep_email,
          'region_of_operation': region_of_operation,
          'updated_at': new Date(),
          'updated_by': updated_by
        });
        if (distributor_update <= 0) reject(sendApiResult(false, "Could not Found Distributor"))
        resolve(sendApiResult(true, "Distributor updated Successfully", distributor_update))
      });

    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  })
}
module.exports = FileUpload;
