const moment = require("moment");
const express = require("express");
const { sendApiResult, getSettingsValue } = require("../controllers/helper");
const { ValidateNID, ValidatePhoneNumber, ValidateEmail, generateUserIDMidDigitForLogin } = require("../controllers/helperController");
const knex = require("../config/database");
const { default: axios } = require("axios");
const { check } = require("prettier");

const FileUpload = function () { };

FileUpload.insertExcelData = function (rows, filename, req) {
  var mapped_data_array = [];
  var invalidated_rows_arr = [];
  var duplicated_rows_arr = [];
  var user_Id;

  return new Promise(async (resolve, reject) => {
    try {
      await knex
        .transaction(async (trx) => {
          let msg;
          const folder_name = req.file_for;
          console.log(folder_name);
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
          console.log(user_role_id);

          const data_array = [];
          const unuploaded_data_array = [];
          const invalidate_data_array = [];
          if (Object.keys(rows).length != 0) {
            for (let index = 0; index < rows.length; index++) {
              const agent_nid = rows[index].Sales_Agent_NID;
              const phoneNumber = rows[index].Phone;
              const autho_supervisor_code = rows[index].Authorized_supervisor_emp_code;
              const distributor_id_check = rows[index].Distributor;
              const manufacturer_id_check = rows[index].Manufacturer;

              const validNID = ValidateNID(agent_nid);
              const validPhoneNumber = ValidatePhoneNumber(phoneNumber.toString());

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

              const check_sup = await knex("APSISIPDC.cr_supervisor")
                .where(
                  "cr_supervisor.supervisor_employee_code", autho_supervisor_code.toString()
                )
                .select("cr_supervisor.id");

              var supervisor_id = check_sup[0]?.id ?? null;
              console.log(" supervisor ", supervisor_id);

              const check_mapping_manu_dis_sup = await knex("APSISIPDC.cr_supervisor_distributor_manufacturer_map")
                .where(
                  "cr_supervisor_distributor_manufacturer_map.supervisor_id", Number(supervisor_id)
                )
                .where(
                  "cr_supervisor_distributor_manufacturer_map.distributor_id", distributor_id_check
                )
                .where(
                  "cr_supervisor_distributor_manufacturer_map.manufacturer_id", manufacturer_id_check
                )
                .select("cr_supervisor_distributor_manufacturer_map.id");

              const checkNidInSupervisor = await knex("APSISIPDC.cr_supervisor")
                .where("supervisor_nid", agent_nid)
                .select(
                  "id",
                );

              if (!validNID || !validPhoneNumber || check_manu_exist.length == 0 || check_dis_exist.length == 0 || check_sup.length == 0 || check_mapping_manu_dis_sup.length == 0 || checkNidInSupervisor.length != 0 || supervisor_id == null) {

                let invalidStr = "invalid columns - ";
                if (!validNID) {
                  invalidStr = invalidStr + "Sales_Agent_NID " + ", ";
                }
                if (!validPhoneNumber) {
                  invalidStr = invalidStr + "Phone " + ", ";
                }
                if (check_manu_exist.length == 0) {
                  invalidStr = invalidStr + "Manufacturer is not existed " + ", ";
                }
                if (check_dis_exist.length == 0) {
                  invalidStr = invalidStr + "Distributor is not existed " + ", ";
                }
                if (check_sup.length == 0) {
                  invalidStr = invalidStr + "supervisor is not existed " + ", ";
                }
                if (check_mapping_manu_dis_sup.length == 0) {
                  invalidStr = invalidStr + "supervisor distributor manufacturer mapping is not correct " + ", ";
                }
                if (checkNidInSupervisor.length != 0) {
                  invalidStr = invalidStr + "NID exist in supervisor_NID " + ", ";
                }


                const temp_data = {
                  Sales_Agent_Name: rows[index].Sales_Agent_Name,
                  Sales_Agent_NID: rows[index].Sales_Agent_NID,
                  Phone: rows[index].Phone,
                  Sales_Agent_Employee_Code:
                    rows[index].Sales_Agent_Employee_Code,
                  Authorized_supervisor_emp_code:
                    rows[index].Authorized_supervisor_emp_code,
                  Distributor: rows[index].Distributor,
                  Manufacturer: rows[index].Manufacturer,
                  Region_of_Operation: rows[index].Region_of_Operation,
                  Remarks_Invalidated: invalidStr,
                };
                invalidated_rows_arr.push(temp_data);
                invalidate_data_array.push(temp_data);
                continue;
              }

              const salesagent_nid = rows[index].Sales_Agent_NID;
              const salesagent_phone = rows[index].Phone;
              const salesagent_emp_code = rows[index].Sales_Agent_Employee_Code;

              const duplication_checkNID = await knex
                .count("cr_sales_agent.agent_nid as count")
                .from("APSISIPDC.cr_sales_agent")
                .where(
                  "APSISIPDC.cr_sales_agent.agent_nid",
                  salesagent_nid
                );
              const duplication_check_val_nid = parseInt(
                duplication_checkNID[0].count
              );

              const duplication_check_phone = await knex
                .count("cr_sales_agent.phone as count")
                .from("APSISIPDC.cr_sales_agent")
                .where(
                  "APSISIPDC.cr_sales_agent.phone",
                  salesagent_phone.toString()
                );
              const duplication_check_val_phone = parseInt(
                duplication_check_phone[0].count
              );

              const duplication_check_emp_code = await knex
                .count("cr_sales_agent.agent_employee_code as count")
                .from("APSISIPDC.cr_sales_agent")
                .where(
                  "APSISIPDC.cr_sales_agent.agent_employee_code",
                  salesagent_emp_code.toString()
                );
              const duplication_check_val_emp_code = parseInt(
                duplication_check_emp_code[0].count
              );

              const duplication_checkEmpCode_user_table = await knex
                .count("cr_users.email as count")
                .from("APSISIPDC.cr_users")
                .where(
                  "APSISIPDC.cr_users.email",
                  salesagent_emp_code.toString()
                );

              const duplication_check_val_empCode_user_table = parseInt(
                duplication_checkEmpCode_user_table[0].count
              );



              if (duplication_check_val_nid == 0
                && duplication_check_val_phone == 0
                && duplication_check_val_emp_code == 0
                && duplication_check_val_empCode_user_table == 0) {
                const temp_data = {
                  Sales_Agent_Name: rows[index].Sales_Agent_Name,
                  Sales_Agent_NID: rows[index].Sales_Agent_NID,
                  Phone: rows[index].Phone,
                  Manufacturer: rows[index].Manufacturer,
                  Sales_Agent_Employee_Code:
                    rows[index].Sales_Agent_Employee_Code,
                  Authorized_supervisor_emp_code:
                    rows[index].Authorized_supervisor_emp_code,
                  Region_of_Operation: rows[index].Region_of_Operation,
                  Distributor: rows[index].Distributor
                };
                data_array.push(temp_data);
              } else {
                //multiple manufacturer mapping with salesagent by supervisor and distributor



                const salesAgent_manufacturer_id = rows[index].Manufacturer;
                const sales_agent_info = await knex("APSISIPDC.cr_sales_agent")
                  .where("status", "Active")
                  .where(
                    "agent_nid",
                    salesagent_nid
                  )
                  .where(
                    "phone",
                    salesagent_phone.toString()
                  )
                  .where(
                    "agent_employee_code",
                    salesagent_emp_code.toString()
                  )
                  .select(
                    "id",
                    "agent_name",
                    "agent_employee_code",
                    "distributor_id"
                  );

                const supervisor_info = await knex("APSISIPDC.cr_supervisor")
                  .where(
                    "id",
                    Number(supervisor_id)
                  )
                  .select(
                    "supervisor_employee_code"
                  );

                if (sales_agent_info.length != 0) {
                  if (sales_agent_info[0].distributor_id == rows[index].Distributor) {
                    if (supervisor_info[0].supervisor_employee_code == rows[index].Authorized_supervisor_emp_code) {
                      const duplicate_check_sup_dis_manu = await knex
                        .count("cr_salesagent_supervisor_distributor_manufacturer_map.id as count")
                        .from("APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map")
                        .where(
                          "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id",
                          sales_agent_info[0].id
                        )
                        .where(
                          "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map.supervisor_id",
                          Number(supervisor_id)
                        )
                        .where(
                          "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map.distributor_id",
                          sales_agent_info[0].distributor_id
                        )
                        .where(
                          "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map.manufacturer_id",
                          salesAgent_manufacturer_id
                        );

                      const duplicate_check_sup_dis_manu_val = parseInt(
                        duplicate_check_sup_dis_manu[0].count
                      );

                      if (duplicate_check_sup_dis_manu_val == 0) {

                        const check_sup_insert_info_map = await knex("APSISIPDC.cr_supervisor")
                          .where(
                            "cr_supervisor.supervisor_employee_code", supervisor_info[0].supervisor_employee_code.toString()
                          )
                          .select("cr_supervisor.id");

                        var supervisor_info_id = check_sup_insert_info_map[0]?.id ?? null;
                        console.log(" supervisor ", supervisor_info_id);
                        const multiple_manu_mapping_salesagent = {
                          salesagent_id: sales_agent_info[0].id,
                          salesagent_employee_code: sales_agent_info[0].agent_employee_code,
                          supervisor_id: Number(supervisor_info_id),
                          distributor_id: sales_agent_info[0].distributor_id,
                          manufacturer_id: rows[index].Manufacturer,
                          created_by: req.user_id,
                        }
                        console.log("multiple_manu_mapping_salesagent..3", multiple_manu_mapping_salesagent)
                        mapped_data_array.push(multiple_manu_mapping_salesagent)
                        const multiple_manu_salesagent_mapping = await knex(
                          "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map"
                        ).insert(multiple_manu_mapping_salesagent).returning("id");

                        //total_mapping_dis_manu.push(mapping_dis_manu[0])
                        continue;
                      }

                    }

                  }
                }

                //multiple manufacturer mapping with salesagent by supervisor and distributor

                let duplicateStr = "duplicate columns - ";

                if (duplication_check_val_nid != 0) {
                  duplicateStr = duplicateStr + "Sales_Agent_NID " + ", ";
                }
                if (duplication_check_val_phone != 0) {
                  duplicateStr = duplicateStr + "Phone " + ", ";
                }
                if (duplication_check_val_emp_code != 0) {
                  duplicateStr = duplicateStr + "Sales_Agent_Employee_Code " + ", ";
                }
                if (duplication_check_val_empCode_user_table != 0) {
                  duplicateStr = duplicateStr + "Sales_Agent_Employee_Code is existed in system " + ", ";
                }

                const temp_data = {
                  Sales_Agent_Name: rows[index].Sales_Agent_Name,
                  Sales_Agent_NID: rows[index].Sales_Agent_NID,
                  Phone: rows[index].Phone,
                  Sales_Agent_Employee_Code:
                    rows[index].Sales_Agent_Employee_Code,
                  Authorized_supervisor_emp_code:
                    rows[index].Authorized_supervisor_emp_code,
                  Distributor: rows[index].Distributor,
                  Manufacturer: rows[index].Manufacturer,
                  Region_of_Operation: rows[index].Region_of_Operation,
                  Remarks_Duplicated: duplicateStr
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
              "total_mapped": mapped_data_array,
              "total_invalidated_row": invalidated_rows_arr.length,
              "total_duplicated_row": duplicated_rows_arr.length
            }
            resolve(sendApiResult(true, msg, response));
          }

          if (Object.keys(invalidate_data_array).length != 0) {
            for (let index = 0; index < invalidate_data_array.length; index++) {
              const invalidated_salesagent = {
                agent_name: invalidate_data_array[index].Sales_Agent_Name,
                agent_nid: invalidate_data_array[index].Sales_Agent_NID,
                phone: invalidate_data_array[index].Phone,
                agent_employee_code:
                  invalidate_data_array[index].Sales_Agent_Employee_Code,
                autho_supervisor_employee_code:
                  invalidate_data_array[index].Authorized_supervisor_emp_code,
                distributor_id: invalidate_data_array[index].Distributor,
                manufacturer_id: invalidate_data_array[index].Manufacturer,
                region_of_operation: invalidate_data_array[index].Region_of_Operation,
                remarks_invalidated: invalidate_data_array[index].Remarks_Invalidated,
                created_by: req.user_id,
              };

              await knex("APSISIPDC.cr_sales_agent_invalidated_data")
                .insert(invalidated_salesagent);
            }
          }

          if (Object.keys(unuploaded_data_array).length != 0) {
            for (let index = 0; index < unuploaded_data_array.length; index++) {
              const unuploaded_sales_agent = {
                agent_name: unuploaded_data_array[index].Sales_Agent_Name,
                agent_nid: unuploaded_data_array[index].Sales_Agent_NID,
                phone: unuploaded_data_array[index].Phone,
                agent_employee_code:
                  unuploaded_data_array[index].Sales_Agent_Employee_Code,
                autho_supervisor_employee_code:
                  unuploaded_data_array[index].Authorized_supervisor_emp_code,
                distributor_id: unuploaded_data_array[index].Distributor,
                manufacturer_id: unuploaded_data_array[index].Manufacturer,
                region_of_operation: unuploaded_data_array[index].Region_of_Operation,
                remarks_duplications: unuploaded_data_array[index].Remarks_Duplicated,
                created_by: req.user_id,
              };
              await knex("APSISIPDC.cr_salesagent_unuploaded_data")
                .insert(unuploaded_sales_agent);
            }
          }

          if (Object.keys(data_array).length != 0) {
            const sales_agent_insert_ids = [];
            const user_insert_ids = [];
            const distributor_ids = [];
            for (let index = 0; index < data_array.length; index++) {
              const agent_nid_insert_data = data_array[index].Sales_Agent_NID;
              const agent_phone_insert_data = data_array[index].Phone;
              const agent_emp_code_insert_data = data_array[index].Sales_Agent_Employee_Code;

              const duplication_checkNID_insert = await knex
                .count("cr_sales_agent.agent_nid as count")
                .from("APSISIPDC.cr_sales_agent")
                .where(
                  "APSISIPDC.cr_sales_agent.agent_nid",
                  agent_nid_insert_data
                );
              const duplication_check_val_nid_insert = parseInt(
                duplication_checkNID_insert[0].count
              );

              const duplication_check_phone_insert = await knex
                .count("cr_sales_agent.phone as count")
                .from("APSISIPDC.cr_sales_agent")
                .where(
                  "APSISIPDC.cr_sales_agent.phone",
                  agent_phone_insert_data.toString()
                );
              const duplication_check_val_phone_insert = parseInt(
                duplication_check_phone_insert[0].count
              );

              const duplication_check_emp_code_insert = await knex
                .count("cr_sales_agent.agent_employee_code as count")
                .from("APSISIPDC.cr_sales_agent")
                .where(
                  "APSISIPDC.cr_sales_agent.agent_employee_code",
                  agent_emp_code_insert_data.toString()
                );
              const duplication_check_val_emp_code_insert = parseInt(
                duplication_check_emp_code_insert[0].count
              );

              if (duplication_check_val_nid_insert != 0
                || duplication_check_val_phone_insert != 0
                || duplication_check_val_emp_code_insert != 0) {

                //multiple manufacturer mapping with salesagent by supervisor and distributor

                const salesAgent_manufacturer_id_insert = data_array[index].Manufacturer;
                const sales_agent_info_insert = await knex("APSISIPDC.cr_sales_agent")
                  .where("status", "Active")
                  .where(
                    "agent_nid",
                    agent_nid_insert_data
                  )
                  .where(
                    "phone",
                    agent_phone_insert_data.toString()
                  )
                  .where(
                    "agent_employee_code",
                    agent_emp_code_insert_data.toString()
                  )
                  .select(
                    "id",
                    "agent_name",
                    "agent_employee_code",
                    "distributor_id",
                  );

                const supervisor_info_insert = await knex("APSISIPDC.cr_supervisor")
                  .where(
                    "id",
                    Number(supervisor_id)
                  )
                  .select(
                    "supervisor_employee_code"
                  );

                if (sales_agent_info_insert.length != 0) {
                  if (sales_agent_info_insert[0].distributor_id == data_array[index].Distributor) {
                    if (supervisor_info_insert[0].supervisor_employee_code == data_array[index].Authorized_supervisor_emp_code) {
                      const duplicate_check_sup_dis_manu_insert = await knex
                        .count("cr_salesagent_supervisor_distributor_manufacturer_map.id as count")
                        .from("APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map")
                        .where(
                          "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id",
                          sales_agent_info_insert[0].id
                        )
                        .where(
                          "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map.supervisor_id",
                          Number(supervisor_id),
                        )
                        .where(
                          "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map.distributor_id",
                          sales_agent_info_insert[0].distributor_id
                        )
                        .where(
                          "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map.manufacturer_id",
                          salesAgent_manufacturer_id_insert
                        );

                      const duplicate_check_sup_dis_manu_val_insert = parseInt(
                        duplicate_check_sup_dis_manu_insert[0].count
                      );

                      if (duplicate_check_sup_dis_manu_val_insert == 0) {

                        const check_sup_insert_info_map_nested = await knex("APSISIPDC.cr_supervisor")
                          .where(
                            "cr_supervisor.supervisor_employee_code", supervisor_info_insert[0].supervisor_employee_code.toString()
                          )
                          .select("cr_supervisor.id");

                        var supervisor_info_id = check_sup_insert_info_map_nested[0]?.id ?? null;
                        console.log("supervisor 2 ", Number(supervisor_id));
                        const multiple_manu_mapping_salesagent_insert = {
                          salesagent_id: sales_agent_info_insert[0].id,
                          salesagent_employee_code: sales_agent_info_insert[0].agent_employee_code,
                          supervisor_id: Number(supervisor_id),
                          distributor_id: sales_agent_info_insert[0].distributor_id,
                          manufacturer_id: data_array[index].Manufacturer,
                          created_by: req.user_id,
                        }
                        console.log("multiple_manu_mapping_salesagent..1", multiple_manu_mapping_salesagent_insert)
                        mapped_data_array.push(multiple_manu_mapping_salesagent_insert)
                        const multiple_manu_salesagent_mapping_insert = await knex(
                          "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map"
                        ).insert(multiple_manu_mapping_salesagent_insert).returning("id");

                        //total_mapping_dis_manu.push(mapping_dis_manu[0])
                        continue;
                      }

                    }

                  }
                }

                let duplicateStr = "duplicate columns - ";
                if (duplication_check_val_nid_insert != 0) {
                  duplicateStr = duplicateStr + "Sales_Agent_NID " + ", ";
                }
                if (duplication_check_val_phone_insert != 0) {
                  duplicateStr = duplicateStr + "Phone " + ", ";
                }
                if (duplication_check_val_emp_code_insert != 0) {
                  duplicateStr = duplicateStr + "Sales_Agent_Employee_Code " + ", ";
                }

                const duplicate_data_array = {
                  agent_name: data_array[index].Sales_Agent_Name,
                  agent_nid: data_array[index].Sales_Agent_NID,
                  phone: data_array[index].Phone,
                  agent_employee_code:
                    data_array[index].Sales_Agent_Employee_Code,
                  autho_supervisor_employee_code:
                    data_array[index].Authorized_supervisor_emp_code,
                  distributor_id: data_array[index].Distributor,
                  manufacturer_id: data_array[index].Manufacturer,
                  region_of_operation: data_array[index].Region_of_Operation,
                  remarks_duplications: duplicateStr,
                  created_by: req.user_id,
                };
                duplicated_rows_arr.push(duplicate_data_array);
                await knex("APSISIPDC.cr_salesagent_unuploaded_data")
                  .insert(duplicate_data_array);
                continue;
              }

              const team_sales_agent = {
                agent_name: data_array[index].Sales_Agent_Name,
                agent_nid: data_array[index].Sales_Agent_NID,
                phone: data_array[index].Phone,
                //manufacturer_id: data_array[index].Manufacturer,
                distributor_id: data_array[index].Distributor,
                agent_employee_code:
                  data_array[index].Sales_Agent_Employee_Code,
                region_of_operation: data_array[index].Region_of_Operation,
                created_by: req.user_id,
              };
              distributor_ids.push(data_array[index].Distributor);
              const insert_sales_agent = await knex("APSISIPDC.cr_sales_agent")
                .insert(team_sales_agent)
                .returning("id");

              user_Id = insert_sales_agent ? "SA-" + generateUserIDMidDigitForLogin(insert_sales_agent[0], 6) : 0;
              if (insert_sales_agent) {
                sales_agent_insert_ids.push(insert_sales_agent[0]);

                const autho_supervisor_code_insert = data_array[index].Authorized_supervisor_emp_code;


                const check_sup_insert_info = await knex("APSISIPDC.cr_supervisor")
                  .where(
                    "cr_supervisor.supervisor_employee_code", autho_supervisor_code_insert.toString()
                  )
                  .select("cr_supervisor.id");

                var supervisor_info_id = check_sup_insert_info[0]?.id ?? null;
                console.log(" supervisor ", supervisor_info_id);


                const temp_manufacturer_vs_salesagent_map = {
                  salesagent_id: insert_sales_agent[0],
                  salesagent_employee_code: data_array[index].Sales_Agent_Employee_Code,
                  supervisor_id: Number(supervisor_info_id),
                  distributor_id: data_array[index].Distributor,
                  manufacturer_id: data_array[index].Manufacturer,
                  created_by: req.user_id,
                };
                mapped_data_array.push(temp_manufacturer_vs_salesagent_map)

                const insert_manufacturer_vs_salesagent_map = await knex(
                  "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map"
                ).insert(temp_manufacturer_vs_salesagent_map).returning("id");

                //total_mapping_dis_manu.push(insert_manufacturer_vs_salesagent_map[0]);


                // try{
                //   const sendMail =await axios.post(`${process.env.HOSTIP}/mail/tempSendmail`,{
                //     "email": data_array[index].Official_Email,
                //     "mail_subject": "IPDC DANA | Registration Completed",
                //     "mail_body": `
                //     <p>Greetings from IPDC DANA!</p>
                //     <p>Congratulations! Your registration
                //     with IPDC DANA has been
                //     completed. Please enter the below
                //     mentioned user ID and password
                //     at www.ipdcDANA.com and login.</p>
                //     <p>User ID : ${data_array[index].Official_Email}</p>
                //     <p>Password : 123456</p>
                //     <p>Regards, </p>
                //     <p>IPDC Finance</p>
                //     `
                //   })
                //   console.log('sendMailsendMailsendMail',sendMail)
                // }
                // catch(err){
                //   console.log('errorerrorerrorerrorerror',err)
                // }
              }

              const temp_user = {
                name: data_array[index].Sales_Agent_Name,
                email: data_array[index].Sales_Agent_Employee_Code,
                phone: data_array[index].Phone,
                password: "5efd3b0647df9045c240729d31622c79",
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
                  "APSISIPDC.cr_sales_agent_user"
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
              is_sales_agent_wise_user_insert == 1 &&
              is_user_wise_role_insert == 1
            ) {
              const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
              const insert_log = {
                sys_date: new Date(date),
                file_for: folder_name,
                file_path: `public/configuration_file/${folder_name}`,
                file_name: filename,
                found_rows: Object.keys(rows).length,
                upload_rows: Object.keys(sales_agent_insert_ids).length,
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
          console.log("Data not inserted.", error)
          reject(sendApiResult(false, "Data not inserted."));
        });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  }).catch((error) => {
    console.log("Catch Error", error)
  });
};

FileUpload.getSalesAgentList = function (req) {
  const { page, per_page } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_sales_agent")
        .where("cr_sales_agent.activation_status", "Active")
        // .leftJoin("APSISIPDC.cr_manufacturer",
        //   "cr_manufacturer.id",
        //   "cr_sales_agent.manufacturer_id"
        // )
        .leftJoin("APSISIPDC.cr_distributor",
          "cr_distributor.id",
          "cr_sales_agent.distributor_id"
        )
        .leftJoin("APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map",
          "cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id",
          "cr_sales_agent.id"
        )
        .leftJoin("APSISIPDC.cr_supervisor",
          "cr_supervisor.id",
          "cr_salesagent_supervisor_distributor_manufacturer_map.supervisor_id"
        )
        .select(
          "cr_sales_agent.id",
          "cr_sales_agent.agent_name",
          "cr_sales_agent.agent_nid",
          "cr_sales_agent.phone",
          "cr_sales_agent.distributor_id",
          "cr_distributor.distributor_name",
          "cr_sales_agent.agent_employee_code",
          "cr_supervisor.supervisor_employee_code",
          "cr_supervisor.supervisor_name",
          "cr_sales_agent.region_of_operation"
        )
        .orderBy("cr_sales_agent.id", "desc")
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

FileUpload.getSalesAgentOperationRegion = function (req) {
  const { id } = req.params;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_sales_agent")
        .where("status", "Active")
        .where("id", id)
        .select(
          "region_of_operation"
        );
      if (data == 0) reject(sendApiResult(false, "Not found."));

      const region_of_operation_data = data[0].region_of_operation;
      const region_of_operation_array = region_of_operation_data.split(",");

      resolve(sendApiResult(true, "Data fetched successfully", region_of_operation_array));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getRetailersBySalesAgent = function (req) {
  const { salesagent_id, distributor_id, manufacturer_id } = req.params;

  return new Promise(async (resolve, reject) => {
    try {
      // const manufacturer = await knex("APSISIPDC.cr_sales_agent")
      //   .where("status", "Active")
      //   .where("id", salesagent_id)
      //   .select(
      //     "manufacturer_id"
      //   );
      // if (manufacturer == 0) reject(sendApiResult(false, "Not found."));

      //const manufacturer_id = manufacturer[0].manufacturer_id;

      const data = await knex("APSISIPDC.cr_retailer")
        .leftJoin(
          "APSISIPDC.cr_retailer_manu_scheme_mapping",
          "cr_retailer.id",
          "cr_retailer_manu_scheme_mapping.retailer_id"
        )
        .leftJoin(
          "APSISIPDC.cr_retailer_vs_sales_agent",
          "cr_retailer_vs_sales_agent.manufacture_id",
          "cr_retailer_manu_scheme_mapping.manufacturer_id"
        )
        .leftJoin(
          "APSISIPDC.cr_disbursement",
          "cr_disbursement.sales_agent_id",
          "cr_retailer_vs_sales_agent.sales_agent_id"
        )
        .where("cr_retailer.status", "Active")
        .where("cr_retailer_manu_scheme_mapping.status", "Active")
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", distributor_id)
        .where("cr_retailer_vs_sales_agent.sales_agent_id", salesagent_id)
        .where("cr_disbursement.sales_agent_id", salesagent_id)
        .where("cr_disbursement.retailer_id", retailer_id)
        .whereBetween("cr_disbursement.created_at", [start_date, end_date])
        .select(
          "cr_retailer.id",
          "cr_retailer.retailer_name",
          "cr_retailer.retailer_code",
          "cr_retailer_manu_scheme_mapping.manufacturer_id",
          "cr_retailer_manu_scheme_mapping.distributor_id",
          "cr_disbursement.salesagent_id",
          "cr_disbursement.create_at"
        );

      if (data == 0) reject(sendApiResult(false, "Not found."));



      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};


FileUpload.getManufacturerListBySalesagent = function (req) {
  const { sales_agent_id } = req.query;

  return new Promise(async (resolve, reject) => {
    try {

      const data = await knex("APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map")
        .leftJoin(
          "APSISIPDC.cr_manufacturer",
          "cr_manufacturer.id",
          "cr_salesagent_supervisor_distributor_manufacturer_map.manufacturer_id"
        )
        .where("cr_manufacturer.status", "Active")
        .where("cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id", sales_agent_id)
        .select(
          "cr_salesagent_supervisor_distributor_manufacturer_map.manufacturer_id",
          "cr_manufacturer.manufacturer_name"
        );

      if (data == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getRetailersByRegionOperation = function (req) {
  const { salesagent_id } = req.params;
  const { region_of_operation } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const manufacturer = await knex("APSISIPDC.cr_sales_agent")
        .where("status", "Active")
        .where("id", salesagent_id)
        .select(
          "manufacturer_id"
        );
      if (manufacturer == 0) reject(sendApiResult(false, "Not found."));

      const manufacturer_id = manufacturer[0].manufacturer_id;

      const data = await knex("APSISIPDC.cr_retailer")
        .leftJoin(
          "APSISIPDC.cr_retailer_manu_scheme_mapping",
          "cr_retailer.id",
          "cr_retailer_manu_scheme_mapping.retailer_id"
        )
        .where("cr_retailer.status", "Active")
        .where("cr_retailer_manu_scheme_mapping.status", "Active")
        .where("cr_retailer.region_operation", region_of_operation)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .select(
          "cr_retailer.id",
          "cr_retailer.ac_number_1rn",
          "cr_retailer.retailer_name",
          "cr_retailer.retailer_code",
          "cr_retailer_manu_scheme_mapping.ac_number_1rmn",
          "cr_retailer_manu_scheme_mapping.manufacturer_id",
          "cr_retailer_manu_scheme_mapping.distributor_id",
          "cr_retailer_manu_scheme_mapping.system_limit",
          "cr_retailer_manu_scheme_mapping.propose_limit",
          "cr_retailer_manu_scheme_mapping.crm_approve_limit"
        );

      if (data == 0) reject(sendApiResult(false, "Not found."));



      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getRetailerbySalesAgent = function (req) {

  return new Promise(async (resolve, reject) => {
    try {
      const { salesagent_id } = req.params;
      const manufacturer = await knex("APSISIPDC.cr_sales_agent")
        .where("id", salesagent_id)
        .select("manufacturer_id");

      const manufacturer_id = manufacturer[0].manufacturer_id;

      const data = await knex("APSISIPDC.cr_retailer")
        .leftJoin(
          "APSISIPDC.cr_retailer_vs_sales_agent",
          "cr_retailer_vs_sales_agent.retailer_id",
          "cr_retailer.id"
        )
        .leftJoin(
          "APSISIPDC.cr_retailer_manu_scheme_mapping",
          "cr_retailer_manu_scheme_mapping.retailer_id",
          "cr_retailer.id"
        )
        .where("cr_retailer.status", "Active")
        .where("cr_retailer_vs_sales_agent.status", "Active")
        .where("cr_retailer_vs_sales_agent.sales_agent_id", salesagent_id)
        .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
        .select(
          "cr_retailer.id",
          "cr_retailer.retailer_name",
          "cr_retailer.phone",
          "cr_retailer.retailer_code",
          "cr_retailer_vs_sales_agent.sales_agent_id",
          "cr_retailer_manu_scheme_mapping.retailer_id",
          "cr_retailer_manu_scheme_mapping.ac_number_1rmn",
          "cr_retailer_manu_scheme_mapping.processing_fee",
          "cr_retailer_manu_scheme_mapping.crm_approve_limit",
        );

      if (data == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.getSalesAgentListByManufacturerAndSupervisor = function (req) {
  const { manufacturer_id } = req.params;
  const { autho_supervisor_employee_code } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_sales_agent")
        .where("status", "Active")
        .where("manufacturer_id", manufacturer_id)
        .where("autho_supervisor_employee_code", autho_supervisor_employee_code)
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


FileUpload.deleteSalesAgent = function ({ id }) {
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        const salesagent_delete = await trx("APSISIPDC.cr_sales_agent")
          .where({ id })
          .delete();
        if (salesagent_delete <= 0)
          reject(sendApiResult(false, "Could not Found Salesagent"));
        resolve(
          sendApiResult(
            true,
            "Salesagent Deleted Successfully",
            salesagent_delete
          )
        );
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

FileUpload.editSalesAgent = function (req) {
  const {
    agent_name,
    agent_nid,
    phone,
    manufacturer_id,
    agent_employee_code,
    autho_supervisor_employee_code,
    region_of_operation,
    updated_by,
  } = req.body;
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        const salesagent_update = await trx("APSISIPDC.cr_sales_agent")
          .where({ id: req.params.id })
          .update({
            agent_name,
            agent_nid,
            phone,
            manufacturer_id,
            agent_employee_code,
            autho_supervisor_employee_code,
            region_of_operation,
            updated_at: new Date(),
            updated_by,
          });
        if (salesagent_update <= 0)
          reject(sendApiResult(false, "Could not Found Salesagent"));
        resolve(
          sendApiResult(
            true,
            "Salesagent updated Successfully",
            salesagent_update
          )
        );
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};


FileUpload.retailersBySalesAgentAndManufacturer = function (req) {
  const {
    salesagent_id,
    manufacturer_id,
  } = req.params;
  return new Promise(async (resolve, reject) => {

    try {
      await knex.transaction(async (trx) => {
        const retailers = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_vs_sales_agent",
            "cr_retailer_vs_sales_agent.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .where("cr_retailer.status", "Active")
          .where("cr_retailer_vs_sales_agent.status", "Active")
          .where("cr_retailer_vs_sales_agent.sales_agent_id", salesagent_id)
          .where("cr_retailer_vs_sales_agent.manufacturer_id", manufacturer_id)
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
          .select(
            "cr_retailer.id",
            "cr_retailer.retailer_name",
            "cr_retailer.phone",
            "cr_retailer.retailer_code",
            "cr_retailer_vs_sales_agent.sales_agent_id",
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


module.exports = FileUpload;
