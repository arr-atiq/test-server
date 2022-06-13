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

          const data_array = [];
          const unuploaded_data_array = [];
          const invalidate_data_array = [];
          if (Object.keys(rows).length != 0) {
            for (let index = 0; index < rows.length; index++) {
              const nid = rows[index].Supervisor_NID;
              const phoneNumber = rows[index].Phone;
              const validNID = ValidateNID(nid);
              const validPhoneNumber = ValidatePhoneNumber(phoneNumber.toString());

              if (!validNID || !validPhoneNumber) {
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

                invalidate_data_array.push(temp_data);
                continue;
              }

              const checkNidSalesAgent = await knex("APSISIPDC.cr_sales_agent")
                .where("agent_nid", rows[index].Supervisor_NID)
                .select(
                  "id",
                );
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
                    supervisor_phone
                  );
                const duplication_check_val_phone = parseInt(
                  duplication_check_phone[0].count
                );
                const duplication_check_emp_code = await knex
                  .count("cr_supervisor.supervisor_employee_code as count")
                  .from("APSISIPDC.cr_supervisor")
                  .where(
                    "APSISIPDC.cr_supervisor.supervisor_employee_code",
                    supervisor_emp_code
                  );
                const duplication_check_val_emp_code = parseInt(
                  duplication_check_emp_code[0].count
                );
                if (duplication_check_val_nid == 0 && duplication_check_val_phone == 0 && duplication_check_val_emp_code == 0) {
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
                  const temp_data = {
                    Supervisor_Name: rows[index].Supervisor_Name,
                    Supervisor_NID: rows[index].Supervisor_NID,
                    Phone: rows[index].Phone,
                    Manufacturer: rows[index].Manufacturer,
                    Supervisor_Employee_Code:
                      rows[index].Supervisor_Employee_Code,
                    Region_of_Operation: rows[index].Region_of_Operation,
                    Distributor: rows[index].Distributor,
                  };
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
            resolve(sendApiResult(true, msg, empty_insert_log));
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
                created_by: req.user_id,
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
              const team_supervisor = {
                supervisor_name: data_array[index].Supervisor_Name,
                supervisor_nid: data_array[index].Supervisor_NID,
                phone: data_array[index].Phone,
                manufacturer_id: data_array[index].Manufacturer,
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

FileUpload.getAllManufacturerForSupervisor = function (req) {
  const { supervisor_id } = req.params;

  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_supervisor")
        .where("id", supervisor_id)
        .where("status", "Active")
        .select(
          "manufacturer_id"
        );
      if (data == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", data));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

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
        .where("activation_status", "Active")
        .select(
          "id",
          "supervisor_name",
          "supervisor_nid",
          "phone",
          "manufacturer_id",
          "supervisor_employee_code",
          "region_of_operation"
        )
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

FileUpload.getDisbursementBySalesagentAndRetailer = function (req) {
  const { supervisor_code } = req.params;
  const { start_date, end_date } = req.query;


  return new Promise(async (resolve, reject) => {
    try {
      const data = await knex("APSISIPDC.cr_disbursement")
        .leftJoin("APSISIPDC.cr_retailer",
          "cr_retailer.id",
          "cr_disbursement.retailer_id")
        .leftJoin("APSISIPDC.cr_sales_agent",
          "cr_sales_agent.id",
          "cr_disbursement.sales_agent_id")
        //.where("cr_disbursement.sales_agent_id", salesagent_id)
        .where("cr_sales_agent.autho_supervisor_employee_code", supervisor_code)
        .whereRaw(`"cr_disbursement"."created_at" >= TO_DATE('${start_date}', 'YYYY-MM-DD')`)
        .whereRaw(`"cr_disbursement"."created_at" < TO_DATE('${end_date}', 'YYYY-MM-DD')`)
        .select(
          "cr_disbursement.id",
          "cr_disbursement.retailer_id",
          "cr_disbursement.disbursement_amount",
          "cr_disbursement.transaction_fee",
          "cr_retailer.retailer_name",
          "cr_retailer.phone",
          "cr_retailer.email",
          "cr_disbursement.created_at",
          //(knex.raw(`IF(sum(cr_disbursement.disbursement_amount) IS NULL,0.00,sum(cr_disbursement.disbursement_amount)) AS total_disbursement_amount`))

        );
      //.knex.raw(`IF(sum(cr_disbursement.disbursement_amount) IS NULL,0.00,sum(cr_disbursement.disbursement_amount)) AS total_disbursement_amount`);
      let total_amount = 0;
      for (let i = 0; i < data.length; i++) {
        total_amount = total_amount + data[i].disbursement_amount;

      }
      if (data == 0) reject(sendApiResult(false, "Not found."));
      const data_Array = [{ data: data }, { total_amount: total_amount }]
      resolve(sendApiResult(true, "Data fetched successfully", data_Array));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};
FileUpload.getRepaymentBySalesagentAndRetailer = function (req) {
  const { supervisor_code } = req.params;
  const { start_date, end_date } = req.query;


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
        .whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${start_date}', 'YYYY-MM-DD')`)
        .whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${end_date}', 'YYYY-MM-DD')`)
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
        );
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
      const data_Array = [{ data: data },
      { total_repayment: total_amount },
      { total_principal_outstanding: total_principal_outstanding },
      { total_daily_principal_interest: total_daily_principal_interest },
      { total_charge: total_charge },
      { total_other_charge: total_other_charge },
      { total_outstanding_sum: total_outstanding_sum },
      { total_overdue_amount: total_overdue_amount },
      { total_transaction_cost: total_transaction_cost },
      { total_penal_interest: total_penal_interest },
      { total_penal_charge: total_penal_charge },
      { total_processing_fee: total_processing_fee },
      { total_interest_reimbursment: total_interest_reimbursment }
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

module.exports = FileUpload;
