const moment = require('moment');
const express = require('express');
const {
  sendApiResult,
  getSettingsValue,
} = require('../controllers/helper');
const knex = require('../config/database');

const FileUpload = function () {};
require('dotenv').config();

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

          // Type of entity scope - start
          const type_entity_arr = {};
          const type_entity = await knex
            .from('APSISIPDC.cr_manufacturer_type_entity')
            .select('id', 'name')
            .where('status', 'Active');
          if (Object.keys(type_entity).length != 0) {
            for (let i = 0; i < type_entity.length; i++) {
              type_entity_arr[type_entity[i].name] = type_entity[i].id;
            }
          }
          // Type of entity scope - end

          // Nature of business scope - start
          const nature_business_arr = {};
          const nature_business = await knex
            .from('APSISIPDC.cr_manufacturer_nature_business')
            .select('id', 'name')
            .where('status', 'Active');
          if (Object.keys(nature_business).length != 0) {
            for (let i = 0; i < nature_business.length; i++) {
              nature_business_arr[nature_business[i].name] = nature_business[i].id;
            }
          }
          // Nature of business scope - end


          const data_array = [];
          if (Object.keys(rows).length != 0) {
            for (let index = 0; index < rows.length; index++) {
              const reg_no = rows[index].Manufacturer_Registration_No;
              const duplication_check = await knex
                .count('cr_manufacturer.registration_no as count')
                .from('APSISIPDC.cr_manufacturer')
                .where('APSISIPDC.cr_manufacturer.registration_no', reg_no);
              const duplication_check_val = parseInt(
                duplication_check[0].count,
              );
              if (duplication_check_val == 0) {
                const temp_data = {
                  Manufacturer_Name: rows[index].Manufacturer_Name,
                  Type_of_Entity: type_entity_arr[rows[index].Type_of_Entity],
                  Name_of_Scheme: rows[index].Name_of_Scheme,
                  Manufacturer_Registration_No:
                    rows[index].Manufacturer_Registration_No,
                  Manufacturer_TIN: rows[index].Manufacturer_TIN,
                  Manufacturer_BIN: rows[index].Manufacturer_BIN,
                  Website_URL: rows[index].Website_URL,
                  Registered_Corporate_Office_Address_in_Bangladesh:
                    rows[index]
                      .Registered_Corporate_Office_Address_in_Bangladesh,
                  Corporate_Office_Address_Line_1:
                    rows[index].Corporate_Office_Address_Line_1,
                  Corporate_Office_Address_Line_2:
                    rows[index].Corporate_Office_Address_Line_2,
                  Corporate_Office_Postal_Code:
                    rows[index].Corporate_Office_Postal_Code,
                  Corporate_Office_Post_Office:
                    rows[index].Corporate_Office_Post_Office,
                  Corporate_Office_Thana: rows[index].Corporate_Office_Thana,
                  Corporate_Office_District:
                    rows[index].Corporate_Office_District,
                  Corporate_Office_Division:
                    rows[index].Corporate_Office_Division,
                  Nature_of_Business:
                    nature_business_arr[rows[index].Nature_of_Business],
                  Alternative_Addresses: rows[index].Alternative_Addresses,
                  Alternative_Address_Line_1:
                    rows[index].Alternative_Address_Line_1,
                  Alternative_Address_Line_2:
                    rows[index].Alternative_Address_Line_2,
                  Alternative_Postal_Code: rows[index].Alternative_Postal_Code,
                  Alternative_Post_Office: rows[index].Alternative_Post_Office,
                  Alternative_Thana: rows[index].Alternative_Thana,
                  Alternative_District: rows[index].Alternative_District,
                  Alternative_Division: rows[index].Alternative_Division,
                  Official_Phone_Number: rows[index].Official_Phone_Number,
                  Official_Email_ID: rows[index].Official_Email_ID,
                  Authorized_Representative_Name:
                    rows[index].Authorized_Representative_Name,
                  Authorized_Representative_Full_Name:
                    rows[index].Authorized_Representative_Full_Name,
                  Authorized_Representative_NID:
                    rows[index].Authorized_Representative_NID,
                  Authorized_Representative_Designation:
                    rows[index].Authorized_Representative_Designation,
                  Authorized_Representative_Mobile_No:
                    rows[index].Authorized_Representative_Mobile_No,
                  Authorized_Representative_Official_Email_ID:
                    rows[index].Authorized_Representative_Official_Email_ID,
                  Manufacturer_Name: rows[index].Manufacturer_Name,
                  Official_Email_ID: rows[index].Official_Email_ID,
                  Official_Phone_Number: rows[index].Official_Phone_Number,
                };
                data_array.push(temp_data);
              }
            }
          }

          if (
            Object.keys(rows).length != 0
            && Object.keys(data_array).length == 0
          ) {
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
            await knex('APSISIPDC.cr_bulk_upload_file_log').insert(
              empty_insert_log,
            );
            msg = 'File Uploaded successfully!';
            resolve(sendApiResult(true, msg, empty_insert_log));
          }

          if (Object.keys(data_array).length != 0) {
            const manufacture_insert_ids = [];
            const user_insert_ids = [];
            for (let index = 0; index < data_array.length; index++) {
              const team_manufacture = {
                manufacturer_name: data_array[index].Manufacturer_Name,
                type_of_entity: data_array[index].Type_of_Entity,
                name_of_scheme: data_array[index].Name_of_Scheme,
                registration_no: data_array[index].Manufacturer_Registration_No,
                manufacturer_tin: data_array[index].Manufacturer_TIN,
                manufacturer_bin: data_array[index].Manufacturer_BIN,
                website_link: data_array[index].Website_URL,
                corporate_ofc_address:
                  data_array[index]
                    .Registered_Corporate_Office_Address_in_Bangladesh,
                corporate_ofc_address_1:
                  data_array[index].Corporate_Office_Address_Line_1,
                corporate_ofc_address_2:
                  data_array[index].Corporate_Office_Address_Line_2,
                corporate_ofc_postal_code:
                  data_array[index].Corporate_Office_Postal_Code,
                corporate_ofc_post_office:
                  data_array[index].Corporate_Office_Post_Office,
                corporate_ofc_thana: data_array[index].Corporate_Office_Thana,
                corporate_ofc_district:
                  data_array[index].Corporate_Office_District,
                corporate_ofc_division:
                  data_array[index].Corporate_Office_Division,
                nature_of_business: data_array[index].Nature_of_Business,
                alternative_ofc_address:
                  data_array[index].Alternative_Addresses,
                alternative_address_1:
                  data_array[index].Alternative_Address_Line_1,
                alternative_address_2:
                  data_array[index].Alternative_Address_Line_2,
                alternative_postal_code:
                  data_array[index].Alternative_Postal_Code,
                alternative_post_office:
                  data_array[index].Alternative_Post_Office,
                alternative_thana: data_array[index].Alternative_Thana,
                alternative_district: data_array[index].Alternative_District,
                alternative_division: data_array[index].Alternative_Division,
                official_phone: data_array[index].Official_Phone_Number,
                official_email: data_array[index].Official_Email_ID,
                name_of_authorized_representative:
                  data_array[index].Authorized_Representative_Name,
                autho_rep_full_name:
                  data_array[index].Authorized_Representative_Full_Name,
                autho_rep_nid: data_array[index].Authorized_Representative_NID,
                autho_rep_designation:
                  data_array[index].Authorized_Representative_Designation,
                autho_rep_phone:
                  data_array[index].Authorized_Representative_Mobile_No,
                autho_rep_email:
                  data_array[index].Authorized_Representative_Official_Email_ID,
                created_by: req.user_id,
              };
              const insert_manufacture = await knex('APSISIPDC.cr_manufacturer')
                .insert(team_manufacture)
                .returning('id');
              if (insert_manufacture) {
                manufacture_insert_ids.push(insert_manufacture[0]);
              }

              const temp_user = {
                name: data_array[index].Manufacturer_Name,
                email: data_array[index].Official_Email_ID,
                phone: data_array[index].Official_Phone_Number,
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
            let is_manufacture_wise_user_insert = 0;
            if (Object.keys(manufacture_insert_ids).length != 0) {
              const user_wise_manufacture = [];
              for (let i = 0; i < manufacture_insert_ids.length; i++) {
                const temp_user_manufacture_map = {
                  user_id: user_insert_ids[i],
                  manufacturer_id: manufacture_insert_ids[i],
                  created_by: req.user_id,
                };
                user_wise_manufacture.push(temp_user_manufacture_map);
              }
              if (Object.keys(user_wise_manufacture).length != 0) {
                const insert_user_wise_manufacture = await knex(
                  'APSISIPDC.cr_manufacturer_user',
                ).insert(user_wise_manufacture);
                if (insert_user_wise_manufacture) {
                  is_manufacture_wise_user_insert = 1;
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
              is_manufacture_wise_user_insert == 1
              && is_user_wise_role_insert == 1
            ) {
              const date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
              const insert_log = {
                sys_date: new Date(date),
                file_for: folder_name,
                file_path: `public/configuration_file/${folder_name}`,
                file_name: filename,
                found_rows: Object.keys(rows).length,
                upload_rows: Object.keys(manufacture_insert_ids).length,
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
        })
        .catch((error) => {
          reject(sendApiResult(false, 'Data not inserted.'));
          logger.info(error);
        });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  }).catch((error) => {
    logger.info(error, 'Promise error');
  });
};


FileUpload.getManufacturerList = function (req) {
  const { page, per_page } = req;
  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex('APSISIPDC.cr_manufacturer')
        .leftJoin(
          'APSISIPDC.cr_manufacturer_type_entity',
          'cr_manufacturer_type_entity.id',
          'cr_manufacturer.type_of_entity',
        )
        .where('activation_status', 'Active')
        .select(
          'cr_manufacturer.id',
          'manufacturer_name',
          knex.raw('"cr_manufacturer_type_entity"."name" as "type_of_entity"'),
          'name_of_scheme',
          'registration_no',
          'manufacturer_tin',
          'manufacturer_bin',
          'website_link',
          'corporate_ofc_address',
          'corporate_ofc_address_1',
          'corporate_ofc_address_2',
          'corporate_ofc_postal_code',
          'corporate_ofc_post_office',
          'corporate_ofc_thana',
          'corporate_ofc_district',
          'corporate_ofc_division',
          'nature_of_business',
          'alternative_ofc_address',
          'alternative_address_1',
          'alternative_address_2',
          'alternative_postal_code',
          'alternative_post_office',
          'alternative_thana',
          'alternative_district',
          'alternative_division',
          'official_phone',
          'official_email',
          'name_of_authorized_representative',
          'autho_rep_full_name',
          'autho_rep_nid',
          'autho_rep_designation',
          'autho_rep_phone',
          'autho_rep_email',
        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (data == 0) reject(sendApiResult(false, 'Not found.'));

      resolve(sendApiResult(true, 'Data fetched successfully', data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.deleteManufacturer = function ({ id }) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        const manufacturer_delete = await trx('APSISIPDC.cr_manufacturer')
          .where({ id })
          .delete();
        if (manufacturer_delete <= 0) reject(sendApiResult(false, 'Could not Found manufacturer'));
        resolve(
          sendApiResult(
            true,
            'Manufacturer Deleted Successfully',
            manufacturer_delete,
          ),
        );
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.editManufacturer = function (req) {
  const {
    manufacturer_name,
    type_of_entity,
    name_of_scheme,
    registration_no,
    manufacturer_tin,
    manufacturer_bin,
    website_link,
    corporate_ofc_address,
    corporate_ofc_address_1,
    corporate_ofc_address_2,
    corporate_ofc_postal_code,
    corporate_ofc_post_office,
    corporate_ofc_thana,
    corporate_ofc_district,
    corporate_ofc_division,
    nature_of_business,
    alternative_ofc_address,
    alternative_address_1,
    alternative_address_2,
    alternative_postal_code,
    alternative_post_office,
    alternative_thana,
    alternative_district,
    alternative_division,
    official_phone,
    official_email,
    name_of_authorized_representative,
    autho_rep_full_name,
    autho_rep_nid,
    autho_rep_designation,
    autho_rep_phone,
    autho_rep_email,
    updated_by,
  } = req.body;

  return new Promise(async (resolve, reject) => {
    try {
      const type_entity_manufacturer = await knex(
        'APSISIPDC.cr_manufacturer_type_entity',
      )
        .where('name', type_of_entity)
        .select('id');
      await knex.transaction(async (trx) => {
        const manufacturer_update = await trx('APSISIPDC.cr_manufacturer')
          .where({ id: req.params.id })
          .update({
            manufacturer_name,
            type_of_entity: type_entity_manufacturer[0].id,
            name_of_scheme,
            registration_no,
            manufacturer_tin,
            manufacturer_bin,
            website_link,
            corporate_ofc_address,
            corporate_ofc_address_1,
            corporate_ofc_address_2,
            corporate_ofc_postal_code,
            corporate_ofc_post_office,
            corporate_ofc_thana,
            corporate_ofc_district,
            corporate_ofc_division,
            nature_of_business,
            alternative_ofc_address,
            alternative_address_1,
            alternative_address_2,
            alternative_postal_code,
            alternative_post_office,
            alternative_thana,
            alternative_district,
            alternative_division,
            official_phone,
            official_email,
            name_of_authorized_representative,
            autho_rep_full_name,
            autho_rep_nid,
            autho_rep_designation,
            autho_rep_phone,
            autho_rep_email,
            updated_at: new Date(),
            updated_by,
          });
        if (manufacturer_update <= 0) reject(sendApiResult(false, 'Could not Found Manufacturer'));
        resolve(
          sendApiResult(
            true,
            'Manufacturer updated Successfully',
            manufacturer_update,
          ),
        );
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

module.exports = FileUpload;
