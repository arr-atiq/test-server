const moment = require("moment");
const { sendApiResult } = require("../controllers/helper");
const knex = require("../config/database");
const { resolve } = require("path");

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

      const previousMonthEndDate = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
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
        // .whereRaw(`"cr_schema"."expiry_date" < TO_DATE('${todaydate}', 'YYYY-MM-DD')`)
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

      const dashboardArray = [{
        'total_retailers': total_retailers_count_val,
        'retailers_diff': total_retailers_diff_current_prev,
        'total_sanctioned_amount': total_crm_approve_limit,
        'sanctioned_amount_rate': sanctioned_amount_rate,
        'total_live_accounts': count_live_acc_val,
        'total_npl_accounts': npl_acc_val,
        'total_npl_amount': 0,
        'total_idle_retailers': total_idle_retailers,
        'total_pending_retailers_onboarding': pending_retailers_value,
        'total_rejected_retailers': rejected_retailers_value,
        'total_disbursements': disbursement_count_value,
        'total_processing_fees': processing_fees[0].total_processing_fees,
        'total_disbursement_amount': disbursement[0].total_disbursement_amount
      }
      ]



      if (dashboardArray.length == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", dashboardArray));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.getCountNotifications = function (req) {
  const { salesagent_id } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const unseenNotify = await knex
        .count("cr_push_notification.id as count")
        .from("APSISIPDC.cr_push_notification")
        .where("cr_push_notification.sales_agent_id", salesagent_id)
        .where("cr_push_notification.seen_by", null);

      const total_unseen_notify = parseInt(
        unseenNotify[0].count
      );
      if (total_unseen_notify == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", total_unseen_notify));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.getNotificationsList = function (req) {
  const { salesagent_id, page, per_page } = req.query;

  return new Promise(async (resolve, reject) => {
    try {
      const NotifyList = await knex
        .from("APSISIPDC.cr_push_notification")
        .where("cr_push_notification.sales_agent_id", salesagent_id)
        .select(
          "id",
          //"receiver_token",
          "action",
          "title",
          "body",
          "created_at",
          "seen_by"
        )
        .orderBy("id", "desc")
        .paginate({
          perPage: per_page,
          currentPage: page,
          isLengthAware: true,
        });
      if (NotifyList == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", NotifyList));

      await knex.transaction(async (trx) => {
        const seen_update = await trx("APSISIPDC.cr_push_notification")
          .where({ sales_agent_id: salesagent_id })
          .where({ seen_by: null })
          .update({
            seen_by: salesagent_id,
          });
        if (seen_update <= 0)
          reject(sendApiResult(false, "Could not Found unseen notify"));
        resolve(
          sendApiResult(
            true,
            "notifications seen updated Successfully",
            seen_update
          )
        );
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.compareOtp = function (req) {

  const {
    retailer_onermn_account,
    otp
  } = req.body;

  const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

  return new Promise(async (resolve, reject) => {
    try {

      const update_obj = {
        status: 1
      }

      const otpExpInfo = await knex("APSISIPDC.cr_otp")
        .where("otp", otp)
        .where("retailer_onermn_account", retailer_onermn_account)
        .select(
          "expiry_time",
          "status",
          "created_at"
        );
      let status_update = 0;
      if (otpExpInfo.length != 0) {
        const miliSecondsCreateAt = moment(otpExpInfo[0].created_at).format("x");
        const miliSecondstoday = moment().format("x");
        const diffTime = miliSecondstoday - miliSecondsCreateAt;

        if (otpExpInfo[0].status == 1) {
          reject(sendApiResult(false, "OTP is used previoiusly"));
        }

        await knex.transaction(async (trx) => {
          status_update = await trx("APSISIPDC.cr_otp")
            .where("otp", otp)
            .where("retailer_onermn_account", retailer_onermn_account)
            .whereRaw(`"expiry_time" >= ${diffTime} `)
            .update(update_obj);
        });
      }

      if (status_update <= 0)
        reject(sendApiResult(false, "OTP Status is not updated"));
      resolve(
        sendApiResult(
          true,
          "OTP Status Updated Successfully",
          status_update
        )
      );

    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};


User.getCollectionDisbursementGraphData = function (req) {
  const { manufacturer_id, distributor_id, region_opearation, start_date, end_date } = req.query;

  return new Promise(async (resolve, reject) => {
    try {

      const startDate = moment(start_date, 'YYYY-MM-DD');
      const endDate = moment(end_date, 'YYYY-MM-DD').add(1, 'days');
      let daysDiff = 0;

      if (start_date && end_date) {
        daysDiff = moment.duration(endDate.diff(startDate)).asDays();
      }

      const diffWeeks = (parseInt(daysDiff / 7));
      const remainingDays = (parseInt(daysDiff % 7));

      const graph_info_arr = [];

      let date_start_week_iteration = moment(start_date).startOf('date').format('YYYY-MM-DD');
      let weeks = 0;

      for (let i = 0; i < diffWeeks; i++) {
        let startWeekDate = moment(date_start_week_iteration).startOf('date').format('YYYY-MM-DD');
        let endWeekDate = moment(date_start_week_iteration).add(6, 'days').startOf('date').format('YYYY-MM-DD');
        let endWeekDateNextDay = moment(endWeekDate).add(1, 'days').startOf('date').format('YYYY-MM-DD');
        date_start_week_iteration = endWeekDateNextDay;
        weeks = weeks + 1;

        const data_info_temp = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .leftJoin("APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.id",
            "cr_retailer_loan_calculation.manu_scheme_mapping_id")
          .leftJoin("APSISIPDC.cr_retailer",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id")
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (region_opearation) {
              this.where("cr_retailer.region_opearation", region_opearation)
            }
            if (start_date && end_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${startWeekDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${endWeekDateNextDay}', 'YYYY-MM-DD')`)
            }
          })
          .select(
            knex.raw('SUM("cr_retailer_loan_calculation"."disburshment") AS Disbursement'),
            knex.raw('SUM("cr_retailer_loan_calculation"."repayment") AS Repayment')
          );

        console.log(data_info_temp);

        const graph_generate_info = {
          Week: weeks,
          Disbursement: data_info_temp[0].DISBURSEMENT != null ? data_info_temp[0].DISBURSEMENT : 0,
          Collection: data_info_temp[0].REPAYMENT != null ? data_info_temp[0].REPAYMENT : 0,
          Date: moment(startWeekDate).format('DD MMM YY') + " - " + moment(endWeekDate).format('DD MMM YY')
        }

        graph_info_arr.push(graph_generate_info);

      }

      if (remainingDays > 0) {
        let startWeekDate = moment(date_start_week_iteration).startOf('date').format('YYYY-MM-DD');
        let endWeekDate = moment(date_start_week_iteration).add(remainingDays - 1, 'days').startOf('date').format('YYYY-MM-DD');
        let endWeekDateNextDay = moment(endWeekDate).add(1, 'days').startOf('date').format('YYYY-MM-DD');
        date_start_week_iteration = endWeekDateNextDay;
        weeks = weeks + 1;

        const data_info_temp = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .leftJoin("APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.id",
            "cr_retailer_loan_calculation.manu_scheme_mapping_id")
          .leftJoin("APSISIPDC.cr_retailer",
            "cr_retailer.id",
            "cr_retailer_loan_calculation.retailer_id")
          .where(function () {
            if (manufacturer_id) {
              this.where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacturer_id)
            }
            if (distributor_id) {
              this.where("cr_retailer_manu_scheme_mapping.distributor_id", distributor_id)
            }
            if (region_opearation) {
              this.where("cr_retailer.region_opearation", region_opearation)
            }
            if (start_date && end_date) {
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" >= TO_DATE('${startWeekDate}', 'YYYY-MM-DD')`)
              this.whereRaw(`"cr_retailer_loan_calculation"."created_at" < TO_DATE('${endWeekDateNextDay}', 'YYYY-MM-DD')`)
            }
          })
          .select(
            knex.raw('SUM("cr_retailer_loan_calculation"."disburshment") AS Disbursement'),
            knex.raw('SUM("cr_retailer_loan_calculation"."repayment") AS Repayment')
          );

        console.log(data_info_temp);

        const graph_generate_info = {
          Week: weeks,
          Disbursement: data_info_temp[0].DISBURSEMENT != null ? data_info_temp[0].DISBURSEMENT : 0,
          Collection: data_info_temp[0].REPAYMENT != null ? data_info_temp[0].REPAYMENT : 0,
          Date: moment(startWeekDate).format('DD MMM YY') + " - " + moment(endWeekDate).format('DD MMM YY')
        }

        graph_info_arr.push(graph_generate_info);

      }
      if (graph_info_arr == 0) reject(sendApiResult(false, "Not found."));
      resolve(sendApiResult(true, "Data fetched successfully", graph_info_arr));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.userDetails = function (req) {

  const { user_id } = req.query;
  console.log(user_id);

  return new Promise(async (resolve, reject) => {
    try {

      const role = await knex("APSISIPDC.cr_user_wise_role")
        .where("user_id", user_id)
        .select(
          "role_id"
        );

      const role_id = role[0]?.role_id ?? 0;

      const role_type = await knex("APSISIPDC.cr_user_roles")
        .where("id", role_id)
        .select(
          "role_type_id"
        );

      const role_type_id = role_type[0]?.role_type_id ?? 0;

      if (role_type_id == 3) {

        const manufacture = await knex("APSISIPDC.cr_manufacturer_user")
          .where("user_id", user_id)
          .select(
            "manufacturer_id"
          );

        console.log(manufacture[0].manufacturer_id);

        const data = await knex("APSISIPDC.cr_manufacturer")
          .select()
          .where("id", manufacture[0].manufacturer_id);

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type_id == 4) {

        const distributor = await knex("APSISIPDC.cr_distributor_user")
          .where("user_id", user_id)
          .select(
            "distributor_id"
          );

        const data = await knex("APSISIPDC.cr_distributor")
          .select()
          .where("id", distributor[0].distributor_id);

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type_id == 5) {

        const supervisor = await knex("APSISIPDC.cr_supervisor_user")
          .where("user_id", user_id)
          .select(
            "supervisor_id"
          );

        const data = await knex("APSISIPDC.cr_supervisor")
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_supervisor.distributor_id"
          )
          .select(
            "cr_supervisor.*",
            "cr_distributor.distributor_name",
            "cr_distributor.official_email",
            "cr_distributor.official_contact_number",
            "cr_distributor.registered_office_bangladesh",
            "cr_distributor.ofc_postal_code",
            "cr_distributor.ofc_post_office",
            "cr_distributor.ofc_thana",
            "cr_distributor.ofc_district"
          )
          .where("cr_supervisor.id", supervisor[0].supervisor_id);

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type_id == 6) {

        const salesagent = await knex("APSISIPDC.cr_sales_agent_user")
          .where("user_id", user_id)
          .select(
            "sales_agent_id"
          );

        const data = await knex("APSISIPDC.cr_sales_agent")
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_sales_agent.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map",
            "cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id",
            "cr_sales_agent.id"
          )
          .leftJoin(
            "APSISIPDC.cr_supervisor",
            "cr_supervisor.id",
            "cr_salesagent_supervisor_distributor_manufacturer_map.supervisor_id"
          )
          .select(
            "cr_sales_agent.*",
            "cr_distributor.distributor_name",
            "cr_distributor.official_email",
            "cr_distributor.official_contact_number",
            "cr_distributor.registered_office_bangladesh",
            "cr_distributor.ofc_postal_code",
            "cr_distributor.ofc_post_office",
            "cr_distributor.ofc_thana",
            "cr_distributor.ofc_district",
            "cr_salesagent_supervisor_distributor_manufacturer_map.supervisor_id",
            "cr_supervisor.supervisor_name",
            "cr_supervisor.phone",
            "cr_supervisor.region_of_operation"
          )
          .where("cr_sales_agent.id", salesagent[0].sales_agent_id);

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type_id == 7) {

        const retailer = await knex("APSISIPDC.cr_retailer_user")
          .where("user_id", user_id)
          .select(
            "retailer_id"
          );

        const data = await knex("APSISIPDC.cr_retailer")
          .select()
          .where("id", retailer[0].retailer_id);

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }

      else {
        reject(sendApiResult(false, "Not found."));

      }

    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.getManufacturersForUser = function (req) {

  const { user_id, page, per_page } = req.query;

  return new Promise(async (resolve, reject) => {
    try {

      const role = await knex("APSISIPDC.cr_user_wise_role")
        .where("user_id", user_id)
        .select(
          "role_id"
        );

      const role_id = role[0]?.role_id ?? 0;

      const role_type = await knex("APSISIPDC.cr_user_roles")
        .where("id", role_id)
        .select(
          "role_type_id"
        );

      const role_type_id = role_type[0]?.role_type_id ?? 0;

      if (role_type_id == 4) {

        const distributor = await knex("APSISIPDC.cr_distributor_user")
          .where("user_id", user_id)
          .select(
            "distributor_id"
          );

        const data = await knex("APSISIPDC.cr_manufacturer_vs_distributor")
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_manufacturer_vs_distributor.manufacturer_id"
          )
          .where("cr_manufacturer_vs_distributor.distributor_id", distributor[0].distributor_id)
          .select(
            "cr_manufacturer.*"
          )
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type_id == 5) {

        const supervisor = await knex("APSISIPDC.cr_supervisor_user")
          .where("user_id", user_id)
          .select(
            "supervisor_id"
          );

        const data = await knex("APSISIPDC.cr_supervisor_distributor_manufacturer_map")
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_supervisor_distributor_manufacturer_map.manufacturer_id"
          )
          .where("cr_supervisor_distributor_manufacturer_map.supervisor_id", supervisor[0].supervisor_id)
          .select(
            "cr_manufacturer.*"
          )
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type_id == 6) {

        const salesagent = await knex("APSISIPDC.cr_sales_agent_user")
          .where("user_id", user_id)
          .select(
            "sales_agent_id"
          );

        const data = await knex("APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map")
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_salesagent_supervisor_distributor_manufacturer_map.manufacturer_id"
          )
          .where("cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id", salesagent[0].sales_agent_id)
          .select(
            "cr_manufacturer.*"
          )
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type_id == 7) {

        const retailer = await knex("APSISIPDC.cr_retailer_user")
          .where("user_id", user_id)
          .select(
            "retailer_id"
          );

        const data = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
          .leftJoin(
            "APSISIPDC.cr_manufacturer",
            "cr_manufacturer.id",
            "cr_retailer_manu_scheme_mapping.manufacturer_id"
          )
          .where("cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id", retailer[0].retailer_id)
          .select(
            "cr_manufacturer.*"
          )
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }

      else {
        reject(sendApiResult(false, "Not found."));

      }

    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.getSupervisorsForUser = function (req) {

  const { user_id, page, per_page } = req.query;

  return new Promise(async (resolve, reject) => {
    try {

      const role = await knex("APSISIPDC.cr_user_wise_role")
        .where("user_id", user_id)
        .select(
          "role_id"
        );

      const role_id = role[0]?.role_id ?? 0;

      const role_type = await knex("APSISIPDC.cr_user_roles")
        .where("id", role_id)
        .select(
          "role_type_id"
        );

      const role_type_id = role_type[0]?.role_type_id ?? 0;

      if (role_type_id == 3) {

        const manufacture = await knex("APSISIPDC.cr_manufacturer_user")
          .where("user_id", user_id)
          .select(
            "manufacturer_id"
          );

        const data = await knex("APSISIPDC.cr_supervisor_distributor_manufacturer_map")
          .leftJoin(
            "APSISIPDC.cr_supervisor",
            "cr_supervisor.id",
            "cr_supervisor_distributor_manufacturer_map.supervisor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_supervisor.distributor_id"
          )
          .where("cr_supervisor_distributor_manufacturer_map.manufacturer_id", manufacture[0].manufacturer_id)
          .select(
            "cr_supervisor.*",
            "cr_distributor.distributor_name"
          )
          .distinct()
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type_id == 4) {

        const distributor = await knex("APSISIPDC.cr_distributor_user")
          .where("user_id", user_id)
          .select(
            "distributor_id"
          );

        const data = await knex("APSISIPDC.cr_supervisor_distributor_manufacturer_map")
          .leftJoin(
            "APSISIPDC.cr_supervisor",
            "cr_supervisor.id",
            "cr_supervisor_distributor_manufacturer_map.supervisor_id"
          )
          .where("cr_supervisor_distributor_manufacturer_map.distributor_id", distributor[0].distributor_id)
          .select(
            "cr_supervisor.*"
          )
          .distinct()
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type_id == 6) {

        const salesagent = await knex("APSISIPDC.cr_sales_agent_user")
          .where("user_id", user_id)
          .select(
            "sales_agent_id"
          );

        const data = await knex("APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map")
          .leftJoin(
            "APSISIPDC.cr_supervisor",
            "cr_supervisor.id",
            "cr_salesagent_supervisor_distributor_manufacturer_map.supervisor_id"
          )
          .where("cr_supervisor_distributor_manufacturer_map.distributor_id", salesagent[0].sales_agent_id)
          .select(
            "cr_supervisor.*",
          )
          .distinct()
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      // if (role_type_id == 7) {

      //   const retailer = await knex("APSISIPDC.cr_retailer_user")
      //     .where("user_id", user_id)
      //     .select(
      //       "retailer_id"
      //     );

      //   const data = await knex("APSISIPDC.cr_retailer")
      //     .select()
      //     .where("id", retailer[0].retailer_id);

      //   if (data == 0) reject(sendApiResult(false, "Not found."));

      //   resolve(sendApiResult(true, "Data fetched successfully", data));

      // }

      else {
        reject(sendApiResult(false, "Not found."));

      }

    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.getSalesagentsForUser = function (req) {

  const { user_id, page, per_page } = req.query;

  return new Promise(async (resolve, reject) => {
    try {

      const role = await knex("APSISIPDC.cr_user_wise_role")
        .where("user_id", user_id)
        .select(
          "role_id"
        );

      const role_id = role[0]?.role_id ?? 0;

      const role_type = await knex("APSISIPDC.cr_user_roles")
        .where("id", role_id)
        .select(
          "role_type_id"
        );

      const role_type_id = role_type[0]?.role_type_id ?? 0;

      if (role_type_id == 3) {
        const manufacture = await knex("APSISIPDC.cr_manufacturer_user")
          .where("user_id", user_id)
          .select(
            "manufacturer_id"
          );

        const data = await knex("APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map")
          .leftJoin(
            "APSISIPDC.cr_sales_agent",
            "cr_sales_agent.id",
            "cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_sales_agent.distributor_id"
          )
          .leftJoin(
            "APSISIPDC.cr_supervisor",
            "cr_supervisor.id",
            "cr_salesagent_supervisor_distributor_manufacturer_map.supervisor_id"
          )
          .where("cr_salesagent_supervisor_distributor_manufacturer_map.manufacturer_id", manufacture[0].manufacturer_id)
          .select(
            "cr_sales_agent.*",
            "cr_distributor.distributor_name",
            "cr_salesagent_supervisor_distributor_manufacturer_map.supervisor_id",
            "cr_supervisor.supervisor_name"
          )
          .distinct()
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type_id == 4) {

        const distributor = await knex("APSISIPDC.cr_distributor_user")
          .where("user_id", user_id)
          .select(
            "distributor_id"
          );

        const data = await knex("APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map")
          .leftJoin(
            "APSISIPDC.cr_sales_agent",
            "cr_sales_agent.id",
            "cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id"
          )
          .leftJoin(
            "APSISIPDC.cr_supervisor",
            "cr_supervisor.id",
            "cr_salesagent_supervisor_distributor_manufacturer_map.supervisor_id"
          )
          .where("cr_salesagent_supervisor_distributor_manufacturer_map.distributor_id", distributor[0].distributor_id)
          .select(
            "cr_sales_agent.*",
            "cr_salesagent_supervisor_distributor_manufacturer_map.supervisor_id",
            "cr_supervisor.supervisor_name"
          )
          .distinct()
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type_id == 5) {

        const supervisor = await knex("APSISIPDC.cr_supervisor_user")
          .where("user_id", user_id)
          .select(
            "supervisor_id"
          );

        const data = await knex("APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map")
          .leftJoin(
            "APSISIPDC.cr_sales_agent",
            "cr_sales_agent.id",
            "cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id"
          )
          .leftJoin(
            "APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_sales_agent.distributor_id"
          )
          .where("cr_salesagent_supervisor_distributor_manufacturer_map.distributor_id", supervisor[0].supervisor_id)
          .select(
            "cr_sales_agent.*",
            "cr_distributor.distributor_name",
          )
          .distinct()
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      // if (role_type_id == 7) {

      //   const retailer = await knex("APSISIPDC.cr_retailer_user")
      //     .where("user_id", user_id)
      //     .select(
      //       "retailer_id"
      //     );

      //   const data = await knex("APSISIPDC.cr_retailer")
      //     .select()
      //     .where("id", retailer[0].retailer_id);

      //   if (data == 0) reject(sendApiResult(false, "Not found."));

      //   resolve(sendApiResult(true, "Data fetched successfully", data));

      // }

      else {
        reject(sendApiResult(false, "Not found."));

      }

    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.getRetailersForUser = function (req) {

  const { user_id, page, per_page } = req.query;

  return new Promise(async (resolve, reject) => {
    try {

      const role = await knex("APSISIPDC.cr_user_wise_role")
        .where("user_id", user_id)
        .select(
          "role_id"
        );

      const role_id = role[0]?.role_id ?? 0;

      const role_type = await knex("APSISIPDC.cr_user_roles")
        .where("id", role_id)
        .select(
          "role_type_id"
        );

      const role_type_id = role_type[0]?.role_type_id ?? 0;

      if (role_type_id == 3) {
        const manufacture = await knex("APSISIPDC.cr_manufacturer_user")
          .where("user_id", user_id)
          .select(
            "manufacturer_id"
          );

        const data = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
          .leftJoin(
            "APSISIPDC.cr_retailer",
            "cr_retailer.id",
            "cr_retailer_manu_scheme_mapping.retailer_id"
          )
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", manufacture[0].manufacturer_id)
          .select(
            "cr_retailer.*"
          )
          .distinct()
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type_id == 4) {

        const distributor = await knex("APSISIPDC.cr_distributor_user")
          .where("user_id", user_id)
          .select(
            "distributor_id"
          );

        const data = await knex("APSISIPDC.cr_retailer_manu_scheme_mapping")
          .leftJoin(
            "APSISIPDC.cr_retailer",
            "cr_retailer.id",
            "cr_retailer_manu_scheme_mapping.retailer_id"
          )
          .where("cr_retailer_manu_scheme_mapping.manufacturer_id", distributor[0].distributor_id)
          .select(
            "cr_retailer.*"
          )
          .distinct()
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });


        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type_id == 5) {

        const supervisor = await knex("APSISIPDC.cr_supervisor_user")
          .where("user_id", user_id)
          .select(
            "supervisor_id"
          );

        const data = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_vs_sales_agent",
            "cr_retailer_vs_sales_agent.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_salesagent_supervisor_distributor_manufacturer_map",
            "cr_salesagent_supervisor_distributor_manufacturer_map.salesagent_id",
            "cr_retailer_vs_sales_agent.sales_agent_id"
          )
          .where("cr_retailer_vs_sales_agent.sales_agent_id", supervisor[0].supervisor_id)
          .select(
            "cr_retailer.*"
          )
          .distinct()
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });
        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }

      if (role_type_id == 6) {

        const salesagent = await knex("APSISIPDC.cr_sales_agent_user")
          .where("user_id", user_id)
          .select(
            "sales_agent_id"
          );

        const data = await knex("APSISIPDC.cr_retailer_vs_sales_agent")
          .leftJoin(
            "APSISIPDC.cr_retailer",
            "cr_retailer.id",
            "cr_retailer_vs_sales_agent.retailer_id"
          )
          .where("cr_retailer_vs_sales_agent.sales_agent_id", salesagent[0].sales_agent_id)
          .select(
            "cr_retailer.*"
          )
          .distinct()
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      // if (role_type_id == 7) {

      //   const retailer = await knex("APSISIPDC.cr_retailer_user")
      //     .where("user_id", user_id)
      //     .select(
      //       "retailer_id"
      //     );

      //   const data = await knex("APSISIPDC.cr_retailer")
      //     .select()
      //     .where("id", retailer[0].retailer_id);

      //   if (data == 0) reject(sendApiResult(false, "Not found."));

      //   resolve(sendApiResult(true, "Data fetched successfully", data));

      // }

      else {
        reject(sendApiResult(false, "Not found."));

      }

    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.getSearchResultView = function (req) {
  const { type, filter_text, page, per_page } = req.query;
  return new Promise(async (resolve, reject) => {
    try {
      if (type == "manufacturer") {
        const data = await knex("APSISIPDC.cr_manufacturer")
          .leftJoin(
            "APSISIPDC.cr_manufacturer_type_entity",
            "cr_manufacturer_type_entity.id",
            "cr_manufacturer.type_of_entity"
          )
          .where("activation_status", "Active")
          .where(function () {
            if (filter_text) {
              var search_param = filter_text.replace(/\s/g, '');
              this.orWhere("cr_manufacturer.id", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_manufacturer.manufacturer_name", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_manufacturer.official_email", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_manufacturer.official_phone", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_manufacturer.autho_rep_full_name", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_manufacturer.autho_rep_email", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_manufacturer.autho_rep_phone", 'like', `%${search_param.toString()}%`)
            }
          })
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
          .distinct();
        if (data == 0) reject(sendApiResult(false, "Not found."));
        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      else if (type == "distributor") {
        const data = await knex("APSISIPDC.cr_distributor")
          .where("cr_distributor.activation_status", "Active")
          .where(function () {
            if (filter_text) {
              var search_param = filter_text.replace(/\s/g, '');
              this.orWhere("cr_distributor.id", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_distributor.distributor_name", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_distributor.distributor_tin", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_distributor.official_email", 'like', `%${search_param.toString()}%`)
            }
          })
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
          .distinct()
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });
        if (data == 0) reject(sendApiResult(false, "Not found."));
        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      else if (type == "supervisor") {
        const data = await knex("APSISIPDC.cr_supervisor")
          .leftJoin("APSISIPDC.cr_distributor",
            "cr_distributor.id",
            "cr_supervisor.distributor_id"
          )
          .where("cr_supervisor.activation_status", "Active")
          .where(function () {
            if (filter_text) {
              var search_param = filter_text.replace(/\s/g, '');
              this.orWhere("cr_supervisor.id", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_supervisor.supervisor_name", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_supervisor.supervisor_nid", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_supervisor.supervisor_email_id", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_supervisor.distributor_id", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_distributor.distributor_name", 'like', `%${search_param.toString()}%`)
            }
          })
          .select(
            "cr_supervisor.id",
            "cr_supervisor.supervisor_name",
            "cr_supervisor.supervisor_nid",
            "cr_supervisor.phone",
            "cr_supervisor.supervisor_email_id",
            "cr_supervisor.distributor_id",
            "cr_distributor.distributor_name",
            "cr_supervisor.supervisor_employee_code",
            "cr_supervisor.region_of_operation"
          )
          .orderBy("cr_supervisor.id", "desc")
          .distinct()
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });
        if (data == 0) reject(sendApiResult(false, "Not found."));
        resolve(sendApiResult(true, "Data fetched successfully", data));
      }
      else if (type == "salesagent") {
        const data = await knex("APSISIPDC.cr_sales_agent")
          .where("cr_sales_agent.activation_status", "Active")
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
          .where(function () {
            if (filter_text) {
              var search_param = filter_text.replace(/\s/g, '');
              this.orWhere("cr_sales_agent.id", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_sales_agent.agent_name", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_sales_agent.agent_nid", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_sales_agent.phone", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_sales_agent.distributor_id", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_distributor.distributor_name", 'like', `%${search_param.toString()}%`)
            }
          })
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
      }
      else if (type == "retailer") {
        const data = await knex("APSISIPDC.cr_retailer")
          .leftJoin(
            "APSISIPDC.cr_retailer_manu_scheme_mapping",
            "cr_retailer_manu_scheme_mapping.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_details_info",
            "cr_retailer_details_info.retailer_id",
            "cr_retailer.id"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_type",
            "cr_retailer_type.id",
            "cr_retailer_details_info.retailer_type"
          )
          .leftJoin(
            "APSISIPDC.cr_retailer_type_entity",
            "cr_retailer_type_entity.id",
            "cr_retailer_details_info.type_of_entity"
          )
          .where("cr_retailer.status", "Active")
          .where(function () {
            if (filter_text) {
              var search_param = filter_text.replace(/\s/g, '');
              this.orWhere("cr_retailer.id", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_retailer.retailer_name", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_retailer.retailer_nid", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_retailer.retailer_smart_nid", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_retailer.phone", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_retailer_details_info.email", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_retailer_type.name", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_retailer_type_entity.name", 'like', `%${search_param.toString()}%`)
                .orWhere("cr_retailer_details_info.retailer_tin", 'like', `%${search_param.toString()}%`)
              //.orWhere("cr_distributor.registration_no", 'like', `%${search_param.toString()}%`)
            }
          })
          .select(
            "cr_retailer.id",
            "cr_retailer.retailer_name",
            "cr_retailer.retailer_nid",
            "cr_retailer.retailer_smart_nid",
            "cr_retailer.phone",
            "cr_retailer_manu_scheme_mapping.retailer_code",
            "cr_retailer_details_info.email",
            "cr_retailer_details_info.retailer_tin",
            knex.raw('"cr_retailer_type"."name" as "retailer_type"'),
            knex.raw('"cr_retailer_type_entity"."name" as "entity_type"'),
            // "cr_retailer_details_info.retailer_tin",
            // "cr_retailer_details_info.corporate_registration_no",
            // "cr_retailer_details_info.trade_license_no",
            // "cr_retailer_details_info.outlet_address",
            // "cr_retailer_details_info.postal_code",
            // "cr_retailer_details_info.post_office",
            // "cr_retailer_details_info.thana",
            // "cr_retailer_details_info.district",
            // "cr_retailer_details_info.division",
            // "cr_retailer_details_info.autho_rep_full_name",
            // "cr_retailer_details_info.autho_rep_phone",
            // "cr_retailer_details_info.region_operation",
            knex.raw(`CASE "cr_retailer"."kyc_status" WHEN 1 THEN 'True' ELSE 'False' END AS "kyc_status"`),
            knex.raw(`CASE "cr_retailer_manu_scheme_mapping"."cib_status" WHEN 1 THEN 'True' ELSE 'False' END AS "cib_status"`),
          )
          .orderBy("cr_retailer.id", "desc")
          .distinct()
          .paginate({
            perPage: per_page,
            currentPage: page,
            isLengthAware: true,
          });
        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Retailer List fetched successfully", data));
      }
      else {
        reject(sendApiResult(false, "type is not  matched"));
      }

    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.getDocumentsView = function (req) {
  return new Promise(async (resolve, reject) => {
    try {
      const documents = await knex("APSISIPDC.cr_documents_add")
        .select(
          "cr_documents_add.id",
          "cr_documents_add.name"
        )
        .orderBy("cr_documents_add.id", "desc")
        .distinct();
      if (documents == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendApiResult(true, "Data fetched successfully", documents));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.getVerifyDocumentByUser = function (req) {
  const { user_type, document_tag_user_id, file_for } = req.query;
  return new Promise(async (resolve, reject) => {
    try {
      const documents = await knex("APSISIPDC.cr_verify_document")
        .select(
          "id",
          "file_path",
          "file_name"
        )
        .orderBy("id", "desc")
        .first();
      if (documents == 0) reject(sendApiResult(false, "Not found."));

      resolve(sendApiResult(true, "Data fetched successfully", documents));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.downloadDocumentByID = function (req) {
  const { id } = req.query;
  return new Promise(async (resolve, reject) => {
    try {
      const documents = await knex("APSISIPDC.cr_verify_document")
        .where("id", id)
        .select(
          "id",
          "file_path",
          "file_name"
        )
        .orderBy("id", "desc")
        .first();
      if (documents == 0) reject(sendApiResult(false, "Not found."));
      const file_view_path = documents.file_path + "/" + documents.file_name;

      resolve(sendApiResult(true, "document view fetched successfully", file_view_path));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

User.uploadDocumentsTag = (filename, req) => {
  // const date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
  const folder_name = req.file_for.trim();
  const upload_insert_log = {
    file_for: folder_name,
    file_path: `public/tag_documents/${folder_name}`,
    file_name: filename,
    created_by: parseInt(req.user_id),
    user_type: req.user_type,
    document_tag_user_id: req.document_tag_user_id
  };

  return new Promise(async (resolve, reject) => {
    try {
      const file_upload = await knex("APSISIPDC.cr_verify_document").insert(
        upload_insert_log
      ).returning("id");

      if (file_upload == 0) reject(sendApiResult(false, "Not Upload"));
      resolve(sendApiResult(true, "file Upload successfully", file_upload));
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });

};

User.deleteVerifyDocument = function (req) {
  const { id } = req.params;
  return new Promise(async (resolve, reject) => {
    try {
      await knex.transaction(async (trx) => {
        const verify_document_delete = await trx("APSISIPDC.cr_verify_document")
          .where("id", id)
          .delete();
        if (verify_document_delete <= 0)
          reject(sendApiResult(false, "Could not Found Verify Document"));
        resolve(
          sendApiResult(
            true,
            "Verify Document Deleted Successfully",
            verify_document_delete
          )
        );
      });
    } catch (error) {
      reject(sendApiResult(false, error.message));
    }

  });

};

module.exports = User;
