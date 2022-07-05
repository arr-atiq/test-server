const moment = require("moment");
const express = require("express");
const { sendApiResult, getSettingsValue } = require("../controllers/helper");
const { ValidateNID, ValidatePhoneNumber, ValidateEmail } = require("../controllers/helperController");
const knex = require("../config/database");

const FileUpload = function () { };

FileUpload.insertExcelData = function (rows, filename, req) {
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
              const validNID = ValidateNID(agent_nid);
              const validPhoneNumber = ValidatePhoneNumber(phoneNumber.toString());

              if (!validNID || !validPhoneNumber) {

                let invalidStr = "invalid columns - ";
                if (!validNID) {
                  invalidStr = invalidStr + "Sales_Agent_NID " + ", ";
                }
                if (!validPhoneNumber) {
                  invalidStr = invalidStr + "Phone " + ", ";
                }

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
                  Distributor: rows[index].Distributor,
                  Remarks_Invalidated: invalidStr,
                };

                invalidate_data_array.push(temp_data);
                continue;
              }

              const salesagent_nid = rows[index].Sales_Agent_NID;
              const salesagent_phone = rows[index].Phone;
              const salesagent_emp_code = rows[index].Sales_Agent_Employee_Code;
              const autho_supervisor_code = rows[index].Authorized_supervisor_emp_code;
              const agent_distributor_id = rows[index].Distributor;
              const autho_manufacturer_id = rows[index].Manufacturer;

              const check_exist_manu_dis_sup = await knex("APSISIPDC.cr_supervisor")
                .where(
                  "cr_supervisor.distributor_id", agent_distributor_id
                )
                .where(
                  "cr_supervisor.supervisor_employee_code", autho_supervisor_code
                )
                .where(
                  "cr_supervisor.manufacturer_id", autho_manufacturer_id
                )
                .select("cr_supervisor.id");

              if (check_exist_manu_dis_sup.length == 0) {

                let invalidStr = "supervisor distributor manufacturer mapping is not correct";

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
                  Distributor: rows[index].Distributor,
                  Remarks_Invalidated: invalidStr
                };

                invalidate_data_array.push(temp_data);
                continue;
              }

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
                  salesagent_phone
                );
              const duplication_check_val_phone = parseInt(
                duplication_check_phone[0].count
              );

              const duplication_check_emp_code = await knex
                .count("cr_sales_agent.agent_employee_code as count")
                .from("APSISIPDC.cr_sales_agent")
                .where(
                  "APSISIPDC.cr_sales_agent.agent_employee_code",
                  salesagent_emp_code
                );
              const duplication_check_val_emp_code = parseInt(
                duplication_check_emp_code[0].count
              );

              if (duplication_check_val_nid == 0
                && duplication_check_val_phone == 0
                && duplication_check_val_emp_code == 0) {
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
                  Distributor: rows[index].Distributor,
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
              const invalidated_salesagent = {
                agent_name: invalidate_data_array[index].Sales_Agent_Name,
                agent_nid: invalidate_data_array[index].Sales_Agent_NID,
                phone: invalidate_data_array[index].Phone,
                manufacturer_id: invalidate_data_array[index].Manufacturer,
                distributor_id: invalidate_data_array[index].Distributor,
                agent_employee_code:
                  invalidate_data_array[index].Sales_Agent_Employee_Code,
                autho_supervisor_employee_code:
                  invalidate_data_array[index].Authorized_supervisor_emp_code,
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
                manufacturer_id: unuploaded_data_array[index].Manufacturer,
                distributor_id: unuploaded_data_array[index].Distributor,
                agent_employee_code:
                  unuploaded_data_array[index].Sales_Agent_Employee_Code,
                autho_supervisor_employee_code:
                  unuploaded_data_array[index].Authorized_supervisor_emp_code,
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
                  agent_phone_insert_data
                );
              const duplication_check_val_phone_insert = parseInt(
                duplication_check_phone_insert[0].count
              );

              const duplication_check_emp_code_insert = await knex
                .count("cr_sales_agent.agent_employee_code as count")
                .from("APSISIPDC.cr_sales_agent")
                .where(
                  "APSISIPDC.cr_sales_agent.agent_employee_code",
                  agent_emp_code_insert_data
                );
              const duplication_check_val_emp_code_insert = parseInt(
                duplication_check_emp_code_insert[0].count
              );

              if (duplication_check_val_nid_insert != 0
                || duplication_check_val_phone_insert != 0
                || duplication_check_val_emp_code_insert != 0) {
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
                  manufacturer_id: data_array[index].Manufacturer,
                  distributor_id: data_array[index].Distributor,
                  agent_employee_code:
                    data_array[index].Sales_Agent_Employee_Code,
                  autho_supervisor_employee_code:
                    data_array[index].Authorized_supervisor_emp_code,
                  region_of_operation: data_array[index].Region_of_Operation,
                  remarks_duplications: duplicateStr,
                  created_by: req.user_id,
                };
                await knex("APSISIPDC.cr_salesagent_unuploaded_data")
                  .insert(duplicate_data_array);
                continue;
              }

              const team_sales_agent = {
                agent_name: data_array[index].Sales_Agent_Name,
                agent_nid: data_array[index].Sales_Agent_NID,
                phone: data_array[index].Phone,
                manufacturer_id: data_array[index].Manufacturer,
                distributor_id: data_array[index].Distributor,
                agent_employee_code:
                  data_array[index].Sales_Agent_Employee_Code,
                autho_supervisor_employee_code:
                  data_array[index].Authorized_supervisor_emp_code,
                region_of_operation: data_array[index].Region_of_Operation,
                created_by: req.user_id,
              };
              distributor_ids.push(data_array[index].Distributor);
              const insert_sales_agent = await knex("APSISIPDC.cr_sales_agent")
                .insert(team_sales_agent)
                .returning("id");
              if (insert_sales_agent) {
                sales_agent_insert_ids.push(insert_sales_agent[0]);
              }

              const temp_user = {
                name: data_array[index].Sales_Agent_Name,
                email: data_array[index].Sales_Agent_Employee_Code,
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
              resolve(sendApiResult(true, msg, insert_log));
            }
          } else {
            msg = "No Data Founds to Update";
            resolve(sendApiResult(true, msg));
          }
        })
        .then((result) => { })
        .catch((error) => {
          reject(sendApiResult(false, "Data not inserted."));
          logger.info(error);
        });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  }).catch((error) => {
    logger.info(error, "Promise error");
  });
};

FileUpload.getSalesAgentList = function (req) {
  const { page, per_page } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_sales_agent")
        .where("cr_sales_agent.activation_status", "Active")
        .leftJoin("APSISIPDC.cr_manufacturer",
          "cr_manufacturer.id",
          "cr_sales_agent.manufacturer_id"
        )
        .leftJoin("APSISIPDC.cr_distributor",
          "cr_distributor.id",
          "cr_sales_agent.distributor_id"
        )
        .leftJoin("APSISIPDC.cr_supervisor",
          "cr_supervisor.supervisor_employee_code",
          "cr_sales_agent.autho_supervisor_employee_code"
        )
        .select(
          "cr_sales_agent.id",
          "cr_sales_agent.agent_name",
          "cr_sales_agent.agent_nid",
          "cr_sales_agent.phone",
          "cr_sales_agent.manufacturer_id",
          "cr_manufacturer.manufacturer_name",
          "cr_sales_agent.distributor_id",
          "cr_distributor.distributor_name",
          "cr_distributor.distributor_code",
          "cr_sales_agent.agent_employee_code",
          "cr_sales_agent.autho_supervisor_employee_code",
          "cr_supervisor.supervisor_name",
          "cr_sales_agent.region_of_operation"
        )
        .orderBy("cr_sales_agent.id", "desc")
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
module.exports = FileUpload;
