const moment = require("moment");
const express = require("express");
const { sendApiResult, getSettingsValue } = require("../controllers/helper");
const { ValidateNID, ValidatePhoneNumber, ValidateEmail } = require("../controllers/helperController");
const knex = require("../config/database");
const { default: axios } = require("axios");

const FileUpload = function () { };

FileUpload.insertExcelData = function (rows, filename, req) {
  var mapped_data_array = [];
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

          // const all_NID_array = [];
          // const all_Phone_array = [];
          // const all_Emp_code_array = [];
          const data_array = [];
          const unuploaded_data_array = [];
          const invalidate_data_array = [];
          if (Object.keys(rows).length != 0) {
            // for (let index = 0; index < rows.length; index++) {
            //   all_NID_array[index] = rows[index].Supervisor_NID;
            //   all_Phone_array[index] = rows[index].Phone;
            //   all_Emp_code_array[index] = rows[index].Supervisor_Employee_Code;
            // }
            for (let index = 0; index < rows.length; index++) {
              const nid = rows[index].Supervisor_NID;
              const phoneNumber = rows[index].Phone;
              const validNID = ValidateNID(nid);
              const validPhoneNumber = ValidatePhoneNumber(phoneNumber.toString());

              const distributor_id_check = rows[index].Distributor;
              const manufacturer_id_check = rows[index].Manufacturer;

              const check_manu_exist = await knex("APSISIPDC.cr_manufacturer")
                .where(
                  "id", manufacturer_id_check
                )
                .select("id");

              const check_dis_exist = await knex("APSISIPDC.cr_distributor")
                .where(
                  "id", distributor_id_check
                )
                .select("id");

              const check_exist_manu_dis = await knex("APSISIPDC.cr_manufacturer_vs_distributor")
                .where(
                  "cr_manufacturer_vs_distributor.distributor_id", distributor_id_check
                )
                .where(
                  "cr_manufacturer_vs_distributor.manufacturer_id", manufacturer_id_check
                )
                .select("cr_manufacturer_vs_distributor.id");

              const checkNidSalesAgent = await knex("APSISIPDC.cr_sales_agent")
                .where("agent_nid", rows[index].Supervisor_NID)
                .select(
                  "id",
                );


              if (!validNID || !validPhoneNumber || check_exist_manu_dis.length == 0 || check_manu_exist.length == 0 || check_dis_exist.length == 0 || checkNidSalesAgent.length != 0) {
                let invalidStr = "invalid columns - ";
                if (!validNID) {
                  invalidStr = invalidStr + "Supervisor_NID " + ", ";
                }
                if (!validPhoneNumber) {
                  invalidStr = invalidStr + "Phone " + ", ";
                }

                if (check_exist_manu_dis.length == 0 || check_manu_exist.length == 0 || check_dis_exist.length == 0) {
                  invalidStr = invalidStr + "distributor manufacturer mapping is not correct " + ", ";
                }

                if (checkNidSalesAgent.length != 0) {
                  invalidStr = invalidStr + "NID exist in Sales Agent NID " + ", ";
                }

                const temp_data = {
                  Supervisor_Name: rows[index].Supervisor_Name,
                  Supervisor_NID: rows[index].Supervisor_NID,
                  Phone: rows[index].Phone,
                  Manufacturer: rows[index].Manufacturer,
                  Supervisor_Employee_Code:
                    rows[index].Supervisor_Employee_Code,
                  Region_of_Operation: rows[index].Region_of_Operation,
                  Distributor: rows[index].Distributor,
                  Remarks_Invalidated: invalidStr,
                };

                invalidated_rows_arr.push(temp_data);
                invalidate_data_array.push(temp_data);
                continue;
              }

              if (checkNidSalesAgent.length == 0) {
                const supervisor_nid = rows[index].Supervisor_NID;
                const supervisor_phone = rows[index].Phone;
                const supervisor_emp_code = rows[index].Supervisor_Employee_Code;
                const duplication_checkNID = await knex
                  .count("cr_supervisor.supervisor_nid as count")
                  .from("APSISIPDC.cr_supervisor")
                  .where(
                    "APSISIPDC.cr_supervisor.supervisor_nid",
                    supervisor_nid
                  );
                const duplication_check_val_nid = parseInt(
                  duplication_checkNID[0].count
                );
                const duplication_check_phone = await knex
                  .count("cr_supervisor.phone as count")
                  .from("APSISIPDC.cr_supervisor")
                  .where(
                    "APSISIPDC.cr_supervisor.phone",
                    supervisor_phone.toString()
                  );
                const duplication_check_val_phone = parseInt(
                  duplication_check_phone[0].count
                );
                const duplication_check_emp_code = await knex
                  .count("cr_supervisor.supervisor_employee_code as count")
                  .from("APSISIPDC.cr_supervisor")
                  .where(
                    "APSISIPDC.cr_supervisor.supervisor_employee_code",
                    supervisor_emp_code.toString()
                  );
                const duplication_check_val_emp_code = parseInt(
                  duplication_check_emp_code[0].count
                );

                const duplication_checkEmpCode_user_table = await knex
                  .count("cr_users.email as count")
                  .from("APSISIPDC.cr_users")
                  .where(
                    "APSISIPDC.cr_users.email",
                    supervisor_emp_code.toString()
                  );

                const duplication_check_val_empCode_user_table = parseInt(
                  duplication_checkEmpCode_user_table[0].count
                );

                if (duplication_check_val_nid == 0
                  && duplication_check_val_phone == 0
                  && duplication_check_val_emp_code == 0
                  && duplication_check_val_empCode_user_table == 0) {
                  const temp_data = {
                    Supervisor_Name: rows[index].Supervisor_Name,
                    Supervisor_NID: rows[index].Supervisor_NID,
                    Phone: rows[index].Phone,
                    Manufacturer: rows[index].Manufacturer,
                    Supervisor_Employee_Code:
                      rows[index].Supervisor_Employee_Code,
                    Region_of_Operation: rows[index].Region_of_Operation,
                    Distributor: rows[index].Distributor
                  };
                  data_array.push(temp_data);
                } else {
                  //multiple distributor manufacturer with supervisor
                  const sup_manufacturer_id = rows[index].Manufacturer;
                  const supervisor_info = await knex("APSISIPDC.cr_supervisor")
                    .where("status", "Active")
                    .where(
                      "supervisor_nid",
                      supervisor_nid
                    )
                    .where(
                      "phone",
                      supervisor_phone.toString()
                    )
                    .where(
                      "supervisor_employee_code",
                      supervisor_emp_code.toString()
                    )
                    .select(
                      "id",
                      "supervisor_name",
                      "supervisor_employee_code",
                      "distributor_id"
                    );

                  if (supervisor_info.length != 0) {
                    if (supervisor_info[0].distributor_id == rows[index].Distributor) {
                      const duplicate_check_dis_manu = await knex
                        .count("cr_supervisor_distributor_manufacturer_map.id as count")
                        .from("APSISIPDC.cr_supervisor_distributor_manufacturer_map")
                        .where(
                          "APSISIPDC.cr_supervisor_distributor_manufacturer_map.supervisor_id",
                          supervisor_info[0].id
                        )
                        .where(
                          "APSISIPDC.cr_supervisor_distributor_manufacturer_map.distributor_id",
                          supervisor_info[0].distributor_id
                        )
                        .where(
                          "APSISIPDC.cr_supervisor_distributor_manufacturer_map.manufacturer_id",
                          sup_manufacturer_id
                        );

                      const duplicate_check_dis_manu_val = parseInt(
                        duplicate_check_dis_manu[0].count
                      );

                      if (duplicate_check_dis_manu_val == 0) {
                        const multiple_manu_mapping_supervisor = {
                          supervisor_id: supervisor_info[0].id,
                          //supervisor_employee_code: supervisor_info[0].supervisor_employee_code,
                          distributor_id: supervisor_info[0].distributor_id,
                          manufacturer_id: rows[index].Manufacturer,
                          created_by: req.user_id,
                        }
                        mapped_data_array.push(multiple_manu_mapping_supervisor);
                        const mapping_manu_supervisor_mapping = await knex(
                          "APSISIPDC.cr_supervisor_distributor_manufacturer_map"
                        ).insert(multiple_manu_mapping_supervisor).returning("id");

                        //total_mapping_dis_manu.push(mapping_dis_manu[0])
                        continue;
                      }

                    }

                  }
                  //multiple distributor manufacturer with supervisor


                  let duplicateStr = "duplicate columns - ";
                  if (duplication_check_val_nid != 0) {
                    duplicateStr = duplicateStr + "Supervisor_NID " + ", ";
                  }
                  if (duplication_check_val_phone != 0) {
                    duplicateStr = duplicateStr + "Phone " + ", ";
                  }
                  if (duplication_check_val_emp_code != 0) {
                    duplicateStr = duplicateStr + "Supervisor_Employee_Code " + ", ";
                  }
                  if (duplication_check_val_empCode_user_table != 0) {
                    duplicateStr = duplicateStr + "Supervisor_Employee_Code already used by another user " + ", ";
                  }

                  const temp_data = {
                    Supervisor_Name: rows[index].Supervisor_Name,
                    Supervisor_NID: rows[index].Supervisor_NID,
                    Phone: rows[index].Phone,
                    Manufacturer: rows[index].Manufacturer,
                    Supervisor_Employee_Code:
                      rows[index].Supervisor_Employee_Code,
                    Region_of_Operation: rows[index].Region_of_Operation,
                    Distributor: rows[index].Distributor,
                    Remarks_Duplicated: duplicateStr
                  };
                  duplicated_rows_arr.push(temp_data);
                  unuploaded_data_array.push(temp_data);
                }
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
              "total_mapped": mapped_data_array,
              "total_invalidated_row": invalidated_rows_arr.length,
              "total_duplicated_row": duplicated_rows_arr.length
            }
            resolve(sendApiResult(true, msg, response));
          }

          if (Object.keys(invalidate_data_array).length != 0) {
            for (let index = 0; index < invalidate_data_array.length; index++) {
              const invalidated_supervisor = {
                supervisor_name: invalidate_data_array[index].Supervisor_Name,
                supervisor_nid: invalidate_data_array[index].Supervisor_NID,
                phone: invalidate_data_array[index].Phone,
                manufacturer_id: invalidate_data_array[index].Manufacturer,
                distributor_id: invalidate_data_array[index].Distributor,
                supervisor_employee_code:
                  invalidate_data_array[index].Supervisor_Employee_Code,
                region_of_operation: invalidate_data_array[index].Region_of_Operation,
                remarks_invalidated: invalidate_data_array[index].Remarks_Invalidated,
                created_by: req.user_id,
              };

              await knex("APSISIPDC.cr_supervisor_invalidated_data")
                .insert(invalidated_supervisor);
            }
          }

          if (Object.keys(unuploaded_data_array).length != 0) {
            for (let index = 0; index < unuploaded_data_array.length; index++) {
              const unuploaded_supervisor = {
                supervisor_name: unuploaded_data_array[index].Supervisor_Name,
                supervisor_nid: unuploaded_data_array[index].Supervisor_NID,
                phone: unuploaded_data_array[index].Phone,
                manufacturer_id: unuploaded_data_array[index].Manufacturer,
                distributor_id: unuploaded_data_array[index].Distributor,
                supervisor_employee_code:
                  unuploaded_data_array[index].Supervisor_Employee_Code,
                region_of_operation: unuploaded_data_array[index].Region_of_Operation,
                remarks_duplications: unuploaded_data_array[index].Remarks_Duplicated,
                created_by: req.user_id
              };

              await knex("APSISIPDC.cr_supervisor_unuploaded_data")
                .insert(unuploaded_supervisor);
            }
          }

          if (Object.keys(data_array).length != 0) {
            const supervisor_insert_ids = [];
            const user_insert_ids = [];
            const distributor_ids = [];
            for (let index = 0; index < data_array.length; index++) {
              const supervisor_nid_insert_data = data_array[index].Supervisor_NID;
              const supervisor_phone_insert_data = data_array[index].Phone;
              const supervisor_emp_code_insert_data = data_array[index].Supervisor_Employee_Code;

              const duplication_checkNID_insert_data = await knex
                .count("cr_supervisor.supervisor_nid as count")
                .from("APSISIPDC.cr_supervisor")
                .where(
                  "APSISIPDC.cr_supervisor.supervisor_nid",
                  supervisor_nid_insert_data
                );
              const duplication_check_val_nid_insert_data = parseInt(
                duplication_checkNID_insert_data[0].count
              );
              const duplication_check_phone_insert_data = await knex
                .count("cr_supervisor.phone as count")
                .from("APSISIPDC.cr_supervisor")
                .where(
                  "APSISIPDC.cr_supervisor.phone",
                  supervisor_phone_insert_data.toString()
                );
              const duplication_check_val_phone_insert_data = parseInt(
                duplication_check_phone_insert_data[0].count
              );
              const duplication_check_emp_code_insert_data = await knex
                .count("cr_supervisor.supervisor_employee_code as count")
                .from("APSISIPDC.cr_supervisor")
                .where(
                  "APSISIPDC.cr_supervisor.supervisor_employee_code",
                  supervisor_emp_code_insert_data.toString()
                );
              const duplication_check_val_emp_code_insert_data = parseInt(
                duplication_check_emp_code_insert_data[0].count
              );

              if (duplication_check_val_nid_insert_data != 0
                || duplication_check_val_phone_insert_data != 0
                || duplication_check_val_emp_code_insert_data != 0) {

                //multiple distributor manufacturer with supervisor

                const sup_manufacturer_id_insert_data = data_array[index].Manufacturer;

                const supervisor_info_insert_data = await knex("APSISIPDC.cr_supervisor")
                  .where("status", "Active")
                  .where(
                    "supervisor_nid",
                    supervisor_nid_insert_data
                  )
                  .where(
                    "phone",
                    supervisor_phone_insert_data.toString()
                  )
                  .where(
                    "supervisor_employee_code",
                    supervisor_emp_code_insert_data.toString()
                  )
                  .select(
                    "id",
                    "supervisor_name",
                    "supervisor_employee_code",
                    "distributor_id"
                  );

                if (supervisor_info_insert_data.length != 0) {
                  if (supervisor_info_insert_data[0].distributor_id == data_array[index].Distributor) {
                    const duplicate_check_dis_manu_insert_data = await knex
                      .count("cr_supervisor_distributor_manufacturer_map.id as count")
                      .from("APSISIPDC.cr_supervisor_distributor_manufacturer_map")
                      .where(
                        "APSISIPDC.cr_supervisor_distributor_manufacturer_map.supervisor_id",
                        supervisor_info_insert_data[0].id
                      )
                      .where(
                        "APSISIPDC.cr_supervisor_distributor_manufacturer_map.distributor_id",
                        supervisor_info_insert_data[0].distributor_id
                      )
                      .where(
                        "APSISIPDC.cr_supervisor_distributor_manufacturer_map.manufacturer_id",
                        sup_manufacturer_id_insert_data
                      );

                    const duplicate_check_dis_manu_val_insert_data = parseInt(
                      duplicate_check_dis_manu_insert_data[0].count
                    );

                    if (duplicate_check_dis_manu_val_insert_data == 0) {
                      const multiple_manu_mapping_supervisor_insert_data = {
                        supervisor_id: supervisor_info_insert_data[0].id,
                        //supervisor_employee_code: supervisor_info_insert_data[0].supervisor_employee_code,
                        distributor_id: supervisor_info_insert_data[0].distributor_id,
                        manufacturer_id: data_array[index].Manufacturer,
                        created_by: req.user_id,
                      }
                      mapped_data_array.push(multiple_manu_mapping_supervisor_insert_data);
                      const mapping_manu_supervisor_mapping_insert_data = await knex(
                        "APSISIPDC.cr_supervisor_distributor_manufacturer_map"
                      ).insert(multiple_manu_mapping_supervisor_insert_data).returning("id");

                      //total_mapping_dis_manu.push(mapping_dis_manu[0])
                      continue;
                    }

                  }

                }

                //multiple distributor manufacturer with supervisor

                let duplicateStr = "duplicate columns - ";
                if (duplication_check_val_nid_insert_data != 0) {
                  duplicateStr = duplicateStr + "Supervisor_NID " + ", ";
                }
                if (duplication_check_val_phone_insert_data != 0) {
                  duplicateStr = duplicateStr + "Phone " + ", ";
                }
                if (duplication_check_val_emp_code_insert_data != 0) {
                  duplicateStr = duplicateStr + "Supervisor_Employee_Code " + ", ";
                }

                const duplicate_data_array = {
                  supervisor_name: data_array[index].Supervisor_Name,
                  supervisor_nid: data_array[index].Supervisor_NID,
                  phone: data_array[index].Phone,
                  manufacturer_id: data_array[index].Manufacturer,
                  distributor_id: data_array[index].Distributor,
                  supervisor_employee_code:
                    data_array[index].Supervisor_Employee_Code,
                  region_of_operation: data_array[index].Region_of_Operation,
                  remarks_duplications: duplicateStr,
                  created_by: req.user_id,
                };
                duplicated_rows_arr.push(duplicate_data_array);
                await knex("APSISIPDC.cr_supervisor_unuploaded_data")
                  .insert(duplicate_data_array);
                continue;
              }

              const team_supervisor = {
                supervisor_name: data_array[index].Supervisor_Name,
                supervisor_nid: data_array[index].Supervisor_NID,
                phone: data_array[index].Phone,
                distributor_id: data_array[index].Distributor,
                supervisor_employee_code:
                  data_array[index].Supervisor_Employee_Code,
                region_of_operation: data_array[index].Region_of_Operation,
                created_by: req.user_id,
              };
              distributor_ids.push(data_array[index].Distributor);

              const insert_supervisor = await knex("APSISIPDC.cr_supervisor")
                .insert(team_supervisor)
                .returning("id");


              if (insert_supervisor) {
                supervisor_insert_ids.push(insert_supervisor[0]);

                const temp_manufacturer_vs_supervisor_map = {
                  supervisor_id: insert_supervisor[0],
                  //supervisor_employee_code: data_array[index].Supervisor_Employee_Code,
                  distributor_id: data_array[index].Distributor,
                  manufacturer_id: data_array[index].Manufacturer,
                  created_by: req.user_id,
                };

                mapped_data_array.push(temp_manufacturer_vs_supervisor_map);
                const insert_manufacturer_vs_supervisor_map = await knex(
                  "APSISIPDC.cr_supervisor_distributor_manufacturer_map"
                ).insert(temp_manufacturer_vs_supervisor_map).returning("id");
              }

              const temp_user = {
                name: data_array[index].Supervisor_Name,
                email: data_array[index].Supervisor_Employee_Code,
                phone: data_array[index].Phone,
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
                  "APSISIPDC.cr_supervisor_user"
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
                  "APSISIPDC.cr_user_wise_distributor"
                ).insert(user_wise_distributor);
                const insert_user_wise_role = await knex(
                  "APSISIPDC.cr_user_wise_role"
                ).insert(user_wise_role);
                if (insert_user_wise_distributor && insert_user_wise_role) {
                  is_user_wise_role_insert = 1;
                }
              }
            }

            if (
              is_supervisor_wise_user_insert == 1 &&
              is_user_wise_role_insert == 1
            ) {
              const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
              const insert_log = {
                sys_date: new Date(date),
                file_for: folder_name,
                file_path: `public/configuration_file/${folder_name}`,
                file_name: filename,
                found_rows: Object.keys(rows).length,
                upload_rows: Object.keys(supervisor_insert_ids).length,
                created_by: parseInt(req.user_id),
              };
              await knex("APSISIPDC.cr_bulk_upload_file_log").insert(
                insert_log
              );
              msg = "File Uploaded successfully!";
              var response = {
                "insert_log": insert_log,
                "total_mapped": mapped_data_array,
                "total_invalidated_row": invalidated_rows_arr.length,
                "total_duplicated_row": duplicated_rows_arr.length
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
          console.log("Catch error...Data not inserted", error)
          reject(sendApiResult(false, "Data not inserted."));

        });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  }).catch((error) => {
    console.log("Catch error", error)
  });
};

FileUpload.getAllManufacturerForSupervisor = function (req) {
  const { supervisor_id } = req.params;

  return new Promise(async (resolve, reject) => {
    try {
      const manufacturer = await knex("APSISIPDC.cr_supervisor")
        .leftJoin("APSISIPDC.cr_supervisor_distributor_manufacturer_map",
          "cr_supervisor_distributor_manufacturer_map.supervisor_id",
          "cr_supervisor.id")
        .leftJoin("APSISIPDC.cr_manufacturer",
          "cr_manufacturer.id",
          "cr_supervisor_distributor_manufacturer_map.manufacturer_id")
        .where("cr_supervisor.id", Number(supervisor_id))
        .where("cr_manufacturer.status", "Active")
        .select(
          "cr_manufacturer.id",
          "cr_manufacturer.manufacturer_name"
        );
      if (manufacturer == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", manufacturer));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.saveRemarksFeedback = function (req) {

  const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

  const userID = req.body.user_id;

  const { remarks_id, remarks_one, supervisor_status, admin_status, transaction_type } = req.body;

  const remarks_loan_cal_idsArr = remarks_id.split(",");

  return new Promise(async (resolve, reject) => {
    try {

      let file_upload_id = [];

      if (req.body.file_for && req.file.filename) {
        const folder_name = req.body.file_for;
        const filename = req.file.filename;

        const file_insert_log = {
          sys_date: new Date(date),
          file_for: folder_name,
          file_path: `public/feedback_file/${folder_name}`,
          file_name: filename,
          created_by: parseInt(userID)
        };

        file_upload_id = await knex("APSISIPDC.cr_feedback_file_upload").insert(
          file_insert_log
        ).returning("id");

        if (file_upload_id == 0) reject(sendApiResult(false, "Not Upload"));

      }

      const insertValue = {
        remarks_one,
        transaction_type,
        created_by: parseInt(userID),
        file_upload_id: file_upload_id[0]
      }

      const cr_remarks_feedback_id = await knex("APSISIPDC.cr_remarks_feedback")
        .insert(insertValue).returning("id");

      if (cr_remarks_feedback_id == 0) reject(sendApiResult(false, "Not Save"));

      for (let i = 0; i < remarks_loan_cal_idsArr.length; i++) {

        const feedback_loan_ids = {
          cr_remarks_feedback_id: cr_remarks_feedback_id[0],
          cr_remarks_loan_calculation_id: remarks_loan_cal_idsArr[i],
          supervisor_status,
          admin_status
        };

        await knex("APSISIPDC.cr_remarks_loan_calculation_ids")
          .insert(feedback_loan_ids);

        if (transaction_type == "DISBURSEMENT") {
          await knex("APSISIPDC.cr_disbursement")
            .where("cr_disbursement.id", remarks_loan_cal_idsArr[i])
            .update({ supervisor_status_disbursement: 1 });
        }

        if (transaction_type == "REPAYMENT") {
          await knex("APSISIPDC.cr_retailer_loan_calculation")
            .where("cr_retailer_loan_calculation.id", remarks_loan_cal_idsArr[i])
            .update({ supervisor_status_repayment: 1 });
        }


      }

      resolve(sendApiResult(true, "Data Saved successfully", cr_remarks_feedback_id));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.insertRemarksFeedback = function (req) {
  const { supervisor_code,
    manufacturer_id,
    amount,
    transaction_type,
    cr_retailer_loan_calculation_ids

  } = req.body;

  const cr_retailer_loan_calculation_idsArr = cr_retailer_loan_calculation_ids.split(",");

  return new Promise(async (resolve, reject) => {
    try {
      const insert_obj = {
        manufacturer_id: manufacturer_id,
        supervisor_emp_code: supervisor_code,
        amount: amount,
        supervisor_status: 1,
        transaction_type: transaction_type
      }

      const insert_obj_Id = await knex("APSISIPDC.cr_remarks_feedback").insert(
        insert_obj
      ).returning("id");

      if (insert_obj_Id == 0) reject(sendApiResult(false, "Not Insert"));

      const manufacturer = await knex("APSISIPDC.cr_manufacturer")
        .where("id", manufacturer_id)
        .select(
          "manufacturer_name"
        );

      if (manufacturer == 0) reject(sendApiResult(false, "Not found"));

      // const supervisor = await knex("APSISIPDC.cr_supervisor")
      //   .where("cr_supervisor.supervisor_employee_code", supervisor_code)
      //   .select(
      //     "supervisor_name"
      //   );

      // if (supervisor == 0) reject(sendApiResult(false, "Not found"));

      const genereateSystemId = manufacturer[0].manufacturer_name + "-" + insert_obj_Id[0] + "-" + supervisor_code;

      const system_Id = await knex("APSISIPDC.cr_remarks_feedback").update(
        { system_id: genereateSystemId }
      ).where("id", insert_obj_Id[0]);

      for (let i = 0; i < cr_retailer_loan_calculation_idsArr.length; i++) {
        await knex("APSISIPDC.cr_retailer_loan_calculation")
          .update({ feedback_reference_id: insert_obj_Id[0] })
          .where("id", cr_retailer_loan_calculation_idsArr[i])
          .where("transaction_type", transaction_type);

        if (transaction_type == "DISBURSEMENT") {
          await knex("APSISIPDC.cr_retailer_loan_calculation")
            .update({ supervisor_status_disbursement: 1 })
            .where("id", cr_retailer_loan_calculation_idsArr[i])
            .where("transaction_type", transaction_type);

        }

        if (transaction_type == "REPAYMENT") {
          await knex("APSISIPDC.cr_retailer_loan_calculation")
            .update({ supervisor_status_repayment: 1 })
            .where("id", cr_retailer_loan_calculation_idsArr[i])
            .where("transaction_type", transaction_type);

        }
      }

      resolve(sendApiResult(true, "Data Saved and Updated successfully", insert_obj_Id));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

//getAdminFeedbackList

FileUpload.getAdminFeedbackList = function (req) {
  const { manufacturer_id, page, per_page, transaction_type, start_date, end_date } = req.query;
  const startDate = moment(start_date).startOf('date').format('YYYY-MM-DD');
  const endDate = moment(end_date).add(1, 'days').format('YYYY-MM-DD');

  return new Promise(async (resolve, reject) => {
    try {
      const adminFeedBack = await knex("APSISIPDC.cr_remarks_feedback")
        .leftJoin("APSISIPDC.cr_manufacturer",
          "cr_manufacturer.id",
          "cr_remarks_feedback.manufacturer_id")
        .whereRaw(`"cr_remarks_feedback"."created_at" >= TO_DATE('${startDate}', 'YYYY-MM-DD')`)
        .whereRaw(`"cr_remarks_feedback"."created_at" < TO_DATE('${endDate}', 'YYYY-MM-DD')`)
        .where("cr_remarks_feedback.manufacturer_id", manufacturer_id)
        .where("cr_remarks_feedback.transaction_type", transaction_type)
        .where("cr_remarks_feedback.admin_status", null)
        .select(
          "cr_remarks_feedback.id",
          "cr_manufacturer.manufacturer_name",
          "cr_remarks_feedback.amount",
          knex.raw('TO_CHAR("cr_remarks_feedback"."created_at", \'DD-MON-YYYY\') AS feedback_date'),
          "cr_remarks_feedback.system_id",
          "cr_remarks_feedback.approve_status",
          "cr_remarks_feedback.transaction_type",
        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (adminFeedBack == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", adminFeedBack));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getAdminFeedbackListHistory = function (req) {
  const { manufacturer_id, page, per_page, transaction_type, start_date, end_date } = req.query;
  const startDate = moment(start_date).startOf('date').format('YYYY-MM-DD');
  const endDate = moment(end_date).add(1, 'days').format('YYYY-MM-DD');

  return new Promise(async (resolve, reject) => {
    try {
      const adminFeedBack = await knex("APSISIPDC.cr_remarks_feedback")
        .leftJoin("APSISIPDC.cr_manufacturer",
          "cr_manufacturer.id",
          "cr_remarks_feedback.manufacturer_id")
        .whereRaw(`"cr_remarks_feedback"."created_at" >= TO_DATE('${startDate}', 'YYYY-MM-DD')`)
        .whereRaw(`"cr_remarks_feedback"."created_at" < TO_DATE('${endDate}', 'YYYY-MM-DD')`)
        .where("cr_remarks_feedback.manufacturer_id", manufacturer_id)
        .where("cr_remarks_feedback.transaction_type", transaction_type)
        .where("cr_remarks_feedback.admin_status", 1)
        .select(
          "cr_remarks_feedback.id",
          "cr_manufacturer.manufacturer_name",
          "cr_remarks_feedback.amount",
          knex.raw('TO_CHAR("cr_remarks_feedback"."created_at", \'DD-MON-YYYY\') AS feedback_date'),
          "cr_remarks_feedback.system_id",
          "cr_remarks_feedback.approve_status",
          "cr_remarks_feedback.transaction_type",
        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (adminFeedBack == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", adminFeedBack));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getSupervisorFeedbackListHistory = function (req) {
  const { supervisor_code } = req.params;
  const { manufacturer_id, page, per_page, transaction_type, start_date, end_date } = req.query;
  const startDate = moment(start_date).startOf('date').format('YYYY-MM-DD');
  const endDate = moment(end_date).add(1, 'days').format('YYYY-MM-DD');

  return new Promise(async (resolve, reject) => {
    try {
      const adminFeedBack = await knex("APSISIPDC.cr_remarks_feedback")
        .leftJoin("APSISIPDC.cr_manufacturer",
          "cr_manufacturer.id",
          "cr_remarks_feedback.manufacturer_id")
        .whereRaw(`"cr_remarks_feedback"."created_at" >= TO_DATE('${startDate}', 'YYYY-MM-DD')`)
        .whereRaw(`"cr_remarks_feedback"."created_at" < TO_DATE('${endDate}', 'YYYY-MM-DD')`)
        .where("cr_remarks_feedback.manufacturer_id", manufacturer_id)
        .where("cr_remarks_feedback.supervisor_emp_code", supervisor_code)
        .where("cr_remarks_feedback.transaction_type", transaction_type)
        .where("cr_remarks_feedback.supervisor_status", 1)
        .select(
          "cr_remarks_feedback.id",
          "cr_manufacturer.manufacturer_name",
          "cr_remarks_feedback.amount",
          knex.raw('TO_CHAR("cr_remarks_feedback"."created_at", \'DD-MON-YYYY\') AS feedback_date'),
          "cr_remarks_feedback.system_id",
          "cr_remarks_feedback.approve_status",
          "cr_remarks_feedback.transaction_type",
        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (adminFeedBack == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", adminFeedBack));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getDetailsFeedbackListDisbursementRepayment = function (req) {
  const { feedback_id, transaction_type } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_retailer_loan_calculation")
        .leftJoin("APSISIPDC.cr_retailer",
          "cr_retailer.id",
          "cr_retailer_loan_calculation.retailer_id")
        .leftJoin("APSISIPDC.cr_sales_agent",
          "cr_sales_agent.id",
          "cr_retailer_loan_calculation.sales_agent_id")
        .where("cr_retailer_loan_calculation.feedback_reference_id", feedback_id)
        .where("cr_retailer_loan_calculation.transaction_type", transaction_type)
        .select(
          "cr_retailer_loan_calculation.id",
          knex.raw('TO_CHAR("cr_retailer_loan_calculation"."created_at", \'DD-MON-YYYY\') AS create_date'),
          "cr_retailer_loan_calculation.retailer_id",
          "cr_retailer.retailer_name",
          "cr_retailer_loan_calculation.sales_agent_id",
          "cr_sales_agent.agent_name",
          "cr_retailer_loan_calculation.disburshment",
          "cr_retailer_loan_calculation.repayment",
          "cr_retailer.phone",
          "cr_retailer.email"
        );

      if (data == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};


FileUpload.updateAdminFeedback = function (req) {

  const { admin_id } = req.params;
  const {
    feedback_id,
    transaction_type
  } = req.body;

  const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

  return new Promise(async (resolve, reject) => {
    try {

      const update_obj = {
        admin_status: 1,
        admin_id: admin_id,
        approve_status: "Done",
        updated_at: new Date(date)
      }

      var admin_status_update = [];
      await knex.transaction(async (trx) => {
        admin_status_update = await trx("APSISIPDC.cr_remarks_feedback")
          .where("id", feedback_id)
          .where("transaction_type", transaction_type)
          .update(update_obj);
      });

      if (admin_status_update.length <= 0)
        reject(sendApiResult(false, "Admin Status is not updated"));
      resolve(
        sendApiResult(
          true,
          "Admin Status Updated Successfully",
          admin_status_update
        )
      );

    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

// FileUpload.uploadFileReamarks = (filename, req) => {
//   const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
//   const folder_name = req.file_for;
//   const file_insert_log = {
//     sys_date: new Date(date),
//     file_for: folder_name,
//     file_path: `public/feedback_file/${folder_name}`,
//     file_name: filename,
//     created_by: parseInt(req.user_id)
//   };

//   return new Promise(async (resolve, reject) => {
//     try {
//       const file_upload = await knex("APSISIPDC.cr_feedback_file_upload").insert(
//         file_insert_log
//       ).returning("id");

//       if (file_upload == 0) reject(sendApiResult(false, "Not Upload"));
//       resolve(sendApiResult(true, "file Upload successfully", file_upload));
//     } catch (error) {
//       reject(sendApiResult(false, error.message));
//     }
//   });


// }

FileUpload.getAllManufacturerOfSalesagentUnderSupervisor = function (req) {
  const { supervisor_id } = req.params;

  return new Promise(async (resolve, reject) => {
    try {
      const supervisor_employee_code_data = await knex("APSISIPDC.cr_supervisor")
        .where("id", supervisor_id)
        .where("status", "Active")
        .select(
          "supervisor_employee_code"
        );
      if (supervisor_employee_code_data == 0) reject(sendApiResult(false, "Supervisor Not found."));
      const supervisor_code = supervisor_employee_code_data[0].supervisor_employee_code;
      const manufacturer = await knex("APSISIPDC.cr_sales_agent")
        .leftJoin("APSISIPDC.cr_manufacturer",
          "cr_manufacturer.id",
          "cr_sales_agent.manufacturer_id")
        .where("cr_sales_agent.autho_supervisor_employee_code", supervisor_code)
        .where("cr_sales_agent.status", "Active")
        .where("cr_manufacturer.status", "Active")
        .select(
          "cr_sales_agent.manufacturer_id",
          "cr_manufacturer.manufacturer_name"
        );
      if (manufacturer == 0) reject(sendApiResult(false, "Manufacturer Not found."));

      resolve(sendApiResult(true, "Data fetched successfully", manufacturer));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getSupervisorList = function (req) {
  const { page, per_page } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_supervisor")
        .leftJoin("APSISIPDC.cr_distributor",
          "cr_distributor.id",
          "cr_supervisor.distributor_id"
        )
        .where("cr_supervisor.activation_status", "Active")
        .select(
          "cr_supervisor.id",
          "cr_supervisor.supervisor_name",
          "cr_supervisor.supervisor_nid",
          "cr_supervisor.phone",
          "cr_supervisor.distributor_id",
          "cr_distributor.distributor_name",
          "cr_supervisor.supervisor_employee_code",
          "cr_supervisor.region_of_operation"
        )
        .orderBy("cr_supervisor.id", "desc")
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

FileUpload.getSupervisorListByManufacturerAndDistributor = function (req) {
  const { manufacturer_id, distributor_id } = req.params;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_supervisor")
        .where("status", "Active")
        .where("manufacturer_id", manufacturer_id)
        .where("distributor_id", distributor_id)
        .select(
          "id",
          "supervisor_name",
          "supervisor_nid",
          "phone",
          "supervisor_employee_code"
        );
      if (data == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getSalesAgentListByManufacturerAndSupervisor = function (req) {
  const { manufacturer_id, supervisor_code } = req.params;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_sales_agent")
        .where("status", "Active")
        .where("manufacturer_id", manufacturer_id)
        .where("autho_supervisor_employee_code", supervisor_code)
        .select(
          "id",
          "agent_name",
          "agent_nid",
          "phone",
          "agent_employee_code"
        );
      if (data == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getSalesAgentListBySupervisor = function (req) {
  const { supervisor_code } = req.params;

  return new Promise(async (resolve, reject) => {
    try {
      const sales_agent = await knex("APSISIPDC.cr_sales_agent")
        .where("status", "Active")
        .where("autho_supervisor_employee_code", supervisor_code)
        .select(
          "id",
          "agent_name"
        );

      console.log(sales_agent);
      if (sales_agent == 0) reject(sendApiResult(false, "Not found Sales Agent."));
      resolve(sendApiResult(true, "Data fetched successfully", sales_agent));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getRepaymentRemarksFeedbackHistoryAdmin = function (req) {
  const { page, per_page } = req.query;
  // const startDate = moment(start_date).startOf('date').format('YYYY-MM-DD');
  // const endDate = moment(end_date).add(1, 'days').format('YYYY-MM-DD');

  return new Promise(async (resolve, reject) => {
    try {
      const remarks_result = await knex("APSISIPDC.cr_remarks_feedback")
        .leftJoin("APSISIPDC.cr_feedback_file_upload",
          "cr_feedback_file_upload.id",
          "cr_remarks_feedback.file_upload_id")
        .leftJoin("APSISIPDC.cr_remarks_loan_calculation_ids",
          "cr_remarks_loan_calculation_ids.cr_remarks_feedback_id",
          "cr_remarks_feedback.id")
        .leftJoin("APSISIPDC.cr_retailer_loan_calculation",
          "cr_retailer_loan_calculation.id",
          "cr_remarks_loan_calculation_ids.cr_remarks_loan_calculation_id")
        .where("cr_remarks_loan_calculation_ids.supervisor_status", 1)
        .where("cr_remarks_loan_calculation_ids.admin_status", 1)
        .select(
          "cr_remarks_loan_calculation_ids.id",
          "cr_remarks_loan_calculation_ids.cr_remarks_feedback_id",
          "cr_remarks_feedback.remarks_one",
          "cr_remarks_feedback.status",
          "cr_remarks_feedback.file_upload_id",
          "cr_remarks_feedback.created_by",
          "cr_remarks_loan_calculation_ids.supervisor_status",
          "cr_remarks_loan_calculation_ids.admin_status",
          "cr_remarks_feedback.transaction_type",
          "cr_feedback_file_upload.sys_date",
          "cr_feedback_file_upload.file_for",
          "cr_feedback_file_upload.file_path",
          "cr_feedback_file_upload.file_name",
          "cr_remarks_loan_calculation_ids.cr_remarks_loan_calculation_id",
          "cr_retailer_loan_calculation.repayment"
        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (remarks_result == 0) reject(sendApiResult(false, "Not found"));
      resolve(sendApiResult(true, "Data fetched successfully", remarks_result));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getDisbursementRemarksFeedbackHistoryAdmin = function (req) {
  const { page, per_page } = req.query;
  // const startDate = moment(start_date).startOf('date').format('YYYY-MM-DD');
  // const endDate = moment(end_date).add(1, 'days').format('YYYY-MM-DD');

  return new Promise(async (resolve, reject) => {
    try {
      const remarks_result = await knex("APSISIPDC.cr_remarks_feedback")
        .leftJoin("APSISIPDC.cr_feedback_file_upload",
          "cr_feedback_file_upload.id",
          "cr_remarks_feedback.file_upload_id")
        .leftJoin("APSISIPDC.cr_remarks_loan_calculation_ids",
          "cr_remarks_loan_calculation_ids.cr_remarks_feedback_id",
          "cr_remarks_feedback.id")
        .leftJoin("APSISIPDC.cr_disbursement",
          "cr_disbursement.id",
          "cr_remarks_loan_calculation_ids.cr_remarks_loan_calculation_id")
        .where("cr_remarks_loan_calculation_ids.supervisor_status", 1)
        .where("cr_remarks_loan_calculation_ids.admin_status", 1)
        .select(
          "cr_remarks_loan_calculation_ids.id",
          "cr_remarks_loan_calculation_ids.cr_remarks_feedback_id",
          "cr_remarks_feedback.remarks_one",
          "cr_remarks_feedback.status",
          "cr_remarks_feedback.file_upload_id",
          "cr_remarks_feedback.created_by",
          "cr_remarks_loan_calculation_ids.supervisor_status",
          "cr_remarks_loan_calculation_ids.admin_status",
          "cr_remarks_feedback.transaction_type",
          "cr_feedback_file_upload.sys_date",
          "cr_feedback_file_upload.file_for",
          "cr_feedback_file_upload.file_path",
          "cr_feedback_file_upload.file_name",
          "cr_remarks_loan_calculation_ids.cr_remarks_loan_calculation_id",
          "cr_disbursement.disbursement_amount"
        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (remarks_result == 0) reject(sendApiResult(false, "Not found"));
      resolve(sendApiResult(true, "Data fetched successfully", remarks_result));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getRepaymentRemarksFeedbackHistorySupervisor = function (req) {
  const { supervisor_code } = req.params;
  const { start_date, end_date, page, per_page } = req.query;
  const startDate = moment(start_date).startOf('date').format('YYYY-MM-DD');
  const endDate = moment(end_date).add(1, 'days').format('YYYY-MM-DD');

  return new Promise(async (resolve, reject) => {
    try {
      const remarks_result = await knex("APSISIPDC.cr_remarks_feedback")
        .where("cr_remarks_loan_calculation_ids.supervisor_status", 1)
        .select(
          "cr_remarks_loan_calculation_ids.id",
          "cr_remarks_loan_calculation_ids.cr_remarks_feedback_id",
          "cr_remarks_feedback.remarks_one",
          "cr_remarks_feedback.status",
          "cr_remarks_feedback.file_upload_id",
          "cr_remarks_feedback.created_by",
          "cr_remarks_loan_calculation_ids.supervisor_status",
          "cr_remarks_loan_calculation_ids.admin_status",
          "cr_remarks_feedback.transaction_type",
          "cr_feedback_file_upload.sys_date",
          "cr_feedback_file_upload.file_for",
          "cr_feedback_file_upload.file_path",
          "cr_feedback_file_upload.file_name",
          "cr_remarks_loan_calculation_ids.cr_remarks_loan_calculation_id",
          "cr_retailer_loan_calculation.repayment"
        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (remarks_result == 0) reject(sendApiResult(false, "Not found"));
      resolve(sendApiResult(true, "Data fetched successfully", remarks_result));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};
FileUpload.getDisbursementRemarksFeedbackHistorySupervisor = function (req) {
  const { page, per_page } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const remarks_result = await knex("APSISIPDC.cr_remarks_feedback")
        .leftJoin("APSISIPDC.cr_feedback_file_upload",
          "cr_feedback_file_upload.id",
          "cr_remarks_feedback.file_upload_id")
        .leftJoin("APSISIPDC.cr_remarks_loan_calculation_ids",
          "cr_remarks_loan_calculation_ids.cr_remarks_feedback_id",
          "cr_remarks_feedback.id")
        .leftJoin("APSISIPDC.cr_disbursement",
          "cr_disbursement.id",
          "cr_remarks_loan_calculation_ids.cr_remarks_loan_calculation_id")
        .where("cr_remarks_loan_calculation_ids.supervisor_status", 1)
        .select(
          "cr_remarks_loan_calculation_ids.id",
          "cr_remarks_loan_calculation_ids.cr_remarks_feedback_id",
          "cr_remarks_feedback.remarks_one",
          "cr_remarks_feedback.status",
          "cr_remarks_feedback.file_upload_id",
          "cr_remarks_feedback.created_by",
          "cr_remarks_loan_calculation_ids.supervisor_status",
          "cr_remarks_loan_calculation_ids.admin_status",
          "cr_remarks_feedback.transaction_type",
          "cr_feedback_file_upload.sys_date",
          "cr_feedback_file_upload.file_for",
          "cr_feedback_file_upload.file_path",
          "cr_feedback_file_upload.file_name",
          "cr_remarks_loan_calculation_ids.cr_remarks_loan_calculation_id",
          "cr_disbursement.disbursement_amount"
        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (remarks_result == 0) reject(sendApiResult(false, "Not found"));
      resolve(sendApiResult(true, "Data fetched successfully", remarks_result));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};


FileUpload.getRepaymentRemarksFeedbackAdmin = function (req) {
  const { start_date, end_date, page, per_page, transaction_type } = req.query;
  const startDate = moment(start_date).startOf('date').format('YYYY-MM-DD');
  const endDate = moment(end_date).add(1, 'days').format('YYYY-MM-DD');

  return new Promise(async (resolve, reject) => {
    try {
      const remarks_result = await knex("APSISIPDC.cr_remarks_feedback")
        .leftJoin("APSISIPDC.cr_feedback_file_upload",
          "cr_feedback_file_upload.id",
          "cr_remarks_feedback.file_upload_id")
        .leftJoin("APSISIPDC.cr_remarks_loan_calculation_ids",
          "cr_remarks_loan_calculation_ids.cr_remarks_feedback_id",
          "cr_remarks_feedback.id")
        .leftJoin("APSISIPDC.cr_retailer_loan_calculation",
          "cr_retailer_loan_calculation.id",
          "cr_remarks_loan_calculation_ids.cr_remarks_loan_calculation_id")
        .whereRaw(`"cr_remarks_feedback"."created_at" >= TO_DATE('${startDate}', 'YYYY-MM-DD')`)
        .whereRaw(`"cr_remarks_feedback"."created_at" < TO_DATE('${endDate}', 'YYYY-MM-DD')`)
        .where("cr_remarks_loan_calculation_ids.supervisor_status", 1)
        .where("cr_remarks_loan_calculation_ids.admin_status", 0)
        .where("cr_remarks_feedback.transaction_type", transaction_type)
        .select(
          "cr_remarks_loan_calculation_ids.id",
          "cr_remarks_loan_calculation_ids.cr_remarks_feedback_id",
          "cr_remarks_feedback.remarks_one",
          "cr_remarks_feedback.status",
          "cr_remarks_feedback.file_upload_id",
          "cr_remarks_feedback.created_by",
          "cr_remarks_loan_calculation_ids.supervisor_status",
          "cr_remarks_loan_calculation_ids.admin_status",
          "cr_remarks_feedback.transaction_type",
          "cr_feedback_file_upload.sys_date",
          "cr_feedback_file_upload.file_for",
          "cr_feedback_file_upload.file_path",
          "cr_feedback_file_upload.file_name",
          "cr_remarks_loan_calculation_ids.cr_remarks_loan_calculation_id",
          "cr_retailer_loan_calculation.repayment"
        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (remarks_result == 0) reject(sendApiResult(false, "Not found"));
      resolve(sendApiResult(true, "Data fetched successfully", remarks_result));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};
FileUpload.getRemarksFeedbackAdmin = function (req) {
  const { start_date, end_date, page, per_page, transaction_type } = req.query;
  const startDate = moment(start_date).startOf('date').format('YYYY-MM-DD');
  const endDate = moment(end_date).add(1, 'days').format('YYYY-MM-DD');
  console.log(startDate);
  console.log(endDate);

  return new Promise(async (resolve, reject) => {
    try {
      const remarks_result = await knex("APSISIPDC.cr_remarks_feedback")
        .leftJoin("APSISIPDC.cr_feedback_file_upload",
          "cr_feedback_file_upload.id",
          "cr_remarks_feedback.file_upload_id")
        .leftJoin("APSISIPDC.cr_remarks_loan_calculation_ids",
          "cr_remarks_loan_calculation_ids.cr_remarks_feedback_id",
          "cr_remarks_feedback.id")
        .leftJoin("APSISIPDC.cr_disbursement",
          "cr_disbursement.id",
          "cr_remarks_loan_calculation_ids.cr_remarks_loan_calculation_id")
        .whereRaw(`"cr_remarks_feedback"."created_at" >= TO_DATE('${startDate}', 'YYYY-MM-DD')`)
        .whereRaw(`"cr_remarks_feedback"."created_at" < TO_DATE('${endDate}', 'YYYY-MM-DD')`)
        .where("cr_remarks_loan_calculation_ids.supervisor_status", 1)
        .where("cr_remarks_loan_calculation_ids.admin_status", 0)
        .where("cr_remarks_feedback.transaction_type", transaction_type)
        .select(
          "cr_remarks_loan_calculation_ids.id",
          "cr_remarks_loan_calculation_ids.cr_remarks_feedback_id",
          "cr_remarks_feedback.remarks_one",
          "cr_remarks_feedback.status",
          "cr_remarks_feedback.file_upload_id",
          "cr_remarks_feedback.created_by",
          "cr_remarks_loan_calculation_ids.supervisor_status",
          "cr_remarks_loan_calculation_ids.admin_status",
          "cr_remarks_feedback.transaction_type",
          "cr_feedback_file_upload.sys_date",
          "cr_feedback_file_upload.file_for",
          "cr_feedback_file_upload.file_path",
          "cr_feedback_file_upload.file_name",
          "cr_remarks_loan_calculation_ids.cr_remarks_loan_calculation_id",
          "cr_disbursement.disbursement_amount"
        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (remarks_result == 0) reject(sendApiResult(false, "Not found"));

      // console.log(loan_calculation_ids);
      // let loan_details_array = [];
      // var loan_calculation_id_arr = [];

      // for (let i = 0; i < loan_calculation_ids.length; i++) {

      // }
      // const loan_calculation_data = await knex("APSISIPDC.cr_retailer_loan_calculation")
      //   .leftJoin("APSISIPDC.cr_retailer",
      //     "cr_retailer.id",
      //     "cr_retailer_loan_calculation.retailer_id")
      //   // .where("cr_retailer_loan_calculation.id", loan_calculation_id_arr[i])
      //   .select("cr_retailer_loan_calculation.id",
      //     "cr_retailer_loan_calculation.principal_outstanding",
      //     "cr_retailer_loan_calculation.transaction_cost",
      //     "cr_retailer_loan_calculation.charge",
      //     "cr_retailer_loan_calculation.other_charge",
      //     "cr_retailer_loan_calculation.processing_fee",
      //     "cr_retailer.retailer_name",
      //     "cr_retailer.retailer_code");

      resolve(sendApiResult(true, "Data fetched successfully", remarks_result));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};
FileUpload.getRetailerListByManufacturerAndSalesagent = function (req) {
  const { manufacturer_id, salesagent_id } = req.params;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_retailer_vs_sales_agent")
        .where("status", "Active")
        .where("manufacturer_id", manufacturer_id)
        .where("sales_agent_id", salesagent_id)
        .select(
          "retailer_id",
          "retailer_code"
        );
      if (data == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.updateAdminStatus = function (req) {
  const {
    ids,
    admin_status,
  } = req.body;

  const idsArr = ids.split(",");
  return new Promise(async (resolve, reject) => {
    try {

      const admin_status_update_array = [];

      for (let i = 0; i < idsArr.length; i++) {
        await knex.transaction(async (trx) => {
          const admin_status_update = await trx("APSISIPDC.cr_remarks_loan_calculation_ids")
            .where({ id: idsArr[i] })
            .update({
              admin_status
            });

          admin_status_update_array.push(admin_status_update);

        });

      }

      if (admin_status_update_array.length <= 0)
        reject(sendApiResult(false, "Admin Status is not updated"));
      resolve(
        sendApiResult(
          true,
          "Admin Status Updated Successfully",
          { Total_updated: admin_status_update_array.length }
        )
      );

    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};


FileUpload.getDisbursementByManufacturerAndSupervisor = function (req) {
  const { manufacturer_id, supervisor_code } = req.params;
  const { transaction_type, start_date, end_date, page, per_page } = req.query;
  const startDate = moment(start_date).startOf('date').format('YYYY-MM-DD');
  const endDate = moment(end_date).add(1, 'days').format('YYYY-MM-DD');

  console.log('req.params', req.params)
  console.log('req.query', req.query)

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
        .leftJoin("APSISIPDC.cr_retailer_loan_calculation",
          "cr_retailer_loan_calculation.manu_scheme_mapping_id",
          "cr_retailer_manu_scheme_mapping.id")
        .leftJoin("APSISIPDC.cr_retailer",
          "cr_retailer.id",
          "cr_retailer_loan_calculation.retailer_id")
        .leftJoin("APSISIPDC.cr_sales_agent",
          "cr_sales_agent.id",
          "cr_retailer_loan_calculation.sales_agent_id")
        .leftJoin("APSISIPDC.cr_supervisor",
          "cr_supervisor.distributor_id",
          "cr_retailer_manu_scheme_mapping.distributor_id")
        .where("cr_supervisor.supervisor_employee_code", supervisor_code)
        .where("cr_sales_agent.autho_supervisor_employee_code", supervisor_code)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where("cr_retailer_loan_calculation.transaction_type", transaction_type)
        .where(function () {
          if (transaction_type == "DISBURSEMENT") {
            this.where("cr_retailer_loan_calculation.supervisor_status_disbursement", null)
          }

          if (transaction_type == "REPAYMENT") {
            this.where("cr_retailer_loan_calculation.supervisor_status_repayment", null)
          }

        })
        .whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${startDate}', 'YYYY-MM-DD')`)
        .whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${endDate}', 'YYYY-MM-DD')`)
        .select(
          "cr_retailer_loan_calculation.id",
          "cr_retailer_loan_calculation.created_at",
          "cr_retailer_loan_calculation.retailer_id",
          "cr_retailer.retailer_name",
          "cr_retailer_loan_calculation.sales_agent_id",
          "cr_sales_agent.agent_name",
          "cr_retailer_loan_calculation.disburshment",
          "cr_retailer_loan_calculation.repayment",
          "cr_retailer.phone",
          "cr_retailer.email"
          //(knex.raw(`IF(sum(cr_disbursement.disbursement_amount) IS NULL,0.00,sum(cr_disbursement.disbursement_amount)) AS total_disbursement_amount`))

        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      //.knex.raw(`IF(sum(cr_disbursement.disbursement_amount) IS NULL,0.00,sum(cr_disbursement.disbursement_amount)) AS total_disbursement_amount`);
      // let total_amount = 0;
      // if (transaction_type == "DISBURSEMENT") {
      //   console.log( data_credit.data.length);
      //   for (let i = 0; i < data_credit.data.length; i++) {
      //     total_amount = total_amount + data_credit.data[i].disburshment;
      //   }
      // }

      // if (transaction_type == "REPAYMENT") {
      //   for (let i = 0; i < data_credit.data.length; i++) {
      //     total_amount = total_amount + data_credit.data[i].repayment;
      //   }
      // }

      if (data == 0) reject(sendApiResult(false, "Not found."));
      // const data_Array = [{ data: data_credit }, { total_amount: total_amount }]
      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};
FileUpload.getRepaymentBySalesagentAndRetailer = function (req) {
  const { supervisor_code } = req.params;
  const { start_date, end_date, page, per_page } = req.query;


  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_retailer_loan_calculation")
        .leftJoin("APSISIPDC.cr_retailer",
          "cr_retailer.id",
          "cr_retailer_loan_calculation.retailer_id")
        .leftJoin("APSISIPDC.cr_sales_agent",
          "cr_sales_agent.id",
          "cr_retailer_loan_calculation.sales_agent_id")
        //.where("cr_disbursement.sales_agent_id", salesagent_id)
        .where("cr_sales_agent.autho_supervisor_employee_code", supervisor_code)
        .where("cr_retailer_loan_calculation.supervisor_status_repayment", null)
        .whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${start_date}', 'YYYY-MM-DD')`)
        .whereRaw(`"cr_retailer_loan_calculation"."created_at" <= TO_DATE('${end_date}', 'YYYY-MM-DD')`)
        .where("cr_retailer_loan_calculation.transaction_type", "REPAYMENT")
        .select(
          "cr_retailer_loan_calculation.id",
          "cr_retailer_loan_calculation.retailer_id",
          "cr_retailer_loan_calculation.repayment",
          "cr_retailer_loan_calculation.principal_outstanding",
          "cr_retailer_loan_calculation.daily_principal_interest",
          "cr_retailer_loan_calculation.charge",
          "cr_retailer_loan_calculation.other_charge",
          "cr_retailer_loan_calculation.total_outstanding",
          "cr_retailer_loan_calculation.overdue_amount",
          "cr_retailer_loan_calculation.transaction_cost",
          "cr_retailer_loan_calculation.penal_interest",
          "cr_retailer_loan_calculation.penal_charge",
          "cr_retailer_loan_calculation.processing_fee",
          "cr_retailer_loan_calculation.interest_reimbursment",
          "cr_retailer.retailer_name",
          "cr_retailer.phone",
          "cr_retailer.email",
          "cr_retailer_loan_calculation.created_at"
        )
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      let total_amount = 0;
      let total_principal_outstanding = 0;
      let total_daily_principal_interest = 0;
      let total_charge = 0;
      let total_other_charge = 0;
      let total_outstanding_sum = 0;
      let total_overdue_amount = 0;
      let total_transaction_cost = 0;
      let total_penal_interest = 0;
      let total_penal_charge = 0;
      let total_processing_fee = 0;
      let total_interest_reimbursment = 0;


      for (let i = 0; i < data.length; i++) {
        total_amount = total_amount + data[i].repayment;
        total_principal_outstanding = total_principal_outstanding + data[i].principal_outstanding;
        total_daily_principal_interest = total_daily_principal_interest + data[i].principal_outstanding;
        total_charge = total_charge + data[i].charge;
        total_other_charge = total_other_charge + data[i].other_charge;
        total_outstanding_sum = total_outstanding_sum + data[i].total_outstanding;
        total_overdue_amount = total_overdue_amount + data[i].overdue_amount;
        total_transaction_cost = total_transaction_cost + data[i].transaction_cost;
        total_penal_interest = total_penal_interest + data[i].penal_interest;
        total_penal_charge = total_penal_charge + data[i].penal_charge;
        total_processing_fee = total_processing_fee + data[i].processing_fee;
        total_interest_reimbursment = total_interest_reimbursment + data[i].interest_reimbursment;
      }
      if (data == 0) reject(sendApiResult(false, "Not found."));
      const data_Array = [
        { result: data },
        {
          calculation:
          {
            total_repayment: total_amount,
            total_principal_outstanding: total_principal_outstanding,
            total_daily_principal_interest: total_daily_principal_interest,
            total_charge: total_charge,
            total_other_charge: total_other_charge,
            total_outstanding_sum: total_outstanding_sum,
            total_overdue_amount: total_overdue_amount,
            total_transaction_cost: total_transaction_cost,
            total_penal_interest: total_penal_interest,
            total_penal_charge: total_penal_charge,
            total_processing_fee: total_processing_fee,
            total_interest_reimbursment: total_interest_reimbursment
          }
        }

      ]
      resolve(sendApiResult(true, "Data fetched successfully", data_Array));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.deleteSupervisor = function ({ id }) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        const supervisor_delete = await trx("APSISIPDC.cr_supervisor")
          .where({ id })
          .delete();
        if (supervisor_delete <= 0)
          reject(sendApiResult(false, "Could not Found Supervisor"));
        resolve(
          sendApiResult(
            true,
            "Supervisor Deleted Successfully",
            supervisor_delete
          )
        );
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.editSupervisor = function (req) {
  const {
    supervisor_name,
    supervisor_nid,
    phone,
    manufacturer_id,
    supervisor_employee_code,
    region_of_operation,
    updated_by,
  } = req.body;
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        const supervisor_update = await trx("APSISIPDC.cr_supervisor")
          .where({ id: req.params.id })
          .update({
            supervisor_name,
            supervisor_nid,
            phone,
            manufacturer_id,
            supervisor_employee_code,
            region_of_operation,
            updated_at: new Date(),
            updated_by,
          });
        if (supervisor_update <= 0)
          reject(sendApiResult(false, "Could not Found Supervisor"));
        resolve(
          sendApiResult(
            true,
            "Supervisor updated Successfully",
            supervisor_update
          )
        );
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};


FileUpload.adminDisbursementAdd = function (req) {

  const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

  const userID = req.body.user_id;

  // const { remarks_id, remarks_one, supervisor_status, admin_status, transaction_type } = req.body;


  return new Promise(async (resolve, reject) => {
    try {
      const adminDisAdd = await knex("APSISIPDC.cr_cbs_init")
        .insert(req.body).returning("id");

      resolve(sendApiResult(true, "Data Saved successfully", adminDisAdd));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};


FileUpload.GetAdminDisbursement = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_cbs_init")
        .select(
          knex.raw('SUM("cr_cbs_init"."amount") AS total_amount'),
          "cr_cbs_init.cr_remarks_feedback_id"
        )
        .where("cr_remarks_feedback_id", req.params.id)
        .groupBy("cr_cbs_init.cr_remarks_feedback_id");

      if (data == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendApiResult(true, "Data fetched successfully", data));

    } catch (error) {

      reject(sendApiResult(false, error.message));
    }
  });
}


FileUpload.GetAdminAmount = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_cbs_init")
        .where("cr_remarks_feedback_id", req.params.id)

      if (data == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendApiResult(true, "Data fetched successfully", data));

    } catch (error) {

      reject(sendApiResult(false, error.message));
    }
  });
}

module.exports = FileUpload;
