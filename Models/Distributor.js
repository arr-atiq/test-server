const moment = require("moment");
const express = require("express");
const excel = require('excel4node');
const fs = require('fs');
const { sendApiResult, getSettingsValue } = require("../controllers/helper");
const { ValidateNID, ValidatePhoneNumber, ValidateEmail, randomPasswordGenerator, sendReportApiResult, generateUserIDMidDigitForLogin } = require("../controllers/helperController");
const knex = require("../config/database");
const { default: axios } = require("axios");

const FileUpload = function () { };

FileUpload.insertExcelData = function (rows, filename, req) {
  var password;
  var link_code;
  var user_Id;
  var invalidated_rows_arr = [];
  var duplicated_rows_arr = [];
  var mapping_rows_arr = [];
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

          //const all_TIN_array = [];
          const data_array = [];
          const unuploaded_data_array = [];
          const invalidate_data_array = [];
          const total_mapping_dis_manu = [];
          if (Object.keys(rows).length != 0) {
            // for (let index = 0; index < rows.length; index++) {
            //   all_TIN_array[index] = rows[index].Distributor_TIN;
            // }

            for (let index = 0; index < rows.length; index++) {
              const nid = rows[index].NID;
              const manu_id = rows[index].Manufacturer_id;
              const phoneNumber = rows[index].Official_Contact_Number;
              const email = rows[index].Official_Email;
              const autho_person_phoneNumber = rows[index].Mobile_No;
              const autho_person_email = rows[index].Official_Email_Id_of_Authorized_Representative;

              const validNID = ValidateNID(nid);
              const validPhoneNumber = ValidatePhoneNumber(phoneNumber.toString());
              const autho_person_Valid_PhoneNumber = ValidatePhoneNumber(autho_person_phoneNumber.toString());
              const validEmail = ValidateEmail(email);
              const autho_person_validEmail = ValidateEmail(autho_person_email);

              const manufacturer_exist_check = await knex
                .count("cr_manufacturer.id as count")
                .from("APSISIPDC.cr_manufacturer")
                .where(
                  "APSISIPDC.cr_manufacturer.id",
                  manu_id
                );

              const manufacturer_exist_check_val = parseInt(
                manufacturer_exist_check[0].count
              );

              if (!validNID || !validPhoneNumber || !validEmail || !autho_person_Valid_PhoneNumber || !autho_person_validEmail || manufacturer_exist_check_val == 0) {
                let invalidStr = "invalid columns - ";

                if (manufacturer_exist_check_val == 0) {
                  invalidStr = invalidStr + "Manufacturer_id " + ", ";
                }

                if (!validNID) {
                  invalidStr = invalidStr + "NID " + ", ";
                }
                if (!validPhoneNumber) {
                  invalidStr = invalidStr + "Official_Phone_Number " + ", ";
                }
                if (!validEmail) {
                  invalidStr = invalidStr + "Official_Email_ID " + ", ";
                }
                if (!autho_person_Valid_PhoneNumber) {
                  invalidStr = invalidStr + "Mobile_No " + ", ";
                }
                if (!autho_person_validEmail) {
                  invalidStr = invalidStr + "Official_Email_Id_of_Authorized_Representative " + ", ";
                }

                const temp_data = {
                  Manufacturer_id: rows[index].Manufacturer_id,
                  Distributor_Name: rows[index].Distributor_Name,
                  Distributor_Code: rows[index].Distributor_Code,
                  Distributor_TIN: rows[index].Distributor_TIN,
                  Official_Email: rows[index].Official_Email,
                  Official_Contact_Number: rows[index].Official_Contact_Number,
                  Is_Distributor_or_Third_Party_Agency:
                    rows[index].Is_Distributor_or_Third_Party_Agency,
                  Distributor_Corporate_Registration_No:
                    rows[index]?.Distributor_Corporate_Registration_No ?? " ",
                  Trade_License_No: rows[index]?.Trade_License_No ?? " ",
                  Distributor_Registered_Office_in_Bangladesh:
                    rows[index]?.Distributor_Registered_Office_in_Bangladesh ?? " ",
                  Address_Line_1: rows[index]?.Address_Line_1 ?? " ",
                  Address_Line_2: rows[index]?.Address_Line_2 ?? " ",
                  Postal_Code: rows[index]?.Postal_Code ?? " ",
                  Post_Office: rows[index]?.Post_Office ?? " ",
                  Thana: rows[index]?.Thana ?? " ",
                  District: rows[index]?.District ?? " ",
                  Division: rows[index]?.Division ?? " ",
                  Name_of_Authorized_Representative:
                    rows[index]?.Name_of_Authorized_Representative ?? " ",
                  Full_Name: rows[index]?.Full_Name ?? " ",
                  NID: rows[index].NID,
                  Designation_of_Authorized_Representative:
                    rows[index]?.Designation_of_Authorized_Representative ?? " ",
                  Mobile_No: rows[index].Mobile_No,
                  Official_Email_Id_of_Authorized_Representative:
                    rows[index].Official_Email_Id_of_Authorized_Representative,
                  Region_of_Operation: rows[index]?.Region_of_Operation ?? " ",
                  Distributor_Bank_Account_Number:
                    rows[index].Distributor_Bank_Account_Number,
                  Distributor_Bank_Account_Title:
                    rows[index].Distributor_Bank_Account_Title,
                  Distributor_Bank_Account_Type:
                    rows[index].Distributor_Bank_Account_Type,
                  Distributor_Bank_Name: rows[index].Distributor_Bank_Name,
                  Distributor_Bank_Branch: rows[index].Distributor_Bank_Branch,
                  Remarks_Invalidated: invalidStr,
                };
                invalidated_rows_arr.push(temp_data);
                invalidate_data_array.push(temp_data);
                continue;
              }

              const distributor_tin =
                rows[index].Distributor_TIN;

              // const distributor_code =
              //   rows[index].Distributor_Code;

              const duplication_check = await knex
                .count("cr_distributor.distributor_tin as count")
                .from("APSISIPDC.cr_distributor")
                .where(
                  "APSISIPDC.cr_distributor.distributor_tin",
                  distributor_tin.toString()
                );

              const duplication_check_val = parseInt(
                duplication_check[0].count
              );

              // const duplication_check_dis_code = await knex
              //   .count("cr_distributor.distributor_code as count")
              //   .from("APSISIPDC.cr_distributor")
              //   .where(
              //     "APSISIPDC.cr_distributor.distributor_code",
              //     distributor_code.toString()
              //   );

              // const duplication_check_val_dis_code = parseInt(
              //   duplication_check_dis_code[0].count
              // );

              if (duplication_check_val == 0) {

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

                if (duplication_check_val_email_user_table == 0) {
                  const temp_data = {
                    Manufacturer_id: rows[index].Manufacturer_id,
                    Distributor_Name: rows[index].Distributor_Name,
                    Distributor_Code: rows[index].Distributor_Code,
                    Distributor_TIN: rows[index].Distributor_TIN,
                    Official_Email: rows[index].Official_Email,
                    Official_Contact_Number: rows[index].Official_Contact_Number,
                    Is_Distributor_or_Third_Party_Agency:
                      rows[index].Is_Distributor_or_Third_Party_Agency,
                    Distributor_Corporate_Registration_No:
                      rows[index]?.Distributor_Corporate_Registration_No ?? " ",
                    Trade_License_No: rows[index]?.Trade_License_No ?? " ",
                    Distributor_Registered_Office_in_Bangladesh:
                      rows[index]?.Distributor_Registered_Office_in_Bangladesh ?? " ",
                    Address_Line_1: rows[index]?.Address_Line_1 ?? " ",
                    Address_Line_2: rows[index]?.Address_Line_2 ?? " ",
                    Postal_Code: rows[index]?.Postal_Code ?? " ",
                    Post_Office: rows[index]?.Post_Office ?? " ",
                    Thana: rows[index]?.Thana ?? " ",
                    District: rows[index]?.District ?? " ",
                    Division: rows[index]?.Division ?? " ",
                    Name_of_Authorized_Representative:
                      rows[index]?.Name_of_Authorized_Representative ?? " ",
                    Full_Name: rows[index]?.Full_Name ?? " ",
                    NID: rows[index].NID,
                    Designation_of_Authorized_Representative:
                      rows[index]?.Designation_of_Authorized_Representative ?? " ",
                    Mobile_No: rows[index].Mobile_No,
                    Official_Email_Id_of_Authorized_Representative:
                      rows[index].Official_Email_Id_of_Authorized_Representative,
                    Region_of_Operation: rows[index]?.Region_of_Operation ?? " ",
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

                else {
                  let duplicateStr = "duplicate columns - ";
                  if (duplication_check_val_email_user_table != 0) {
                    duplicateStr = duplicateStr + "Official_Email is existed in system " + ", ";
                  }

                  const temp_data = {
                    Manufacturer_id: rows[index].Manufacturer_id,
                    Distributor_Name: rows[index].Distributor_Name,
                    Distributor_Code: rows[index].Distributor_Code,
                    Distributor_TIN: rows[index].Distributor_TIN,
                    Official_Email: rows[index].Official_Email,
                    Official_Contact_Number: rows[index].Official_Contact_Number,
                    Is_Distributor_or_Third_Party_Agency:
                      rows[index].Is_Distributor_or_Third_Party_Agency,
                    Distributor_Corporate_Registration_No:
                      rows[index]?.Distributor_Corporate_Registration_No ?? " ",
                    Trade_License_No: rows[index]?.Trade_License_No ?? " ",
                    Distributor_Registered_Office_in_Bangladesh:
                      rows[index]?.Distributor_Registered_Office_in_Bangladesh ?? " ",
                    Address_Line_1: rows[index]?.Address_Line_1 ?? " ",
                    Address_Line_2: rows[index]?.Address_Line_2 ?? " ",
                    Postal_Code: rows[index]?.Postal_Code ?? " ",
                    Post_Office: rows[index]?.Post_Office ?? " ",
                    Thana: rows[index]?.Thana ?? " ",
                    District: rows[index]?.District ?? " ",
                    Division: rows[index]?.Division ?? " ",
                    Name_of_Authorized_Representative:
                      rows[index]?.Name_of_Authorized_Representative ?? " ",
                    Full_Name: rows[index]?.Full_Name ?? " ",
                    NID: rows[index].NID,
                    Designation_of_Authorized_Representative:
                      rows[index]?.Designation_of_Authorized_Representative ?? " ",
                    Mobile_No: rows[index].Mobile_No,
                    Official_Email_Id_of_Authorized_Representative:
                      rows[index].Official_Email_Id_of_Authorized_Representative,
                    Region_of_Operation: rows[index]?.Region_of_Operation ?? " ",
                    Distributor_Bank_Account_Number:
                      rows[index].Distributor_Bank_Account_Number,
                    Distributor_Bank_Account_Title:
                      rows[index].Distributor_Bank_Account_Title,
                    Distributor_Bank_Account_Type:
                      rows[index].Distributor_Bank_Account_Type,
                    Distributor_Bank_Name: rows[index].Distributor_Bank_Name,
                    Distributor_Bank_Branch: rows[index].Distributor_Bank_Branch,
                    Remarks_Duplicated: duplicateStr
                  };
                  duplicated_rows_arr.push(temp_data);
                  unuploaded_data_array.push(temp_data);

                }

              } else {
                //multiple manufacturer mapping with distributor

                const distributor_info = await knex("APSISIPDC.cr_distributor")
                  .where("status", "Active")
                  .where("distributor_tin", distributor_tin.toString())
                  .select(
                    "id",
                    "distributor_name",
                    "official_email"
                  );

                let email_official = distributor_info[0].official_email;

                if (distributor_info.length == 1) {
                  const manufacturer_id_check = rows[index].Manufacturer_id;

                  const duplication_check_manu_id = await knex
                    .count("cr_manufacturer_vs_distributor.id as count")
                    .from("APSISIPDC.cr_manufacturer_vs_distributor")
                    .where(
                      "APSISIPDC.cr_manufacturer_vs_distributor.distributor_id",
                      distributor_info[0].id
                    )
                    .where(
                      "APSISIPDC.cr_manufacturer_vs_distributor.manufacturer_id",
                      manufacturer_id_check
                    );

                  const duplication_check_val_manu_id = parseInt(
                    duplication_check_manu_id[0].count
                  );

                  if (duplication_check_val_manu_id == 0) {
                    const multiple_manu_mapping_dis = {
                      manufacturer_id: rows[index].Manufacturer_id,
                      distributor_id: distributor_info[0].id,
                      distributor_code: rows[index].Distributor_Code,
                      created_by: req.user_id,
                    }
                    const mapping_dis_manu = await knex(
                      "APSISIPDC.cr_manufacturer_vs_distributor"
                    ).insert(multiple_manu_mapping_dis).returning("id");
                    mapping_rows_arr.push(multiple_manu_mapping_dis);
                    total_mapping_dis_manu.push(mapping_dis_manu[0])

                    try {
                      const sendMail = await axios.post(`${process.env.HOSTIP}/mail/tempSendmail`, {
                        "email": email_official,
                        "mail_subject": "IPDC DANA | Mapping Completed",
                        "mail_body": `
                          <p>Greetings from IPDC DANA!</p>
                          <p>Congratulations! Your Mapping
                          with Manufacturer ID :${manufacturer_id_check} has been
                          completed. Please enter the below
                          mentioned user ID and password
                          at www.ipdcDANA.com and login.</p>
                          <p>Regards, </p>
                          <p>IPDC Finance</p>
                          `
                      })
                      console.log('sendMailsendMailsendMail', sendMail)
                    }
                    catch (err) {
                      console.log('errorerrorerrorerrorerror', err)
                    }

                    continue;
                  }
                }
                //multiple manufacturer mapping with distributor

                let duplicateStr = "duplicate columns - ";
                if (duplication_check_val != 0) {
                  duplicateStr = duplicateStr + "Distributor_TIN " + ", ";
                }
                // if (duplication_check_val_email_user_table != 0) {
                //   duplicateStr = duplicateStr + "Official_Email is existed in system " + ", ";
                // }

                // if (duplication_check_val_dis_code != 0) {
                //   duplicateStr = duplicateStr + "Distributor_Code " + ", ";
                // }
                const temp_data = {
                  Manufacturer_id: rows[index].Manufacturer_id,
                  Distributor_Name: rows[index].Distributor_Name,
                  Distributor_Code: rows[index].Distributor_Code,
                  Distributor_TIN: rows[index].Distributor_TIN,
                  Official_Email: rows[index].Official_Email,
                  Official_Contact_Number: rows[index].Official_Contact_Number,
                  Is_Distributor_or_Third_Party_Agency:
                    rows[index].Is_Distributor_or_Third_Party_Agency,
                  Distributor_Corporate_Registration_No:
                    rows[index]?.Distributor_Corporate_Registration_No ?? " ",
                  Trade_License_No: rows[index]?.Trade_License_No ?? " ",
                  Distributor_Registered_Office_in_Bangladesh:
                    rows[index]?.Distributor_Registered_Office_in_Bangladesh ?? " ",
                  Address_Line_1: rows[index]?.Address_Line_1 ?? " ",
                  Address_Line_2: rows[index]?.Address_Line_2 ?? " ",
                  Postal_Code: rows[index]?.Postal_Code ?? " ",
                  Post_Office: rows[index]?.Post_Office ?? " ",
                  Thana: rows[index]?.Thana ?? " ",
                  District: rows[index]?.District ?? " ",
                  Division: rows[index]?.Division ?? " ",
                  Name_of_Authorized_Representative:
                    rows[index]?.Name_of_Authorized_Representative ?? " ",
                  Full_Name: rows[index]?.Full_Name ?? " ",
                  NID: rows[index].NID,
                  Designation_of_Authorized_Representative:
                    rows[index]?.Designation_of_Authorized_Representative ?? " ",
                  Mobile_No: rows[index].Mobile_No,
                  Official_Email_Id_of_Authorized_Representative:
                    rows[index].Official_Email_Id_of_Authorized_Representative,
                  Region_of_Operation: rows[index]?.Region_of_Operation ?? " ",
                  Distributor_Bank_Account_Number:
                    rows[index].Distributor_Bank_Account_Number,
                  Distributor_Bank_Account_Title:
                    rows[index].Distributor_Bank_Account_Title,
                  Distributor_Bank_Account_Type:
                    rows[index].Distributor_Bank_Account_Type,
                  Distributor_Bank_Name: rows[index].Distributor_Bank_Name,
                  Distributor_Bank_Branch: rows[index].Distributor_Bank_Branch,
                  Remarks_Duplicated: duplicateStr
                };
                duplicated_rows_arr.push(temp_data);
                unuploaded_data_array.push(temp_data);

                //const distributor_name_check = rows[index].Distributor_Name;
                //const distributor_code_check = rows[index].Distributor_Code;

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
              mapping_distributor_with_manufacturer: Object.keys(total_mapping_dis_manu).length,
              created_by: parseInt(req.user_id),
            };
            await knex("APSISIPDC.cr_bulk_upload_file_log").insert(
              empty_insert_log
            );
            msg = "File Uploaded successfully!";
            var response = {
              "insert_log": empty_insert_log,
              "total_mapping": mapping_rows_arr,
              "total_invalidated_row": invalidated_rows_arr.length,
              "total_duplicated_row": duplicated_rows_arr.length
            }
            resolve(sendApiResult(true, msg, response));
          }

          if (Object.keys(invalidate_data_array).length != 0) {
            for (let index = 0; index < invalidate_data_array.length; index++) {
              const invalidated_distributor = {
                distributor_name: invalidate_data_array[index].Distributor_Name,
                manufacturer_id: invalidate_data_array[index].Manufacturer_id,
                distributor_code: invalidate_data_array[index].Distributor_Code,
                distributor_tin: invalidate_data_array[index].Distributor_TIN,
                official_email: invalidate_data_array[index].Official_Email,
                official_contact_number:
                  invalidate_data_array[index].Official_Contact_Number,
                is_distributor_or_third_party_agency:
                  invalidate_data_array[index].Is_Distributor_or_Third_Party_Agency,
                corporate_registration_no:
                  invalidate_data_array[index].Distributor_Corporate_Registration_No,
                trade_license_no: invalidate_data_array[index].Trade_License_No,
                registered_office_bangladesh:
                  invalidate_data_array[index].Distributor_Registered_Office_in_Bangladesh,
                ofc_address1: invalidate_data_array[index].Address_Line_1,
                ofc_address2: invalidate_data_array[index].Address_Line_2,
                ofc_postal_code: invalidate_data_array[index].Postal_Code,
                ofc_post_office: invalidate_data_array[index].Post_Office,
                ofc_thana: invalidate_data_array[index].Thana,
                ofc_district: invalidate_data_array[index].District,
                ofc_division: invalidate_data_array[index].Division,
                name_of_authorized_representative:
                  invalidate_data_array[index].Name_of_Authorized_Representative,
                autho_rep_full_name: invalidate_data_array[index].Full_Name,
                autho_rep_nid: invalidate_data_array[index].NID,
                autho_rep_designation:
                  invalidate_data_array[index].Designation_of_Authorized_Representative,
                autho_rep_phone: invalidate_data_array[index].Mobile_No,
                autho_rep_email:
                  invalidate_data_array[index]
                    .Official_Email_Id_of_Authorized_Representative,
                region_of_operation: invalidate_data_array[index].Region_of_Operation,
                remarks_invalidated: invalidate_data_array[index].Remarks_Invalidated,
                created_by: req.user_id
              };

              await knex("APSISIPDC.cr_distributor_invalidated_data")
                .insert(invalidated_distributor);
            }
          }


          if (Object.keys(unuploaded_data_array).length != 0) {
            for (let index = 0; index < unuploaded_data_array.length; index++) {
              const unuploaded_distributor = {
                distributor_name: unuploaded_data_array[index].Distributor_Name,
                manufacturer_id: unuploaded_data_array[index].Manufacturer_id,
                distributor_code: unuploaded_data_array[index].Distributor_Code,
                distributor_tin: unuploaded_data_array[index].Distributor_TIN,
                official_email: unuploaded_data_array[index].Official_Email,
                official_contact_number:
                  unuploaded_data_array[index].Official_Contact_Number,
                is_distributor_or_third_party_agency:
                  unuploaded_data_array[index].Is_Distributor_or_Third_Party_Agency,
                corporate_registration_no:
                  unuploaded_data_array[index].Distributor_Corporate_Registration_No,
                trade_license_no: unuploaded_data_array[index].Trade_License_No,
                registered_office_bangladesh:
                  unuploaded_data_array[index].Distributor_Registered_Office_in_Bangladesh,
                ofc_address1: unuploaded_data_array[index].Address_Line_1,
                ofc_address2: unuploaded_data_array[index].Address_Line_2,
                ofc_postal_code: unuploaded_data_array[index].Postal_Code,
                ofc_post_office: unuploaded_data_array[index].Post_Office,
                ofc_thana: unuploaded_data_array[index].Thana,
                ofc_district: unuploaded_data_array[index].District,
                ofc_division: unuploaded_data_array[index].Division,
                name_of_authorized_representative:
                  unuploaded_data_array[index].Name_of_Authorized_Representative,
                autho_rep_full_name: unuploaded_data_array[index].Full_Name,
                autho_rep_nid: unuploaded_data_array[index].NID,
                autho_rep_designation:
                  unuploaded_data_array[index].Designation_of_Authorized_Representative,
                autho_rep_phone: unuploaded_data_array[index].Mobile_No,
                autho_rep_email:
                  unuploaded_data_array[index]
                    .Official_Email_Id_of_Authorized_Representative,
                region_of_operation: unuploaded_data_array[index].Region_of_Operation,
                remarks_duplications: unuploaded_data_array[index].Remarks_Duplicated,
                created_by: req.user_id,
              };
              await knex("APSISIPDC.cr_distributor_unuploaded_data")
                .insert(unuploaded_distributor);
            }
          }

          if (Object.keys(data_array).length != 0) {
            const distributor_insert_ids = [];
            const user_insert_ids = [];
            for (let index = 0; index < data_array.length; index++) {
              const tin_insert_data = data_array[index].Distributor_TIN;
              const email_insert_data = data_array[index].Official_Email;
              const duplication_checkTIN_insert_data = await knex
                .count("cr_distributor.distributor_tin as count")
                .from("APSISIPDC.cr_distributor")
                .where(
                  "APSISIPDC.cr_distributor.distributor_tin",
                  tin_insert_data.toString()
                );
              const duplication_check_val_tin_insert_data = parseInt(
                duplication_checkTIN_insert_data[0].count
              );

              // const duplication_checkEmail_user_table_insert_data = await knex
              //   .count("cr_users.email as count")
              //   .from("APSISIPDC.cr_users")
              //   .where(
              //     "APSISIPDC.cr_users.email",
              //     email_insert_data.toString()
              //   );

              // const duplication_check_val_email_user_table_insert_date = parseInt(
              //   duplication_checkEmail_user_table_insert_data[0].count
              // );

              // const duplication_checkCode_insert_data = await knex
              //   .count("cr_distributor.distributor_code as count")
              //   .from("APSISIPDC.cr_distributor")
              //   .where(
              //     "APSISIPDC.cr_distributor.distributor_code",
              //     distributor_code_insert_data.toString()
              //   );
              // const duplication_check_val_code_insert_data = parseInt(
              //   duplication_checkCode_insert_data[0].count
              // );


              if (duplication_check_val_tin_insert_data != 0) {
                //multiple manu-distri mapping-check-code-in-same-excel

                const distributor_info_insert_data = await knex("APSISIPDC.cr_distributor")
                  .where("status", "Active")
                  .where("distributor_tin", tin_insert_data.toString())
                  .select(
                    "id",
                    "distributor_name",
                    "official_email"
                  );

                let official_email_insert_data = distributor_info_insert_data[0].official_email;

                // const distributor_name_check_insert_data = data_array[index].Distributor_Name;
                //const distributor_code_check_insert_data = data_array[index].Distributor_Code;
                const manufacturer_id_check_insert_data = data_array[index].Manufacturer_id;

                const duplication_check_manu_id_insert_data = await knex
                  .count("cr_manufacturer_vs_distributor.id as count")
                  .from("APSISIPDC.cr_manufacturer_vs_distributor")
                  .where(
                    "APSISIPDC.cr_manufacturer_vs_distributor.distributor_id",
                    distributor_info_insert_data[0].id
                  )
                  .where(
                    "APSISIPDC.cr_manufacturer_vs_distributor.manufacturer_id",
                    manufacturer_id_check_insert_data
                  );

                const duplication_check_val_manu_id_insert_data = parseInt(
                  duplication_check_manu_id_insert_data[0].count
                );

                if (duplication_check_val_manu_id_insert_data == 0) {
                  const multiple_manu_mapping_dis_insert_data = {
                    manufacturer_id: data_array[index].Manufacturer_id,
                    distributor_id: distributor_info_insert_data[0].id,
                    distributor_code: data_array[index].Distributor_Code,
                    created_by: req.user_id,
                  }
                  await knex(
                    "APSISIPDC.cr_manufacturer_vs_distributor"
                  ).insert(multiple_manu_mapping_dis_insert_data);
                  mapping_rows_arr.push(multiple_manu_mapping_dis_insert_data);
                  try {
                    const sendMail = await axios.post(`${process.env.HOSTIP}/mail/tempSendmail`, {
                      "email": official_email_insert_data,
                      "mail_subject": "IPDC DANA | Mapping Completed",
                      "mail_body": `
                        <p>Greetings from IPDC DANA!</p>
                        <p>Congratulations! Your Mapping
                        with Manufacturer ID :${manufacturer_id_check_insert_data} has been
                        completed. Please enter the below
                        mentioned user ID and password
                        at www.ipdcDANA.com and login.</p>
                        <p>Regards, </p>
                        <p>IPDC Finance</p>
                        `
                    })
                    console.log('sendMailsendMailsendMail', sendMail)
                  }
                  catch (err) {
                    console.log('errorerrorerrorerrorerror', err)
                  }
                  continue;
                }

                //multiple manu-distri mapping-check-code-in-same-excel

                let duplicateStr = "duplicate columns - ";
                if (duplication_check_val_tin_insert_data != 0) {
                  duplicateStr = duplicateStr + "Distributor_TIN " + ", ";
                }
                // if (duplication_check_val_email_user_table_insert_date != 0) {
                //   duplicateStr = duplicateStr + "Email is existed in system " + ", ";
                // }
                const duplicate_data_array = {
                  distributor_name: data_array[index].Distributor_Name,
                  manufacturer_id: data_array[index].Manufacturer_id,
                  distributor_code: data_array[index].Distributor_Code,
                  distributor_tin: data_array[index].Distributor_TIN,
                  official_email: data_array[index].Official_Email,
                  official_contact_number:
                    data_array[index].Official_Contact_Number,
                  is_distributor_or_third_party_agency:
                    data_array[index].Is_Distributor_or_Third_Party_Agency,
                  corporate_registration_no:
                    data_array[index].Distributor_Corporate_Registration_No,
                  trade_license_no: data_array[index].Trade_License_No,
                  registered_office_bangladesh:
                    data_array[index].Distributor_Registered_Office_in_Bangladesh,
                  ofc_address1: data_array[index].Address_Line_1,
                  ofc_address2: data_array[index].Address_Line_2,
                  ofc_postal_code: data_array[index].Postal_Code,
                  ofc_post_office: data_array[index].Post_Office,
                  ofc_thana: data_array[index].Thana,
                  ofc_district: data_array[index].District,
                  ofc_division: data_array[index].Division,
                  name_of_authorized_representative:
                    data_array[index].Name_of_Authorized_Representative,
                  autho_rep_full_name: data_array[index].Full_Name,
                  autho_rep_nid: data_array[index].NID,
                  autho_rep_designation:
                    data_array[index].Designation_of_Authorized_Representative,
                  autho_rep_phone: data_array[index].Mobile_No,
                  autho_rep_email:
                    data_array[index]
                      .Official_Email_Id_of_Authorized_Representative,
                  region_of_operation: data_array[index].Region_of_Operation,
                  remarks_duplications: duplicateStr,
                  created_by: req.user_id,
                };
                duplicated_rows_arr.push(duplicate_data_array);
                await knex("APSISIPDC.cr_distributor_unuploaded_data")
                  .insert(duplicate_data_array);
                continue;
              }

              const emailOfficial_insert_data = data_array[index].Official_Email;
              const duplication_checkEmail_user_insert_data = await knex
                .count("cr_users.email as count")
                .from("APSISIPDC.cr_users")
                .where(
                  "APSISIPDC.cr_users.email",
                  emailOfficial_insert_data.toString()
                );

              const duplication_checkEmail_user_insert_data_val = parseInt(
                duplication_checkEmail_user_insert_data[0].count
              )

              if (duplication_checkEmail_user_insert_data_val != 0) {
                let duplicateStr = "duplicate columns - Official_Email is existed in system";
                const duplicate_user_data_array = {
                  distributor_name: data_array[index].Distributor_Name,
                  manufacturer_id: data_array[index].Manufacturer_id,
                  distributor_code: data_array[index].Distributor_Code,
                  distributor_tin: data_array[index].Distributor_TIN,
                  official_email: data_array[index].Official_Email,
                  official_contact_number:
                    data_array[index].Official_Contact_Number,
                  is_distributor_or_third_party_agency:
                    data_array[index].Is_Distributor_or_Third_Party_Agency,
                  corporate_registration_no:
                    data_array[index].Distributor_Corporate_Registration_No,
                  trade_license_no: data_array[index].Trade_License_No,
                  registered_office_bangladesh:
                    data_array[index].Distributor_Registered_Office_in_Bangladesh,
                  ofc_address1: data_array[index].Address_Line_1,
                  ofc_address2: data_array[index].Address_Line_2,
                  ofc_postal_code: data_array[index].Postal_Code,
                  ofc_post_office: data_array[index].Post_Office,
                  ofc_thana: data_array[index].Thana,
                  ofc_district: data_array[index].District,
                  ofc_division: data_array[index].Division,
                  name_of_authorized_representative:
                    data_array[index].Name_of_Authorized_Representative,
                  autho_rep_full_name: data_array[index].Full_Name,
                  autho_rep_nid: data_array[index].NID,
                  autho_rep_designation:
                    data_array[index].Designation_of_Authorized_Representative,
                  autho_rep_phone: data_array[index].Mobile_No,
                  autho_rep_email:
                    data_array[index]
                      .Official_Email_Id_of_Authorized_Representative,
                  region_of_operation: data_array[index].Region_of_Operation,
                  remarks_duplications: duplicateStr,
                  created_by: req.user_id,
                };
                duplicated_rows_arr.push(duplicate_data_array);
                await knex("APSISIPDC.cr_distributor_unuploaded_data")
                  .insert(duplicate_data_array);
                continue;
              }

              const team_distributor = {
                distributor_name: data_array[index].Distributor_Name,
                distributor_tin: data_array[index].Distributor_TIN,
                official_email: data_array[index].Official_Email,
                official_contact_number:
                  data_array[index].Official_Contact_Number,
                is_distributor_or_third_party_agency:
                  data_array[index].Is_Distributor_or_Third_Party_Agency,
                corporate_registration_no:
                  data_array[index].Distributor_Corporate_Registration_No,
                trade_license_no: data_array[index].Trade_License_No,
                registered_office_bangladesh:
                  data_array[index].Distributor_Registered_Office_in_Bangladesh,
                ofc_address1: data_array[index].Address_Line_1,
                ofc_address2: data_array[index].Address_Line_2,
                ofc_postal_code: data_array[index].Postal_Code,
                ofc_post_office: data_array[index].Post_Office,
                ofc_thana: data_array[index].Thana,
                ofc_district: data_array[index].District,
                ofc_division: data_array[index].Division,
                name_of_authorized_representative:
                  data_array[index].Name_of_Authorized_Representative,
                autho_rep_full_name: data_array[index].Full_Name,
                autho_rep_nid: data_array[index].NID,
                autho_rep_designation:
                  data_array[index].Designation_of_Authorized_Representative,
                autho_rep_phone: data_array[index].Mobile_No,
                autho_rep_email:
                  data_array[index]
                    .Official_Email_Id_of_Authorized_Representative,
                region_of_operation: data_array[index].Region_of_Operation,
                created_by: req.user_id,
              };
              const insert_distributor = await knex("APSISIPDC.cr_distributor")
                .insert(team_distributor)
                .returning("id");

              user_Id = insert_distributor ? "DH-" + generateUserIDMidDigitForLogin(insert_distributor[0], 6) : 0;

              if (insert_distributor) {
                const temp_manufacturer_vs_distributor_map = {
                  manufacturer_id: data_array[index].Manufacturer_id,
                  distributor_id: insert_distributor[0],
                  distributor_code: data_array[index].Distributor_Code,
                  created_by: req.user_id,
                };

                // var distributorIDUpdate = {
                //   distributor_code: `${data_array[index].Distributor_Code}-${insert_distributor[0]}`
                // };
                // console.log('insert_user[0]', insert_distributor[0])

                // console.log('distributorIDUpdate', distributorIDUpdate)

                // await knex.transaction(async (trx) => {
                //   let updateData = await trx(
                //     "APSISIPDC.cr_distributor"
                //   )
                //     .where({ id: insert_distributor[0] })
                //     .update(distributorIDUpdate);
                //   console.log('updateData', updateData)
                // });
                password = randomPasswordGenerator()
                link_code = randomPasswordGenerator()

                const insert_manufacturer_vs_distributor = await knex(
                  "APSISIPDC.cr_manufacturer_vs_distributor"
                ).insert(temp_manufacturer_vs_distributor_map).returning("id");
                //mapping_rows_arr.push(insert_manufacturer_vs_distributor);

                //total_mapping_dis_manu.push(insert_manufacturer_vs_distributor[0]);


                const acc_num =
                  data_array[index].Distributor_Bank_Account_Number.toString().split(";");
                const acc_title =
                  data_array[index].Distributor_Bank_Account_Title.toString().split(";");
                const acc_type =
                  data_array[index].Distributor_Bank_Account_Type.toString().split(";");
                const bank_name =
                  data_array[index].Distributor_Bank_Name.toString().split(";");
                const branch =
                  data_array[index].Distributor_Bank_Branch.toString().split(";");
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
                    "APSISIPDC.cr_distributor_bank_acc_details"
                  ).insert(team_bank_acc);
                }

                distributor_insert_ids.push(insert_distributor[0]);
              }

              const temp_user = {
                name: data_array[index].Distributor_Name,
                email: data_array[index].Official_Email,
                phone: data_array[index].Official_Contact_Number,
                // password: "5efd3b0647df9045c240729d31622c79",
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

                try {
                  const sendMail = await axios.post(`${process.env.HOSTIP}/mail/tempSendmail`, {
                    "email": data_array[index].Official_Email,
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
                  "APSISIPDC.cr_distributor_user"
                ).insert(user_wise_distributor);
                const insert_user_wise_distributor2 = await knex(
                  "APSISIPDC.cr_user_wise_distributor"
                ).insert(user_wise_distributor);
                if (
                  insert_user_wise_distributor &&
                  insert_user_wise_distributor2
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
                  "APSISIPDC.cr_user_wise_role"
                ).insert(user_wise_role);
                if (insert_user_wise_role) {
                  is_user_wise_role_insert = 1;
                }
              }
            }

            if (
              is_distributor_wise_user_insert == 1 &&
              is_user_wise_role_insert == 1
            ) {
              const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
              const insert_log = {
                sys_date: new Date(date),
                file_for: folder_name,
                file_path: `public/configuration_file/${folder_name}`,
                file_name: filename,
                found_rows: Object.keys(rows).length,
                upload_rows: Object.keys(distributor_insert_ids).length,
                mapping_distributor_with_manufacturer: Object.keys(total_mapping_dis_manu).length,
                created_by: parseInt(req.user_id),
              };
              await knex("APSISIPDC.cr_bulk_upload_file_log").insert(
                insert_log
              );
              msg = "File Uploaded successfully!";
              var response = {
                "insert_log": insert_log,
                "total_mapping": mapping_rows_arr,
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
          console.log("Catch error...Data not inserted..", error)
          reject(sendApiResult(false, "Data not inserted."));
        });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  }).catch((error) => {
    console.log("Catch error...", error)
  });
};
FileUpload.getDistributorListDropDown = function (req) {

  const { manufacturer_id } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_distributor")
        .leftJoin(
          "APSISIPDC.cr_manufacturer_vs_distributor",
          "cr_manufacturer_vs_distributor.distributor_id",
          "cr_distributor.id"
        )
        .select(
          "cr_distributor.id",
          "cr_distributor.distributor_name"
        )
        .where(function () {
          if (manufacturer_id) {
            this.where("cr_manufacturer_vs_distributor.manufacturer_id", manufacturer_id)
          }
        })
        .orderBy("cr_distributor.id", "desc")
        .distinct();
      if (data == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};
FileUpload.getDistributorList = function (req) {
  const { page, per_page } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_distributor")
        .where("cr_distributor.activation_status", "Active")
        .select(
          "cr_distributor.id",
          "cr_distributor.distributor_name",
          "cr_distributor.distributor_tin",
          "cr_distributor.official_email",
          "cr_distributor.official_contact_number",
          "cr_distributor.is_distributor_or_third_party_agency",
          "cr_distributor.corporate_registration_no",
          "cr_distributor.trade_license_no",
          "cr_distributor.registered_office_bangladesh",
          "cr_distributor.ofc_address1",
          "cr_distributor.ofc_address2",
          "cr_distributor.ofc_postal_code",
          "cr_distributor.ofc_post_office",
          "cr_distributor.ofc_thana",
          "cr_distributor.ofc_district",
          "cr_distributor.ofc_division",
          "cr_distributor.name_of_authorized_representative",
          "cr_distributor.autho_rep_full_name",
          "cr_distributor.autho_rep_nid",
          "cr_distributor.autho_rep_designation",
          "cr_distributor.autho_rep_phone",
          "cr_distributor.autho_rep_email",
          "cr_distributor.region_of_operation"
        )
        .orderBy("cr_distributor.id", "desc")
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

FileUpload.deleteDistributor = function ({ id }) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        const distributor_delete = await trx("APSISIPDC.cr_distributor")
          .where({ id })
          .delete();
        if (distributor_delete <= 0)
          reject(sendApiResult(false, "Could not Found Distributor"));
        resolve(
          sendApiResult(
            true,
            "Distributor Deleted Successfully",
            distributor_delete
          )
        );
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

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
    updated_by,
  } = req.body;

  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        const distributor_update = await trx("APSISIPDC.cr_distributor")
          .where({ id: req.params.id })
          .update({
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
            updated_at: new Date(),
            updated_by,
          });
        if (distributor_update <= 0)
          reject(sendApiResult(false, "Could not Found Distributor"));
        resolve(
          sendApiResult(
            true,
            "Distributor updated Successfully",
            distributor_update
          )
        );
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getDistributorByManufacturer = function (req) {
  const { manufacturer_id } = req.params;
  const { page, per_page } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_distributor")
        .leftJoin(
          "APSISIPDC.cr_manufacturer_vs_distributor",
          "cr_manufacturer_vs_distributor.distributor_id",
          "cr_distributor.id"
        )
        .where(
          "cr_manufacturer_vs_distributor.manufacturer_id",
          manufacturer_id
        )
        .select(
          "cr_manufacturer_vs_distributor.distributor_id",
          "cr_distributor.distributor_name",
          "cr_distributor.distributor_tin",
          "cr_distributor.official_email",
          "cr_distributor.official_contact_number",
          "cr_distributor.ofc_address1",
          "cr_distributor.ofc_district",
          "cr_distributor.ofc_division",
          "cr_manufacturer_vs_distributor.distributor_code",
          "cr_distributor.is_distributor_or_third_party_agency",
          "cr_distributor.corporate_registration_no",
          "cr_distributor.registered_office_bangladesh",
          "cr_distributor.ofc_postal_code",
          "cr_distributor.ofc_post_office",
          "cr_distributor.autho_rep_full_name",
          "cr_distributor.autho_rep_designation",
          "cr_distributor.autho_rep_phone",
          "cr_distributor.region_of_operation",
          "cr_distributor.autho_rep_email",
          "cr_distributor.autho_rep_nid",
          "cr_distributor.trade_license_no"
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

FileUpload.getManufacturerByDistributor = function (req) {
  const { distributor_id } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_manufacturer")
        .leftJoin(
          "APSISIPDC.cr_manufacturer_vs_distributor",
          "cr_manufacturer_vs_distributor.manufacturer_id",
          "cr_manufacturer.id"
        )
        .where(
          "cr_manufacturer_vs_distributor.distributor_id",
          distributor_id
        )
        .select(
          "cr_manufacturer.id",
          "cr_manufacturer.manufacturer_name",
          "cr_manufacturer_vs_distributor.distributor_code",
          "cr_manufacturer.registration_no",
          "cr_manufacturer.website_link",
          "cr_manufacturer.corporate_ofc_address",
          "cr_manufacturer.autho_rep_full_name",
          "cr_manufacturer.autho_rep_designation"
        );
      if (data == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getDistributorCodeByDistributor = function (req) {
  const { distributor_id } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_manufacturer")
        .leftJoin(
          "APSISIPDC.cr_manufacturer_vs_distributor",
          "cr_manufacturer_vs_distributor.manufacturer_id",
          "cr_manufacturer.id"
        )
        .where(
          "cr_manufacturer_vs_distributor.distributor_id",
          distributor_id
        )
        .select(
          "cr_manufacturer.id",
          "cr_manufacturer.manufacturer_name",
          "cr_manufacturer_vs_distributor.distributor_code"
        );
      if (data == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.generateDistributorAnnualReport = async (req, res) => {
  const { distributor_id, manufacturer_id, select_date } = req.query;
  const selectDate = moment(select_date).startOf('date').format('YYYY-MM-DD');
  const selectDatePreviousDay = moment(select_date).subtract(1, 'days').format('YYYY-MM-DD');
  const currentYearJuly = moment(select_date).startOf('year').add(6, 'months').format('YYYY-MM-DD');
  const previousYearJuly = moment(select_date).startOf('year').add(6, 'months').subtract(1, 'years').format('YYYY-MM-DD');
  const currentMonth = 1 + moment(selectDate, 'YYYY-MM-DD').month();
  const comparison_financial_year = currentMonth > 6 ? currentYearJuly : previousYearJuly;
  console.log(comparison_financial_year);

  return new Promise(async (resolve, reject) => {
    try {
      const distributor_info = await knex("APSISIPDC.cr_distributor")
        .where(function () {
          if (distributor_id) {
            this.where("cr_distributor.id", distributor_id);
          }
        })
        .select(
          "cr_distributor.id",
          "cr_distributor.distributor_name"
        );

      if (distributor_info.length == 0) {
        reject(sendReportApiResult(false, "Distributor Not Found"))
      }

      const distributor_annual_performance_Arr = [];

      for (let i = 0; i < distributor_info.length; i++) {
        const total_manufacturers = await knex
          .count("cr_manufacturer_vs_distributor.manufacturer_id as count")
          .from("APSISIPDC.cr_manufacturer_vs_distributor")
          .where("cr_manufacturer_vs_distributor.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_manufacturer_vs_distributor.manufacturer_id", manufacturer_id)
            }

            if (select_date) {
              this.whereRaw(`"cr_manufacturer_vs_distributor"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_manufacturer_vs_distributor"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_retailers = await knex
          .countDistinct("cr_retailer_manu_scheme_mapping.retailer_id as count")
          .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }

            if (select_date) {
              this.whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_supervisors = await knex
          .countDistinct("cr_supervisor.id as count")
          .from("APSISIPDC.cr_supervisor")
          .leftJoin(
            "APSISIPDC.cr_supervisor_distributor_manufacturer_map",
            "cr_supervisor_distributor_manufacturer_map.supervisor_id",
            "cr_supervisor.id"
          )
          .where("cr_supervisor.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_supervisor_distributor_manufacturer_map.manufacturer_id", manufacturer_id)
            }

            if (select_date) {
              this.whereRaw(`"cr_supervisor_distributor_manufacturer_map"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_supervisor_distributor_manufacturer_map"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_salesagents = await knex
          .countDistinct("cr_sales_agent.id as count")
          .from("APSISIPDC.cr_sales_agent")
          .leftJoin(
            "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map",
            "cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id",
            "cr_sales_agent.id"
          )
          .where("cr_sales_agent.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_salesagent_supervisor_distributor_manufacturer_map.manufacturer_id", manufacturer_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_salesagent_supervisor_distributor_manufacturer_map"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_salesagent_supervisor_distributor_manufacturer_map"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const principal_outstanding_blans = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.id",
            "cr_retailer_loan_calculation.manu_scheme_mapping_id"
          )
          .select("cr_retailer_loan_calculation.principal_outstanding")
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
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
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
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
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
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
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
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
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const distributor_annual_performance_consolidated_info = {
          distributor_name: distributor_info[i].distributor_name,
          distributor_id: distributor_info[i].id,
          total_manufacturers: total_manufacturers[0].count,
          total_retailers: total_retailers[0].count,
          total_supervisors: total_supervisors[0].count,
          total_salesagents: total_salesagents[0].count,
          total_transactions_number: total_transactions_number[0].count,
          total_loan: total_amount[0].loan,
          total_collection: total_amount[0].collection,
          current_outstanding_amount: principal_outstanding_beginning_blans,
          total_blacklist_retailer: total_blacklist_retailer[0].count,
          total_suspened_retailer: total_suspened_retailer[0].count
        }

        distributor_annual_performance_Arr.push(distributor_annual_performance_consolidated_info);
      }
      const headers = [
        "Sr.",
        "Name of distributor",
        "Distributor ID",
        "No of associated manufacturers",
        "No of retailers onboarded",
        "No of supervisors allocated",
        "No of sales agents allocated",
        "Total number of transactions",
        "Total sales volume (BDT)",
        "Total loan amount (BDT)",
        "Total collection amount (BDT)",
        "Current outstanding amount (BDT)",
        "Number of times discrepancies occurred in collection amount",
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
      for (let i = 0; i < distributor_annual_performance_Arr.length; i++) {
        var col_add = 0;
        let e = distributor_annual_performance_Arr[i];
        worksheet.cell(row, col + col_add).number(i + 1);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .string(e.distributor_name ? e.distributor_name : "");
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.distributor_id ? e.distributor_id : 0);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.total_manufacturers ? e.total_manufacturers : 0);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.total_retailers ? e.total_retailers : 0);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.total_supervisors ? e.total_supervisors : 0);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.total_salesagents ? e.total_salesagents : 0);
        col_add++;
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
      await workbook.write("public/reports_retailer/consolidated_annual_distributor_performance_report.xlsx");
      const fileName = "./reports_retailer/consolidated_annual_distributor_performance_report.xlsx";
      setTimeout(() => {
        resolve(sendApiResult(true, "File Generated", fileName));
      }, 1500);
    } catch (error) {
      console.log(error);
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.filterDistributorAnnualView = async (req, res) => {
  const { distributor_id, manufacturer_id, select_date } = req.query;
  const selectDate = moment(select_date).startOf('date').format('YYYY-MM-DD');
  const selectDatePreviousDay = moment(select_date).subtract(1, 'days').format('YYYY-MM-DD');
  const currentYearJuly = moment(select_date).startOf('year').add(6, 'months').format('YYYY-MM-DD');
  const previousYearJuly = moment(select_date).startOf('year').add(6, 'months').subtract(1, 'years').format('YYYY-MM-DD');
  const currentMonth = 1 + moment(selectDate, 'YYYY-MM-DD').month();
  const comparison_financial_year = currentMonth > 6 ? currentYearJuly : previousYearJuly;

  return new Promise(async (resolve, reject) => {
    try {
      const distributor_info = await knex("APSISIPDC.cr_distributor")
        .where(function () {
          if (distributor_id) {
            this.where("cr_distributor.id", distributor_id);
          }
        })
        .select(
          "cr_distributor.id",
          "cr_distributor.distributor_name"
        );

      if (distributor_info.length == 0) {
        reject(sendReportApiResult(false, "Distributor Not Found"))
      }

      const distributor_annual_performance_Arr = [];

      for (let i = 0; i < distributor_info.length; i++) {
        const total_manufacturers = await knex
          .count("cr_manufacturer_vs_distributor.manufacturer_id as count")
          .from("APSISIPDC.cr_manufacturer_vs_distributor")
          .where("cr_manufacturer_vs_distributor.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_manufacturer_vs_distributor.manufacturer_id", manufacturer_id)
            }

            if (select_date) {
              this.whereRaw(`"cr_manufacturer_vs_distributor"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_manufacturer_vs_distributor"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_retailers = await knex
          .countDistinct("cr_retailer_manu_scheme_mapping.retailer_id as count")
          .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }

            if (select_date) {
              this.whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_supervisors = await knex
          .countDistinct("cr_supervisor.id as count")
          .from("APSISIPDC.cr_supervisor")
          .leftJoin(
            "APSISIPDC.cr_supervisor_distributor_manufacturer_map",
            "cr_supervisor_distributor_manufacturer_map.supervisor_id",
            "cr_supervisor.id"
          )
          .where("cr_supervisor.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_supervisor_distributor_manufacturer_map.manufacturer_id", manufacturer_id)
            }

            if (select_date) {
              this.whereRaw(`"cr_supervisor_distributor_manufacturer_map"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_supervisor_distributor_manufacturer_map"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const total_salesagents = await knex
          .countDistinct("cr_sales_agent.id as count")
          .from("APSISIPDC.cr_sales_agent")
          .leftJoin(
            "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map",
            "cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id",
            "cr_sales_agent.id"
          )
          .where("cr_sales_agent.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_salesagent_supervisor_distributor_manufacturer_map.manufacturer_id", manufacturer_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_salesagent_supervisor_distributor_manufacturer_map"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_salesagent_supervisor_distributor_manufacturer_map"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const principal_outstanding_blans = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.id",
            "cr_retailer_loan_calculation.manu_scheme_mapping_id"
          )
          .select("cr_retailer_loan_calculation.principal_outstanding")
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
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
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
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
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
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
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
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
          .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_info[i].id)
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (select_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
            }
          });

        const distributor_annual_performance_consolidated_info = {
          distributor_name: distributor_info[i].distributor_name,
          distributor_id: distributor_info[i].id,
          total_manufacturers: total_manufacturers[0].count,
          total_retailers: total_retailers[0].count,
          total_supervisors: total_supervisors[0].count,
          total_salesagents: total_salesagents[0].count,
          total_transactions_number: total_transactions_number[0].count,
          total_loan: total_amount[0].loan,
          total_collection: total_amount[0].collection,
          current_outstanding_amount: principal_outstanding_beginning_blans,
          total_blacklist_retailer: total_blacklist_retailer[0].count,
          total_suspened_retailer: total_suspened_retailer[0].count
        }

        distributor_annual_performance_Arr.push(distributor_annual_performance_consolidated_info);
      }
      if (distributor_annual_performance_Arr == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendReportApiResult(true, "Distributor Annual Consolidated Performance filter successfully", distributor_annual_performance_Arr));

    } catch (error) {
      console.log(error);
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.generateDistributorAnnualReportForManufacturer = async (req, res) => {
  const { distributor_id, manufacturer_id, select_date } = req.query;
  const selectDate = moment(select_date).startOf('date').format('YYYY-MM-DD');
  const selectDatePreviousDay = moment(select_date).subtract(1, 'days').format('YYYY-MM-DD');
  const currentYearJuly = moment(select_date).startOf('year').add(6, 'months').format('YYYY-MM-DD');
  const previousYearJuly = moment(select_date).startOf('year').add(6, 'months').subtract(1, 'years').format('YYYY-MM-DD');
  const currentMonth = 1 + moment(selectDate, 'YYYY-MM-DD').month();
  const comparison_financial_year = currentMonth > 6 ? currentYearJuly : previousYearJuly;

  return new Promise(async (resolve, reject) => {
    try {
      const distributor_info = await knex("APSISIPDC.cr_distributor")
        .where("cr_distributor.id", distributor_id)
        .select(
          "cr_distributor.id",
          "cr_distributor.distributor_name"
        );

      if (distributor_info.length == 0) {
        reject(sendReportApiResult(false, "Distributor Not Found"))
      }

      const distributor_annual_performance_Arr = [];

      const total_retailers = await knex
        .countDistinct("cr_retailer_manu_scheme_mapping.retailer_id as count")
        .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where(function () {
          if (select_date) {
            this.whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
            this.whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
          }
        });

      const total_supervisors = await knex
        .countDistinct("cr_supervisor.id as count")
        .from("APSISIPDC.cr_supervisor")
        .leftJoin(
          "APSISIPDC.cr_supervisor_distributor_manufacturer_map",
          "cr_supervisor_distributor_manufacturer_map.supervisor_id",
          "cr_supervisor.id"
        )
        .where("cr_supervisor.distributor_id", distributor_id)
        .where("cr_supervisor_distributor_manufacturer_map.manufacturer_id", manufacturer_id)
        .where(function () {
          if (select_date) {
            this.whereRaw(`"cr_supervisor_distributor_manufacturer_map"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
            this.whereRaw(`"cr_supervisor_distributor_manufacturer_map"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
          }
        });

      const total_salesagents = await knex
        .countDistinct("cr_sales_agent.id as count")
        .from("APSISIPDC.cr_sales_agent")
        .leftJoin(
          "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map",
          "cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id",
          "cr_sales_agent.id"
        )
        .where("cr_sales_agent.distributor_id", distributor_id)
        .where("cr_salesagent_supervisor_distributor_manufacturer_map.manufacturer_id", manufacturer_id)
        .where(function () {
          if (select_date) {
            this.whereRaw(`"cr_salesagent_supervisor_distributor_manufacturer_map"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
            this.whereRaw(`"cr_salesagent_supervisor_distributor_manufacturer_map"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
          }
        });

      const principal_outstanding_blans = await knex("APSISIPDC.cr_retailer_loan_calculation")
        .leftJoin(
          "APSISIPDC.cr_retailer_manu_scheme_mapping",
          "cr_retailer_manu_scheme_mapping.id",
          "cr_retailer_loan_calculation.manu_scheme_mapping_id"
        )
        .select("cr_retailer_loan_calculation.principal_outstanding")
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where(function () {
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
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where(function () {
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
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where(function () {
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
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where(function () {
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
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where(function () {
          if (select_date) {
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
          }
        });

      const distributor_annual_performance_consolidated_info = {
        distributor_name: distributor_info[0].distributor_name,
        distributor_id: distributor_info[0].id,
        total_retailers: total_retailers[0].count,
        total_supervisors: total_supervisors[0].count,
        total_salesagents: total_salesagents[0].count,
        total_transactions_number: total_transactions_number[0].count,
        total_loan: total_amount[0].loan,
        total_collection: total_amount[0].collection,
        current_outstanding_amount: principal_outstanding_beginning_blans,
        total_blacklist_retailer: total_blacklist_retailer[0].count,
        total_suspened_retailer: total_suspened_retailer[0].count
      }

      distributor_annual_performance_Arr.push(distributor_annual_performance_consolidated_info);

      const headers = [
        "Sr.",
        "Name of distributor",
        "Distributor ID",
        "No of retailers onboarded",
        "No of supervisors allocated",
        "No of sales agents allocated",
        "Total number of transactions",
        "Total sales volume (BDT)",
        "Total loan amount (BDT)",
        "Total collection amount (BDT)",
        "Current outstanding amount (BDT)",
        "Number of times discrepancies occurred in collection amount",
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
      for (let i = 0; i < distributor_annual_performance_Arr.length; i++) {
        var col_add = 0;
        let e = distributor_annual_performance_Arr[i];
        worksheet.cell(row, col + col_add).number(i + 1);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .string(e.distributor_name ? e.distributor_name : "");
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.distributor_id ? e.distributor_id : 0);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.total_retailers ? e.total_retailers : 0);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.total_supervisors ? e.total_supervisors : 0);
        col_add++;
        worksheet
          .cell(row, col + col_add)
          .number(e.total_salesagents ? e.total_salesagents : 0);
        col_add++;
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
      await workbook.write("public/reports_retailer/consolidated_annual_distributor_performance_report_for_manufacturer.xlsx");
      const fileName = "./reports_retailer/consolidated_annual_distributor_performance_report_for_manufacturer.xlsx";
      setTimeout(() => {
        resolve(sendApiResult(true, "File Generated", fileName));
      }, 1500);
    } catch (error) {
      console.log(error);
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.filterDistributorAnnualViewForManufacturer = async (req, res) => {
  const { distributor_id, manufacturer_id, select_date } = req.query;
  const selectDate = moment(select_date).startOf('date').format('YYYY-MM-DD');
  const selectDatePreviousDay = moment(select_date).subtract(1, 'days').format('YYYY-MM-DD');
  const currentYearJuly = moment(select_date).startOf('year').add(6, 'months').format('YYYY-MM-DD');
  const previousYearJuly = moment(select_date).startOf('year').add(6, 'months').subtract(1, 'years').format('YYYY-MM-DD');
  const currentMonth = 1 + moment(selectDate, 'YYYY-MM-DD').month();
  const comparison_financial_year = currentMonth > 6 ? currentYearJuly : previousYearJuly;

  return new Promise(async (resolve, reject) => {
    try {
      const distributor_info = await knex("APSISIPDC.cr_distributor")
        .where("cr_distributor.id", distributor_id)
        .select(
          "cr_distributor.id",
          "cr_distributor.distributor_name"
        );

      if (distributor_info.length == 0) {
        reject(sendReportApiResult(false, "Distributor Not Found"))
      }

      const distributor_annual_performance_Arr = [];

      const total_retailers = await knex
        .countDistinct("cr_retailer_manu_scheme_mapping.retailer_id as count")
        .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where(function () {
          if (select_date) {
            this.whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
            this.whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
          }
        });

      const total_supervisors = await knex
        .countDistinct("cr_supervisor.id as count")
        .from("APSISIPDC.cr_supervisor")
        .leftJoin(
          "APSISIPDC.cr_supervisor_distributor_manufacturer_map",
          "cr_supervisor_distributor_manufacturer_map.supervisor_id",
          "cr_supervisor.id"
        )
        .where("cr_supervisor.distributor_id", distributor_id)
        .where("cr_supervisor_distributor_manufacturer_map.manufacturer_id", manufacturer_id)
        .where(function () {
          if (select_date) {
            this.whereRaw(`"cr_supervisor_distributor_manufacturer_map"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
            this.whereRaw(`"cr_supervisor_distributor_manufacturer_map"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
          }
        });

      const total_salesagents = await knex
        .countDistinct("cr_sales_agent.id as count")
        .from("APSISIPDC.cr_sales_agent")
        .leftJoin(
          "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map",
          "cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id",
          "cr_sales_agent.id"
        )
        .where("cr_sales_agent.distributor_id", distributor_id)
        .where("cr_salesagent_supervisor_distributor_manufacturer_map.manufacturer_id", manufacturer_id)
        .where(function () {
          if (select_date) {
            this.whereRaw(`"cr_salesagent_supervisor_distributor_manufacturer_map"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
            this.whereRaw(`"cr_salesagent_supervisor_distributor_manufacturer_map"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
          }
        });

      const principal_outstanding_blans = await knex("APSISIPDC.cr_retailer_loan_calculation")
        .leftJoin(
          "APSISIPDC.cr_retailer_manu_scheme_mapping",
          "cr_retailer_manu_scheme_mapping.id",
          "cr_retailer_loan_calculation.manu_scheme_mapping_id"
        )
        .select("cr_retailer_loan_calculation.principal_outstanding")
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where(function () {
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
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where(function () {
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
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where(function () {
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
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where(function () {
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
        .where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where(function () {
          if (select_date) {
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${comparison_financial_year}', 'YYYY-MM-DD')`)
            this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${selectDate}', 'YYYY-MM-DD')`)
          }
        });

      const distributor_annual_performance_consolidated_info = {
        distributor_name: distributor_info[0].distributor_name,
        distributor_id: distributor_info[0].id,
        total_retailers: total_retailers[0].count,
        total_supervisors: total_supervisors[0].count,
        total_salesagents: total_salesagents[0].count,
        total_transactions_number: total_transactions_number[0].count,
        total_loan: total_amount[0].loan,
        total_collection: total_amount[0].collection,
        current_outstanding_amount: principal_outstanding_beginning_blans,
        total_blacklist_retailer: total_blacklist_retailer[0].count,
        total_suspened_retailer: total_suspened_retailer[0].count
      }

      distributor_annual_performance_Arr.push(distributor_annual_performance_consolidated_info);

      if (distributor_annual_performance_Arr == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendReportApiResult(true, "Distributor Annual Consolidated Performance filter successfully", distributor_annual_performance_Arr));

    } catch (error) {
      console.log(error);
      reject(sendApiResult(false, error.message));
    }
  });
};

module.exports = FileUpload;
