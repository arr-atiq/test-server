const jwt = require("jsonwebtoken");
const md5 = require("md5");
const knex = require("../config/database");
const { sendApiResult } = require("./helper");
const rimraf = require('rimraf');
const moment = require("moment");

exports.refreshToken = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400);
  }
  const data = await knex("cr_users")
    .select(
      "id",
      "name",
      "email",
      "phone",
      "cr_user_type",
      "password",
      "id_fi",
      "remember_token"
    )
    .where({ email })
    .first();

  if (data.remember_token !== req.body.refreshToken) {
    return res.sendStatus(401);
  }
  delete data.remember_token;
  const payload = { data };
  const options = { expiresIn: process.env.JWT_EXPIRES_IN };
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign(payload, secret, options);
  const refreshOptions = { expiresIn: process.env.REFRESH_TOKEN_LIFE };
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  const refreshToken = jwt.sign(payload, refreshSecret, refreshOptions);
  await knex("cr_users").where("id", data.id).update({
    remember_token: refreshToken,
  });
  const output = { token, refreshToken };
  return res.json(output);
};

exports.login = async (req, res) => {
  const { user_id, password } = req.body;

  if (!user_id || !password) {
    return res.status(400);
  }

  const userData = await knex("APSISIPDC.cr_users")
    .select("id", "name", "email", "phone", "password", "device_token", "password_changed_date", "account_locked", "created_at")
    .where({ user_id, status: "Active" })
    .first();

  console.log('userData', userData);
  console.log('req.body', md5(`++${password}--`))

  if (!userData || !(md5(`++${password}--`) === userData.password) || userData.account_locked == "Y") {

    if (userData.account_locked == "Y") {
      res.send(sendApiResult(false, "Oops! Your Account is locked!."));

    } else if (!(md5(`++${password}--`) === userData.password)) {
      const login_hit = await knex
        .count("cr_login_failed_history.id as count")
        .from("APSISIPDC.cr_login_failed_history")
        .where(
          "APSISIPDC.cr_login_failed_history.user_id",
          user_id.toString()
        );

      const login_hit_val = parseInt(
        login_hit[0].count
      );

      if (login_hit_val < 5) {

        await knex("APSISIPDC.cr_login_failed_history")
          .insert({ user_id: user_id });

      } else if (login_hit_val >= 5) {

        await knex("APSISIPDC.cr_users")
          .update({ account_locked: "Y" })
          .where("user_id", user_id);

      }

    } else {
      res.send(sendApiResult(false, "Oops! Invalid UserID or Password."));
    }

  } else {
    const password_changed_date = moment(userData?.password_changed_date, 'YYYY-MM-DD');

    let daysDiff = 0;

    if (password_changed_date) {
      daysDiff = moment.duration(moment().diff(password_changed_date)).asDays();
    }

    if (daysDiff > 30) {
      res.send(sendApiResult(false, "Oops! Password must be changed every 30 days interval"));
    } else {
      const testDate = moment().add(2, "minutes").format("YYYY-MM-DDTHH:mm:ss");
      console.log("test date", testDate);
      console.log(userData.created_at);
      const userLevel = await knex("APSISIPDC.cr_user_wise_role")
        .innerJoin(
          "APSISIPDC.cr_user_roles",
          "cr_user_roles.id",
          "cr_user_wise_role.role_id"
        )
        .select("cr_user_wise_role.role_id", "cr_user_roles.name")
        .where("cr_user_wise_role.user_id", userData.id)
        .where("cr_user_wise_role.status", 'Active')
        .where("cr_user_roles.status", 'Active')
        .first();

      if (userLevel == undefined) {
        res.send(sendApiResult(false, "Oops! User Wise Level Missing."));
      }

      if (userLevel.role_id == 12) {
        const salesagentUser = await knex("APSISIPDC.cr_sales_agent_user")
          .select("cr_sales_agent_user.sales_agent_id")
          .where("cr_sales_agent_user.user_id", userData.id)
          .where("cr_sales_agent_user.status", 'Active')
          .first();

        userData.salesagent_id = (salesagentUser?.sales_agent_id != undefined) ? salesagentUser?.sales_agent_id : null;

      }

      if (userLevel.role_id == 11) {
        const supervisorUser = await knex("APSISIPDC.cr_supervisor_user")
          .select("cr_supervisor_user.supervisor_id")
          .where("cr_supervisor_user.user_id", userData.id)
          .where("cr_supervisor_user.status", 'Active')
          .first();

        const supervisorUserCode = await knex("APSISIPDC.cr_supervisor")
          .select("cr_supervisor.supervisor_employee_code")
          .where("cr_supervisor.id", supervisorUser.supervisor_id)
          .where("cr_supervisor.status", 'Active')
          .first();

        userData.supervisor_id = (supervisorUser?.supervisor_id != undefined) ? supervisorUser?.supervisor_id : null;
        userData.supervisor_code = (supervisorUserCode?.supervisor_employee_code != undefined) ? supervisorUserCode?.supervisor_employee_code : null;
      }

      await knex("APSISIPDC.cr_login_failed_history").del()
        .where("user_id", user_id);

      delete userData.password;
      const payload = { userData };
      const options = { expiresIn: process.env.JWT_EXPIRES_IN };
      const secret = process.env.JWT_SECRET;
      const token = jwt.sign(payload, secret, options);
      const refreshOptions = { expiresIn: process.env.REFRESH_TOKEN_LIFE };
      const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
      const refreshToken = jwt.sign(payload, refreshSecret, refreshOptions);
      // await knex("APSISIPDC.cr_users").where("id", userData.id).update({
      //   remember_token: refreshToken,
      // });

      userData.user_level_id = (userLevel?.role_id != undefined) ? userLevel?.role_id : null;
      userData.user_level_name = (userLevel?.name != undefined) ? userLevel?.name : null;
      userData.token = token;
      userData.refreshToken = refreshToken;
      userData.device_token = userData.device_token;

      return res.send(
        sendApiResult(true, "You have Successfully Logged In.", userData)
      );

    }
  }
};

exports.keepAliveDb = async (req, res) => {
  const data = await knex("APSISIPDC.cr_manufacturer").select("id").first().returning("id");
  return data;
};

exports.cleanFile = async (req, res) => {


  rimraf('./public/configuration_file/distributor_onboarding/*', function () { console.log('done'); });
  rimraf('./public/configuration_file/manufacturer_onboarding/*', function () { console.log('done'); });
  rimraf('./public/configuration_file/retailer_cib/*', function () { console.log('done'); });
  rimraf('./public/configuration_file/retailer_ekyc/*', function () { console.log('done'); });
  rimraf('./public/configuration_file/retailer_onboarding/*', function () { console.log('done'); });
  rimraf('./public/configuration_file/sales_agent_onboarding/*', function () { console.log('done'); });
  rimraf('./public/configuration_file/supervisor_onboarding/*', function () { console.log('done'); });

  //rimraf('../public/cib/*', function () { console.log('done'); });
  //rimraf('../public/ekyc/*', function () { console.log('done'); });
  rimraf('./public/feedback_file/feedback_remarks/*', function () { console.log('done'); });
  rimraf('./public/feedback_file/upload_remarks/*', function () { console.log('done'); });
  rimraf('./public/reports_retailer/*', function () { console.log('done'); });
  rimraf('./public/retailer/*', function () { console.log('done'); });
  rimraf('./public/unupload_report/*', function () { console.log('done'); });

};


exports.deviceToken = async (req, res) => {
  const { id, device_token } = req.body;
  const data = await knex("APSISIPDC.cr_users").where("id", id).update({
    device_token: device_token,
  });
  return res.send(true, "You have Successfully Logged In.", data);

}

exports.updatePassword = async (req, res) => {
  const { link_token, password } = req.body;
  console.log('password', password)
  const data = await knex("APSISIPDC.cr_users").where("link_token", link_token).update({
    password: md5(`++${password}--`),
    link_token: 'False',
    password_changed_date: knex.fn.now()
  })
    .returning("id");

  if (data.length) {
    await knex("APSISIPDC.cr_password_history")
      .insert({
        user_id: data[0],
        password: password
      });
  }

  return res.send(true, "You have Successfully Reset Password.", data);
}

exports.getPassAndMail = async (req, res) => {
  const { link_token } = req.query;
  try {
    const data = await knex("APSISIPDC.cr_users").select('password', 'email').where("link_token", link_token)
    if (data == 0) res.send(sendApiResult(false, "Not found."));
    res.send(sendApiResult(true, "Data fetched successfully", data));
  } catch (error) {
    sendApiResult(false, error.message);
  }
}

