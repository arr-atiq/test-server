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

      console.log(role[0].role_id);

      const role_type = await knex("APSISIPDC.cr_user_roles")
        .where("id", role[0].role_id)
        .select(
          "role_type_id"
        );

        console.log(role_type[0].role_type_id);

      if (role_type[0].role_type_id == 3) {

        const manufacture = await knex("APSISIPDC.cr_manufacturer_user")
          .where("user_id", user_id)
          .select(
            "manufacturer_id"
          );

          console.log(manufacture[0].manufacturer_id);

        const data = await knex("APSISIPDC.cr_manufacturer")
          .select()
          .where("id", manufacture[0].manufacturer_id);

        console.log(data);

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type[0].role_type_id == 4) {

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
      if (role_type[0].role_type_id == 5) {

        const supervisor = await knex("APSISIPDC.cr_supervisor_user")
          .where("user_id", user_id)
          .select(
            "supervisor_id"
          );

        const data = await knex("APSISIPDC.cr_supervisor")
          .select()
          .where("id", supervisor[0].supervisor_id);

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type[0].role_type_id == 6) {

        const salesagent = await knex("APSISIPDC.cr_sales_agent_user")
          .where("user_id", user_id)
          .select(
            "sales_agent_id"
          );

        const data = await knex("APSISIPDC.cr_sales_agent")
          .select()
          .where("id", salesagent[0].sales_agent_id);

        if (data == 0) reject(sendApiResult(false, "Not found."));

        resolve(sendApiResult(true, "Data fetched successfully", data));

      }
      if (role_type[0].role_type_id == 7) {

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

    } catch (error) {
      reject(sendApiResult(false, error.message));
    }
  });
};

module.exports = User;
