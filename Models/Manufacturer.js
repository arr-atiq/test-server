const moment = require("moment");
const express = require("express");
const fs = require('fs');
const excel = require("excel4node");
const { sendApiResult, getSettingsValue } = require("../controllers/helper");
const { ValidateNID, ValidatePhoneNumber, ValidateEmail, duplication_manufacturer, randomPasswordGenerator, sendReportApiResult, generateUserIDMidDigitForLogin } = require("../controllers/helperController");
const knex = require("../config/database");
const { default: axios } = require("axios");

const FileUpload = function () { };
require("dotenv").config();

FileUpload.insertExcelData = function (rows, filename, req) {
  var password;
  var link_code;
  var user_Id;
  var invalidated_rows_arr = [];
  var duplicated_rows_arr = [];
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
          }

          const user_roles = await knex
            .from("APSISIPDC.cr_user_roles")
            .select("id")
            .where("status", "Active")
            .whereIn("user_type", folder_name);

          const user_role_id = user_roles[0].id;

          // Type of entity scope - start
          const type_entity_arr = {};
          const type_entity = await knex
            .from("APSISIPDC.cr_manufacturer_type_entity")
            .select("id", "name")
            .where("status", "Active");
          if (Object.keys(type_entity).length != 0) {
            for (let i = 0; i < type_entity.length; i++) {
              type_entity_arr[type_entity[i].name.trim()] = type_entity[i].id;
            }
          }

          // Type of entity scope - end

          // Nature of business scope - start
          const nature_business_arr = {};
          const nature_business = await knex
            .from("APSISIPDC.cr_manufacturer_nature_business")
            .select("id", "name")
            .where("status", "Active");

          if (Object.keys(nature_business).length != 0) {
            for (let i = 0; i < nature_business.length; i++) {
              nature_business_arr[nature_business[i].name] =
                nature_business[i].id;
            }
          }
          // Nature of business scope - end

          // const all_Reg_No_array = [];
          // const all_Official_Email_array = [];
          // const all_Official_Phone_array = [];
          // const all_Name_array = [];
          const data_array = [];
          const unuploaded_data_array = [];
          const invalidate_data_array = [];
          if (Object.keys(rows).length != 0) {

            // for (let index = 0; index < rows.length; index++) {
            //   all_Reg_No_array[index] = rows[index].Manufacturer_Registration_No;
            //   all_Official_Email_array[index] = rows[index].Official_Email_ID;
            //   all_Official_Phone_array[index] = rows[index].Official_Phone_Number;
            //   all_Name_array[index] = rows[index].Manufacturer_Name;
            // }

            for (let index = 0; index < rows.length; index++) {
              const reg_no = rows[index].Manufacturer_Registration_No;
              const email = rows[index].Official_Email_ID;
              const phone = rows[index].Official_Phone_Number;
              const person_email = rows[index].Authorized_Representative_Official_Email_ID;
              const person_phone = rows[index].Authorized_Representative_Mobile_No;
              const tin = rows[index].Manufacturer_TIN;
              const name = rows[index].Manufacturer_Name;
              const nid = rows[index].Authorized_Representative_NID;
              const reg = reg_no.toString();

              const validNID = ValidateNID(nid);
              const validPhoneNumber = ValidatePhoneNumber(phone.toString());
              const validEmail = ValidateEmail(email);
              const validPersonPhoneNumber = ValidatePhoneNumber(person_phone.toString());
              const validPersonEmail = ValidateEmail(person_email);

              if (!validNID || !validPhoneNumber || !validEmail || !validPersonPhoneNumber || !validPersonEmail) {

                let invalidStr = "invalid columns - ";
                if (!validNID) {
                  invalidStr = invalidStr + "NID " + ", ";
                }
                if (!validPhoneNumber) {
                  invalidStr = invalidStr + "Official_Phone_Number " + ", ";
                }
                if (!validEmail) {
                  invalidStr = invalidStr + "Official_Email_ID " + ", ";
                }
                if (!validPersonPhoneNumber) {
                  invalidStr = invalidStr + "Authorized_Representative_Mobile_No " + ", ";
                }
                if (!validPersonEmail) {
                  invalidStr = invalidStr + "Authorized_Representative_Official_Email_ID " + ", ";
                }

                const temp_data = {
                  Manufacturer_Name: rows[index].Manufacturer_Name,
                  Type_of_Entity: type_entity_arr[rows[index].Type_of_Entity.trim()],
                  Name_of_Scheme: rows[index]?.Name_of_Scheme ?? " ",
                  Manufacturer_Registration_No:
                    rows[index].Manufacturer_Registration_No,
                  Manufacturer_TIN: rows[index]?.Manufacturer_TIN ?? " ",
                  Manufacturer_BIN: rows[index]?.Manufacturer_BIN ?? " ",
                  Website_URL: rows[index]?.Website_URL ?? " ",
                  Registered_Corporate_Office_Address_in_Bangladesh:
                    rows[index]?.Registered_Corporate_Office_Address_in_Bangladesh ?? " ",
                  Corporate_Office_Address_Line_1:
                    rows[index]?.Corporate_Office_Address_Line_1 ?? " ",
                  Corporate_Office_Address_Line_2:
                    rows[index]?.Corporate_Office_Address_Line_2 ?? " ",
                  Corporate_Office_Postal_Code:
                    rows[index]?.Corporate_Office_Postal_Code ?? " ",
                  Corporate_Office_Post_Office:
                    rows[index]?.Corporate_Office_Post_Office ?? " ",
                  Corporate_Office_Thana: rows[index]?.Corporate_Office_Thana ?? " ",
                  Corporate_Office_District:
                    rows[index]?.Corporate_Office_District ?? " ",
                  Corporate_Office_Division:
                    rows[index]?.Corporate_Office_Division ?? " ",
                  Nature_of_Business:
                    nature_business_arr[rows[index].Nature_of_Business],
                  Alternative_Addresses: rows[index]?.Alternative_Addresses ?? " ",
                  Alternative_Address_Line_1:
                    rows[index]?.Alternative_Address_Line_1 ?? " ",
                  Alternative_Address_Line_2:
                    rows[index]?.Alternative_Address_Line_2 ?? " ",
                  Alternative_Postal_Code: rows[index]?.Alternative_Postal_Code ?? " ",
                  Alternative_Post_Office: rows[index]?.Alternative_Post_Office ?? " ",
                  Alternative_Thana: rows[index]?.Alternative_Thana ?? " ",
                  Alternative_District: rows[index]?.Alternative_District ?? " ",
                  Alternative_Division: rows[index]?.Alternative_Division ?? " ",
                  Official_Phone_Number: rows[index].Official_Phone_Number,
                  Official_Email_ID: rows[index].Official_Email_ID,
                  Authorized_Representative_Name:
                    rows[index]?.Authorized_Representative_Name ?? " ",
                  Authorized_Representative_Full_Name:
                    rows[index]?.Authorized_Representative_Full_Name ?? " ",
                  Authorized_Representative_NID:
                    rows[index].Authorized_Representative_NID,
                  Authorized_Representative_Designation:
                    rows[index]?.Authorized_Representative_Designation ?? " ",
                  Authorized_Representative_Mobile_No:
                    rows[index].Authorized_Representative_Mobile_No,
                  Authorized_Representative_Official_Email_ID:
                    rows[index].Authorized_Representative_Official_Email_ID,
                  Remarks_Invalidated: invalidStr,
                };
                invalidated_rows_arr.push(temp_data);
                invalidate_data_array.push(temp_data);
                continue;
              }

              const duplication_checkReg = await knex
                .count("cr_manufacturer.registration_no as count")
                .from("APSISIPDC.cr_manufacturer")
                .where(
                  "APSISIPDC.cr_manufacturer.registration_no",
                  reg.toString()
                );

              const duplication_check_val_reg = parseInt(
                duplication_checkReg[0].count
              );

              const duplication_checkEmail = await knex
                .count("cr_manufacturer.official_email as count")
                .from("APSISIPDC.cr_manufacturer")
                .where(
                  "APSISIPDC.cr_manufacturer.official_email",
                  email.toString()
                );

              const duplication_check_val_email = parseInt(
                duplication_checkEmail[0].count
              );

              const duplication_checkEmail_user_table = await knex
                .count("cr_users.email as count")
                .from("APSISIPDC.cr_users")
                .where(
                  "APSISIPDC.cr_users.email",
                  email.toString()
                );

              const duplication_check_val_email_user_table = parseInt(
                duplication_checkEmail_user_table[0].count
              );

              const duplication_checkPhone = await knex
                .count("cr_manufacturer.official_phone as count")
                .from("APSISIPDC.cr_manufacturer")
                .where(
                  "APSISIPDC.cr_manufacturer.official_phone",
                  phone.toString()
                );

              const duplication_check_val_phone = parseInt(
                duplication_checkPhone[0].count
              );

              const duplication_checkTIN = await knex
                .count("cr_manufacturer.manufacturer_tin as count")
                .from("APSISIPDC.cr_manufacturer")
                .where(
                  "APSISIPDC.cr_manufacturer.manufacturer_tin",
                  tin.toString()
                );

              const duplication_check_val_tin = parseInt(
                duplication_checkTIN[0].count
              );

              const duplication_checkName = await knex
                .count("cr_manufacturer.manufacturer_name as count")
                .from("APSISIPDC.cr_manufacturer")
                .where(
                  "APSISIPDC.cr_manufacturer.manufacturer_name",
                  name.toString()
                );

              const duplication_check_val_name = parseInt(
                duplication_checkName[0].count
              );

              const duplication_checkNID = await knex
                .count("cr_manufacturer.autho_rep_nid as count")
                .from("APSISIPDC.cr_manufacturer")
                .where(
                  "APSISIPDC.cr_manufacturer.autho_rep_nid",
                  nid.toString()
                );

              const duplication_check_val_nid = parseInt(
                duplication_checkNID[0].count
              );

              // const regNoSubArray = all_Reg_No_array.slice(0, index);
              // const officialEmailSubArray = all_Official_Email_array.slice(0, index);
              // const officialPhoneSubArray = all_Official_Phone_array.slice(0, index);
              // const name_SubArray = all_Name_array.slice(0, index);

              // const regNoDuplicateExcel = regNoSubArray.includes(reg_no);
              // const officialEmailDuplicateExcel = officialEmailSubArray.includes(email);
              // const officialPhoneDuplicateExcel = officialPhoneSubArray.includes(phone);
              // const empCodeDuplicateExcel = name_SubArray.includes(name);

              if (duplication_check_val_reg == 0
                && duplication_check_val_email == 0
                && duplication_check_val_phone == 0
                && duplication_check_val_name == 0
                && duplication_check_val_email_user_table == 0) {
                const temp_data = {
                  Manufacturer_Name: rows[index].Manufacturer_Name,
                  Type_of_Entity: type_entity_arr[rows[index].Type_of_Entity.trim()],
                  Name_of_Scheme: rows[index]?.Name_of_Scheme ?? " ",
                  Manufacturer_Registration_No:
                    rows[index].Manufacturer_Registration_No,
                  Manufacturer_TIN: rows[index]?.Manufacturer_TIN ?? " ",
                  Manufacturer_BIN: rows[index]?.Manufacturer_BIN ?? " ",
                  Website_URL: rows[index]?.Website_URL ?? " ",
                  Registered_Corporate_Office_Address_in_Bangladesh:
                    rows[index]?.Registered_Corporate_Office_Address_in_Bangladesh ?? " ",
                  Corporate_Office_Address_Line_1:
                    rows[index]?.Corporate_Office_Address_Line_1 ?? " ",
                  Corporate_Office_Address_Line_2:
                    rows[index]?.Corporate_Office_Address_Line_2 ?? " ",
                  Corporate_Office_Postal_Code:
                    rows[index]?.Corporate_Office_Postal_Code ?? " ",
                  Corporate_Office_Post_Office:
                    rows[index]?.Corporate_Office_Post_Office ?? " ",
                  Corporate_Office_Thana: rows[index]?.Corporate_Office_Thana ?? " ",
                  Corporate_Office_District:
                    rows[index]?.Corporate_Office_District ?? " ",
                  Corporate_Office_Division:
                    rows[index]?.Corporate_Office_Division ?? " ",
                  Nature_of_Business:
                    nature_business_arr[rows[index].Nature_of_Business],
                  Alternative_Addresses: rows[index]?.Alternative_Addresses ?? " ",
                  Alternative_Address_Line_1:
                    rows[index]?.Alternative_Address_Line_1 ?? " ",
                  Alternative_Address_Line_2:
                    rows[index]?.Alternative_Address_Line_2 ?? " ",
                  Alternative_Postal_Code: rows[index]?.Alternative_Postal_Code ?? " ",
                  Alternative_Post_Office: rows[index]?.Alternative_Post_Office ?? " ",
                  Alternative_Thana: rows[index]?.Alternative_Thana ?? " ",
                  Alternative_District: rows[index]?.Alternative_District ?? " ",
                  Alternative_Division: rows[index]?.Alternative_Division ?? " ",
                  Official_Phone_Number: rows[index].Official_Phone_Number,
                  Official_Email_ID: rows[index].Official_Email_ID,
                  Authorized_Representative_Name:
                    rows[index]?.Authorized_Representative_Name ?? " ",
                  Authorized_Representative_Full_Name:
                    rows[index]?.Authorized_Representative_Full_Name ?? " ",
                  Authorized_Representative_NID:
                    rows[index].Authorized_Representative_NID,
                  Authorized_Representative_Designation:
                    rows[index]?.Authorized_Representative_Designation ?? " ",
                  Authorized_Representative_Mobile_No:
                    rows[index].Authorized_Representative_Mobile_No,
                  Authorized_Representative_Official_Email_ID:
                    rows[index].Authorized_Representative_Official_Email_ID,
                };
                data_array.push(temp_data);
              } else {

                let duplicateStr = "duplicate columns - ";
                if (duplication_check_val_reg != 0) {
                  duplicateStr = duplicateStr + "Manufacturer_Registration_No " + ", ";
                }
                if (duplication_check_val_email != 0) {
                  duplicateStr = duplicateStr + "Official_Email_ID " + ", ";
                }
                if (duplication_check_val_email_user_table != 0) {
                  duplicateStr = duplicateStr + "Official_Email_ID is existed in system " + ", ";
                }
                if (duplication_check_val_phone != 0) {
                  duplicateStr = duplicateStr + "Official_Phone_Number " + ", ";
                }
                if (duplication_check_val_name != 0) {
                  duplicateStr = duplicateStr + "Manufacturer_Name " + ", ";
                }

                const temp_data = {
                  Manufacturer_Name: rows[index].Manufacturer_Name,
                  Type_of_Entity: type_entity_arr[rows[index].Type_of_Entity.trim()],
                  Name_of_Scheme: rows[index]?.Name_of_Scheme ?? null,
                  Manufacturer_Registration_No:
                    rows[index].Manufacturer_Registration_No,
                  Manufacturer_TIN: rows[index]?.Manufacturer_TIN ?? " ",
                  Manufacturer_BIN: rows[index]?.Manufacturer_BIN ?? " ",
                  Website_URL: rows[index]?.Website_URL ?? " ",
                  Registered_Corporate_Office_Address_in_Bangladesh:
                    rows[index]?.Registered_Corporate_Office_Address_in_Bangladesh ?? " ",
                  Corporate_Office_Address_Line_1:
                    rows[index]?.Corporate_Office_Address_Line_1 ?? " ",
                  Corporate_Office_Address_Line_2:
                    rows[index]?.Corporate_Office_Address_Line_2 ?? " ",
                  Corporate_Office_Postal_Code:
                    rows[index]?.Corporate_Office_Postal_Code ?? " ",
                  Corporate_Office_Post_Office:
                    rows[index]?.Corporate_Office_Post_Office ?? " ",
                  Corporate_Office_Thana: rows[index]?.Corporate_Office_Thana ?? " ",
                  Corporate_Office_District:
                    rows[index]?.Corporate_Office_District ?? " ",
                  Corporate_Office_Division:
                    rows[index]?.Corporate_Office_Division ?? " ",
                  Nature_of_Business:
                    nature_business_arr[rows[index].Nature_of_Business],
                  Alternative_Addresses: rows[index]?.Alternative_Addresses ?? " ",
                  Alternative_Address_Line_1:
                    rows[index]?.Alternative_Address_Line_1 ?? " ",
                  Alternative_Address_Line_2:
                    rows[index]?.Alternative_Address_Line_2 ?? " ",
                  Alternative_Postal_Code: rows[index]?.Alternative_Postal_Code ?? " ",
                  Alternative_Post_Office: rows[index]?.Alternative_Post_Office ?? " ",
                  Alternative_Thana: rows[index]?.Alternative_Thana ?? " ",
                  Alternative_District: rows[index]?.Alternative_District ?? " ",
                  Alternative_Division: rows[index]?.Alternative_Division ?? " ",
                  Official_Phone_Number: rows[index].Official_Phone_Number,
                  Official_Email_ID: rows[index].Official_Email_ID,
                  Authorized_Representative_Name:
                    rows[index]?.Authorized_Representative_Name ?? " ",
                  Authorized_Representative_Full_Name:
                    rows[index]?.Authorized_Representative_Full_Name ?? " ",
                  Authorized_Representative_NID:
                    rows[index].Authorized_Representative_NID,
                  Authorized_Representative_Designation:
                    rows[index]?.Authorized_Representative_Designation ?? " ",
                  Authorized_Representative_Mobile_No:
                    rows[index].Authorized_Representative_Mobile_No,
                  Authorized_Representative_Official_Email_ID:
                    rows[index].Authorized_Representative_Official_Email_ID,
                  Remarks_Duplicated: duplicateStr,
                };
                duplicated_rows_arr.push(temp_data);
                unuploaded_data_array.push(temp_data);
              }
            }
          }

          if (
            Object.keys(rows).length != 0 &&
            Object.keys(data_array).length == 0
          ) {
            const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
            const empty_insert_log = {
              sys_date: new Date(date),
              file_for: folder_name,
              file_path: `public/configuration_file/${folder_name}`,
              file_name: filename,
              found_rows: Object.keys(rows).length,
              upload_rows: Object.keys(data_array).length,
              created_by: parseInt(req.user_id),
            };
            await knex("APSISIPDC.cr_bulk_upload_file_log").insert(
              empty_insert_log
            );
            msg = "File Uploaded successfully!";
            var response = {
              "insert_log": empty_insert_log,
              "total_invalidated": invalidated_rows_arr.length,
              "total_duplicated": duplicated_rows_arr.length
            }
            resolve(sendApiResult(true, msg, response));
          }

          if (Object.keys(invalidate_data_array).length != 0) {
            for (let index = 0; index < invalidate_data_array.length; index++) {
              const invalidated_manufacture = {
                manufacturer_name: invalidate_data_array[index].Manufacturer_Name,
                type_of_entity: invalidate_data_array[index].Type_of_Entity,
                name_of_scheme: invalidate_data_array[index]?.Name_of_Scheme ?? ' ',
                registration_no: invalidate_data_array[index].Manufacturer_Registration_No,
                manufacturer_tin: invalidate_data_array[index].Manufacturer_TIN,
                manufacturer_bin: invalidate_data_array[index].Manufacturer_BIN,
                website_link: invalidate_data_array[index].Website_URL,
                corporate_ofc_address:
                  invalidate_data_array[index]
                    .Registered_Corporate_Office_Address_in_Bangladesh,
                corporate_ofc_address_1:
                  invalidate_data_array[index].Corporate_Office_Address_Line_1,
                corporate_ofc_address_2:
                  invalidate_data_array[index].Corporate_Office_Address_Line_2,
                corporate_ofc_postal_code:
                  invalidate_data_array[index].Corporate_Office_Postal_Code,
                corporate_ofc_post_office:
                  invalidate_data_array[index].Corporate_Office_Post_Office,
                corporate_ofc_thana: invalidate_data_array[index].Corporate_Office_Thana,
                corporate_ofc_district:
                  invalidate_data_array[index].Corporate_Office_District,
                corporate_ofc_division:
                  invalidate_data_array[index].Corporate_Office_Division,
                nature_of_business: invalidate_data_array[index].Nature_of_Business,
                alternative_ofc_address:
                  invalidate_data_array[index].Alternative_Addresses,
                alternative_address_1:
                  invalidate_data_array[index].Alternative_Address_Line_1,
                alternative_address_2:
                  invalidate_data_array[index].Alternative_Address_Line_2,
                alternative_postal_code:
                  invalidate_data_array[index].Alternative_Postal_Code,
                alternative_post_office:
                  invalidate_data_array[index].Alternative_Post_Office,
                alternative_thana: invalidate_data_array[index].Alternative_Thana,
                alternative_district: invalidate_data_array[index].Alternative_District,
                alternative_division: invalidate_data_array[index].Alternative_Division,
                official_phone: invalidate_data_array[index].Official_Phone_Number,
                official_email: invalidate_data_array[index].Official_Email_ID,
                name_of_authorized_representative:
                  invalidate_data_array[index].Authorized_Representative_Name,
                autho_rep_full_name:
                  invalidate_data_array[index].Authorized_Representative_Full_Name,
                autho_rep_nid: invalidate_data_array[index].Authorized_Representative_NID,
                autho_rep_designation:
                  invalidate_data_array[index].Authorized_Representative_Designation,
                autho_rep_phone:
                  invalidate_data_array[index]?.Authorized_Representative_Mobile_No ?? '',
                autho_rep_email:
                  invalidate_data_array[index]?.Authorized_Representative_Official_Email_ID ?? '',
                remarks_invalidated:
                  invalidate_data_array[index]?.Remarks_Invalidated ?? '',
                created_by: req.user_id,
              };

              await knex("APSISIPDC.cr_manufacturer_invalidated_data")
                .insert(invalidated_manufacture);
            }
          }

          if (Object.keys(unuploaded_data_array).length != 0) {
            for (let index = 0; index < unuploaded_data_array.length; index++) {
              const unuploaded_manufacture = {
                manufacturer_name: unuploaded_data_array[index].Manufacturer_Name,
                type_of_entity: unuploaded_data_array[index].Type_of_Entity,
                name_of_scheme: unuploaded_data_array[index]?.Name_of_Scheme ?? ' ',
                registration_no: unuploaded_data_array[index].Manufacturer_Registration_No,
                manufacturer_tin: unuploaded_data_array[index].Manufacturer_TIN,
                manufacturer_bin: unuploaded_data_array[index].Manufacturer_BIN,
                website_link: unuploaded_data_array[index].Website_URL,
                corporate_ofc_address:
                  unuploaded_data_array[index]
                    .Registered_Corporate_Office_Address_in_Bangladesh,
                corporate_ofc_address_1:
                  unuploaded_data_array[index].Corporate_Office_Address_Line_1,
                corporate_ofc_address_2:
                  unuploaded_data_array[index].Corporate_Office_Address_Line_2,
                corporate_ofc_postal_code:
                  unuploaded_data_array[index].Corporate_Office_Postal_Code,
                corporate_ofc_post_office:
                  unuploaded_data_array[index].Corporate_Office_Post_Office,
                corporate_ofc_thana: unuploaded_data_array[index].Corporate_Office_Thana,
                corporate_ofc_district:
                  unuploaded_data_array[index].Corporate_Office_District,
                corporate_ofc_division:
                  unuploaded_data_array[index].Corporate_Office_Division,
                nature_of_business: unuploaded_data_array[index].Nature_of_Business,
                alternative_ofc_address:
                  unuploaded_data_array[index].Alternative_Addresses,
                alternative_address_1:
                  unuploaded_data_array[index].Alternative_Address_Line_1,
                alternative_address_2:
                  unuploaded_data_array[index].Alternative_Address_Line_2,
                alternative_postal_code:
                  unuploaded_data_array[index].Alternative_Postal_Code,
                alternative_post_office:
                  unuploaded_data_array[index].Alternative_Post_Office,
                alternative_thana: unuploaded_data_array[index].Alternative_Thana,
                alternative_district: unuploaded_data_array[index].Alternative_District,
                alternative_division: unuploaded_data_array[index].Alternative_Division,
                official_phone: unuploaded_data_array[index].Official_Phone_Number,
                official_email: unuploaded_data_array[index].Official_Email_ID,
                name_of_authorized_representative:
                  unuploaded_data_array[index].Authorized_Representative_Name,
                autho_rep_full_name:
                  unuploaded_data_array[index].Authorized_Representative_Full_Name,
                autho_rep_nid: unuploaded_data_array[index].Authorized_Representative_NID,
                autho_rep_designation:
                  unuploaded_data_array[index].Authorized_Representative_Designation,
                autho_rep_phone:
                  unuploaded_data_array[index]?.Authorized_Representative_Mobile_No ?? ' ',
                autho_rep_email:
                  unuploaded_data_array[index]?.Authorized_Representative_Official_Email_ID ?? ' ',
                remarks_duplications: unuploaded_data_array[index]?.Remarks_Duplicated ?? ' ',
                created_by: req.user_id,
              };

              console.log(unuploaded_manufacture);
              await knex("APSISIPDC.cr_manufacturer_unuploaded_data")
                .insert(unuploaded_manufacture);
            }
          }

          if (Object.keys(data_array).length != 0) {
            const manufacture_insert_ids = [];
            const user_insert_ids = [];
            for (let index = 0; index < data_array.length; index++) {
              const reg_no_insert_data = data_array[index].Manufacturer_Registration_No;
              const name_insert_data = data_array[index].Manufacturer_Name;
              const email_insert_data = data_array[index].Official_Email_ID;
              const mobile_insert_data = data_array[index].Official_Phone_Number;
              const reg_no_string = reg_no_insert_data.toString();

              const duplication_checkReg_insert_data = await knex
                .count("cr_manufacturer.registration_no as count")
                .from("APSISIPDC.cr_manufacturer")
                .where(
                  "APSISIPDC.cr_manufacturer.registration_no",
                  reg_no_string.toString()
                );
              const duplication_check_val_reg_insert_data = parseInt(
                duplication_checkReg_insert_data[0].count
              );

              const duplication_checkEmail_insert_data = await knex
                .count("cr_manufacturer.official_email as count")
                .from("APSISIPDC.cr_manufacturer")
                .where(
                  "APSISIPDC.cr_manufacturer.official_email",
                  email_insert_data.toString()
                );
              const duplication_check_val_email_insert_data = parseInt(
                duplication_checkEmail_insert_data[0].count
              );

              const duplication_checkPhone_insert_data = await knex
                .count("cr_manufacturer.official_phone as count")
                .from("APSISIPDC.cr_manufacturer")
                .where(
                  "APSISIPDC.cr_manufacturer.official_phone",
                  mobile_insert_data.toString()
                );
              const duplication_check_val_phone_insert_data = parseInt(
                duplication_checkPhone_insert_data[0].count
              );

              const duplication_checkName_insert_data = await knex
                .count("cr_manufacturer.manufacturer_name as count")
                .from("APSISIPDC.cr_manufacturer")
                .where(
                  "APSISIPDC.cr_manufacturer.manufacturer_name",
                  name_insert_data.toString()
                );
              const duplication_check_val_name_insert_data = parseInt(
                duplication_checkName_insert_data[0].count
              );

              if (duplication_check_val_reg_insert_data != 0
                || duplication_check_val_email_insert_data != 0
                || duplication_check_val_phone_insert_data != 0
                || duplication_check_val_name_insert_data != 0) {

                let duplicateStr = "duplicate columns - ";
                if (duplication_check_val_reg_insert_data != 0) {
                  duplicateStr = duplicateStr + "Manufacturer_Registration_No " + ", ";
                }
                if (duplication_check_val_email_insert_data != 0) {
                  duplicateStr = duplicateStr + "Official_Email_ID " + ", ";
                }
                if (duplication_check_val_phone_insert_data != 0) {
                  duplicateStr = duplicateStr + "Official_Phone_Number " + ", ";
                }
                if (duplication_check_val_name_insert_data != 0) {
                  duplicateStr = duplicateStr + "Manufacturer_Name " + ", ";
                }
                const duplicate_data_array = {
                  manufacturer_name: data_array[index].Manufacturer_Name,
                  type_of_entity: data_array[index].Type_of_Entity,
                  name_of_scheme: data_array[index]?.Name_of_Scheme ?? ' ',
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
                    data_array[index]?.Authorized_Representative_Mobile_No ?? '',
                  autho_rep_email:
                    data_array[index]?.Authorized_Representative_Official_Email_ID ?? '',
                  remarks_duplications: duplicateStr,
                  created_by: req.user_id,
                };
                duplicated_rows_arr.push(duplicate_data_array);
                await knex("APSISIPDC.cr_manufacturer_unuploaded_data")
                  .insert(duplicate_data_array);

                continue;

              }

              const team_manufacture = {
                manufacturer_name: data_array[index].Manufacturer_Name,
                type_of_entity: data_array[index].Type_of_Entity,
                name_of_scheme: data_array[index]?.Name_of_Scheme ?? ' ',
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
                  data_array[index]?.Authorized_Representative_Mobile_No ?? '',
                autho_rep_email:
                  data_array[index]?.Authorized_Representative_Official_Email_ID ?? '',
                created_by: req.user_id,
              };
              console.log(team_manufacture);
              password = randomPasswordGenerator()
              link_code = randomPasswordGenerator()
              const insert_manufacture = await knex("APSISIPDC.cr_manufacturer")
                .insert(team_manufacture)
                .returning("id");

              user_Id = insert_manufacture ? "MAN-" + generateUserIDMidDigitForLogin(insert_manufacture[0], 6) : 0;

              if (insert_manufacture) {
                manufacture_insert_ids.push(insert_manufacture[0]);
                try {
                  const sendMail = await axios.post(`${process.env.HOSTIP}/mail/tempSendmail`, {
                    "email": data_array[index].Official_Email_ID,
                    "mail_subject": "IPDC DANA | Registration Completed",
                    "mail_body": `
                    <p>Greetings from IPDC DANA!</p>
                    <p>Congratulations! Your registration
                    with IPDC DANA has been
                    completed. Please enter the below
                    mentioned user ID and password
                    at www.ipdcDANA.com and login.</p>
                    <p>User ID : ${user_Id}</p>
                    <p>Your Temporary Password : ${password}</p>
                    <p>For Password Reset Please Click this link : ${process.env.CLIENTIP}/reset_password/${link_code}  </p>
                    <p>Regards, </p>
                    <p>IPDC Finance</p>
                    `
                  })
                  console.log('sendMailsendMailsendMail', sendMail)
                }
                catch (err) {
                  console.log('errorerrorerrorerrorerror', err)
                }
              }


              const temp_user = {
                name: data_array[index].Manufacturer_Name,
                email: data_array[index].Official_Email_ID,
                phone: data_array[index].Official_Phone_Number,
                password: "5efd3b0647df9045c240729d31622c79",
                password: password,
                link_token: link_code,
                cr_user_type: folder_name,
                user_id: user_Id
              };
              const insert_user = await knex("APSISIPDC.cr_users")
                .insert(temp_user)
                .returning("id");
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
                  "APSISIPDC.cr_manufacturer_user"
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
                  "APSISIPDC.cr_user_wise_role"
                ).insert(user_wise_role);
                if (insert_user_wise_role) {
                  is_user_wise_role_insert = 1;
                }
              }
            }

            if (
              is_manufacture_wise_user_insert == 1 &&
              is_user_wise_role_insert == 1
            ) {
              const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
              const insert_log = {
                sys_date: new Date(date),
                file_for: folder_name,
                file_path: `public/configuration_file/${folder_name}`,
                file_name: filename,
                found_rows: Object.keys(rows).length,
                upload_rows: Object.keys(manufacture_insert_ids).length,
                created_by: parseInt(req.user_id),
              };
              await knex("APSISIPDC.cr_bulk_upload_file_log").insert(
                insert_log
              );
              msg = "File Uploaded successfully!";
              var response = {
                "insert_log": insert_log,
                "total_invalidated": invalidated_rows_arr.length,
                "total_duplicated": duplicated_rows_arr.length
              }
              resolve(sendApiResult(true, msg, response));
            }
          } else {
            msg = "No Data Founds to Update";
            resolve(sendApiResult(true, msg));
          }
        })
        .then((result) => { })
        .catch((error) => {
          reject(sendApiResult(false, "Data not inserted."));
        });
    } catch (error) {

      reject(sendApiResult(false, error.message));
    }
  }).catch((error) => {
    console.log('--------------------------------2nd error', error);
  });
};

FileUpload.getManufacturerListDropDown = function (req) {
  const { distributor_id } = req.query;
  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_manufacturer")
        .leftJoin(
          "APSISIPDC.cr_manufacturer_vs_distributor",
          "cr_manufacturer_vs_distributor.manufacturer_id",
          "cr_manufacturer.id"
        )
        .select(
          "cr_manufacturer.id",
          "cr_manufacturer.manufacturer_name"
        )
        .where(function () {
          if (distributor_id) {
            this.where("cr_manufacturer_vs_distributor.distributor_id", distributor_id)
          }
        })
        .orderBy("cr_manufacturer.id", "desc")
        .distinct();
      if (data == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getManufacturerList = function (req) {
  const { page, per_page } = req.query;
  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_manufacturer")
        .leftJoin(
          "APSISIPDC.cr_manufacturer_type_entity",
          "cr_manufacturer_type_entity.id",
          "cr_manufacturer.type_of_entity"
        )
        .where("activation_status", "Active")
        .select(
          "cr_manufacturer.id",
          "manufacturer_name",
          knex.raw('"cr_manufacturer_type_entity"."name" as "type_of_entity"'),
          // "name_of_scheme",
          "registration_no",
          "manufacturer_tin",
          "manufacturer_bin",
          "website_link",
          "corporate_ofc_address",
          "corporate_ofc_address_1",
          "corporate_ofc_address_2",
          "corporate_ofc_postal_code",
          "corporate_ofc_post_office",
          "corporate_ofc_thana",
          "corporate_ofc_district",
          "corporate_ofc_division",
          "nature_of_business",
          "alternative_ofc_address",
          "alternative_address_1",
          "alternative_address_2",
          "alternative_postal_code",
          "alternative_post_office",
          "alternative_thana",
          "alternative_district",
          "alternative_division",
          "official_phone",
          "official_email",
          "name_of_authorized_representative",
          "autho_rep_full_name",
          "autho_rep_nid",
          "autho_rep_designation",
          "autho_rep_phone",
          "autho_rep_email"
        )
        .orderBy("cr_manufacturer.id", "desc")
      if (data == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.deleteManufacturer = function ({ id }) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        const manufacturer_delete = await trx("APSISIPDC.cr_manufacturer")
          .where({ id })
          .delete();
        if (manufacturer_delete <= 0)
          reject(sendApiResult(false, "Could not Found manufacturer"));
        resolve(
          sendApiResult(
            true,
            "Manufacturer Deleted Successfully",
            manufacturer_delete
          )
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
      // const type_entity_manufacturer = await knex(
      //   "APSISIPDC.cr_manufacturer_type_entity"
      // )
      //   .where("name", type_of_entity)
      //   .select("id");
      await knex.transaction(async (trx) => {
        const manufacturer_update = await trx("APSISIPDC.cr_manufacturer")
          .where({ id: req.params.id })
          .update({
            manufacturer_name,
            // type_of_entity: type_entity_manufacturer[0]?.id,
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
        if (manufacturer_update <= 0)
          reject(sendApiResult(false, "Could not Found Manufacturer"));
        resolve(
          sendApiResult(
            true,
            "Manufacturer updated Successfully",
            manufacturer_update
          )
        );
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.updateAllSchemasByManufacturer = function (req) {
  const { manufacturer_id, scheme_id } = req.body;
  return new Promise(async (resolve, reject) => {
    try {
      const distributor_ids_Array_Obj = await knex(
        "APSISIPDC.cr_retailer_manu_scheme_mapping"
      )
        .where("manufacturer_id", manufacturer_id)
        .select("distributor_id");

      const distributor_ids = distributor_ids_Array_Obj.map(
        (id) => id.distributor_id
      );
      await knex.transaction(async (trx) => {
        const scheme_update = await trx(
          "APSISIPDC.cr_retailer_manu_scheme_mapping"
        )
          .whereIn("distributor_id", distributor_ids)
          .where("manufacturer_id", manufacturer_id)
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


FileUpload.retailersByManufacturer = function (req) {
  const {
    manufacturer_id,
  } = req.params;
  return new Promise(async (resolve, reject) => {

    try {
      await knex.transaction(async (trx) => {
        const retailers = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .where("cr_retailer.status", "Active")
          // .where("cr_retailer_vs_sales_agent.status", "Active")
          // .where("cr_retailer_vs_sales_agent.sales_agent_id", salesagent_id)
          // .where("cr_retailer_vs_sales_agent.manufacturer_id", manufacturer_id)
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
          .select(
            "cr_retailer.id",
            "cr_retailer.retailer_name",
            "cr_retailer.retailer_code",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer_manu_scheme_mapping.ac_number_1rmn",
            "cr_retailer_manu_scheme_mapping.processing_fee",
            "cr_retailer_manu_scheme_mapping.crm_approve_limit",
          );

        if (retailers.length == 0) resolve(sendApiResult(true, "No retailer found", retailers))
        resolve(
          sendApiResult(
            true,
            "List of retailers by sales agent and manaufacturer",
            retailers,
          )
        );
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.generateManufacturerAnnualReport = async (req, res) => {
  const { manufacturer_id, distributor_id, select_date } = req.query;
  const selectDate = moment(select_date).startOf('date').format('YYYY-MM-DD');
  const selectDatePreviousDay = moment(select_date).subtract(1, 'days').format('YYYY-MM-DD');
  const currentYearJuly = moment(select_date).startOf('year').add(6, 'months').format('YYYY-MM-DD');
  const previousYearJuly = moment(select_date).startOf('year').add(6, 'months').subtract(1, 'years').format('YYYY-MM-DD');
  const currentMonth = 1 + moment(selectDate, 'YYYY-MM-DD').month();
  const comparison_financial_year = currentMonth > 6 ? currentYearJuly : previousYearJuly;
  console.log(comparison_financial_year);

  return new Promise(async (resolve, reject) => {
    try {
      const manufacturer_info = await knex("APSISIPDC.cr_manufacturer")
        .where(function () {
          if (manufacturer_id) {
            this.where("cr_manufacturer.id", manufacturer_id);
          }
        })
        .select(
          "cr_manufacturer.id",
          "cr_manufacturer.manufacturer_name"
        );

      if (manufacturer_info.length == 0) {
        reject(sendReportApiResult(false, "Manufacturer Not Found"))
      }

      const manufacturer_annual_performance_Arr = [];

      for (let i = 0; i < manufacturer_info.length; i++) {
        const total_distributors = await knex
          .countDistinct("cr_manufacturer_vs_distributor.distributor_id as count")
          .from("APSISIPDC.cr_manufacturer_vs_distributor")
          .where("cr_manufacturer_vs_distributor.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_manufacturer_vs_distributor.distributor_id", distributor_id)
            }

            if (select_date) {
              this.whereRaw(`"cr_manufacturer_vs_distributor"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_manufacturer_vs_distributor"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_retailers = await knex
          .countDistinct("cr_retailer_manu_scheme_mapping.retailer_id as count")
          .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }

            if (select_date) {
              this.whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        // const total_supervisors = await knex
        //   .countDistinct("cr_supervisor.id as count")
        //   .from("APSISIPDC.cr_supervisor")
        //   .leftJoin(
        //     "APSISIPDC.cr_supervisor_distributor_manufacturer_map",
        //     "cr_supervisor_distributor_manufacturer_map.supervisor_id",
        //     "cr_supervisor.id"
        //   )
        //   .where("cr_supervisor.distributor_id", distributor_info[i].id)
        //   .where(function () {
        //     if (manufacturer_id) {
        //       this.where("cr_supervisor_distributor_manufacturer_map.manufacturer_id", manufacturer_id)
        //     }

        //     if (select_date) {
        //       this.whereRaw(`"cr_supervisor_distributor_manufacturer_map"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
        //       this.whereRaw(`"cr_supervisor_distributor_manufacturer_map"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
        //     }
        //   });

        // const total_salesagents = await knex
        //   .countDistinct("cr_sales_agent.id as count")
        //   .from("APSISIPDC.cr_sales_agent")
        //   .leftJoin(
        //     "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map",
        //     "cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id",
        //     "cr_sales_agent.id"
        //   )
        //   .where("cr_sales_agent.distributor_id", distributor_info[i].id)
        //   .where(function () {
        //     if (manufacturer_id) {
        //       this.where("cr_salesagent_supervisor_distributor_manufacturer_map.manufacturer_id", manufacturer_id)
        //     }
        //     if (select_date) {
        //       this.whereRaw(`"cr_salesagent_supervisor_distributor_manufacturer_map"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
        //       this.whereRaw(`"cr_salesagent_supervisor_distributor_manufacturer_map"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
        //     }
        //   });

        const principal_outstanding_blans = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.id",
            "cr_retailer_loan_calculation.manu_scheme_mapping_id"
          )
          .select("cr_retailer_loan_calculation.principal_outstanding")
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${selectDatePreviousDay}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          })
          .orderBy("cr_retailer_loan_calculation.id", "desc")
          .first();

        const principal_outstanding_beginning_blans =
          principal_outstanding_blans != undefined ? principal_outstanding_blans.principal_outstanding : 0;

        const total_amount = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.id",
            "cr_retailer_loan_calculation.manu_scheme_mapping_id"
          )
          .sum("cr_retailer_loan_calculation.disburshment as loan")
          .sum("cr_retailer_loan_calculation.repayment as collection")
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_blacklist_retailer = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .countDistinct("cr_retailer.id as count")
          .where("cr_retailer.retailer_status", "BLOCK")
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_retailer"."updated_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer"."updated_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_suspened_retailer = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .countDistinct("cr_retailer.id as count")
          .where("cr_retailer.retailer_status", "SUSPEND")
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_retailer"."updated_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer"."updated_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_transactions_number = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.id",
            "cr_retailer_loan_calculation.manu_scheme_mapping_id"
          )
          .count("cr_retailer_loan_calculation.id as count")
          .whereIn("cr_retailer_loan_calculation.transaction_type", ["DISBURSEMENT", "REPAYMENT"])
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const manufacturer_annual_performance_consolidated_info = {
          manufacturer_name: manufacturer_info[i].manufacturer_name,
          manufacturer_id: manufacturer_info[i].id,
          total_distributors: total_distributors[0].count,
          total_retailers: total_retailers[0].count,
          // total_supervisors: total_supervisors[0].count,
          // total_salesagents: total_salesagents[0].count,
          total_transactions_number: total_transactions_number[0].count,
          total_loan: total_amount[0].loan,
          total_collection: total_amount[0].collection,
          current_outstanding_amount: principal_outstanding_beginning_blans,
          total_blacklist_retailer: total_blacklist_retailer[0].count,
          total_suspened_retailer: total_suspened_retailer[0].count
        }

        manufacturer_annual_performance_Arr.push(manufacturer_annual_performance_consolidated_info);
      }
      const headers = [
        "Sr.",
        "Name of manufcaturer",
        "Mnaufacturer ID",
        "No of distributors onboarded",
        "No of retailers onboarded",
        // "No of supervisors allocated",
        // "No of sales agents allocated",
        "Total number of transactions",
        "Total sales volume (BDT)",
        "Total loan amount (BDT)",
        "Total collection amount (BDT)",
        "Current outstanding amount (BDT)",
        "Number of times discrepancies occurred in collection amount",
        "Number of suspended Distributors",
        "Number of blacklisted Distributors",
        "Number of suspended Retailers",
        "Number of blacklisted Retailers",
        "Total Amount of Non-performing Loans",
        "Total number of Non-performing accounts"
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
      for (let i = 0; i < manufacturer_annual_performance_Arr.length; i++) {
        var col_add = 0;
        let e = manufacturer_annual_performance_Arr[i];
        worksheet.cell(row, col + col_add).number(i + 1);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .string(e.manufacturer_name ? e.manufacturer_name : "");
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.manufacturer_id ? e.manufacturer_id : 0);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.total_distributors ? e.total_distributors : 0);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.total_retailers ? e.total_retailers : 0);
        col_add++;
        // worksheet
        //   .cell(row, col + col_add)
        //   .number(e.total_supervisors ? e.total_supervisors : 0);
        // col_add++;
        // worksheet
        //   .cell(row, col + col_add)
        //   .number(e.total_salesagents ? e.total_salesagents : 0);
        // col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.total_transactions_number ? e.total_transactions_number : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.total_sales ? e.total_sales : "-");
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.total_loan ? e.total_loan : 0);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.total_collection ? e.total_collection : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.current_outstanding_amount ? e.current_outstanding_amount : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.total_num_times_discrepancies ? e.total_num_times_discrepancies : "-");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.total_blacklist_distributor ? e.total_blacklist_distributor : "-");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.total_suspened_distributor ? e.total_suspened_distributor : "-");
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_blacklist_retailer ? e.total_blacklist_retailer : 0);
        col_add++;
        worksheet.cell(row, col + col_add).number(e.total_suspened_retailer ? e.total_suspened_retailer : 0);
        col_add++;
        worksheet.cell(row, col + col_add).string(e.total_non_performing_loan ? e.total_non_performing_loan : "-");
        col_add++;
        worksheet.cell(row, col + col_add).string(e.total_non_performing_account ? e.total_non_performing_account : "-");
        col_add++;

        // worksheet.cell(row, col + col_add).number(0);
        // col_add++;
        row++;
      }
      await workbook.write("public/reports_retailer/consolidated_annual_manufacturer_performance_report.xlsx");
      const fileName = "./reports_retailer/consolidated_annual_manufacturer_performance_report.xlsx";
      setTimeout(() => {
        resolve(sendApiResult(true, "File Generated", fileName));
      }, 1500);
    } catch (error) {
      console.log(error);
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.filterManufacturerAnnualView = async (req, res) => {
  const { manufacturer_id, distributor_id, select_date } = req.query;
  const selectDate = moment(select_date).startOf('date').format('YYYY-MM-DD');
  const selectDatePreviousDay = moment(select_date).subtract(1, 'days').format('YYYY-MM-DD');
  const currentYearJuly = moment(select_date).startOf('year').add(6, 'months').format('YYYY-MM-DD');
  const previousYearJuly = moment(select_date).startOf('year').add(6, 'months').subtract(1, 'years').format('YYYY-MM-DD');
  const currentMonth = 1 + moment(selectDate, 'YYYY-MM-DD').month();
  const comparison_financial_year = currentMonth > 6 ? currentYearJuly : previousYearJuly;
  console.log(comparison_financial_year);

  return new Promise(async (resolve, reject) => {
    try {
      const manufacturer_info = await knex("APSISIPDC.cr_manufacturer")
        .where(function () {
          if (manufacturer_id) {
            this.where("cr_manufacturer.id", manufacturer_id);
          }
        })
        .select(
          "cr_manufacturer.id",
          "cr_manufacturer.manufacturer_name"
        );

      if (manufacturer_info.length == 0) {
        reject(sendReportApiResult(false, "Manufacturer Not Found"))
      }

      const manufacturer_annual_performance_Arr = [];

      for (let i = 0; i < manufacturer_info.length; i++) {
        const total_distributors = await knex
          .countDistinct("cr_manufacturer_vs_distributor.distributor_id as count")
          .from("APSISIPDC.cr_manufacturer_vs_distributor")
          .where("cr_manufacturer_vs_distributor.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_manufacturer_vs_distributor.distributor_id", distributor_id)
            }

            if (select_date) {
              this.whereRaw(`"cr_manufacturer_vs_distributor"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_manufacturer_vs_distributor"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_retailers = await knex
          .countDistinct("cr_retailer_manu_scheme_mapping.retailer_id as count")
          .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }

            if (select_date) {
              this.whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        // const total_supervisors = await knex
        //   .countDistinct("cr_supervisor.id as count")
        //   .from("APSISIPDC.cr_supervisor")
        //   .leftJoin(
        //     "APSISIPDC.cr_supervisor_distributor_manufacturer_map",
        //     "cr_supervisor_distributor_manufacturer_map.supervisor_id",
        //     "cr_supervisor.id"
        //   )
        //   .where("cr_supervisor.distributor_id", distributor_info[i].id)
        //   .where(function () {
        //     if (manufacturer_id) {
        //       this.where("cr_supervisor_distributor_manufacturer_map.manufacturer_id", manufacturer_id)
        //     }

        //     if (select_date) {
        //       this.whereRaw(`"cr_supervisor_distributor_manufacturer_map"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
        //       this.whereRaw(`"cr_supervisor_distributor_manufacturer_map"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
        //     }
        //   });

        // const total_salesagents = await knex
        //   .countDistinct("cr_sales_agent.id as count")
        //   .from("APSISIPDC.cr_sales_agent")
        //   .leftJoin(
        //     "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map",
        //     "cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id",
        //     "cr_sales_agent.id"
        //   )
        //   .where("cr_sales_agent.distributor_id", distributor_info[i].id)
        //   .where(function () {
        //     if (manufacturer_id) {
        //       this.where("cr_salesagent_supervisor_distributor_manufacturer_map.manufacturer_id", manufacturer_id)
        //     }
        //     if (select_date) {
        //       this.whereRaw(`"cr_salesagent_supervisor_distributor_manufacturer_map"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
        //       this.whereRaw(`"cr_salesagent_supervisor_distributor_manufacturer_map"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
        //     }
        //   });

        const principal_outstanding_blans = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.id",
            "cr_retailer_loan_calculation.manu_scheme_mapping_id"
          )
          .select("cr_retailer_loan_calculation.principal_outstanding")
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${selectDatePreviousDay}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          })
          .orderBy("cr_retailer_loan_calculation.id", "desc")
          .first();

        const principal_outstanding_beginning_blans =
          principal_outstanding_blans != undefined ? principal_outstanding_blans.principal_outstanding : 0;

        const total_amount = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.id",
            "cr_retailer_loan_calculation.manu_scheme_mapping_id"
          )
          .sum("cr_retailer_loan_calculation.disburshment as loan")
          .sum("cr_retailer_loan_calculation.repayment as collection")
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_blacklist_retailer = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .countDistinct("cr_retailer.id as count")
          .where("cr_retailer.retailer_status", "BLOCK")
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_retailer"."updated_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer"."updated_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_suspened_retailer = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .countDistinct("cr_retailer.id as count")
          .where("cr_retailer.retailer_status", "SUSPEND")
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_retailer"."updated_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer"."updated_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_transactions_number = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.id",
            "cr_retailer_loan_calculation.manu_scheme_mapping_id"
          )
          .count("cr_retailer_loan_calculation.id as count")
          .whereIn("cr_retailer_loan_calculation.transaction_type", ["DISBURSEMENT", "REPAYMENT"])
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_info[i].id)
          .where(function () {
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const manufacturer_annual_performance_consolidated_info = {
          manufacturer_name: manufacturer_info[i].manufacturer_name,
          manufacturer_id: manufacturer_info[i].id,
          total_distributors: total_distributors[0].count,
          total_retailers: total_retailers[0].count,
          // total_supervisors: total_supervisors[0].count,
          // total_salesagents: total_salesagents[0].count,
          total_transactions_number: total_transactions_number[0].count,
          total_loan: total_amount[0].loan,
          total_collection: total_amount[0].collection,
          current_outstanding_amount: principal_outstanding_beginning_blans,
          total_blacklist_retailer: total_blacklist_retailer[0].count,
          total_suspened_retailer: total_suspened_retailer[0].count
        }

        manufacturer_annual_performance_Arr.push(manufacturer_annual_performance_consolidated_info);
      }
      if (manufacturer_annual_performance_Arr == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendReportApiResult(true, "Manufacturer Annual Consolidated Performance filter successfully", manufacturer_annual_performance_Arr));

    } catch (error) {
      console.log(error);
      reject(sendApiResult(false, error.message));
    }
  });
};
module.exports = FileUpload;
