const moment = require("moment");
const { sendApiResult } = require("../controllers/helper");
const knex = require("../config/database");

const User = function () { };

User.userList = function (req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      const userList = await knex
        .select(
          "cr_users.id",
          "cr_users.name",
          "cr_users.email AS username",
          "cr_user_wise_role.role_id AS user_level_id",
          "cr_user_roles.name AS user_level_name"
        )
        .leftJoin(
          "APSISIPDC.cr_user_wise_role",
          "cr_user_wise_role.user_id",
          "cr_users.id"
        )
        .leftJoin(
          "APSISIPDC.cr_user_roles",
          "cr_user_roles.id",
          "cr_user_wise_role.role_id"
        )
        .from("APSISIPDC.cr_users")
        .where("cr_users.status", "Active")
        .orderBy("cr_users.id", "asc");

      const userLevelList = await knex
        .select(
          "cr_user_roles.id AS user_level_id",
          "cr_user_roles.name AS user_level_name"
        )
        .from("APSISIPDC.cr_user_roles")
        .where("cr_user_roles.status", "Active")

      if (Object.keys(userList).length != 0) {
        resolve(sendApiResult(true, "User List Fetched Successfully", { userLevelList: userLevelList, userlist: userList }));
      } else {
        reject(sendApiResult(false, "Data not found"));
      }
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.getDashboard = function (req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      const total_retailers_count = await knex("APSISIPDC.cr_retailer")
        .count("cr_retailer.id as count")
        .from("APSISIPDC.cr_retailer");
      const total_retailers_count_val = parseInt(
        total_retailers_count[0].count
      );

      const todaydate = moment().subtract(0, 'months').format('YYYY-MM-DD');
      const currentMonthStartDate = moment().subtract(0, 'months').startOf('month').format('YYYY-MM-DD');

      const previousMonthEndDate = moment().subtract(1, 'months').format('YYYY-MM-DD');
      const previousMonthStartDate = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');

      const total_retailers_count_current_month = await knex("APSISIPDC.cr_retailer")
        .count("cr_retailer.id as count")
        .from("APSISIPDC.cr_retailer")
        .whereRaw(`"cr_retailer"."created_at" >= TO_DATE('${currentMonthStartDate}', 'YYYY-MM-DD')`)
        .whereRaw(`"cr_retailer"."created_at" <= TO_DATE('${todaydate}', 'YYYY-MM-DD')`);
      const total_retailers_count_current_month_val = parseInt(
        total_retailers_count_current_month[0].count
      );

      const total_retailers_count_previous_month = await knex("APSISIPDC.cr_retailer")
        .count("cr_retailer.id as count")
        .from("APSISIPDC.cr_retailer")
        .whereRaw(`"cr_retailer"."created_at" >= TO_DATE('${previousMonthStartDate}', 'YYYY-MM-DD')`)
        .whereRaw(`"cr_retailer"."created_at" <= TO_DATE('${previousMonthEndDate}', 'YYYY-MM-DD')`);

      const total_retailers_count_previous_month_val = parseInt(
        total_retailers_count_previous_month[0].count
      );

      const total_retailers_diff_current_prev = total_retailers_count_current_month_val - total_retailers_count_previous_month_val;

      const crm_approve_limit_data = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
        .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
        .select("crm_approve_limit");

      let total_crm_approve_limit = 0;

      for (let i = 0; i < crm_approve_limit_data.length; i++) {
        total_crm_approve_limit = total_crm_approve_limit + crm_approve_limit_data[i].crm_approve_limit;

      }

      const crm_approve_limit_data_current_month = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
        .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
        .whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" >= TO_DATE('${currentMonthStartDate}', 'YYYY-MM-DD')`)
        .whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" <= TO_DATE('${todaydate}', 'YYYY-MM-DD')`)
        .select("crm_approve_limit");

      let total_crm_approve_limit_current_month = 0;

      for (let i = 0; i < crm_approve_limit_data_current_month.length; i++) {
        total_crm_approve_limit_current_month = total_crm_approve_limit_current_month + crm_approve_limit_data_current_month[i].crm_approve_limit;

      }

      const crm_approve_limit_data_previous_month = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
        .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
        .whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" >= TO_DATE('${previousMonthStartDate}', 'YYYY-MM-DD')`)
        .whereRaw(`"cr_retailer_manu_scheme_mapping"."created_at" <= TO_DATE('${previousMonthEndDate}', 'YYYY-MM-DD')`)
        .select("crm_approve_limit");

      let total_crm_approve_limit_previous_month = 0;

      for (let i = 0; i < crm_approve_limit_data_previous_month.length; i++) {
        total_crm_approve_limit_previous_month = total_crm_approve_limit_previous_month + crm_approve_limit_data_previous_month[i].crm_approve_limit;

      }

      const sanctioned_amount_diff = total_crm_approve_limit_current_month - total_crm_approve_limit_previous_month;
      const sanctioned_amount_rate = (sanctioned_amount_diff / total_crm_approve_limit_current_month) * 100;

      const onermn_acc_count = await knex("APSISIPDC.cr_retailer_loan_calculation")
        .countDistinct("cr_retailer_loan_calculation.onermn_acc as count")
        .from("APSISIPDC.cr_retailer_loan_calculation");


      const count_live_acc_val = parseInt(
        onermn_acc_count[0].count
      );

      const npl_acc = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
        .leftJoin(
          "APSISIPDC.cr_schema",
          "cr_schema.id",
          "cr_retailer_manu_scheme_mapping.scheme_id"
        )
        .whereRaw(`"cr_schema"."expiry_date" < TO_DATE('${todaydate}', 'YYYY-MM-DD')`)
        .count("cr_retailer_manu_scheme_mapping.ac_number_1rmn as count");

      const npl_acc_val = parseInt(
        npl_acc[0].count
      );

      const total_idle_retailers = total_retailers_count_val - count_live_acc_val;

      const pending_retailers = await knex
        .count("cr_retailer.id as count")
        .from("APSISIPDC.cr_retailer")
        .where("kyc_status", null)
        .where("cib_status", null);

      const pending_retailers_value = parseInt(
        pending_retailers[0].count
      );

      const rejected_retailers = await knex
        .count("cr_retailer.id as count")
        .from("APSISIPDC.cr_retailer")
        .where("kyc_status", "0")
        .orWhere("cib_status", "0");

      const rejected_retailers_value = parseInt(
        rejected_retailers[0].count
      );

      const disbursement = await knex("APSISIPDC.cr_disbursement")
        .sum("disbursement_amount as total_disbursement_amount");

      const processing_fees = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
        .sum("processing_fee as total_processing_fees");

      const disbursement_count = await knex("APSISIPDC.cr_disbursement")
        .count("cr_disbursement.id as count");

      const disbursement_count_value = parseInt(
        disbursement_count[0].count
      );

      const dashboardArray = [
        { total_retailers: total_retailers_count_val },
        { retailers_diff: total_retailers_diff_current_prev },
        { total_sanctioned_amount: total_crm_approve_limit },
        { sanctioned_amount_rate: sanctioned_amount_rate },
        { total_live_accounts: count_live_acc_val },
        { total_npl_accounts: npl_acc_val },
        { total_npl_amount: 0 },
        { total_idle_retailers: total_idle_retailers },
        { total_pending_retailers_onboarding: pending_retailers_value },
        { total_rejected_retailers: rejected_retailers_value },
        { total_disbursements: disbursement_count_value },
        { total_processing_fees: processing_fees[0].total_processing_fees },
        { total_disbursement_amount: disbursement[0].total_disbursement_amount }
      ]



      if (dashboardArray.length == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", dashboardArray));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

module.exports = User;
