const moment = require("moment");
const express = require("express");
const { sendApiResult, getSettingsValue } = require("../controllers/helper");
const { ValidateNID, ValidatePhoneNumber, ValidateEmail } = require("../controllers/helperController");
const knex = require("../config/database");
const { default: axios } = require("axios");

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
              } else {
                //multiple manufacturer mapping with distributor

                const distributor_info = await knex("APSISIPDC.cr_distributor")
                  .where("status", "Active")
                  .where("distributor_tin", distributor_tin.toString())
                  .select(
                    "id",
                    "distributor_name"
                  );

                //const distributor_name_check = rows[index].Distributor_Name;
                //const distributor_code_check = rows[index].Distributor_Code;
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
                  total_mapping_dis_manu.push(mapping_dis_manu[0])
                  continue;
                }
                //multiple manufacturer mapping with distributor

                let duplicateStr = "duplicate columns - ";
                if (duplication_check_val != 0) {
                  duplicateStr = duplicateStr + "Distributor_TIN " + ", ";
                }

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
              mapping_distributor_with_manufacturer: Object.keys(total_mapping_dis_manu).length,
              created_by: parseInt(req.user_id),
            };
            await knex("APSISIPDC.cr_bulk_upload_file_log").insert(
              empty_insert_log
            );
            msg = "File Uploaded successfully!";
            resolve(sendApiResult(true, msg, empty_insert_log));
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
                    "distributor_name"
                  );

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
                  continue;
                }

                //multiple manu-distri mapping-check-code-in-same-excel

                let duplicateStr = "duplicate columns - ";
                if (duplication_check_val_tin_insert_data != 0) {
                  duplicateStr = duplicateStr + "Distributor_TIN " + ", ";
                }
                if (duplication_check_val_code_insert_data != 0) {
                  duplicateStr = duplicateStr + "Distributor_Code " + ", ";
                }
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

                const insert_manufacturer_vs_distributor = await knex(
                  "APSISIPDC.cr_manufacturer_vs_distributor"
                ).insert(temp_manufacturer_vs_distributor_map).returning("id");

                total_mapping_dis_manu.push(insert_manufacturer_vs_distributor[0]);

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
                      <p>User ID : ${data_array[index].Official_Email}</p>
                      <p>Password : 123456</p>
                      <p>Regards, </p>
                      <p>IPDC Finance</p>
                      `
                  })
                  console.log('sendMailsendMailsendMail', sendMail)
                }
                catch (err) {
                  console.log('errorerrorerrorerrorerror', err)
                }

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
                password: "5efd3b0647df9045c240729d31622c79",
                cr_user_type: folder_name,
              };
              const insert_user = await knex("APSISIPDC.cr_users")
                .insert(temp_user)
                .returning("id");
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
              resolve(sendApiResult(true, msg, insert_log));
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

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_distributor")
        .select(
          "cr_distributor.id",
          "cr_distributor.distributor_name"
        )
        .orderBy("cr_distributor.id", "desc");
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
          "cr_distributor.official_email",
          "cr_distributor.official_contact_number",
          "cr_distributor.ofc_address1",
          "cr_distributor.ofc_district",
          "cr_distributor.ofc_division",
          "cr_distributor.distributor_code"
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
module.exports = FileUpload;
